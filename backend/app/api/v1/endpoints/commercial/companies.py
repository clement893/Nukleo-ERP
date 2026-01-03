"""
Commercial Companies Endpoints
API endpoints for managing commercial companies
"""

from typing import List, Optional, Dict
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from sqlalchemy.orm import selectinload
import zipfile
import os
import re
import unicodedata
import uuid
import json
import asyncio
from io import BytesIO
from datetime import datetime as dt

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
from app.utils.import_logs import (
    import_logs, import_status, add_import_log, update_import_status,
    get_current_user_from_query, stream_import_logs_generator
)

router = APIRouter(prefix="/commercial/companies", tags=["commercial-companies"])


# SSE endpoint for import logs
@router.get("/import/{import_id}/logs")
async def stream_import_logs(
    import_id: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    Stream import logs via Server-Sent Events (SSE) for companies import
    Note: Uses query parameter authentication because EventSource doesn't support custom headers
    """
    # Authenticate user
    current_user = await get_current_user_from_query(request, db)
    
    return StreamingResponse(
        stream_import_logs_generator(import_id),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )


@router.get("/", response_model=List[CompanySchema])
async def list_companies(
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    is_client: Optional[bool] = Query(None),
    country: Optional[str] = Query(None),
    city: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
) -> List[Company]:
    """
    Get list of companies
    
    Args:
        skip: Number of records to skip
        limit: Maximum number of records to return
        is_client: Optional client filter
        country: Optional country filter
        city: Optional city filter
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
    if city:
        query = query.where(Company.city == city)
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
    
    try:
        result = await db.execute(query)
        companies = result.scalars().all()
    except Exception as e:
        logger.error(f"Database error in list_companies: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"A database error occurred: {str(e)}"
        )
    
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


@router.get("/stats")
async def get_companies_stats(
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    period: str = Query("month", description="Time period: day, week, month, quarter, year"),
) -> Dict:
    """
    Get companies statistics for dashboard widget
    
    Args:
        period: Time period for comparison ('day' | 'week' | 'month' | 'quarter' | 'year')
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        Dictionary with companies statistics
    """
    from datetime import datetime, timedelta
    
    # Calculate period start date
    now = datetime.utcnow()
    period_map = {
        'day': timedelta(days=1),
        'week': timedelta(weeks=1),
        'month': timedelta(days=30),
        'quarter': timedelta(days=90),
        'year': timedelta(days=365),
    }
    period_delta = period_map.get(period.lower(), timedelta(days=30))
    period_start = now - period_delta
    
    # Get current count
    current_count_result = await db.execute(select(func.count(Company.id)))
    current_count = current_count_result.scalar_one() or 0
    
    # Get count from period start
    previous_count_result = await db.execute(
        select(func.count(Company.id))
        .where(Company.created_at < period_start)
    )
    previous_count = previous_count_result.scalar_one() or 0
    
    # Get new companies in period
    new_count_result = await db.execute(
        select(func.count(Company.id))
        .where(Company.created_at >= period_start)
    )
    new_this_period = new_count_result.scalar_one() or 0
    
    # Get active clients count (companies with is_client=True)
    active_count_result = await db.execute(
        select(func.count(Company.id))
        .where(Company.is_client == True)
    )
    active_count = active_count_result.scalar_one() or 0
    
    # Get previous active clients count (before period start)
    previous_active_count_result = await db.execute(
        select(func.count(Company.id))
        .where(
            Company.is_client == True,
            Company.created_at < period_start
        )
    )
    previous_active_count = previous_active_count_result.scalar_one() or 0
    
    # Calculate growth percentage for all companies
    growth = 0.0
    if previous_count > 0:
        growth = ((current_count - previous_count) / previous_count) * 100
    
    # Calculate growth percentage for active clients
    active_growth = 0.0
    if previous_active_count > 0:
        active_growth = ((active_count - previous_active_count) / previous_active_count) * 100
    elif active_count > 0:
        # If we went from 0 to active_count, that's 100% growth
        active_growth = 100.0
    
    return {
        "count": current_count,
        "growth": round(growth, 1),
        "previous_count": previous_count,
        "new_this_month": new_this_period,
        "active_count": active_count,
        "active_growth": round(active_growth, 1),
        "previous_active_count": previous_active_count,
    }


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
    request: Request,
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
    
    # Store old values for activity tracking
    old_values = {
        'name': company.name,
        'parent_company_id': company.parent_company_id,
        'description': company.description,
        'website': company.website,
        'email': company.email,
        'phone': company.phone,
        'address': company.address,
        'city': company.city,
        'country': company.country,
        'is_client': company.is_client,
        'facebook': company.facebook,
        'instagram': company.instagram,
        'linkedin': company.linkedin,
    }
    
    # Update company
    update_data = company_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(company, field, value)
    
    await db.commit()
    
    # Log activities for each modified field
    from app.core.security_audit import SecurityAuditLogger, SecurityEventType
    
    for field, new_value in update_data.items():
        old_value = old_values.get(field)
        if old_value != new_value:
            try:
                await SecurityAuditLogger.log_event(
                    db=db,
                    event_type=SecurityEventType.DATA_MODIFIED,
                    description=f"Company {company_id} - {field} modified",
                    user_id=current_user.id,
                    ip_address=request.client.host if request.client else None,
                    event_metadata={
                        "entity_type": "company",
                        "entity_id": str(company_id),
                        "field": field,
                        "old_value": old_value,
                        "new_value": new_value
                    }
                )
            except Exception as e:
                logger.warning(f"Failed to log activity for company {company_id} field {field}: {e}")
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


@router.delete("/bulk", status_code=status.HTTP_200_OK)
async def delete_all_companies(
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Delete all companies (bulk delete)
    
    WARNING: This will delete ALL companies from the database.
    Only companies without associated contacts will be deleted.
    
    Args:
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        Dict with deletion results
    """
    try:
        # Get all companies
        companies_query = select(Company)
        companies_result = await db.execute(companies_query)
        all_companies = companies_result.scalars().all()
        
        deleted_count = 0
        skipped_count = 0
        errors = []
        
        for company in all_companies:
            try:
                # Check if company has contacts
                contacts_query = select(func.count(Contact.id)).where(Contact.company_id == company.id)
                contacts_result = await db.execute(contacts_query)
                contacts_count = contacts_result.scalar()
                
                if contacts_count > 0:
                    skipped_count += 1
                    errors.append(f"Company '{company.name}' (ID: {company.id}) has {contacts_count} associated contact(s)")
                    continue
                
                # Delete company
                await db.delete(company)
                deleted_count += 1
            except Exception as e:
                skipped_count += 1
                errors.append(f"Error deleting company '{company.name}' (ID: {company.id}): {str(e)}")
                logger.error(f"Error deleting company {company.id}: {e}")
        
        await db.commit()
        
        return {
            "message": f"Deleted {deleted_count} company(ies), skipped {skipped_count}",
            "deleted_count": deleted_count,
            "skipped_count": skipped_count,
            "errors": errors if errors else None,
        }
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in bulk delete companies: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la suppression en masse: {str(e)}"
        )


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
    import_id: Optional[str] = Query(None, description="Unique ID for this import process"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Import companies from Excel file or ZIP file (Excel + logos)
    
    Supports two formats:
    1. Excel file (.xlsx, .xls) - simple import with logo URLs
    2. ZIP file (.zip) containing:
       - entreprises.xlsx or entreprises.xls (Excel file with company data)
       - logos/ folder (optional) with images named as "company_name.jpg" or referenced in Excel
    
    Supported column names (case-insensitive, accent-insensitive):
    - Name: name, nom, nom de l'entreprise, company name, entreprise
    - Description: description, description de l'entreprise
    - Website: website, site web, site, url, site internet
    - Email: email, courriel, e-mail, mail, adresse email
    - Phone: phone, téléphone, telephone, tel, tél, phone_number
    - Address: address, adresse, adresse complète
    - City: city, ville, cité, cite
    - Country: country, pays, nation
    - Is Client: is_client, est client, client, is client, est un client
    - Parent Company ID: parent_company_id, id_entreprise_parente, id entreprise parente, parent company id
    - LinkedIn: linkedin, linkedin_url, linkedin url, profil linkedin
    - Facebook: facebook, facebook_url, facebook url, page facebook
    - Instagram: instagram, instagram_url, instagram url, profil instagram
    - Logo URL: logo_url, logo, logo url, url logo, image_url, image url
    - Logo Filename: logo_filename, nom_fichier_logo, logo filename, nom fichier logo
    
    Features:
    - Automatic matching of existing companies by name (for reimport/update)
    - Case-insensitive and accent-insensitive column name matching
    - Automatic logo upload from ZIP files
    - Support for multiple logo formats (jpg, png, gif, webp)
    
    Args:
        file: Excel file or ZIP file with companies data and logos
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        Import results with data, errors, and warnings
    """
    try:
        # Read file content
        file_content = await file.read()
        filename = file.filename or ""
        file_ext = os.path.splitext(filename.lower())[1]
        
        # Dictionary to store logos from ZIP (filename -> file content)
        logos_dict = {}
        excel_content = None
        
        # Check if it's a ZIP file
        if file_ext == '.zip':
            try:
                with zipfile.ZipFile(BytesIO(file_content), 'r') as zip_ref:
                    # Extract Excel file and logos
                    for file_info in zip_ref.namelist():
                        file_name_lower = file_info.lower()
                        
                        # Find Excel file
                        if file_name_lower.endswith(('.xlsx', '.xls')):
                            if excel_content is None:
                                excel_content = zip_ref.read(file_info)
                            else:
                                logger.warning(f"Multiple Excel files found in ZIP, using first: {file_info}")
                        
                        # Find logos (in logos/ folder or root)
                        elif file_name_lower.endswith(('.jpg', '.jpeg', '.png', '.gif', '.webp')):
                            logo_content = zip_ref.read(file_info)
                            # Store with normalized filename (lowercase, no path)
                            logo_filename = os.path.basename(file_info).lower()
                            logos_dict[logo_filename] = logo_content
                    
                    if excel_content is None:
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail="No Excel file found in ZIP. Please include entreprises.xlsx or entreprises.xls"
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
        try:
            result = ImportService.import_from_excel(
                file_content=file_content,
                has_headers=True
            )
        except Exception as e:
            logger.error(f"Error importing Excel file: {e}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Error reading Excel file: {str(e)}"
            )
        
        # Validate result structure
        if not result or 'data' not in result:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid Excel file format or empty file"
            )
        
        if not isinstance(result['data'], list):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Excel file does not contain valid data rows"
            )
        
        # Load all existing companies once to check for duplicates
        try:
            companies_result = await db.execute(select(Company))
            all_existing_companies = companies_result.scalars().all()
            # Create mappings for duplicate detection:
            # 1. By name (case-insensitive)
            companies_by_name = {}  # name.lower() -> Company
            
            for company in all_existing_companies:
                if company.name:
                    name_lower = company.name.lower().strip()
                    companies_by_name[name_lower] = company
            
            add_import_log(import_id, f"{len(all_existing_companies)} entreprise(s) chargée(s) pour le matching", "info")
        except Exception as e:
            logger.error(f"Error loading existing companies: {e}", exc_info=True)
            add_import_log(import_id, f"❌ Erreur lors du chargement des entreprises existantes: {str(e)}", "error")
            update_import_status(import_id, "failed")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error loading existing companies from database"
            )
        
        # Helper function to normalize column names (case-insensitive, handle accents)
        def normalize_key(key: str) -> str:
            """Normalize column name for matching"""
            if not key:
                return ''
            # Convert to lowercase and strip whitespace
            normalized = str(key).lower().strip()
            # Remove accents and special characters for better matching
            normalized = unicodedata.normalize('NFD', normalized)
            normalized = ''.join(c for c in normalized if unicodedata.category(c) != 'Mn')
            return normalized
        
        # Helper function to get value from row with multiple possible column names
        def get_field_value(row: dict, possible_names: list) -> Optional[str]:
            """Get field value trying multiple possible column names"""
            # First try exact match (case-sensitive)
            for name in possible_names:
                if name in row and row[name] is not None:
                    value = str(row[name]).strip()
                    if value:
                        return value
            
            # Then try normalized match (case-insensitive, accent-insensitive)
            normalized_row = {normalize_key(k): v for k, v in row.items()}
            for name in possible_names:
                normalized_name = normalize_key(name)
                if normalized_name in normalized_row and normalized_row[normalized_name] is not None:
                    value = str(normalized_row[normalized_name]).strip()
                    if value:
                        return value
            
            return None
        
        # Process imported data
        created_companies = []
        errors = []
        warnings = []
        s3_service = S3Service() if S3Service.is_configured() else None
        
        add_import_log(import_id, f"Début du traitement de {total_rows} ligne(s)...", "info")
        
        stats = {
            "total_processed": 0,
            "created_new": 0,
            "matched_existing": 0,
            "errors": 0
        }
        
        for idx, row_data in enumerate(result['data']):
            try:
                stats["total_processed"] += 1
                update_import_status(import_id, "processing", progress=idx + 1, total=total_rows)
                
                # Log progress every 10 rows
                if (idx + 1) % 10 == 0 or idx < 5:
                    add_import_log(import_id, f"📊 Ligne {idx + 1}/{total_rows}: Traitement en cours... (créés: {stats['created_new']}, mis à jour: {stats['matched_existing']}, erreurs: {stats['errors']})", "info", {"progress": idx + 1, "total": total_rows, "stats": stats.copy()})
                
                # Map Excel columns to Company fields
                name = get_field_value(row_data, [
                    'name', 'nom', 'nom de l\'entreprise', 'company name', 'entreprise', 'nom entreprise'
                ]) or ''
                
                if not name or not name.strip():
                    errors.append({
                        'row': idx + 2,
                        'data': row_data,
                        'error': 'Nom de l\'entreprise est requis'
                    })
                    continue
                
                # Normalize name for matching
                name_lower = name.lower().strip()
                
                # Check if company already exists (for reimport/update)
                existing_company = companies_by_name.get(name_lower)
                
                # Handle logo upload if ZIP contains logos
                logo_url = get_field_value(row_data, [
                    'logo_url', 'logo', 'logo url', 'url logo', 'image_url', 'image url'
                ])
                
                # Get explicit logo filename from Excel (highest priority)
                logo_filename_explicit = get_field_value(row_data, [
                    'logo_filename', 'nom_fichier_logo', 'logo filename', 'nom fichier logo'
                ])
                
                # If no logo_url but we have logos in ZIP, try to find matching logo
                if not logo_url and logos_dict and s3_service:
                    # Try multiple naming patterns based on company name
                    # Normalize company name for filename matching
                    company_name_normalized = name_lower.replace(' ', '_').replace('-', '_')
                    # Remove special characters
                    import re
                    company_name_clean = re.sub(r'[^a-z0-9_]', '', company_name_normalized)
                    
                    # Build logo filename patterns (explicit filename has highest priority)
                    logo_filename_patterns = []
                    
                    # 1. Explicit filename from Excel column (highest priority)
                    if logo_filename_explicit:
                        logo_filename_patterns.append(logo_filename_explicit.lower())
                        # Also try with path variations
                        logo_filename_patterns.append(os.path.basename(logo_filename_explicit).lower())
                    
                    # 2. Patterns based on company name
                    logo_filename_patterns.extend([
                        f"{company_name_clean}.jpg",
                        f"{company_name_clean}.jpeg",
                        f"{company_name_clean}.png",
                        f"{company_name_clean}.gif",
                        f"{company_name_clean}.webp",
                        f"{company_name_normalized}.jpg",
                        f"{company_name_normalized}.jpeg",
                        f"{company_name_normalized}.png",
                        f"{company_name_normalized}.gif",
                        f"{company_name_normalized}.webp",
                    ])
                    
                    uploaded_logo_url = None
                    for pattern in logo_filename_patterns:
                        if not pattern:
                            continue
                        pattern_lower = pattern.lower().strip()
                        # Try exact match first
                        matched_filename = None
                        if pattern_lower in logos_dict:
                            matched_filename = pattern_lower
                        else:
                            # Try partial match (filename without extension)
                            pattern_no_ext = os.path.splitext(pattern_lower)[0]
                            for stored_filename in logos_dict.keys():
                                stored_no_ext = os.path.splitext(stored_filename)[0]
                                if stored_no_ext == pattern_no_ext:
                                    matched_filename = stored_filename
                                    break
                        
                        if matched_filename:
                            try:
                                # Upload logo to S3
                                logo_content = logos_dict[matched_filename]
                                
                                # Create a temporary UploadFile-like object compatible with S3Service
                                class TempUploadFile:
                                    def __init__(self, filename: str, content: bytes):
                                        self.filename = filename
                                        self.content = content
                                        self.content_type = 'image/jpeg' if filename.lower().endswith(('.jpg', '.jpeg')) else ('image/png' if filename.lower().endswith('.png') else ('image/gif' if filename.lower().endswith('.gif') else 'image/webp'))
                                        # Create a file-like object
                                        self.file = BytesIO(content)
                                
                                temp_file = TempUploadFile(matched_filename, logo_content)
                                
                                # Upload to S3
                                upload_result = s3_service.upload_file(
                                    file=temp_file,
                                    folder='companies/logos',
                                    user_id=str(current_user.id)
                                )
                                
                                # Always store the file_key (not the presigned URL) for persistence
                                uploaded_logo_url = upload_result.get('file_key')
                                if not uploaded_logo_url:
                                    # Fallback to URL if file_key not available, but extract key from URL
                                    url = upload_result.get('url', '')
                                    if url and 'companies/logos' in url:
                                        from urllib.parse import urlparse
                                        parsed = urlparse(url)
                                        path = parsed.path.strip('/')
                                        if 'companies/logos' in path:
                                            idx_logo = path.find('companies/logos')
                                            uploaded_logo_url = path[idx_logo:]
                                        else:
                                            uploaded_logo_url = url
                                    else:
                                        uploaded_logo_url = url
                                
                                logger.info(f"Uploaded logo for {name}: {matched_filename} -> {uploaded_logo_url}")
                                break
                            except Exception as e:
                                logger.warning(f"Failed to upload logo {matched_filename}: {e}")
                                continue
                    
                    if uploaded_logo_url:
                        logo_url = uploaded_logo_url
                
                # Get other fields
                description = get_field_value(row_data, [
                    'description', 'description de l\'entreprise', 'description entreprise'
                ])
                website = get_field_value(row_data, [
                    'website', 'site web', 'site', 'url', 'site internet'
                ])
                email = get_field_value(row_data, [
                    'email', 'courriel', 'e-mail', 'mail', 'adresse email'
                ])
                phone = get_field_value(row_data, [
                    'phone', 'téléphone', 'telephone', 'tel', 'tél', 'phone_number'
                ])
                address = get_field_value(row_data, [
                    'address', 'adresse', 'adresse complète'
                ])
                city = get_field_value(row_data, [
                    'city', 'ville', 'cité', 'cite'
                ])
                country = get_field_value(row_data, [
                    'country', 'pays', 'nation'
                ])
                
                # Handle is_client field
                is_client_raw = get_field_value(row_data, [
                    'is_client', 'est client', 'client', 'is client', 'est un client'
                ])
                is_client = False
                if is_client_raw:
                    is_client_str = str(is_client_raw).lower().strip()
                    is_client = is_client_str in ['oui', 'yes', 'true', '1', 'vrai', 'o']
                
                # Handle parent_company_id
                parent_company_id = None
                parent_company_id_raw = get_field_value(row_data, [
                    'parent_company_id', 'id_entreprise_parente', 'id entreprise parente', 'parent company id'
                ])
                if parent_company_id_raw:
                    try:
                        parent_company_id = int(float(str(parent_company_id_raw)))
                        # Validate parent company exists
                        parent_check = await db.execute(select(Company).where(Company.id == parent_company_id))
                        if not parent_check.scalar_one_or_none():
                            warnings.append({
                                'row': idx + 2,
                                'type': 'parent_company_not_found',
                                'message': f"Entreprise parente ID '{parent_company_id}' non trouvée",
                                'data': {'parent_company_id': parent_company_id, 'company': name}
                            })
                            parent_company_id = None
                    except (ValueError, TypeError):
                        warnings.append({
                            'row': idx + 2,
                            'type': 'invalid_parent_company_id',
                            'message': f"ID entreprise parente invalide: '{parent_company_id_raw}'",
                            'data': {'parent_company_id_raw': parent_company_id_raw, 'company': name}
                        })
                
                linkedin = get_field_value(row_data, [
                    'linkedin', 'linkedin_url', 'linkedin url', 'profil linkedin'
                ])
                facebook = get_field_value(row_data, [
                    'facebook', 'facebook_url', 'facebook url', 'page facebook'
                ])
                instagram = get_field_value(row_data, [
                    'instagram', 'instagram_url', 'instagram url', 'profil instagram'
                ])
                
                # Prepare company data
                company_data = CompanyCreate(
                    name=name,
                    description=description,
                    website=website,
                    email=email,
                    phone=phone,
                    address=address,
                    city=city,
                    country=country,
                    is_client=is_client,
                    parent_company_id=parent_company_id,
                    linkedin=linkedin,
                    facebook=facebook,
                    instagram=instagram,
                    logo_url=logo_url,  # Store file_key, not presigned URL
                )
                
                # Update existing company or create new one
                if existing_company:
                    # Update existing company
                    update_data = company_data.model_dump(exclude_none=True)
                    for field, value in update_data.items():
                        # Only update logo_url if a new logo was uploaded
                        if field == 'logo_url':
                            if value:  # New logo provided
                                setattr(existing_company, field, value)
                                logger.info(f"Updated logo for company {existing_company.id}")
                            # If no new logo provided, keep existing logo (don't update field)
                        else:
                            # Update all other fields
                            setattr(existing_company, field, value)
                    
                    company = existing_company
                    created_companies.append(company)  # Track as processed company
                    stats["matched_existing"] += 1
                    add_import_log(import_id, f"Ligne {idx + 2}: Entreprise mise à jour - {name} (ID: {existing_company.id})", "info", {"row": idx + 2, "action": "updated", "company_id": existing_company.id})
                    logger.info(f"Updated existing company: {name} (ID: {existing_company.id})")
                else:
                    # Create new company
                    company = Company(**company_data.model_dump(exclude_none=True))
                    db.add(company)
                    created_companies.append(company)
                    stats["created_new"] += 1
                    add_import_log(import_id, f"Ligne {idx + 2}: Nouvelle entreprise créée - {name}", "info", {"row": idx + 2, "action": "created"})
                    logger.info(f"Created new company: {name}")
                
            except Exception as e:
                stats["errors"] += 1
                error_msg = f"Ligne {idx + 2}: ❌ Erreur lors de l'import - {str(e)}"
                add_import_log(import_id, error_msg, "error", {"row": idx + 2, "error": str(e)})
                errors.append({
                    'row': idx + 2,  # +2 because Excel is 1-indexed and has header
                    'data': row_data,
                    'error': str(e)
                })
                logger.error(f"Error importing company row {idx + 2}: {str(e)}")
        
        # Track which companies were updated vs created
        existing_company_ids = {c.id for c in all_existing_companies}
        updated_companies = []
        new_companies = []
        
        # Commit all companies
        add_import_log(import_id, f"Sauvegarde de {len(created_companies)} entreprise(s) dans la base de données...", "info")
        try:
            if created_companies:
                await db.commit()
                for company in created_companies:
                    await db.refresh(company)
                    
                    # Categorize as updated or new
                    if company.id in existing_company_ids:
                        updated_companies.append(company)
                    else:
                        new_companies.append(company)
                    
                    # Regenerate presigned URL for logo if it exists and S3 is configured
                    if company.logo_url and s3_service:
                        try:
                            # Extract file_key from logo_url (it should be a file_key, not a presigned URL)
                            file_key = company.logo_url
                            
                            # If it's already a presigned URL, try to extract file_key
                            if file_key.startswith('http'):
                                from urllib.parse import urlparse
                                parsed = urlparse(file_key)
                                path = parsed.path.strip('/')
                                if 'companies/logos' in path:
                                    idx_logo = path.find('companies/logos')
                                    file_key = path[idx_logo:]
                                else:
                                    # Keep original if we can't extract
                                    continue
                            
                            # Generate presigned URL for display (but keep file_key in DB)
                            presigned_url = s3_service.generate_presigned_url(file_key, expiration=3600 * 24 * 7)  # 7 days
                            if presigned_url:
                                # Temporarily set presigned URL for response (but don't save it to DB)
                                company.logo_url = presigned_url
                                logger.info(f"Generated presigned URL for company {company.id}")
                        except Exception as e:
                            logger.warning(f"Failed to generate presigned URL for company {company.id}: {e}")
                            # Keep original file_key if presigned URL generation fails
                
                add_import_log(import_id, f"Sauvegarde réussie: {len(new_companies)} nouvelle(s) entreprise(s), {len(updated_companies)} entreprise(s) mise(s) à jour", "success")
        except Exception as e:
            logger.error(f"Error committing companies to database: {e}", exc_info=True)
            await db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error saving companies to database: {str(e)}"
            )
        
        # Merge warnings from import service with our warnings
        all_warnings = (result.get('warnings') or []) + warnings
        
        # Final logs
        add_import_log(import_id, f"✅ Import terminé: {len(created_companies)} entreprise(s) importée(s), {len(errors)} erreur(s)", "success", {
            "total_valid": len(created_companies),
            "total_errors": len(errors),
            "new_companies": len(new_companies),
            "updated_companies": len(updated_companies),
            "logos_uploaded": len(logos_dict) if logos_dict else 0
        })
        update_import_status(import_id, "completed", progress=total_rows, total=total_rows)
        
        try:
            return {
                'total_rows': result.get('total_rows', 0),
                'valid_rows': len(created_companies),
                'created_rows': len(new_companies),
                'updated_rows': len(updated_companies),
                'invalid_rows': len(errors) + result.get('invalid_rows', 0),
                'errors': errors + (result.get('errors') or []),
                'warnings': all_warnings,
                'logos_uploaded': len(logos_dict) if logos_dict else 0,
                'import_id': import_id,
                'data': [CompanySchema.model_validate(c) for c in created_companies]
            }
        except Exception as e:
            logger.error(f"Error serializing response: {e}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error processing import results: {str(e)}"
            )
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        if 'import_id' in locals():
            add_import_log(import_id, f"❌ Erreur HTTP: {str(e)}", "error")
            update_import_status(import_id, "failed")
        raise
    except Exception as e:
        # Catch any other unexpected errors that weren't caught above
        logger.error(f"Unexpected error in import_companies: {e}", exc_info=True)
        if 'import_id' in locals():
            add_import_log(import_id, f"❌ Erreur inattendue lors de l'import: {str(e)}", "error")
            update_import_status(import_id, "failed")
        try:
            await db.rollback()
        except Exception:
            pass  # Ignore rollback errors
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred during import: {str(e)}"
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
    try:
        # Get all companies
        query = select(Company).order_by(Company.created_at.desc())
        result = await db.execute(query)
        companies = result.scalars().all()
        
        # Prepare data for export
        export_data = []
        for company in companies:
            export_data.append({
                "ID": company.id,
                "Nom de l'entreprise": company.name,
                "Entreprise parente ID": company.parent_company_id or "",
                "Description": company.description or "",
                "Site web": company.website or "",
                "Logo URL (S3)": company.logo_url or "",
                "Courriel": company.email or "",
                "Téléphone": company.phone or "",
                "Adresse": company.address or "",
                "Ville": company.city or "",
                "Pays": company.country or "",
                "Client (Y/N)": "Oui" if company.is_client else "Non",
                "Facebook": company.facebook or "",
                "Instagram": company.instagram or "",
                "LinkedIn": company.linkedin or "",
                "Date de création": company.created_at.isoformat() if company.created_at else "",
                "Date de mise à jour": company.updated_at.isoformat() if company.updated_at else "",
            })
        
        # Handle empty data case
        if not export_data:
            # Return empty Excel file with headers
            export_data = [{
                "ID": "",
                "Nom de l'entreprise": "",
                "Entreprise parente ID": "",
                "Description": "",
                "Site web": "",
                "Logo URL (S3)": "",
                "Courriel": "",
                "Téléphone": "",
                "Adresse": "",
                "Ville": "",
                "Pays": "",
                "Client (Y/N)": "",
                "Facebook": "",
                "Instagram": "",
                "LinkedIn": "",
                "Date de création": "",
                "Date de mise à jour": "",
            }]
        
        # Export to Excel
        buffer, filename = ExportService.export_to_excel(
            data=export_data,
            headers=[
                "ID",
                "Nom de l'entreprise",
                "Entreprise parente ID",
                "Description",
                "Site web",
                "Logo URL (S3)",
                "Courriel",
                "Téléphone",
                "Adresse",
                "Ville",
                "Pays",
                "Client (Y/N)",
                "Facebook",
                "Instagram",
                "LinkedIn",
                "Date de création",
                "Date de mise à jour",
            ],
            filename=f"entreprises_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx",
            sheet_name="Entreprises"
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
            detail=f"Erreur inattendue lors de l'export: {str(e)}"
        )
