"""
Project Clients Endpoints
API endpoints for managing project clients
"""

from typing import List, Optional, Dict
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
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
from app.models.contact import Contact
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


async def find_contact_by_name(
    first_name: str,
    last_name: str,
    company_id: Optional[int] = None,
    db: AsyncSession = None,
    all_contacts: Optional[List[Contact]] = None,
    contact_name_to_id: Optional[dict] = None
) -> Optional[int]:
    """
    Find a contact ID by first name and last name using intelligent matching.
    
    Matching strategy:
    1. Exact match (case-insensitive) on first_name + last_name
    2. If company_id provided, also filter by company_id
    
    Args:
        first_name: Contact first name
        last_name: Contact last name
        company_id: Optional company ID to filter by
        db: Database session
        all_contacts: Optional pre-loaded list of contacts (for performance)
        contact_name_to_id: Optional pre-built mapping (for performance)
        
    Returns:
        Contact ID if found, None otherwise
    """
    if not first_name or not last_name or not first_name.strip() or not last_name.strip():
        return None
    
    # Load contacts if not provided
    if all_contacts is None or contact_name_to_id is None:
        query = select(Contact)
        if company_id:
            query = query.where(Contact.company_id == company_id)
        contacts_result = await db.execute(query)
        all_contacts = contacts_result.scalars().all()
        contact_name_to_id = {}
        for contact in all_contacts:
            if contact.first_name and contact.last_name:
                full_name = f"{contact.first_name.strip().lower()} {contact.last_name.strip().lower()}"
                contact_name_to_id[full_name] = contact.id
    
    # Normalize search name
    search_name = f"{first_name.strip().lower()} {last_name.strip().lower()}"
    
    # Try exact match
    if search_name in contact_name_to_id:
        return contact_name_to_id[search_name]
    
    # Try matching with company filter if company_id provided
    if company_id:
        for contact in all_contacts:
            if contact.company_id == company_id:
                contact_full_name = f"{contact.first_name.strip().lower()} {contact.last_name.strip().lower()}"
                if contact_full_name == search_name:
                    return contact.id
    
    return None


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
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skip: str = Query("0", description="Number of records to skip"),
    limit: str = Query("100", description="Maximum number of records to return"),
    status: Optional[ClientStatus] = Query(None, description="Filter by client status"),
    responsible_id: Optional[str] = Query(None, description="Filter by responsible employee ID"),
    company_id: Optional[str] = Query(None, description="Filter by company ID"),
    search: Optional[str] = Query(None, description="Search by company name or responsible employee name"),
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
    # Convert string parameters to integers
    try:
        skip_int = int(skip.strip()) if skip and skip.strip() else 0
        limit_int = int(limit.strip()) if limit and limit.strip() else 100
    except (ValueError, TypeError, AttributeError):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="skip and limit must be valid integers"
        )
    
    # Validate ranges
    if skip_int < 0:
        skip_int = 0
    if limit_int < 1:
        limit_int = 100
    elif limit_int > 1000:
        limit_int = 1000
    
    # Convert optional integer parameters
    responsible_id_int = None
    if responsible_id is not None and responsible_id.strip():
        try:
            responsible_id_int = int(responsible_id)
        except (ValueError, TypeError):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="responsible_id must be a valid integer"
            )
    
    company_id_int = None
    if company_id is not None and company_id.strip():
        try:
            company_id_int = int(company_id)
        except (ValueError, TypeError):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="company_id must be a valid integer"
            )
    
    query = select(Client)
    
    if status:
        query = query.where(Client.status == status)
    if responsible_id_int is not None:
        query = query.where(Client.responsible_id == responsible_id_int)
    if company_id_int is not None:
        query = query.where(Client.company_id == company_id_int)
    if search:
        search_term = f"%{search.lower()}%"
        query = query.join(Company).join(User, Client.responsible_id == User.id, isouter=True).where(
            or_(
                func.lower(Company.name).like(search_term),
                func.lower(Company.email).like(search_term),
                func.lower(User.first_name).like(search_term),
                func.lower(User.last_name).like(search_term),
            )
        )
    
    query = query.options(
        selectinload(Client.company),
        selectinload(Client.responsible)
    ).order_by(Client.created_at.desc()).offset(skip_int).limit(limit_int)
    
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


@router.get("/import/{import_id}/logs")
async def get_import_logs(
    import_id: str,
    current_user: User = Depends(get_current_user),
):
    """
    Get import logs for a specific import ID
    
    Args:
        import_id: Import ID to get logs for
        current_user: Current authenticated user
        
    Returns:
        Dictionary with logs and status
    """
    logs = import_logs.get(import_id, [])
    status_info = import_status.get(import_id, {
        "status": "unknown",
        "progress": 0,
        "total": 0,
    })
    
    return {
        "import_id": import_id,
        "logs": logs,
        "status": status_info,
        "total_logs": len(logs),
    }


@router.get("/import/{import_id}/logs/stream")
async def stream_import_logs(
    import_id: str,
    current_user: User = Depends(get_current_user),
):
    """
    Stream import logs via Server-Sent Events (SSE)
    """
    async def event_generator():
        last_index = 0
        
        while True:
            # Check if import is complete
            if import_id in import_status:
                status_info = import_status[import_id]
                if status_info.get("status") == "completed" or status_info.get("status") == "failed":
                    # Send final logs
                    if import_id in import_logs:
                        logs = import_logs[import_id]
                        for log in logs[last_index:]:
                            yield f"data: {json.dumps(log)}\n\n"
                    
                    # Send final status
                    yield f"data: {json.dumps({'type': 'status', 'data': status_info})}\n\n"
                    yield f"data: {json.dumps({'type': 'done'})}\n\n"
                    break
            
            # Send new logs
            if import_id in import_logs:
                logs = import_logs[import_id]
                if len(logs) > last_index:
                    for log in logs[last_index:]:
                        yield f"data: {json.dumps(log)}\n\n"
                    last_index = len(logs)
            
            # Send status update
            if import_id in import_status:
                status_info = import_status[import_id]
                yield f"data: {json.dumps({'type': 'status', 'data': status_info})}\n\n"
            
            await asyncio.sleep(0.5)  # Check every 500ms
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )


@router.post("/import")
async def import_clients(
    file: UploadFile = File(...),
    import_id: Optional[str] = Query(None, description="Optional import ID for tracking logs"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Import clients from Excel file or ZIP file (Excel + logos)
    
    Supported column names (case-insensitive, accent-insensitive):
    - Company Name: company_name, company, entreprise, entreprise_name, nom_entreprise, société, societe, organisation, organization, firme, business, client
    - Company ID: company_id, id_entreprise, entreprise_id, company id, id company, id entreprise
    - Status: status, statut, état, etat, state
    - Responsible ID: responsible_id, responsable_id, employee_id, id_employé, id_employe, employé_id, employe_id, employee id, id employee, responsable id, assigned_to_id, assigned to id
    - Notes: notes, note, commentaires, commentaire, comments, comment
    - Comments: comments, commentaires, commentaire, comment, notes, note
    - Portal URL: portal_url, portal url, url_portail, url portail, portail, portal
    
    Features:
    - Automatic company matching by name (exact, without legal form, or partial match)
    - Create company if not found (if company_name provided)
    - Mark company as client (is_client=True)
    
    Args:
        file: Excel file or ZIP file with clients data and logos
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        Import results with data, errors, and warnings
    """
    # Generate import_id if not provided
    if not import_id:
        import_id = str(uuid.uuid4())
    
    # Initialize logs and status
    import_logs[import_id] = []
    import_status[import_id] = {
        "status": "started",
        "progress": 0,
        "total": 0,
        "created_at": dt.now().isoformat()
    }
    
    add_import_log(import_id, f"Début de l'import du fichier: {file.filename}", "info")
    
    try:
        # Read file content
        file_content = await file.read()
        filename = file.filename or ""
        file_ext = os.path.splitext(filename.lower())[1]
        
        add_import_log(import_id, f"Fichier lu: {len(file_content)} bytes, extension: {file_ext}", "info")
        
        # Dictionary to store logos from ZIP (filename -> file content)
        logos_dict = {}
        excel_content = None
        
        # Check if it's a ZIP file
        if file_ext == '.zip':
            add_import_log(import_id, "Détection d'un fichier ZIP, extraction en cours...", "info")
            try:
                with zipfile.ZipFile(BytesIO(file_content), 'r') as zip_ref:
                    logo_count = 0
                    # Extract Excel file and logos
                    for file_info in zip_ref.namelist():
                        file_name_lower = file_info.lower()
                        
                        # Find Excel file
                        if file_name_lower.endswith(('.xlsx', '.xls')):
                            if excel_content is None:
                                excel_content = zip_ref.read(file_info)
                                add_import_log(import_id, f"Fichier Excel trouvé dans le ZIP: {file_info}", "info")
                            else:
                                logger.warning(f"Multiple Excel files found in ZIP, using first: {file_info}")
                                add_import_log(import_id, f"Plusieurs fichiers Excel trouvés, utilisation du premier: {file_info}", "warning")
                        
                        # Find logos (in logos/ folder or root)
                        elif file_name_lower.endswith(('.jpg', '.jpeg', '.png', '.gif', '.webp')):
                            logo_content = zip_ref.read(file_info)
                            logo_filename = os.path.basename(file_info)
                            logo_filename_normalized = normalize_filename(logo_filename)
                            logos_dict[logo_filename.lower()] = logo_content
                            if logo_filename_normalized != logo_filename.lower():
                                logos_dict[logo_filename_normalized] = logo_content
                            logo_count += 1
                    
                    add_import_log(import_id, f"Extraction ZIP terminée: {logo_count} logo(s) trouvé(s)", "info")
                
                if excel_content is None:
                    add_import_log(import_id, "ERREUR: Aucun fichier Excel trouvé dans le ZIP", "error")
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="No Excel file found in ZIP. Please include clients.xlsx or clients.xls"
                    )
                
                file_content = excel_content
                logger.info(f"Extracted Excel from ZIP with {len(logos_dict)} logos")
                
            except zipfile.BadZipFile:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid ZIP file format"
                )
            except Exception as e:
                logger.error(f"Error extracting ZIP: {e}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Error processing ZIP file: {str(e)}"
                )
        
        # Import from Excel
        add_import_log(import_id, "Lecture du fichier Excel...", "info")
        try:
            result = ImportService.import_from_excel(
                file_content=file_content,
                has_headers=True
            )
        except Exception as e:
            add_import_log(import_id, f"ERREUR lors de la lecture Excel: {str(e)}", "error")
            logger.error(f"Error importing Excel file: {e}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Error reading Excel file: {str(e)}"
            )
        
        # Validate result structure
        if not result or 'data' not in result:
            add_import_log(import_id, "ERREUR: Format de fichier Excel invalide ou fichier vide", "error")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid Excel file format or empty file"
            )
        
        if not isinstance(result['data'], list):
            add_import_log(import_id, "ERREUR: Le fichier Excel ne contient pas de lignes de données valides", "error")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Excel file does not contain valid data rows"
            )
        
        total_rows = len(result['data'])
        add_import_log(import_id, f"Fichier Excel lu avec succès: {total_rows} ligne(s) trouvée(s)", "info")
        update_import_status(import_id, "processing", progress=0, total=total_rows)
        
        # Load all companies once to create a name -> ID mapping
        add_import_log(import_id, "Chargement des entreprises existantes...", "info")
        try:
            companies_result = await db.execute(select(Company))
            all_companies = companies_result.scalars().all()
            company_name_to_id = {}
            for company in all_companies:
                if company.name:
                    company_name_to_id[company.name.lower().strip()] = company.id
            add_import_log(import_id, f"{len(company_name_to_id)} entreprise(s) chargée(s) pour le matching", "info")
        except Exception as e:
            add_import_log(import_id, f"ERREUR lors du chargement des entreprises: {str(e)}", "error")
            logger.error(f"Error loading companies: {e}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error loading companies from database"
            )
        
        # Load all existing clients once to check for duplicates
        add_import_log(import_id, "Chargement des clients existants pour détecter les doublons...", "info")
        try:
            clients_result = await db.execute(select(Client))
            all_existing_clients = clients_result.scalars().all()
            clients_by_company_id = {c.company_id: c for c in all_existing_clients}
            add_import_log(import_id, f"{len(all_existing_clients)} client(s) existant(s) chargé(s)", "info")
        except Exception as e:
            logger.error(f"Error loading existing clients: {e}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error loading existing clients from database"
            )
        
        # Load all contacts once to create a name -> ID mapping
        add_import_log(import_id, "Chargement des contacts existants...", "info")
        try:
            contacts_result = await db.execute(select(Contact))
            all_contacts = contacts_result.scalars().all()
            contact_name_to_id = {}
            for contact in all_contacts:
                if contact.first_name and contact.last_name:
                    full_name = f"{contact.first_name.strip().lower()} {contact.last_name.strip().lower()}"
                    contact_name_to_id[full_name] = contact.id
            add_import_log(import_id, f"{len(contact_name_to_id)} contact(s) chargé(s) pour le matching", "info")
        except Exception as e:
            logger.error(f"Error loading contacts: {e}", exc_info=True)
            add_import_log(import_id, f"⚠️ Erreur lors du chargement des contacts: {str(e)}", "warning")
            all_contacts = []
            contact_name_to_id = {}
        
        # Helper function to normalize column names
        def normalize_key(key: str) -> str:
            """Normalize column name for matching"""
            if not key:
                return ''
            normalized = str(key).lower().strip()
            normalized = unicodedata.normalize('NFD', normalized)
            normalized = ''.join(c for c in normalized if unicodedata.category(c) != 'Mn')
            return normalized
        
        # Helper function to get value from row with multiple possible column names
        def get_field_value(row: dict, possible_names: list) -> Optional[str]:
            """Get field value trying multiple possible column names"""
            for name in possible_names:
                if name in row and row[name] is not None:
                    value = str(row[name]).strip()
                    if value:
                        return value
            
            normalized_row = {normalize_key(k): v for k, v in row.items()}
            for name in possible_names:
                normalized_name = normalize_key(name)
                if normalized_name in normalized_row and normalized_row[normalized_name] is not None:
                    value = str(normalized_row[normalized_name]).strip()
                    if value:
                        return value
            
            return None
        
        # Process imported data
        created_clients = []
        errors = []
        warnings = []
        stats = {
            "total_processed": 0,
            "created_new": 0,
            "matched_existing": 0,
            "errors": 0,
        }
        
        # Initialize S3 service for logo uploads
        s3_service = None
        s3_configured = S3Service.is_configured()
        
        if s3_configured:
            try:
                s3_service = S3Service()
                logger.info("S3Service initialized successfully for client logo uploads")
            except Exception as e:
                logger.error(f"Failed to initialize S3Service: {e}", exc_info=True)
                warnings.append({
                    'row': 0,
                    'type': 's3_init_failed',
                    'message': f"⚠️ Impossible d'initialiser le service S3 pour l'upload des logos. Les clients seront créés sans logos. Erreur: {str(e)}",
                })
        
        for idx, row_data in enumerate(result['data']):
            try:
                stats["total_processed"] += 1
                update_import_status(import_id, "processing", progress=idx + 1, total=total_rows)
                
                # Get company name or ID
                company_name = get_field_value(row_data, [
                    'company_name', 'company', 'entreprise', 'entreprise_name', 'nom_entreprise',
                    'société', 'societe', 'organisation', 'organization', 'firme', 'business', 'client'
                ])
                company_id_raw = get_field_value(row_data, [
                    'company_id', 'id_entreprise', 'entreprise_id', 'company id', 'id company', 'id entreprise'
                ])
                company_id = None
                if company_id_raw:
                    try:
                        company_id = int(float(str(company_id_raw)))
                    except (ValueError, TypeError):
                        warnings.append({
                            'row': idx + 2,
                            'type': 'invalid_company_id',
                            'message': f"ID entreprise invalide: '{company_id_raw}'",
                            'data': {'company_id_raw': company_id_raw}
                        })
                
                # Find or create company
                if company_id:
                    # Verify company exists
                    company_result = await db.execute(
                        select(Company).where(Company.id == company_id)
                    )
                    company = company_result.scalar_one_or_none()
                    if not company:
                        errors.append({
                            'row': idx + 2,
                            'data': row_data,
                            'error': f"Company ID {company_id} not found"
                        })
                        continue
                elif company_name:
                    # Try to find existing company
                    matched_company_id = await find_company_by_name(
                        company_name=company_name,
                        db=db,
                        all_companies=all_companies,
                        company_name_to_id=company_name_to_id
                    )
                    if matched_company_id:
                        company_id = matched_company_id
                        logger.info(f"Auto-matched company '{company_name}' to company ID {matched_company_id}")
                    else:
                        # Create new company
                        company = Company(
                            name=company_name,
                            is_client=True,
                        )
                        db.add(company)
                        await db.flush()
                        company_id = company.id
                        # Update mappings
                        all_companies.append(company)
                        company_name_to_id[company_name.lower().strip()] = company_id
                        logger.info(f"Created new company '{company_name}' with ID {company_id}")
                else:
                    errors.append({
                        'row': idx + 2,
                        'data': row_data,
                        'error': 'Company name or ID is required'
                    })
                    continue
                
                # Check if client already exists for this company
                existing_client = clients_by_company_id.get(company_id)
                
                # If client already exists, skip creation to avoid duplicate key error
                if existing_client:
                    stats["matched_existing"] += 1
                    add_import_log(import_id, f"Ligne {idx + 2}: ⚠️ Client existe déjà pour l'entreprise '{company_name}' (ID: {existing_client.id}) - ignoré", "warning")
                    # Update existing client fields if provided
                    update_data = {}
                    # Get status
                    status_raw = get_field_value(row_data, [
                        'status', 'statut', 'état', 'etat', 'state'
                    ])
                    if status_raw:
                        status_lower = status_raw.lower().strip()
                        if status_lower in ['inactive', 'inactif', 'inactif']:
                            update_data['status'] = ClientStatus.INACTIVE
                        elif status_lower in ['maintenance', 'maintenance']:
                            update_data['status'] = ClientStatus.MAINTENANCE
                        else:
                            update_data['status'] = ClientStatus.ACTIVE
                    
                    # Get responsible_id
                    responsible_id_raw = get_field_value(row_data, [
                        'responsible_id', 'responsable_id', 'employee_id', 'id_employé', 'id_employe',
                        'employé_id', 'employe_id', 'employee id', 'id employee', 'responsable id',
                        'assigned_to_id', 'assigned to id'
                    ])
                    if responsible_id_raw:
                        try:
                            update_data['responsible_id'] = int(float(str(responsible_id_raw)))
                        except (ValueError, TypeError):
                            pass
                    
                    # Get notes and comments
                    notes = get_field_value(row_data, [
                        'notes', 'note', 'commentaires', 'commentaire', 'comments', 'comment'
                    ])
                    if notes:
                        update_data['notes'] = notes
                    
                    comments = get_field_value(row_data, [
                        'comments', 'commentaires', 'commentaire', 'comment', 'notes', 'note'
                    ])
                    if comments:
                        update_data['comments'] = comments
                    
                    portal_url = get_field_value(row_data, [
                        'portal_url', 'portal url', 'url_portail', 'url portail', 'portail', 'portal'
                    ])
                    if portal_url:
                        update_data['portal_url'] = portal_url
                    
                    # Update existing client if there are changes
                    if update_data:
                        for field, value in update_data.items():
                            setattr(existing_client, field, value)
                        add_import_log(import_id, f"Ligne {idx + 2}: Client mis à jour - {company_name} (ID: {existing_client.id})", "info")
                    continue
                
                # Handle contact matching by name
                contact_name = get_field_value(row_data, [
                    'contact_name', 'contact', 'Contact', 'contact_nom', 'contact_name_full'
                ])
                contact_first_name = get_field_value(row_data, [
                    'contact_first_name', 'contact_prenom', 'Contact Prénom', 'contact_prenom'
                ])
                contact_last_name = get_field_value(row_data, [
                    'contact_last_name', 'contact_nom', 'Contact Nom', 'contact_nom_famille'
                ])
                
                if contact_name:
                    # Try to parse "First Last" format
                    name_parts = contact_name.strip().split(' ', 1)
                    if len(name_parts) == 2:
                        contact_first_name = name_parts[0]
                        contact_last_name = name_parts[1]
                    elif len(name_parts) == 1:
                        contact_last_name = name_parts[0]
                
                # Note: We log contact matching but don't link contacts to clients
                # as the Client model doesn't have a direct contact relationship
                # This is for informational purposes and future enhancement
                if contact_first_name and contact_last_name:
                    matched_contact_id = await find_contact_by_name(
                        first_name=contact_first_name,
                        last_name=contact_last_name,
                        company_id=company_id,
                        db=db,
                        all_contacts=all_contacts,
                        contact_name_to_id=contact_name_to_id
                    )
                    if matched_contact_id:
                        add_import_log(import_id, f"Ligne {idx + 2}: Contact '{contact_first_name} {contact_last_name}' matché avec ID {matched_contact_id} (entreprise: {company_name})", "info")
                    else:
                        add_import_log(import_id, f"Ligne {idx + 2}: ⚠️ Contact '{contact_first_name} {contact_last_name}' non trouvé pour l'entreprise '{company_name}'", "warning")
                
                # Get status
                status_raw = get_field_value(row_data, [
                    'status', 'statut', 'état', 'etat', 'state'
                ])
                client_status = ClientStatus.ACTIVE
                if status_raw:
                    status_lower = status_raw.lower().strip()
                    if status_lower in ['inactive', 'inactif', 'inactif']:
                        client_status = ClientStatus.INACTIVE
                    elif status_lower in ['maintenance', 'maintenance']:
                        client_status = ClientStatus.MAINTENANCE
                
                # Get responsible_id
                responsible_id = None
                responsible_id_raw = get_field_value(row_data, [
                    'responsible_id', 'responsable_id', 'employee_id', 'id_employé', 'id_employe',
                    'employé_id', 'employe_id', 'employee id', 'id employee', 'responsable id',
                    'assigned_to_id', 'assigned to id'
                ])
                if responsible_id_raw:
                    try:
                        responsible_id = int(float(str(responsible_id_raw)))
                    except (ValueError, TypeError):
                        warnings.append({
                            'row': idx + 2,
                            'type': 'invalid_responsible_id',
                            'message': f"ID responsable invalide: '{responsible_id_raw}'",
                            'data': {'responsible_id_raw': responsible_id_raw}
                        })
                
                # Get notes
                notes = get_field_value(row_data, [
                    'notes', 'note', 'commentaires', 'commentaire', 'comments', 'comment'
                ])
                
                # Get comments
                comments = get_field_value(row_data, [
                    'comments', 'commentaires', 'commentaire', 'comment', 'notes', 'note'
                ])
                
                # Get portal_url
                portal_url = get_field_value(row_data, [
                    'portal_url', 'portal url', 'url_portail', 'url portail', 'portail', 'portal'
                ])
                
                # Handle logo upload from ZIP
                logo_url = None
                if logos_dict and s3_service:
                    # Try to match logo by company name
                    company_name_normalized = normalize_filename(company_name) if company_name else None
                    if company_name_normalized:
                        # Try various patterns
                        patterns = [
                            company_name_normalized,
                            company_name.lower().strip() if company_name else None,
                            f"{company_name_normalized}.jpg",
                            f"{company_name_normalized}.png",
                            f"{company_name_normalized}.jpeg",
                        ]
                        
                        for pattern in patterns:
                            if pattern and pattern in logos_dict:
                                try:
                                    logo_content = logos_dict[pattern]
                                    file_key = f"clients/logos/{company_id}_{company_name_normalized}_{uuid.uuid4().hex[:8]}.{pattern.split('.')[-1] if '.' in pattern else 'jpg'}"
                                    upload_result = s3_service.upload_file(
                                        file_content=logo_content,
                                        file_key=file_key,
                                        content_type='image/jpeg'
                                    )
                                    if upload_result and 'file_key' in upload_result:
                                        logo_url = upload_result['file_key']
                                        # Update company logo_url
                                        company_result = await db.execute(
                                            select(Company).where(Company.id == company_id)
                                        )
                                        company = company_result.scalar_one_or_none()
                                        if company:
                                            company.logo_url = logo_url
                                        break
                                except Exception as e:
                                    logger.error(f"Failed to upload logo {pattern}: {e}", exc_info=True)
                                    warnings.append({
                                        'row': idx + 2,
                                        'type': 'logo_upload_error',
                                        'message': f"Erreur lors de l'upload du logo '{pattern}': {str(e)}",
                                    })
                
                # Create new client (existing_client check already done above)
                client = Client(
                    company_id=company_id,
                    status=client_status,
                    responsible_id=responsible_id,
                    notes=notes,
                    comments=comments,
                    portal_url=portal_url,
                )
                db.add(client)
                created_clients.append(client)
                # Add to clients_by_company_id to prevent duplicates in same import
                clients_by_company_id[company_id] = client
                stats["created_new"] += 1
                add_import_log(import_id, f"Ligne {idx + 2}: Nouveau client créé - {company_name}", "info")
                
                # Mark company as client
                company_result = await db.execute(
                    select(Company).where(Company.id == company_id)
                )
                company = company_result.scalar_one_or_none()
                if company and not company.is_client:
                    company.is_client = True
                
            except Exception as e:
                stats["errors"] += 1
                error_msg = f"Ligne {idx + 2}: ❌ Erreur lors de l'import - {str(e)}"
                add_import_log(import_id, error_msg, "error", {"row": idx + 2, "error": str(e)})
                errors.append({
                    'row': idx + 2,
                    'data': row_data,
                    'error': str(e)
                })
                logger.error(f"Error importing client row {idx + 2}: {str(e)}", exc_info=True)
        
        # Commit all clients
        add_import_log(import_id, f"Sauvegarde de {len(created_clients)} client(s) dans la base de données...", "info")
        try:
            if created_clients:
                await db.commit()
                for client in created_clients:
                    await db.refresh(client, ["company", "responsible"])
                
                add_import_log(import_id, f"Sauvegarde réussie: {len(created_clients)} client(s) traité(s)", "success")
        except Exception as e:
            add_import_log(import_id, f"ERREUR lors de la sauvegarde: {str(e)}", "error")
            logger.error(f"Error committing clients to database: {e}", exc_info=True)
            await db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error saving clients to database: {str(e)}"
            )
        
        # Serialize clients
        serialized_clients = []
        for client in created_clients:
            logo_url = client.company.logo_url if client.company else None
            if logo_url and s3_service:
                try:
                    presigned_url = s3_service.generate_presigned_url(logo_url, expiration=604800)
                    if presigned_url:
                        logo_url = presigned_url
                except Exception:
                    pass
            
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
            serialized_clients.append(ClientResponse(**client_dict))
        
        # Final summary
        total_valid = len(created_clients)
        total_errors = len(errors)
        
        add_import_log(import_id, f"✅ Import terminé: {total_valid} client(s) importé(s), {total_errors} erreur(s)", "success", {
            "total_valid": total_valid,
            "total_errors": total_errors,
            "created_new": stats["created_new"],
            "matched_existing": stats["matched_existing"],
        })
        update_import_status(import_id, "completed", progress=total_rows, total=total_rows)
        
        return {
            'total_rows': result.get('total_rows', 0),
            'valid_rows': len(created_clients),
            'created_rows': stats["created_new"],
            'updated_rows': stats["matched_existing"],
            'invalid_rows': len(errors),
            'errors': errors,
            'warnings': warnings,
            'logos_uploaded': len(logos_dict) if logos_dict else 0,
            'data': serialized_clients,
            'import_id': import_id
        }
    except HTTPException:
        if import_id:
            update_import_status(import_id, "failed")
        raise
    except Exception as e:
        if import_id:
            add_import_log(import_id, f"ERREUR inattendue: {str(e)}", "error")
            update_import_status(import_id, "failed")
        logger.error(f"Unexpected error in import_clients: {e}", exc_info=True)
        try:
            await db.rollback()
        except Exception:
            pass
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred during import: {str(e)}"
        )


@router.get("/export")
async def export_clients(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Export clients to Excel file
    
    Args:
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        Excel file with clients data
    """
    try:
        # Get all clients
        result = await db.execute(
            select(Client)
            .options(
                selectinload(Client.company),
                selectinload(Client.responsible)
            )
            .order_by(Client.created_at.desc())
        )
        clients = result.scalars().all()
        
        # Convert to dict format for export
        export_data = []
        for client in clients:
            try:
                responsible_name = ''
                if client.responsible:
                    first_name = client.responsible.first_name or ''
                    last_name = client.responsible.last_name or ''
                    responsible_name = f"{first_name} {last_name}".strip()
                
                export_data.append({
                    'Nom de l\'entreprise': client.company.name if client.company and client.company.name else '',
                    'Statut': client.status.value if isinstance(client.status, ClientStatus) else str(client.status),
                    'Responsable': responsible_name,
                    'Notes': client.notes or '',
                    'Commentaires': client.comments or '',
                    'URL Portail': client.portal_url or '',
                })
            except Exception as e:
                logger.error(f"Error processing client {client.id} for export: {e}")
                continue
        
        # Handle empty data case
        if not export_data:
            export_data = [{
                'Nom de l\'entreprise': '',
                'Statut': '',
                'Responsable': '',
                'Notes': '',
                'Commentaires': '',
                'URL Portail': '',
            }]
        
        # Export to Excel
        from datetime import datetime
        buffer, filename = ExportService.export_to_excel(
            data=export_data,
            filename=f"clients_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
        )
        
        return StreamingResponse(
            buffer,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except ValueError as e:
        logger.error(f"Export validation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Erreur lors de l'export: {str(e)}"
        )
    except ImportError as e:
        logger.error(f"Export dependency error: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Le service d'export Excel n'est pas disponible. Veuillez contacter l'administrateur."
        )
    except Exception as e:
        logger.error(f"Unexpected export error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred during export: {str(e)}"
        )
