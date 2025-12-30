"""
Project Clients Endpoints
API endpoints for managing project clients
"""

from typing import List, Optional, Dict
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, delete
from sqlalchemy.orm import selectinload
import zipfile
import os
import unicodedata
from io import BytesIO
from datetime import datetime as dt
import json
import uuid
import asyncio
import re

from app.core.database import get_db
from app.core.cache_enhanced import cache_query
from app.dependencies import get_current_user
from app.models.client import Client, ClientStatus
from app.models.company import Company
from app.models.user import User
from app.schemas.client import ClientCreate, ClientUpdate, ClientResponse
from app.services.import_service import ImportService
from app.services.export_service import ExportService
from app.services.s3_service import S3Service
from app.core.logging import logger

router = APIRouter(prefix="/projects/clients", tags=["project-clients"])

# In-memory store for import logs (in production, use Redis)
import_logs: Dict[str, List[Dict[str, any]]] = {}
import_status: Dict[str, Dict[str, any]] = {}


def normalize_filename(name: str) -> str:
    """
    Normalize a name for filename matching.
    - Convert to lowercase
    - Remove accents
    - Replace spaces and special characters with underscores
    - Remove multiple underscores
    """
    if not name:
        return ""
    # Convert to lowercase
    name = name.lower().strip()
    # Remove accents
    name = unicodedata.normalize('NFD', name)
    name = ''.join(char for char in name if unicodedata.category(char) != 'Mn')
    # Replace spaces and special characters with underscores
    name = re.sub(r'[^\w\-]', '_', name)
    # Remove multiple underscores
    name = re.sub(r'_+', '_', name)
    # Remove leading/trailing underscores
    name = name.strip('_')
    return name


async def find_company_by_name(
    company_name: str,
    db: AsyncSession,
    all_companies: Optional[List[Company]] = None,
    company_name_to_id: Optional[dict] = None
) -> Optional[int]:
    """
    Find a company ID by name using intelligent matching.
    
    Matching strategy:
    1. Exact match (case-insensitive)
    2. Match without legal form (SARL, SA, SAS, EURL)
    3. Partial match (contains)
    
    Args:
        company_name: Company name to search for
        db: Database session
        all_companies: Optional pre-loaded list of companies (for performance)
        company_name_to_id: Optional pre-built mapping (for performance)
        
    Returns:
        Company ID if found, None otherwise
    """
    if not company_name or not company_name.strip():
        return None
    
    # Load companies if not provided
    if all_companies is None or company_name_to_id is None:
        companies_result = await db.execute(select(Company))
        all_companies = companies_result.scalars().all()
        company_name_to_id = {}
        for company in all_companies:
            if company.name:
                company_name_to_id[company.name.lower().strip()] = company.id
    
    company_name_normalized = company_name.strip().lower()
    # Remove common prefixes/suffixes for better matching
    company_name_clean = company_name_normalized.replace('sarl', '').replace('sa', '').replace('sas', '').replace('eurl', '').strip()
    
    # Try exact match first
    if company_name_normalized in company_name_to_id:
        return company_name_to_id[company_name_normalized]
    
    # Try match without legal form
    if company_name_clean and company_name_clean in company_name_to_id:
        return company_name_to_id[company_name_clean]
    
    # Try partial match (contains)
    matched_company_id = None
    for stored_name, stored_id in company_name_to_id.items():
        stored_clean = stored_name.replace('sarl', '').replace('sa', '').replace('sas', '').replace('eurl', '').strip()
        if (company_name_clean and stored_clean and 
            (company_name_clean in stored_clean or stored_clean in company_name_clean)):
            matched_company_id = stored_id
            break
    
    # If no match with cleaned, try original normalized
    if not matched_company_id:
        for stored_name, stored_id in company_name_to_id.items():
            if (company_name_normalized in stored_name or stored_name in company_name_normalized):
                matched_company_id = stored_id
                break
    
    return matched_company_id


def add_import_log(import_id: str, message: str, level: str = "info", data: Optional[Dict] = None):
    """Add a log entry to the import logs"""
    if import_id not in import_logs:
        import_logs[import_id] = []
    
    log_entry = {
        "timestamp": dt.now().isoformat(),
        "level": level,
        "message": message,
        "data": data or {}
    }
    import_logs[import_id].append(log_entry)
    
    # Keep only last 1000 logs per import
    if len(import_logs[import_id]) > 1000:
        import_logs[import_id] = import_logs[import_id][-1000:]


def update_import_status(import_id: str, status: str, progress: Optional[int] = None, total: Optional[int] = None):
    """Update import status"""
    if import_id not in import_status:
        import_status[import_id] = {}
    
    import_status[import_id].update({
        "status": status,
        "updated_at": dt.now().isoformat()
    })
    
    if progress is not None:
        import_status[import_id]["progress"] = progress
    if total is not None:
        import_status[import_id]["total"] = total


@router.get("/", response_model=List[ClientResponse])
@cache_query(expire=60, tags=["clients"])
async def list_clients(
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status: Optional[ClientStatus] = Query(None),
    responsible_id: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
) -> List[Client]:
    """
    Get list of clients
    
    Args:
        skip: Number of records to skip
        limit: Maximum number of records to return
        status: Optional status filter
        responsible_id: Optional responsible filter
        search: Optional search term
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        List of clients
    """
    query = select(Client)
    
    if status:
        query = query.where(Client.status == status)
    if responsible_id:
        query = query.where(Client.responsible_id == responsible_id)
    if search:
        search_term = f"%{search.lower()}%"
        query = query.join(Company).where(
            or_(
                func.lower(Company.name).like(search_term),
                func.lower(Company.email).like(search_term),
            )
        )
    
    query = query.options(
        selectinload(Client.company),
        selectinload(Client.responsible)
    ).order_by(Client.created_at.desc()).offset(skip).limit(limit)
    
    try:
        result = await db.execute(query)
        clients = result.scalars().all()
        
        # Convert to response format
        client_list = []
        s3_service = S3Service() if S3Service.is_configured() else None
        
        for client in clients:
            # Regenerate presigned URL for logo if it exists and S3 is configured
            logo_url = client.company.logo_url if client.company else None
            if logo_url and s3_service:
                try:
                    # Extract file_key from URL if it's a presigned URL
                    if 'clients/logos' in logo_url or 'companies/logos' in logo_url:
                        # It's already a file_key or path
                        file_key = logo_url if not logo_url.startswith('http') else logo_url.split('?')[0].split('/')[-1]
                        presigned_url = s3_service.generate_presigned_url(file_key, expiration=604800)
                        if presigned_url:
                            logo_url = presigned_url
                except Exception as e:
                    logger.warning(f"Failed to generate presigned URL for client {client.id}: {e}")
            
            client_dict = {
                'id': client.id,
                'company_id': client.company_id,
                'company_name': client.company.name if client.company else None,
                'company_logo_url': logo_url,
                'status': client.status.value if isinstance(client.status, ClientStatus) else client.status,
                'responsible_id': client.responsible_id,
                'responsible_name': f"{client.responsible.first_name} {client.responsible.last_name}" if client.responsible else None,
                'notes': client.notes,
                'comments': client.comments,
                'portal_url': client.portal_url,
                'created_at': client.created_at,
                'updated_at': client.updated_at,
            }
            client_list.append(ClientResponse(**client_dict))
        
        return client_list
    except Exception as e:
        logger.error(f"Database error in list_clients: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"A database error occurred: {str(e)}"
        )


@router.get("/{client_id}", response_model=ClientResponse)
async def get_client(
    client_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Client:
    """
    Get a client by ID
    
    Args:
        client_id: Client ID
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        Client
        
    Raises:
        HTTPException: If client not found
    """
    query = select(Client).where(Client.id == client_id)
    query = query.options(
        selectinload(Client.company),
        selectinload(Client.responsible)
    )
    
    result = await db.execute(query)
    client = result.scalar_one_or_none()
    
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found"
        )
    
    # Regenerate presigned URL for logo if it exists
    logo_url = client.company.logo_url if client.company else None
    if logo_url and S3Service.is_configured():
        try:
            s3_service = S3Service()
            if 'clients/logos' in logo_url or 'companies/logos' in logo_url:
                file_key = logo_url if not logo_url.startswith('http') else logo_url.split('?')[0].split('/')[-1]
                presigned_url = s3_service.generate_presigned_url(file_key, expiration=604800)
                if presigned_url:
                    logo_url = presigned_url
        except Exception as e:
            logger.warning(f"Failed to generate presigned URL for client {client_id}: {e}")
    
    client_dict = {
        'id': client.id,
        'company_id': client.company_id,
        'company_name': client.company.name if client.company else None,
        'company_logo_url': logo_url,
        'status': client.status.value if isinstance(client.status, ClientStatus) else client.status,
        'responsible_id': client.responsible_id,
        'responsible_name': f"{client.responsible.first_name} {client.responsible.last_name}" if client.responsible else None,
        'notes': client.notes,
        'comments': client.comments,
        'portal_url': client.portal_url,
        'created_at': client.created_at,
        'updated_at': client.updated_at,
    }
    
    return ClientResponse(**client_dict)


@router.post("/", response_model=ClientResponse, status_code=status.HTTP_201_CREATED)
async def create_client(
    request: Request,
    client_data: ClientCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Client:
    """
    Create a new client
    
    If company_id is provided, use it. Otherwise, if company_name is provided,
    create a new company or find existing one by name.
    
    Args:
        client_data: Client creation data
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        Created client
    """
    try:
        # Handle company creation or matching
        company_id = client_data.company_id
        
        if not company_id:
            # Try to find existing company by name
            if client_data.company_name:
                matched_company_id = await find_company_by_name(
                    company_name=client_data.company_name,
                    db=db
                )
                if matched_company_id:
                    company_id = matched_company_id
                    logger.info(f"Auto-matched company '{client_data.company_name}' to company ID {matched_company_id}")
                else:
                    # Create new company
                    company = Company(
                        name=client_data.company_name,
                        email=client_data.company_email,
                        phone=client_data.company_phone,
                        address=client_data.company_address,
                        city=client_data.company_city,
                        country=client_data.company_country,
                        website=client_data.company_website,
                        description=client_data.company_description,
                        is_client=True,  # Mark as client
                    )
                    db.add(company)
                    await db.flush()
                    company_id = company.id
                    logger.info(f"Created new company '{client_data.company_name}' with ID {company_id}")
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Either company_id or company_name must be provided"
                )
        else:
            # Verify company exists and update is_client flag
            company_result = await db.execute(
                select(Company).where(Company.id == company_id)
            )
            company = company_result.scalar_one_or_none()
            if not company:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Company not found"
                )
            # Mark company as client
            if not company.is_client:
                company.is_client = True
                logger.info(f"Marked company {company_id} as client")
        
        # Verify company_id is set
        if not company_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Company ID is required"
            )
        
        # Check if client already exists for this company
        existing_client_result = await db.execute(
            select(Client).where(Client.company_id == company_id)
        )
        if existing_client_result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A client already exists for this company"
            )
        
        # Validate responsible exists if provided
        if client_data.responsible_id:
            responsible_result = await db.execute(
                select(User).where(User.id == client_data.responsible_id)
            )
            if not responsible_result.scalar_one_or_none():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Responsible user not found"
                )
        
        # Create client
        client = Client(
            company_id=company_id,
            status=client_data.status,
            responsible_id=client_data.responsible_id,
            notes=client_data.notes,
            comments=client_data.comments,
            portal_url=client_data.portal_url,
        )
        
        db.add(client)
        await db.commit()
        await db.refresh(client, ["company", "responsible"])
        
        logger.info(f"User {current_user.id} created client {client.id} for company {company_id}")
        
        # Regenerate presigned URL for logo if it exists
        logo_url = client.company.logo_url if client.company else None
        if logo_url and S3Service.is_configured():
            try:
                s3_service = S3Service()
                if 'clients/logos' in logo_url or 'companies/logos' in logo_url:
                    file_key = logo_url if not logo_url.startswith('http') else logo_url.split('?')[0].split('/')[-1]
                    presigned_url = s3_service.generate_presigned_url(file_key, expiration=604800)
                    if presigned_url:
                        logo_url = presigned_url
            except Exception as e:
                logger.warning(f"Failed to generate presigned URL for client {client.id}: {e}")
        
        client_dict = {
            'id': client.id,
            'company_id': client.company_id,
            'company_name': client.company.name if client.company else None,
            'company_logo_url': logo_url,
            'status': client.status.value if isinstance(client.status, ClientStatus) else client.status,
            'responsible_id': client.responsible_id,
            'responsible_name': f"{client.responsible.first_name} {client.responsible.last_name}" if client.responsible else None,
            'notes': client.notes,
            'comments': client.comments,
            'portal_url': client.portal_url,
            'created_at': client.created_at,
            'updated_at': client.updated_at,
        }
        
        return ClientResponse(**client_dict)
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error creating client: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create client: {str(e)}"
        )


@router.put("/{client_id}", response_model=ClientResponse)
async def update_client(
    request: Request,
    client_id: int,
    client_data: ClientUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Client:
    """
    Update a client
    
    Args:
        client_id: Client ID
        client_data: Client update data
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        Updated client
        
    Raises:
        HTTPException: If client not found
    """
    result = await db.execute(
        select(Client).where(Client.id == client_id)
    )
    client = result.scalar_one_or_none()
    
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found"
        )
    
    try:
        # Validate responsible exists if provided
        if client_data.responsible_id is not None:
            responsible_result = await db.execute(
                select(User).where(User.id == client_data.responsible_id)
            )
            if not responsible_result.scalar_one_or_none():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Responsible user not found"
                )
        
        # Update fields
        update_data = client_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(client, field, value)
        
        await db.commit()
        await db.refresh(client, ["company", "responsible"])
        
        logger.info(f"User {current_user.id} updated client {client_id}")
        
        # Regenerate presigned URL for logo if it exists
        logo_url = client.company.logo_url if client.company else None
        if logo_url and S3Service.is_configured():
            try:
                s3_service = S3Service()
                if 'clients/logos' in logo_url or 'companies/logos' in logo_url:
                    file_key = logo_url if not logo_url.startswith('http') else logo_url.split('?')[0].split('/')[-1]
                    presigned_url = s3_service.generate_presigned_url(file_key, expiration=604800)
                    if presigned_url:
                        logo_url = presigned_url
            except Exception as e:
                logger.warning(f"Failed to generate presigned URL for client {client_id}: {e}")
        
        client_dict = {
            'id': client.id,
            'company_id': client.company_id,
            'company_name': client.company.name if client.company else None,
            'company_logo_url': logo_url,
            'status': client.status.value if isinstance(client.status, ClientStatus) else client.status,
            'responsible_id': client.responsible_id,
            'responsible_name': f"{client.responsible.first_name} {client.responsible.last_name}" if client.responsible else None,
            'notes': client.notes,
            'comments': client.comments,
            'portal_url': client.portal_url,
            'created_at': client.created_at,
            'updated_at': client.updated_at,
        }
        
        return ClientResponse(**client_dict)
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error updating client: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update client: {str(e)}"
        )


@router.delete("/{client_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_client(
    request: Request,
    client_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    """
    Delete a client
    
    Args:
        client_id: Client ID
        current_user: Current authenticated user
        db: Database session
        
    Raises:
        HTTPException: If client not found
    """
    result = await db.execute(
        select(Client).where(Client.id == client_id)
    )
    client = result.scalar_one_or_none()
    
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found"
        )
    
    try:
        # Note: Company is not deleted, only the client record
        # Optionally, we could unset is_client flag on company
        company_id = client.company_id
        await db.delete(client)
        await db.commit()
        
        # Optionally unset is_client flag if no other clients exist for this company
        other_clients_result = await db.execute(
            select(Client).where(Client.company_id == company_id)
        )
        if not other_clients_result.scalar_one_or_none():
            # No other clients for this company, unset is_client flag
            company_result = await db.execute(
                select(Company).where(Company.id == company_id)
            )
            company = company_result.scalar_one_or_none()
            if company:
                company.is_client = False
                await db.commit()
                logger.info(f"Unset is_client flag for company {company_id}")
        
        logger.info(f"User {current_user.id} deleted client {client_id}")
    except Exception as e:
        await db.rollback()
        logger.error(f"Error deleting client: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete client: {str(e)}"
        )
