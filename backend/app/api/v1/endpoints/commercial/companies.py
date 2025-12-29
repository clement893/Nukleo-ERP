"""
Commercial Companies Endpoints
API endpoints for managing commercial companies
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from sqlalchemy.orm import selectinload
import zipfile
import os
from io import BytesIO

from app.core.database import get_db
from app.dependencies import get_current_user
from app.models.company import Company
from app.models.contact import Contact
from app.models.user import User
from app.schemas.company import CompanyCreate, CompanyUpdate, Company as CompanySchema
from app.services.import_service import ImportService
from app.services.export_service import ExportService
from app.services.s3_service import S3Service
from app.core.logging import logger

router = APIRouter(prefix="/commercial/companies", tags=["commercial-companies"])


@router.get("/", response_model=List[CompanySchema])
async def list_companies(
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    is_client: Optional[bool] = Query(None),
    country: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
) -> List[Company]:
    """
    Get list of companies
    
    Args:
        skip: Number of records to skip
        limit: Maximum number of records to return
        is_client: Optional client filter
        country: Optional country filter
        search: Optional search term
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        List of companies
    """
    query = select(Company)
    
    if is_client is not None:
        query = query.where(Company.is_client == is_client)
    if country:
        query = query.where(Company.country == country)
    if search:
        search_term = f"%{search.lower()}%"
        query = query.where(
            or_(
                func.lower(Company.name).like(search_term),
                func.lower(Company.email).like(search_term),
                func.lower(Company.website).like(search_term),
            )
        )
    
    query = query.options(
        selectinload(Company.parent_company),
        selectinload(Company.contacts)
    ).order_by(Company.created_at.desc()).offset(skip).limit(limit)
    
    result = await db.execute(query)
    companies = result.scalars().all()
    
    # Convert to response format with additional data
    company_list = []
    s3_service = S3Service() if S3Service.is_configured() else None
    
    for company in companies:
        # Regenerate presigned URL for logo if it exists and S3 is configured
        logo_url = company.logo_url
        if logo_url and s3_service:
            try:
                # Try to extract file_key from presigned URL or use logo_url as file_key
                file_key = None
                
                # If it's a presigned URL, try to extract the file_key from it
                if logo_url.startswith('http'):
                    # Try to extract file_key from presigned URL
                    from urllib.parse import urlparse, parse_qs, unquote
                    parsed = urlparse(logo_url)
                    
                    # Check query params for 'key' parameter
                    query_params = parse_qs(parsed.query)
                    if 'key' in query_params:
                        file_key = unquote(query_params['key'][0])
                    else:
                        # Extract from path
                        path = parsed.path.strip('/')
                        if 'companies/logos' in path:
                            idx = path.find('companies/logos')
                            if idx != -1:
                                file_key = path[idx:]
                        elif path.startswith('companies/'):
                            file_key = path
                else:
                    # Assume it's already a file_key
                    file_key = logo_url
                
                if file_key:
                    # Generate new presigned URL (7 days expiration)
                    logo_url = s3_service.generate_presigned_url(file_key, expiration=604800)
            except Exception as e:
                logger.warning(f"Failed to generate presigned URL for company logo: {e}")
                # Keep original URL if generation fails
        
        # Count contacts
        contacts_count = len(company.contacts) if company.contacts else 0
        
        # TODO: Count projects when project model is linked
        projects_count = 0
        
        company_dict = {
            "id": company.id,
            "name": company.name,
            "parent_company_id": company.parent_company_id,
            "parent_company_name": company.parent_company.name if company.parent_company else None,
            "description": company.description,
            "website": company.website,
            "logo_url": logo_url,
            "email": company.email,
            "phone": company.phone,
            "address": company.address,
            "city": company.city,
            "country": company.country,
            "is_client": company.is_client,
            "facebook": company.facebook,
            "instagram": company.instagram,
            "linkedin": company.linkedin,
            "contacts_count": contacts_count,
            "projects_count": projects_count,
            "created_at": company.created_at,
            "updated_at": company.updated_at,
        }
        company_list.append(CompanySchema(**company_dict))
    
    return company_list


@router.get("/{company_id}", response_model=CompanySchema)
async def get_company(
    company_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Company:
    """
    Get a company by ID
    
    Args:
        company_id: Company ID
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        Company details
    """
    query = select(Company).where(Company.id == company_id).options(
        selectinload(Company.parent_company),
        selectinload(Company.contacts)
    )
    
    result = await db.execute(query)
    company = result.scalar_one_or_none()
    
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Company not found: {company_id}"
        )
    
    # Regenerate presigned URL for logo if it exists and S3 is configured
    logo_url = company.logo_url
    s3_service = S3Service() if S3Service.is_configured() else None
    
    if logo_url and s3_service:
        try:
            file_key = None
            
            if logo_url.startswith('http'):
                from urllib.parse import urlparse, parse_qs, unquote
                parsed = urlparse(logo_url)
                query_params = parse_qs(parsed.query)
                if 'key' in query_params:
                    file_key = unquote(query_params['key'][0])
                else:
                    path = parsed.path.strip('/')
                    if 'companies/logos' in path:
                        idx = path.find('companies/logos')
                        if idx != -1:
                            file_key = path[idx:]
                    elif path.startswith('companies/'):
                        file_key = path
            else:
                file_key = logo_url
            
            if file_key:
                logo_url = s3_service.generate_presigned_url(file_key, expiration=604800)
        except Exception as e:
            logger.warning(f"Failed to generate presigned URL for company logo: {e}")
    
    # Count contacts
    contacts_count = len(company.contacts) if company.contacts else 0
    
    # TODO: Count projects when project model is linked
    projects_count = 0
    
    company_dict = {
        "id": company.id,
        "name": company.name,
        "parent_company_id": company.parent_company_id,
        "parent_company_name": company.parent_company.name if company.parent_company else None,
        "description": company.description,
        "website": company.website,
        "logo_url": logo_url,
        "email": company.email,
        "phone": company.phone,
        "address": company.address,
        "city": company.city,
        "country": company.country,
        "is_client": company.is_client,
        "facebook": company.facebook,
        "instagram": company.instagram,
        "linkedin": company.linkedin,
        "contacts_count": contacts_count,
        "projects_count": projects_count,
        "created_at": company.created_at,
        "updated_at": company.updated_at,
    }
    
    return CompanySchema(**company_dict)


@router.post("/", response_model=CompanySchema, status_code=status.HTTP_201_CREATED)
async def create_company(
    company_data: CompanyCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Company:
    """
    Create a new company
    
    Args:
        company_data: Company data
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        Created company
    """
    # Check if parent company exists
    if company_data.parent_company_id:
        parent_query = select(Company).where(Company.id == company_data.parent_company_id)
        parent_result = await db.execute(parent_query)
        parent_company = parent_result.scalar_one_or_none()
        if not parent_company:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Parent company not found: {company_data.parent_company_id}"
            )
    
    # Create company
    company = Company(**company_data.model_dump(exclude_unset=True))
    db.add(company)
    await db.commit()
    await db.refresh(company, ["parent_company", "contacts"])
    
    # Regenerate presigned URL for logo if it exists
    logo_url = company.logo_url
    s3_service = S3Service() if S3Service.is_configured() else None
    
    if logo_url and s3_service:
        try:
            file_key = logo_url
            if logo_url.startswith('http'):
                from urllib.parse import urlparse, parse_qs, unquote
                parsed = urlparse(logo_url)
                query_params = parse_qs(parsed.query)
                if 'key' in query_params:
                    file_key = unquote(query_params['key'][0])
                else:
                    path = parsed.path.strip('/')
                    if 'companies/logos' in path:
                        idx = path.find('companies/logos')
                        if idx != -1:
                            file_key = path[idx:]
                    elif path.startswith('companies/'):
                        file_key = path
            
            if file_key:
                logo_url = s3_service.generate_presigned_url(file_key, expiration=604800)
        except Exception as e:
            logger.warning(f"Failed to generate presigned URL for company logo: {e}")
    
    # Count contacts
    contacts_count = len(company.contacts) if company.contacts else 0
    projects_count = 0
    
    company_dict = {
        "id": company.id,
        "name": company.name,
        "parent_company_id": company.parent_company_id,
        "parent_company_name": company.parent_company.name if company.parent_company else None,
        "description": company.description,
        "website": company.website,
        "logo_url": logo_url,
        "email": company.email,
        "phone": company.phone,
        "address": company.address,
        "city": company.city,
        "country": company.country,
        "is_client": company.is_client,
        "facebook": company.facebook,
        "instagram": company.instagram,
        "linkedin": company.linkedin,
        "contacts_count": contacts_count,
        "projects_count": projects_count,
        "created_at": company.created_at,
        "updated_at": company.updated_at,
    }
    
    return CompanySchema(**company_dict)


@router.put("/{company_id}", response_model=CompanySchema)
async def update_company(
    company_id: int,
    company_data: CompanyUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Company:
    """
    Update a company
    
    Args:
        company_id: Company ID
        company_data: Updated company data
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        Updated company
    """
    query = select(Company).where(Company.id == company_id)
    result = await db.execute(query)
    company = result.scalar_one_or_none()
    
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Company not found: {company_id}"
        )
    
    # Check if parent company exists
    if company_data.parent_company_id is not None:
        if company_data.parent_company_id == company_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Company cannot be its own parent"
            )
        if company_data.parent_company_id:
            parent_query = select(Company).where(Company.id == company_data.parent_company_id)
            parent_result = await db.execute(parent_query)
            parent_company = parent_result.scalar_one_or_none()
            if not parent_company:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Parent company not found: {company_data.parent_company_id}"
                )
    
    # Update company
    update_data = company_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(company, field, value)
    
    await db.commit()
    await db.refresh(company, ["parent_company", "contacts"])
    
    # Regenerate presigned URL for logo if it exists
    logo_url = company.logo_url
    s3_service = S3Service() if S3Service.is_configured() else None
    
    if logo_url and s3_service:
        try:
            file_key = logo_url
            if logo_url.startswith('http'):
                from urllib.parse import urlparse, parse_qs, unquote
                parsed = urlparse(logo_url)
                query_params = parse_qs(parsed.query)
                if 'key' in query_params:
                    file_key = unquote(query_params['key'][0])
                else:
                    path = parsed.path.strip('/')
                    if 'companies/logos' in path:
                        idx = path.find('companies/logos')
                        if idx != -1:
                            file_key = path[idx:]
                    elif path.startswith('companies/'):
                        file_key = path
            
            if file_key:
                logo_url = s3_service.generate_presigned_url(file_key, expiration=604800)
        except Exception as e:
            logger.warning(f"Failed to generate presigned URL for company logo: {e}")
    
    # Count contacts
    contacts_count = len(company.contacts) if company.contacts else 0
    projects_count = 0
    
    company_dict = {
        "id": company.id,
        "name": company.name,
        "parent_company_id": company.parent_company_id,
        "parent_company_name": company.parent_company.name if company.parent_company else None,
        "description": company.description,
        "website": company.website,
        "logo_url": logo_url,
        "email": company.email,
        "phone": company.phone,
        "address": company.address,
        "city": company.city,
        "country": company.country,
        "is_client": company.is_client,
        "facebook": company.facebook,
        "instagram": company.instagram,
        "linkedin": company.linkedin,
        "contacts_count": contacts_count,
        "projects_count": projects_count,
        "created_at": company.created_at,
        "updated_at": company.updated_at,
    }
    
    return CompanySchema(**company_dict)


@router.delete("/{company_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_company(
    company_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Delete a company
    
    Args:
        company_id: Company ID
        current_user: Current authenticated user
        db: Database session
    """
    query = select(Company).where(Company.id == company_id)
    result = await db.execute(query)
    company = result.scalar_one_or_none()
    
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Company not found: {company_id}"
        )
    
    # Check if company has contacts
    contacts_query = select(func.count(Contact.id)).where(Contact.company_id == company_id)
    contacts_result = await db.execute(contacts_query)
    contacts_count = contacts_result.scalar()
    
    if contacts_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete company with {contacts_count} associated contact(s)"
        )
    
    await db.delete(company)
    await db.commit()


@router.post("/import", response_model=dict)
async def import_companies(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Import companies from Excel file
    
    Args:
        file: Excel file
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        Import result
    """
    # TODO: Implement Excel import with logo URLs
    # Similar to contacts import but handle logo_url from S3 links
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Import functionality not yet implemented"
    )


@router.get("/export")
async def export_companies(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Export companies to Excel
    
    Args:
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        Excel file
    """
    # TODO: Implement Excel export
    # Similar to contacts export
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Export functionality not yet implemented"
    )
