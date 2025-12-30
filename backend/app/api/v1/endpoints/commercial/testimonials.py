"""
Commercial Testimonials Endpoints
API endpoints for managing commercial testimonials
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
import time

from app.core.database import get_db
from app.core.cache_enhanced import cache_query
from app.dependencies import get_current_user
from app.models.testimonial import Testimonial
from app.models.contact import Contact
from app.models.company import Company
from app.models.user import User
from app.schemas.testimonial import TestimonialCreate, TestimonialUpdate, Testimonial as TestimonialSchema
from app.services.import_service import ImportService
from app.services.export_service import ExportService
from app.services.s3_service import S3Service
from app.core.logging import logger

router = APIRouter(prefix="/commercial/testimonials", tags=["commercial-testimonials"])

# In-memory store for import logs (in production, use Redis)
import_logs: Dict[str, List[Dict[str, any]]] = {}
import_status: Dict[str, Dict[str, any]] = {}


def normalize_filename(name: str) -> str:
    """Normalize a name for filename matching"""
    if not name:
        return ""
    name = name.lower().strip()
    name = unicodedata.normalize('NFD', name)
    name = ''.join(char for char in name if unicodedata.category(char) != 'Mn')
    name = re.sub(r'[^\w\-]', '_', name)
    name = re.sub(r'_+', '_', name)
    name = name.strip('_')
    return name


async def find_company_by_name(
    company_name: str,
    db: AsyncSession,
    all_companies: Optional[List[Company]] = None,
    company_name_to_id: Optional[dict] = None
) -> Optional[int]:
    """Find a company ID by name using intelligent matching"""
    if not company_name or not company_name.strip():
        return None
    
    if all_companies is None or company_name_to_id is None:
        companies_result = await db.execute(select(Company))
        all_companies = companies_result.scalars().all()
        company_name_to_id = {}
        for company in all_companies:
            if company.name:
                company_name_to_id[company.name.lower().strip()] = company.id
    
    company_name_normalized = company_name.strip().lower()
    company_name_clean = company_name_normalized.replace('sarl', '').replace('sa', '').replace('sas', '').replace('eurl', '').strip()
    
    if company_name_normalized in company_name_to_id:
        return company_name_to_id[company_name_normalized]
    
    if company_name_clean and company_name_clean in company_name_to_id:
        return company_name_to_id[company_name_clean]
    
    matched_company_id = None
    for stored_name, stored_id in company_name_to_id.items():
        stored_clean = stored_name.replace('sarl', '').replace('sa', '').replace('sas', '').replace('eurl', '').strip()
        if (company_name_clean and stored_clean and 
            (company_name_clean in stored_clean or stored_clean in company_name_clean)):
            matched_company_id = stored_id
            break
    
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
    """Find a contact ID by first name and last name"""
    if not first_name or not last_name or not first_name.strip() or not last_name.strip():
        return None
    
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
    
    search_name = f"{first_name.strip().lower()} {last_name.strip().lower()}"
    
    if search_name in contact_name_to_id:
        return contact_name_to_id[search_name]
    
    if company_id:
        for contact in all_contacts:
            if contact.company_id == company_id:
                contact_full_name = f"{contact.first_name.strip().lower()} {contact.last_name.strip().lower()}"
                if contact_full_name == search_name:
                    return contact.id
    
    return None


# Cache for presigned URLs
_presigned_url_cache: dict[str, tuple[str, float]] = {}
_cache_max_size = 1000


def regenerate_logo_url(logo_url: Optional[str], testimonial_id: Optional[int] = None) -> Optional[str]:
    """Regenerate presigned URL for a testimonial logo"""
    if not logo_url:
        return None
    
    if not S3Service.is_configured():
        logger.warning(f"S3 not configured, returning original logo_url for testimonial {testimonial_id}")
        return logo_url
    
    try:
        s3_service = S3Service()
        file_key = None
        
        if logo_url.startswith('http'):
            from urllib.parse import urlparse, parse_qs, unquote
            parsed = urlparse(logo_url)
            query_params = parse_qs(parsed.query)
            if 'key' in query_params:
                file_key = unquote(query_params['key'][0])
            else:
                path = parsed.path.strip('/')
                if 'testimonials/logos' in path:
                    idx = path.find('testimonials/logos')
                    if idx != -1:
                        file_key = path[idx:]
        else:
            file_key = logo_url
        
        if file_key:
            if file_key in _presigned_url_cache:
                cached_url, expiration_timestamp = _presigned_url_cache[file_key]
                current_time = time.time()
                buffer_seconds = 3600
                if current_time < (expiration_timestamp - buffer_seconds):
                    return cached_url
                else:
                    del _presigned_url_cache[file_key]
            
            try:
                expiration_seconds = 604800
                presigned_url = s3_service.generate_presigned_url(file_key, expiration=expiration_seconds)
                if presigned_url:
                    expiration_timestamp = time.time() + expiration_seconds
                    _presigned_url_cache[file_key] = (presigned_url, expiration_timestamp)
                    
                    if len(_presigned_url_cache) > _cache_max_size:
                        oldest_key = next(iter(_presigned_url_cache))
                        del _presigned_url_cache[oldest_key]
                    
                    return presigned_url
            except Exception as e:
                logger.error(f"Failed to generate presigned URL for testimonial {testimonial_id}: {e}", exc_info=True)
                return None
        else:
            return logo_url
    except Exception as e:
        logger.error(f"Failed to regenerate presigned URL for testimonial {testimonial_id}: {e}", exc_info=True)
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


async def get_current_user_from_query(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> User:
    """Get current user from query parameter (for SSE endpoints)"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    token = request.query_params.get("token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header.replace("Bearer ", "")
    
    if not token:
        raise credentials_exception
    
    from app.core.security import decode_token
    payload = decode_token(token, token_type="access")
    if not payload:
        raise credentials_exception
    
    username: str = payload.get("sub")
    if username is None:
        raise credentials_exception
    
    result = await db.execute(select(User).where(User.email == username))
    user = result.scalar_one_or_none()
    
    if user is None or not user.is_active:
        raise credentials_exception
    
    return user


def stream_import_logs_generator(import_id: str):
    """Generator for streaming import logs via SSE"""
    last_index = 0
    
    while True:
        if import_id in import_status:
            status_info = import_status[import_id]
            if status_info.get("status") == "completed" or status_info.get("status") == "failed":
                if import_id in import_logs:
                    logs = import_logs[import_id]
                    for log in logs[last_index:]:
                        yield f"data: {json.dumps(log)}\n\n"
                yield f"data: {json.dumps({'type': 'status', 'data': status_info})}\n\n"
                yield f"data: {json.dumps({'type': 'done'})}\n\n"
                break
        
        if import_id in import_logs:
            logs = import_logs[import_id]
            if len(logs) > last_index:
                for log in logs[last_index:]:
                    yield f"data: {json.dumps(log)}\n\n"
                last_index = len(logs)
        
        if import_id in import_status:
            status_info = import_status[import_id]
            yield f"data: {json.dumps({'type': 'status', 'data': status_info})}\n\n"
        
        time.sleep(0.5)


@router.get("/import/{import_id}/logs")
async def stream_import_logs(
    import_id: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Stream import logs via Server-Sent Events (SSE)"""
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


@router.get("/", response_model=List[TestimonialSchema])
@cache_query(expire=60, tags=["testimonials"])
async def list_testimonials(
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    company_id: Optional[int] = Query(None),
    contact_id: Optional[int] = Query(None),
    language: Optional[str] = Query(None),
    is_published: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
) -> List[Testimonial]:
    """
    Get list of testimonials
    
    Args:
        skip: Number of records to skip
        limit: Maximum number of records to return
        company_id: Optional company filter
        contact_id: Optional contact filter
        language: Optional language filter
        is_published: Optional published status filter
        search: Optional search term (searches in title and testimonial text)
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        List of testimonials
    """
    query = select(Testimonial)
    
    if company_id:
        query = query.where(Testimonial.company_id == company_id)
    if contact_id:
        query = query.where(Testimonial.contact_id == contact_id)
    if language:
        query = query.where(Testimonial.language == language)
    if is_published:
        query = query.where(Testimonial.is_published == is_published)
    if search:
        search_term = f"%{search}%"
        query = query.where(
            or_(
                Testimonial.title.ilike(search_term),
                Testimonial.testimonial_fr.ilike(search_term),
                Testimonial.testimonial_en.ilike(search_term),
            )
        )
    
    query = query.options(
        selectinload(Testimonial.company),
        selectinload(Testimonial.contact)
    ).order_by(Testimonial.created_at.desc()).offset(skip).limit(limit)
    
    try:
        result = await db.execute(query)
        testimonials = result.scalars().all()
    except Exception as e:
        logger.error(f"Database error in list_testimonials: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"A database error occurred: {str(e)}"
        )
    
    testimonial_list = []
    for testimonial in testimonials:
        logo_url = regenerate_logo_url(testimonial.logo_url, testimonial.id)
        
        testimonial_dict = {
            "id": testimonial.id,
            "contact_id": testimonial.contact_id,
            "contact_name": f"{testimonial.contact.first_name} {testimonial.contact.last_name}" if testimonial.contact else None,
            "company_id": testimonial.company_id,
            "company_name": testimonial.company.name if testimonial.company else None,
            "title": testimonial.title,
            "testimonial_fr": testimonial.testimonial_fr,
            "testimonial_en": testimonial.testimonial_en,
            "language": testimonial.language,
            "logo_url": logo_url,
            "logo_filename": testimonial.logo_filename,
            "is_published": testimonial.is_published,
            "rating": testimonial.rating,
            "created_at": testimonial.created_at,
            "updated_at": testimonial.updated_at,
        }
        testimonial_list.append(TestimonialSchema(**testimonial_dict))
    
    return testimonial_list


@router.get("/{testimonial_id}", response_model=TestimonialSchema)
async def get_testimonial(
    testimonial_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Testimonial:
    """
    Get a specific testimonial by ID
    
    Args:
        testimonial_id: Testimonial ID
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        Testimonial details
        
    Raises:
        HTTPException: If testimonial not found
    """
    result = await db.execute(
        select(Testimonial)
        .options(
            selectinload(Testimonial.company),
            selectinload(Testimonial.contact)
        )
        .where(Testimonial.id == testimonial_id)
    )
    testimonial = result.scalar_one_or_none()
    
    if not testimonial:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Testimonial not found"
        )
    
    logo_url = regenerate_logo_url(testimonial.logo_url, testimonial.id)
    
    testimonial_dict = {
        "id": testimonial.id,
        "contact_id": testimonial.contact_id,
        "contact_name": f"{testimonial.contact.first_name} {testimonial.contact.last_name}" if testimonial.contact else None,
        "company_id": testimonial.company_id,
        "company_name": testimonial.company.name if testimonial.company else None,
        "title": testimonial.title,
        "testimonial_fr": testimonial.testimonial_fr,
        "testimonial_en": testimonial.testimonial_en,
        "language": testimonial.language,
        "logo_url": logo_url,
        "logo_filename": testimonial.logo_filename,
        "is_published": testimonial.is_published,
        "rating": testimonial.rating,
        "created_at": testimonial.created_at,
        "updated_at": testimonial.updated_at,
    }
    
    return TestimonialSchema(**testimonial_dict)


@router.post("/", response_model=TestimonialSchema, status_code=status.HTTP_201_CREATED)
async def create_testimonial(
    request: Request,
    testimonial_data: TestimonialCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Testimonial:
    """
    Create a new testimonial
    
    Args:
        testimonial_data: Testimonial creation data
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        Created testimonial
    """
    # Handle company matching
    final_company_id = testimonial_data.company_id
    
    if not final_company_id and testimonial_data.company_name:
        matched_company_id = await find_company_by_name(
            company_name=testimonial_data.company_name,
            db=db
        )
        if matched_company_id:
            final_company_id = matched_company_id
            logger.info(f"Auto-matched company '{testimonial_data.company_name}' to company ID {matched_company_id}")
    
    # Validate company exists if provided
    if final_company_id:
        company_result = await db.execute(
            select(Company).where(Company.id == final_company_id)
        )
        if not company_result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Company not found"
            )
    
    # Validate contact exists if provided
    if testimonial_data.contact_id:
        contact_result = await db.execute(
            select(Contact).where(Contact.id == testimonial_data.contact_id)
        )
        if not contact_result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Contact not found"
            )
    
    # Create testimonial
    testimonial = Testimonial(
        contact_id=testimonial_data.contact_id,
        company_id=final_company_id,
        title=testimonial_data.title,
        testimonial_fr=testimonial_data.testimonial_fr,
        testimonial_en=testimonial_data.testimonial_en,
        language=testimonial_data.language,
        logo_url=testimonial_data.logo_url,
        logo_filename=testimonial_data.logo_filename,
        is_published=testimonial_data.is_published,
        rating=testimonial_data.rating,
    )
    
    db.add(testimonial)
    await db.commit()
    await db.refresh(testimonial)
    await db.refresh(testimonial, ["company", "contact"])
    
    logo_url = regenerate_logo_url(testimonial.logo_url, testimonial.id)
    
    testimonial_dict = {
        "id": testimonial.id,
        "contact_id": testimonial.contact_id,
        "contact_name": f"{testimonial.contact.first_name} {testimonial.contact.last_name}" if testimonial.contact else None,
        "company_id": testimonial.company_id,
        "company_name": testimonial.company.name if testimonial.company else None,
        "title": testimonial.title,
        "testimonial_fr": testimonial.testimonial_fr,
        "testimonial_en": testimonial.testimonial_en,
        "language": testimonial.language,
        "logo_url": logo_url,
        "logo_filename": testimonial.logo_filename,
        "is_published": testimonial.is_published,
        "rating": testimonial.rating,
        "created_at": testimonial.created_at,
        "updated_at": testimonial.updated_at,
    }
    
    return TestimonialSchema(**testimonial_dict)


@router.put("/{testimonial_id}", response_model=TestimonialSchema)
async def update_testimonial(
    request: Request,
    testimonial_id: int,
    testimonial_data: TestimonialUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Testimonial:
    """
    Update a testimonial
    
    Args:
        testimonial_id: Testimonial ID
        testimonial_data: Testimonial update data
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        Updated testimonial
        
    Raises:
        HTTPException: If testimonial not found
    """
    result = await db.execute(
        select(Testimonial).where(Testimonial.id == testimonial_id)
    )
    testimonial = result.scalar_one_or_none()
    
    if not testimonial:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Testimonial not found"
        )
    
    # Handle company matching
    final_company_id = testimonial_data.company_id
    
    if final_company_id is None and testimonial_data.company_name:
        matched_company_id = await find_company_by_name(
            company_name=testimonial_data.company_name,
            db=db
        )
        if matched_company_id:
            final_company_id = matched_company_id
    
    # Validate company exists if provided
    if final_company_id is not None:
        company_result = await db.execute(
            select(Company).where(Company.id == final_company_id)
        )
        if not company_result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Company not found"
            )
    
    # Validate contact exists if provided
    if testimonial_data.contact_id is not None:
        contact_result = await db.execute(
            select(Contact).where(Contact.id == testimonial_data.contact_id)
        )
        if not contact_result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Contact not found"
            )
    
    # Update fields
    update_data = testimonial_data.model_dump(exclude_unset=True, exclude={'company_name'})
    
    if final_company_id is not None:
        update_data['company_id'] = final_company_id
    
    for field, value in update_data.items():
        setattr(testimonial, field, value)
    
    await db.commit()
    await db.refresh(testimonial)
    await db.refresh(testimonial, ["company", "contact"])
    
    logo_url = regenerate_logo_url(testimonial.logo_url, testimonial.id)
    
    testimonial_dict = {
        "id": testimonial.id,
        "contact_id": testimonial.contact_id,
        "contact_name": f"{testimonial.contact.first_name} {testimonial.contact.last_name}" if testimonial.contact else None,
        "company_id": testimonial.company_id,
        "company_name": testimonial.company.name if testimonial.company else None,
        "title": testimonial.title,
        "testimonial_fr": testimonial.testimonial_fr,
        "testimonial_en": testimonial.testimonial_en,
        "language": testimonial.language,
        "logo_url": logo_url,
        "logo_filename": testimonial.logo_filename,
        "is_published": testimonial.is_published,
        "rating": testimonial.rating,
        "created_at": testimonial.created_at,
        "updated_at": testimonial.updated_at,
    }
    
    return TestimonialSchema(**testimonial_dict)


@router.delete("/bulk", status_code=status.HTTP_200_OK)
async def delete_all_testimonials(
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """
    Delete all testimonials from the database
    
    Args:
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        Dictionary with count of deleted testimonials
    """
    count_result = await db.execute(select(func.count(Testimonial.id)))
    count = count_result.scalar_one()
    
    if count == 0:
        return {
            "message": "No testimonials found",
            "deleted_count": 0
        }
    
    await db.execute(delete(Testimonial))
    await db.commit()
    
    logger.info(f"User {current_user.id} deleted all {count} testimonials")
    
    return {
        "message": f"Successfully deleted {count} testimonial(s)",
        "deleted_count": count
    }


@router.delete("/{testimonial_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_testimonial(
    request: Request,
    testimonial_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    """
    Delete a testimonial
    
    Args:
        testimonial_id: Testimonial ID
        current_user: Current authenticated user
        db: Database session
        
    Raises:
        HTTPException: If testimonial not found
    """
    result = await db.execute(
        select(Testimonial).where(Testimonial.id == testimonial_id)
    )
    testimonial = result.scalar_one_or_none()
    
    if not testimonial:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Testimonial not found"
        )
    
    await db.delete(testimonial)
    await db.commit()


@router.post("/import")
async def import_testimonials(
    file: UploadFile = File(...),
    import_id: Optional[str] = Query(None, description="Optional import ID for tracking logs"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Import testimonials from Excel file or ZIP file (Excel + logos)
    
    Supports two formats:
    1. Excel file (.xlsx, .xls) - simple import with logo URLs
    2. ZIP file (.zip) containing:
       - testimonials.xlsx or testimonials.xls (Excel file with testimonial data)
       - logos/ folder (optional) with images named as referenced in Excel
    
    Supported column names (case-insensitive, accent-insensitive):
    - Company Name: company_name, company, entreprise, nom_entreprise
    - Company ID: company_id, id_entreprise, entreprise_id
    - Contact First Name: contact_first_name, contact_prenom, contact_firstname
    - Contact Last Name: contact_last_name, contact_nom, contact_lastname
    - Contact ID: contact_id, id_contact
    - Title: title, titre
    - Testimonial FR: testimonial_fr, témoignage_fr, temoignage_fr, témoignage français
    - Testimonial EN: testimonial_en, témoignage_en, temoignage_en, témoignage anglais
    - Language: language, langue
    - Logo Filename: logo_filename, nom_fichier_logo (for matching logos in ZIP)
    - Logo URL: logo_url, logo, url_logo
    - Is Published: is_published, publié, published
    - Rating: rating, note, étoiles
    
    Args:
        file: Excel file or ZIP file with testimonials data and logos
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
        
        # Dictionary to store logos from ZIP
        logos_dict = {}
        excel_content = None
        
        # Check if it's a ZIP file
        if file_ext == '.zip':
            add_import_log(import_id, "Détection d'un fichier ZIP, extraction en cours...", "info")
            try:
                with zipfile.ZipFile(BytesIO(file_content), 'r') as zip_ref:
                    logo_count = 0
                    for file_info in zip_ref.namelist():
                        file_name_lower = file_info.lower()
                        
                        if file_name_lower.endswith(('.xlsx', '.xls')):
                            if excel_content is None:
                                excel_content = zip_ref.read(file_info)
                                add_import_log(import_id, f"Fichier Excel trouvé dans le ZIP: {file_info}", "info")
                        elif file_name_lower.endswith(('.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg')):
                            logo_content = zip_ref.read(file_info)
                            logo_filename = os.path.basename(file_info)
                            logo_filename_normalized = normalize_filename(logo_filename)
                            logos_dict[logo_filename.lower()] = logo_content
                            if logo_filename_normalized != logo_filename.lower():
                                logos_dict[logo_filename_normalized] = logo_content
                            logo_count += 1
                    
                    add_import_log(import_id, f"Extraction ZIP terminée: {logo_count} logo(s) trouvé(s)", "info")
                
                if excel_content is None:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="No Excel file found in ZIP"
                    )
                
                file_content = excel_content
            except zipfile.BadZipFile:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid ZIP file format"
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
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Error reading Excel file: {str(e)}"
            )
        
        if not result or 'data' not in result or not isinstance(result['data'], list) or len(result['data']) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Excel file does not contain valid data rows"
            )
        
        total_rows = len(result['data'])
        add_import_log(import_id, f"Fichier Excel lu avec succès: {total_rows} ligne(s) trouvée(s)", "info")
        update_import_status(import_id, "processing", progress=0, total=total_rows)
        
        # Load all companies and contacts
        add_import_log(import_id, "Chargement des entreprises et contacts existants...", "info")
        companies_result = await db.execute(select(Company))
        all_companies = companies_result.scalars().all()
        company_name_to_id = {company.name.lower().strip(): company.id for company in all_companies if company.name}
        
        contacts_result = await db.execute(select(Contact))
        all_contacts = contacts_result.scalars().all()
        contact_name_to_id = {}
        for contact in all_contacts:
            if contact.first_name and contact.last_name:
                full_name = f"{contact.first_name.strip().lower()} {contact.last_name.strip().lower()}"
                contact_name_to_id[full_name] = contact.id
        
        add_import_log(import_id, f"{len(company_name_to_id)} entreprise(s) et {len(contact_name_to_id)} contact(s) chargé(s)", "info")
        
        # Initialize S3 service
        s3_service = None
        s3_configured = S3Service.is_configured()
        if s3_configured:
            try:
                s3_service = S3Service()
            except Exception as e:
                logger.error(f"Failed to initialize S3Service: {e}", exc_info=True)
                s3_service = None
        
        # Helper function to normalize column names
        def normalize_key(key: str) -> str:
            if not key:
                return ''
            normalized = str(key).lower().strip()
            normalized = unicodedata.normalize('NFD', normalized)
            normalized = ''.join(c for c in normalized if unicodedata.category(c) != 'Mn')
            return normalized
        
        # Helper function to get field value
        def get_field_value(row: dict, possible_names: list) -> Optional[str]:
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
        created_testimonials = []
        errors = []
        warnings = []
        stats = {
            "total_processed": 0,
            "created_new": 0,
            "errors": 0,
            "logos_uploaded": 0
        }
        
        BATCH_SIZE = 50
        
        for idx, row_data in enumerate(result['data']):
            try:
                stats["total_processed"] += 1
                update_import_status(import_id, "processing", progress=idx + 1, total=total_rows)
                
                if (idx + 1) % 10 == 0 or idx < 5:
                    add_import_log(import_id, f"📊 Ligne {idx + 1}/{total_rows}: Traitement... (créés: {stats['created_new']}, erreurs: {stats['errors']})", "info")
                
                # Get company
                company_id = None
                company_id_raw = get_field_value(row_data, ['company_id', 'id_entreprise', 'entreprise_id'])
                company_name = get_field_value(row_data, ['company_name', 'company', 'entreprise', 'nom_entreprise'])
                
                if company_id_raw:
                    try:
                        company_id = int(float(str(company_id_raw)))
                        company_result = await db.execute(select(Company).where(Company.id == company_id))
                        if not company_result.scalar_one_or_none():
                            errors.append({'row': idx + 2, 'data': row_data, 'error': f'Company ID {company_id} not found'})
                            continue
                    except (ValueError, TypeError):
                        errors.append({'row': idx + 2, 'data': row_data, 'error': f'Invalid company ID: {company_id_raw}'})
                        continue
                elif company_name:
                    matched_company_id = await find_company_by_name(company_name, db, all_companies, company_name_to_id)
                    if matched_company_id:
                        company_id = matched_company_id
                    else:
                        warnings.append({'row': idx + 2, 'type': 'company_not_found', 'message': f"Entreprise '{company_name}' non trouvée"})
                
                # Get contact
                contact_id = None
                contact_id_raw = get_field_value(row_data, ['contact_id', 'id_contact'])
                contact_first_name = get_field_value(row_data, ['contact_first_name', 'contact_prenom', 'contact_firstname', 'prenom_contact'])
                contact_last_name = get_field_value(row_data, ['contact_last_name', 'contact_nom', 'contact_lastname', 'nom_contact'])
                
                if contact_id_raw:
                    try:
                        contact_id = int(float(str(contact_id_raw)))
                        contact_result = await db.execute(select(Contact).where(Contact.id == contact_id))
                        if not contact_result.scalar_one_or_none():
                            errors.append({'row': idx + 2, 'data': row_data, 'error': f'Contact ID {contact_id} not found'})
                            continue
                    except (ValueError, TypeError):
                        errors.append({'row': idx + 2, 'data': row_data, 'error': f'Invalid contact ID: {contact_id_raw}'})
                        continue
                elif contact_first_name and contact_last_name:
                    matched_contact_id = await find_contact_by_name(contact_first_name, contact_last_name, company_id, db, all_contacts, contact_name_to_id)
                    if matched_contact_id:
                        contact_id = matched_contact_id
                    else:
                        warnings.append({'row': idx + 2, 'type': 'contact_not_found', 'message': f"Contact '{contact_first_name} {contact_last_name}' non trouvé"})
                
                # Get other fields
                title = get_field_value(row_data, ['title', 'titre'])
                testimonial_fr = get_field_value(row_data, ['testimonial_fr', 'témoignage_fr', 'temoignage_fr', 'témoignage français', 'temoignage_francais'])
                testimonial_en = get_field_value(row_data, ['testimonial_en', 'témoignage_en', 'temoignage_en', 'témoignage anglais', 'temoignage_anglais'])
                language = get_field_value(row_data, ['language', 'langue']) or 'fr'
                logo_filename = get_field_value(row_data, ['logo_filename', 'nom_fichier_logo'])
                logo_url = get_field_value(row_data, ['logo_url', 'logo', 'url_logo'])
                is_published = get_field_value(row_data, ['is_published', 'publié', 'published']) or 'false'
                rating_raw = get_field_value(row_data, ['rating', 'note', 'étoiles', 'etoiles'])
                rating = None
                if rating_raw:
                    try:
                        rating = int(float(str(rating_raw)))
                        if rating < 1 or rating > 5:
                            rating = None
                    except (ValueError, TypeError):
                        pass
                
                # Handle logo upload from ZIP
                if logo_filename and logos_dict and s3_service:
                    logo_filename_lower = logo_filename.lower()
                    logo_filename_normalized = normalize_filename(logo_filename)
                    
                    logo_content = None
                    if logo_filename_lower in logos_dict:
                        logo_content = logos_dict[logo_filename_lower]
                    elif logo_filename_normalized in logos_dict:
                        logo_content = logos_dict[logo_filename_normalized]
                    
                    if logo_content:
                        try:
                            file_key = f"testimonials/logos/{uuid.uuid4().hex}_{logo_filename}"
                            s3_service.upload_file(file_key, logo_content, content_type='image/jpeg')
                            logo_url = file_key
                            stats["logos_uploaded"] += 1
                            add_import_log(import_id, f"Ligne {idx + 2}: Logo uploadé: {logo_filename}", "info")
                        except Exception as e:
                            logger.error(f"Error uploading logo for row {idx + 2}: {e}", exc_info=True)
                            warnings.append({'row': idx + 2, 'type': 'logo_upload_failed', 'message': f"Erreur upload logo: {str(e)}"})
                
                # Create testimonial
                testimonial = Testimonial(
                    contact_id=contact_id,
                    company_id=company_id,
                    title=title,
                    testimonial_fr=testimonial_fr,
                    testimonial_en=testimonial_en,
                    language=language,
                    logo_url=logo_url,
                    logo_filename=logo_filename,
                    is_published=is_published,
                    rating=rating,
                )
                
                db.add(testimonial)
                
                if (idx + 1) % BATCH_SIZE == 0:
                    await db.commit()
                    add_import_log(import_id, f"Batch {idx + 1} sauvegardé", "info")
                
                created_testimonials.append(testimonial)
                stats["created_new"] += 1
                
            except Exception as e:
                stats["errors"] += 1
                error_msg = f"Ligne {idx + 2}: Erreur - {str(e)}"
                add_import_log(import_id, error_msg, "error")
                errors.append({'row': idx + 2, 'data': row_data, 'error': str(e)})
                logger.error(f"Error importing testimonial row {idx + 2}: {str(e)}", exc_info=True)
        
        # Final commit
        if created_testimonials:
            await db.commit()
            for testimonial in created_testimonials:
                await db.refresh(testimonial)
            add_import_log(import_id, f"Sauvegarde réussie: {len(created_testimonials)} témoignage(s) créé(s)", "success")
        
        add_import_log(import_id, f"✅ Import terminé: {len(created_testimonials)} témoignage(s), {len(errors)} erreur(s)", "success")
        update_import_status(import_id, "completed", progress=total_rows, total=total_rows)
        
        return {
            'total_rows': total_rows,
            'valid_rows': len(created_testimonials),
            'invalid_rows': len(errors),
            'errors': errors,
            'warnings': warnings,
            'logos_uploaded': stats.get("logos_uploaded", 0),
            'import_id': import_id,
            'data': [TestimonialSchema.model_validate({
                'id': t.id,
                'contact_id': t.contact_id,
                'company_id': t.company_id,
                'title': t.title,
                'testimonial_fr': t.testimonial_fr,
                'testimonial_en': t.testimonial_en,
                'language': t.language,
                'logo_url': t.logo_url,
                'logo_filename': t.logo_filename,
                'is_published': t.is_published,
                'rating': t.rating,
                'created_at': t.created_at,
                'updated_at': t.updated_at,
            }) for t in created_testimonials]
        }
    except HTTPException:
        if import_id:
            update_import_status(import_id, "failed")
        raise
    except Exception as e:
        if import_id:
            add_import_log(import_id, f"ERREUR inattendue: {str(e)}", "error")
            update_import_status(import_id, "failed")
        logger.error(f"Unexpected error in import_testimonials: {e}", exc_info=True)
        try:
            await db.rollback()
        except Exception:
            pass
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred during import: {str(e)}"
        )


@router.get("/export")
async def export_testimonials(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Export testimonials to Excel file
    
    Args:
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        Excel file with testimonials data
    """
    try:
        # Get all testimonials
        result = await db.execute(
            select(Testimonial)
            .options(
                selectinload(Testimonial.company),
                selectinload(Testimonial.contact)
            )
            .order_by(Testimonial.created_at.desc())
        )
        testimonials = result.scalars().all()
        
        # Convert to dict format for export
        export_data = []
        for testimonial in testimonials:
            try:
                contact_name = ''
                if testimonial.contact:
                    contact_name = f"{testimonial.contact.first_name or ''} {testimonial.contact.last_name or ''}".strip()
                
                export_data.append({
                    'Entreprise': testimonial.company.name if testimonial.company and testimonial.company.name else '',
                    'Nom du contact': contact_name,
                    'Titre': testimonial.title or '',
                    'Témoignage FR': testimonial.testimonial_fr or '',
                    'Témoignage EN': testimonial.testimonial_en or '',
                    'Langue': testimonial.language or 'fr',
                    'Logo URL': testimonial.logo_url or '',
                    'Publié': testimonial.is_published or 'false',
                    'Note': testimonial.rating or '',
                })
            except Exception as e:
                logger.error(f"Error processing testimonial {testimonial.id} for export: {e}")
                continue
        
        # Handle empty data case
        if not export_data:
            export_data = [{
                'Entreprise': '',
                'Nom du contact': '',
                'Titre': '',
                'Témoignage FR': '',
                'Témoignage EN': '',
                'Langue': '',
                'Logo URL': '',
                'Publié': '',
                'Note': '',
            }]
        
        # Export to Excel
        from datetime import datetime
        buffer, filename = ExportService.export_to_excel(
            data=export_data,
            filename=f"testimonials_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
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

