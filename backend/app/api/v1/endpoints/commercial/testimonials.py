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

