"""
Réseau Testimonials Endpoints
API endpoints for managing network module testimonials
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
from app.models.testimonial import Testimonial
from app.models.contact import Contact
from app.models.company import Company
from app.models.user import User
from app.schemas.testimonial import TestimonialCreate, TestimonialUpdate, Testimonial as TestimonialSchema
from app.services.import_service import ImportService
from app.services.export_service import ExportService
from app.services.s3_service import S3Service
from app.core.logging import logger

router = APIRouter(prefix="/reseau/testimonials", tags=["reseau-testimonials"])

# In-memory store for import logs (in production, use Redis)
import_logs: Dict[str, List[Dict[str, any]]] = {}
import_status: Dict[str, Dict[str, any]] = {}

# Cache for presigned URLs (logo_url)
_presigned_url_cache: Dict[str, tuple[str, float]] = {}
_cache_max_size = 1000  # Maximum number of cached URLs


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


def regenerate_logo_url(logo_url: Optional[str], testimonial_id: Optional[int] = None) -> Optional[str]:
    """
    Regenerate presigned URL for a testimonial logo.
    
    Args:
        logo_url: The logo URL (can be a file_key or presigned URL)
        testimonial_id: Optional testimonial ID for logging
        
    Returns:
        Presigned URL if successful, None if generation fails or no logo_url
    """
    if not logo_url:
        return None
    
    if not S3Service.is_configured():
        # If S3 is not configured, return the original URL (might be a direct URL)
        logger.warning(f"S3 not configured, returning original logo_url for testimonial {testimonial_id}")
        return logo_url
    
    try:
        s3_service = S3Service()
        file_key = None
        
        # If it's a presigned URL, try to extract the file_key from it
        if logo_url.startswith('http'):
            # Try to extract file_key from presigned URL
            from urllib.parse import urlparse, parse_qs, unquote
            parsed = urlparse(logo_url)
            
            # Check query params for 'key' parameter (some S3 presigned URLs have it)
            query_params = parse_qs(parsed.query)
            if 'key' in query_params:
                file_key = unquote(query_params['key'][0])
            else:
                # Extract from path - remove bucket name if present
                path = parsed.path.strip('/')
                # Look for 'testimonials/logos' in the path
                if 'testimonials/logos' in path:
                    # Find the position of 'testimonials/logos' and take everything after
                    idx = path.find('testimonials/logos')
                    if idx != -1:
                        file_key = path[idx:]
        else:
            # Assume it's already a file_key
            file_key = logo_url
        
        if file_key:
            # Check cache first
            import time
            if file_key in _presigned_url_cache:
                cached_url, expiration_timestamp = _presigned_url_cache[file_key]
                # If URL is still valid (not expired and not close to expiration), return cached version
                current_time = time.time()
                buffer_seconds = 3600  # Regenerate 1 hour before expiration
                if current_time < (expiration_timestamp - buffer_seconds):
                    logger.debug(f"Using cached presigned URL for testimonial {testimonial_id} with file_key: {file_key[:60]}...")
                    return cached_url
                # Remove expired entry from cache
                else:
                    del _presigned_url_cache[file_key]
            
            # Generate new presigned URL
            try:
                expiration_seconds = 604800  # 7 days (AWS S3 maximum)
                presigned_url = s3_service.generate_presigned_url(file_key, expiration=expiration_seconds)
                if presigned_url:
                    # Cache the URL with expiration timestamp
                    expiration_timestamp = time.time() + expiration_seconds
                    _presigned_url_cache[file_key] = (presigned_url, expiration_timestamp)
                    
                    # Limit cache size (LRU eviction - remove oldest entry)
                    if len(_presigned_url_cache) > _cache_max_size:
                        oldest_key = next(iter(_presigned_url_cache))
                        del _presigned_url_cache[oldest_key]
                    
                    logger.debug(f"Generated and cached presigned URL for testimonial {testimonial_id} with file_key: {file_key[:60]}...")
                    return presigned_url
                else:
                    logger.error(f"generate_presigned_url returned None for testimonial {testimonial_id} with file_key: {file_key}")
                    return None
            except Exception as e:
                logger.error(f"Failed to generate presigned URL for testimonial {testimonial_id} with file_key '{file_key}': {e}", exc_info=True)
                return None
        else:
            # Could not extract file_key, return original URL
            logger.warning(f"Could not extract file_key from logo_url for testimonial {testimonial_id}: {logo_url}")
            return logo_url  # Return original URL instead of None
    except Exception as e:
        logger.error(f"Failed to regenerate presigned URL for testimonial {testimonial_id}: {e}", exc_info=True)
        return None


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
        is_published: Optional publication status filter
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
    
    # Convert to response format
    testimonial_list = []
    
    for testimonial in testimonials:
        # Regenerate presigned URL for logo if it exists
        logo_url = regenerate_logo_url(testimonial.logo_url, testimonial.id)
        
        # Get contact name
        contact_name = None
        if testimonial.contact:
            contact_name = f"{testimonial.contact.first_name} {testimonial.contact.last_name}"
        elif testimonial.contact_id:
            # Try to load contact if not loaded
            contact_result = await db.execute(select(Contact).where(Contact.id == testimonial.contact_id))
            contact = contact_result.scalar_one_or_none()
            if contact:
                contact_name = f"{contact.first_name} {contact.last_name}"
        
        testimonial_dict = {
            "id": testimonial.id,
            "contact_id": testimonial.contact_id,
            "company_id": testimonial.company_id,
            "title": testimonial.title,
            "testimonial_fr": testimonial.testimonial_fr,
            "testimonial_en": testimonial.testimonial_en,
            "logo_url": logo_url,
            "logo_filename": testimonial.logo_filename,
            "language": testimonial.language,
            "is_published": testimonial.is_published,
            "rating": testimonial.rating,
            "contact_name": contact_name,
            "company_name": testimonial.company.name if testimonial.company else None,
            "company_logo_url": testimonial.company.logo_url if testimonial.company else None,
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
    
    # Regenerate presigned URL for logo if it exists
    logo_url = regenerate_logo_url(testimonial.logo_url, testimonial.id)
    
    # Get contact name
    contact_name = None
    if testimonial.contact:
        contact_name = f"{testimonial.contact.first_name} {testimonial.contact.last_name}"
    
    testimonial_dict = {
        "id": testimonial.id,
        "contact_id": testimonial.contact_id,
        "company_id": testimonial.company_id,
        "title": testimonial.title,
        "testimonial_fr": testimonial.testimonial_fr,
        "testimonial_en": testimonial.testimonial_en,
        "logo_url": logo_url,
        "logo_filename": testimonial.logo_filename,
        "language": testimonial.language,
        "is_published": testimonial.is_published,
        "rating": testimonial.rating,
        "contact_name": contact_name,
        "company_name": testimonial.company.name if testimonial.company else None,
        "company_logo_url": testimonial.company.logo_url if testimonial.company else None,
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
    # Handle company matching: if company_name is provided but company_id is not, try to find the company
    final_company_id = testimonial_data.company_id
    
    if not final_company_id and testimonial_data.company_name:
        # Try to find company by name
        matched_company_id = await find_company_by_name(
            company_name=testimonial_data.company_name,
            db=db
        )
        if matched_company_id:
            final_company_id = matched_company_id
            logger.info(f"Auto-matched company '{testimonial_data.company_name}' to company ID {matched_company_id}")
        else:
            logger.warning(f"Company '{testimonial_data.company_name}' not found in database. Testimonial will be created without company link.")
    
    # Handle contact matching: if contact_name is provided but contact_id is not, try to find the contact
    final_contact_id = testimonial_data.contact_id
    
    if not final_contact_id and testimonial_data.contact_name:
        # Try to parse contact name (format: "First Last" or "Last, First")
        contact_name_parts = testimonial_data.contact_name.strip().split(',')
        if len(contact_name_parts) == 2:
            # Format: "Last, First"
            last_name = contact_name_parts[0].strip()
            first_name = contact_name_parts[1].strip()
        else:
            # Format: "First Last"
            name_parts = testimonial_data.contact_name.strip().split(' ', 1)
            if len(name_parts) == 2:
                first_name = name_parts[0].strip()
                last_name = name_parts[1].strip()
            else:
                first_name = testimonial_data.contact_name.strip()
                last_name = ""
        
        if first_name and last_name:
            matched_contact_id = await find_contact_by_name(
                first_name=first_name,
                last_name=last_name,
                company_id=final_company_id,
                db=db
            )
            if matched_contact_id:
                final_contact_id = matched_contact_id
                logger.info(f"Auto-matched contact '{testimonial_data.contact_name}' to contact ID {matched_contact_id}")
            else:
                logger.warning(f"Contact '{testimonial_data.contact_name}' not found in database. Testimonial will be created without contact link.")
    
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
    if final_contact_id:
        contact_result = await db.execute(
            select(Contact).where(Contact.id == final_contact_id)
        )
        if not contact_result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Contact not found"
            )
    
    # Build testimonial
    testimonial = Testimonial(
        contact_id=final_contact_id,
        company_id=final_company_id,
        title=testimonial_data.title,
        testimonial_fr=testimonial_data.testimonial_fr,
        testimonial_en=testimonial_data.testimonial_en,
        logo_url=testimonial_data.logo_url,
        logo_filename=testimonial_data.logo_filename,
        language=testimonial_data.language,
        is_published=testimonial_data.is_published or "draft",
        rating=testimonial_data.rating,
    )
    
    db.add(testimonial)
    await db.commit()
    await db.refresh(testimonial)
    
    # Load relationships
    await db.refresh(testimonial, ["company", "contact"])
    
    # Regenerate presigned URL for logo if it exists
    logo_url = regenerate_logo_url(testimonial.logo_url, testimonial.id)
    
    # Get contact name
    contact_name = None
    if testimonial.contact:
        contact_name = f"{testimonial.contact.first_name} {testimonial.contact.last_name}"
    
    # Convert to response format
    testimonial_dict = {
        "id": testimonial.id,
        "contact_id": testimonial.contact_id,
        "company_id": testimonial.company_id,
        "title": testimonial.title,
        "testimonial_fr": testimonial.testimonial_fr,
        "testimonial_en": testimonial.testimonial_en,
        "logo_url": logo_url,
        "logo_filename": testimonial.logo_filename,
        "language": testimonial.language,
        "is_published": testimonial.is_published,
        "rating": testimonial.rating,
        "contact_name": contact_name,
        "company_name": testimonial.company.name if testimonial.company else None,
        "company_logo_url": testimonial.company.logo_url if testimonial.company else None,
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
    
    # Handle company matching: if company_name is provided but company_id is not, try to find the company
    final_company_id = testimonial_data.company_id
    
    if final_company_id is None and testimonial_data.company_name:
        # Try to find company by name
        matched_company_id = await find_company_by_name(
            company_name=testimonial_data.company_name,
            db=db
        )
        if matched_company_id:
            final_company_id = matched_company_id
            logger.info(f"Auto-matched company '{testimonial_data.company_name}' to company ID {matched_company_id} for testimonial {testimonial_id}")
        else:
            logger.warning(f"Company '{testimonial_data.company_name}' not found in database for testimonial {testimonial_id}")
    
    # Handle contact matching: if contact_name is provided but contact_id is not, try to find the contact
    final_contact_id = testimonial_data.contact_id
    
    if final_contact_id is None and testimonial_data.contact_name:
        # Try to parse contact name
        contact_name_parts = testimonial_data.contact_name.strip().split(',')
        if len(contact_name_parts) == 2:
            last_name = contact_name_parts[0].strip()
            first_name = contact_name_parts[1].strip()
        else:
            name_parts = testimonial_data.contact_name.strip().split(' ', 1)
            if len(name_parts) == 2:
                first_name = name_parts[0].strip()
                last_name = name_parts[1].strip()
            else:
                first_name = testimonial_data.contact_name.strip()
                last_name = ""
        
        if first_name and last_name:
            matched_contact_id = await find_contact_by_name(
                first_name=first_name,
                last_name=last_name,
                company_id=final_company_id or testimonial.company_id,
                db=db
            )
            if matched_contact_id:
                final_contact_id = matched_contact_id
                logger.info(f"Auto-matched contact '{testimonial_data.contact_name}' to contact ID {matched_contact_id} for testimonial {testimonial_id}")
            else:
                logger.warning(f"Contact '{testimonial_data.contact_name}' not found in database for testimonial {testimonial_id}")
    
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
    if final_contact_id is not None:
        contact_result = await db.execute(
            select(Contact).where(Contact.id == final_contact_id)
        )
        if not contact_result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Contact not found"
            )
    
    # Update fields
    update_data = testimonial_data.model_dump(exclude_unset=True, exclude={'contact_name', 'company_name'})
    for field, value in update_data.items():
        setattr(testimonial, field, value)
    
    # Update company_id and contact_id if matched
    if final_company_id is not None:
        testimonial.company_id = final_company_id
    if final_contact_id is not None:
        testimonial.contact_id = final_contact_id
    
    await db.commit()
    await db.refresh(testimonial)
    await db.refresh(testimonial, ["company", "contact"])
    
    # Regenerate presigned URL for logo if it exists
    logo_url = regenerate_logo_url(testimonial.logo_url, testimonial.id)
    
    # Get contact name
    contact_name = None
    if testimonial.contact:
        contact_name = f"{testimonial.contact.first_name} {testimonial.contact.last_name}"
    
    testimonial_dict = {
        "id": testimonial.id,
        "contact_id": testimonial.contact_id,
        "company_id": testimonial.company_id,
        "title": testimonial.title,
        "testimonial_fr": testimonial.testimonial_fr,
        "testimonial_en": testimonial.testimonial_en,
        "logo_url": logo_url,
        "logo_filename": testimonial.logo_filename,
        "language": testimonial.language,
        "is_published": testimonial.is_published,
        "rating": testimonial.rating,
        "contact_name": contact_name,
        "company_name": testimonial.company.name if testimonial.company else None,
        "company_logo_url": testimonial.company.logo_url if testimonial.company else None,
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
    # Count testimonials before deletion
    count_result = await db.execute(select(func.count(Testimonial.id)))
    count = count_result.scalar_one()
    
    if count == 0:
        return {
            "message": "No testimonials found",
            "deleted_count": 0
        }
    
    # Delete all testimonials
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


async def get_current_user_from_query(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    Get current user from query parameter (for SSE endpoints that can't use headers)
    EventSource doesn't support custom headers, so we accept token in query params
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # Try to get token from query parameter first (for SSE)
    token = request.query_params.get("token")
    
    # Fallback to Authorization header if no query param
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header.replace("Bearer ", "")
    
    if not token:
        raise credentials_exception
    
    # Use the same authentication logic as get_current_user
    from app.core.security import decode_token
    
    # Decode token
    payload = decode_token(token, token_type="access")
    if not payload:
        raise credentials_exception
    
    username: str = payload.get("sub")
    if username is None:
        raise credentials_exception
    
    # Get user from database
    result = await db.execute(select(User).where(User.email == username))
    user = result.scalar_one_or_none()
    
    if user is None or not user.is_active:
        raise credentials_exception
    
    return user


@router.get("/import/{import_id}/logs")
async def stream_import_logs(
    import_id: str,
    request: Request,
    current_user: User = Depends(get_current_user_from_query),
    db: AsyncSession = Depends(get_db),
):
    """
    Stream import logs via Server-Sent Events (SSE)
    Note: Uses query parameter authentication because EventSource doesn't support custom headers
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
       - logos/ folder (optional) with images named as company logos
    
    Supported column names (case-insensitive, accent-insensitive):
    - Contact Name: contact_name, contact, nom_contact, nom contact, client, client_name
    - Company Name: company_name, company, entreprise, entreprise_name, nom_entreprise, société, societe
    - Company ID: company_id, id_entreprise, entreprise_id
    - Title: title, titre, heading
    - Testimonial FR: testimonial_fr, témoignage_fr, temoignage_fr, témoignage, temoignage, testimonial, commentaire_fr
    - Testimonial EN: testimonial_en, témoignage_en, temoignage_en, testimonial_en, commentaire_en
    - Logo URL: logo_url, logo, logo url, url logo, image_url, image url
    - Logo Filename: logo_filename, nom_fichier_logo (for matching logos in ZIP during import)
    - Language: language, langue, lang
    - Rating: rating, note, évaluation, evaluation, score
    - Published: is_published, published, publié, publie, status, statut
    
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
        add_import_log(import_id, f"Fichier lu: {len(file_content)} bytes", "info")
        
        # Check if it's a ZIP file
        is_zip = file.filename.endswith('.zip') if file.filename else False
        photos_dict = {}  # filename -> file content
        
        if is_zip:
            add_import_log(import_id, "Détection d'un fichier ZIP, extraction en cours...", "info")
            try:
                with zipfile.ZipFile(BytesIO(file_content), 'r') as zip_ref:
                    # List all files in ZIP
                    file_list = zip_ref.namelist()
                    add_import_log(import_id, f"Fichiers trouvés dans le ZIP: {len(file_list)}", "info")
                    
                    # Find Excel file
                    excel_file = None
                    for file_name in file_list:
                        if file_name.endswith('.xlsx') or file_name.endswith('.xls'):
                            excel_file = file_name
                            break
                    
                    if not excel_file:
                        add_import_log(import_id, "ERREUR: Aucun fichier Excel trouvé dans le ZIP", "error")
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail="ZIP file must contain an Excel file (.xlsx or .xls)"
                        )
                    
                    add_import_log(import_id, f"Fichier Excel trouvé: {excel_file}", "info")
                    file_content = zip_ref.read(excel_file)
                    
                    # Extract logos from logos/ folder
                    logos_folder = "logos/"
                    for file_name in file_list:
                        if file_name.startswith(logos_folder) and not file_name.endswith('/'):
                            # Get filename without folder prefix
                            logo_filename = file_name[len(logos_folder):]
                            # Normalize filename for matching
                            normalized_filename = normalize_filename(logo_filename)
                            photos_dict[normalized_filename] = zip_ref.read(file_name)
                            photos_dict[logo_filename] = zip_ref.read(file_name)  # Also keep original
                    
                    add_import_log(import_id, f"{len(photos_dict)} logo(s) trouvé(s) dans le dossier logos/", "info")
            except zipfile.BadZipFile:
                add_import_log(import_id, "ERREUR: Le fichier ZIP est invalide ou corrompu", "error")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid or corrupted ZIP file"
                )
        
        # Import from Excel
        add_import_log(import_id, "Lecture du fichier Excel...", "info")
        result = ImportService.import_from_excel(
            file_content=file_content,
            has_headers=True
        )
        
        # Validate and get data list
        if not isinstance(result['data'], list) or len(result['data']) == 0:
            add_import_log(import_id, "ERREUR: Le fichier Excel ne contient pas de lignes de données valides", "error")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Excel file does not contain valid data rows"
            )
        
        total_rows = len(result['data'])
        add_import_log(import_id, f"Fichier Excel lu avec succès: {total_rows} ligne(s) trouvée(s)", "info")
        update_import_status(import_id, "processing", progress=0, total=total_rows)
        
        # Load all companies once
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
        
        # Load all contacts once
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
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error loading contacts from database"
            )
        
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
        created_testimonials = []
        errors = []
        warnings = []
        
        stats = {
            "total_processed": 0,
            "created_new": 0,
            "errors": 0,
            "logos_uploaded": 0
        }
        
        # Initialize S3 service for logo uploads
        s3_service = None
        s3_configured = S3Service.is_configured()
        logger.info(f"S3 configuration check: is_configured={s3_configured}, photos_dict has {len(photos_dict)} logos")
        add_import_log(import_id, f"Configuration S3: {'✅ Configuré' if s3_configured else '❌ Non configuré'} - {len(photos_dict)} logo(s) trouvé(s) dans le ZIP", "info" if s3_configured else "warning")
        
        if s3_configured:
            try:
                s3_service = S3Service()
                logger.info("S3Service initialized successfully for testimonial logo uploads")
            except Exception as e:
                logger.error(f"Failed to initialize S3Service: {e}", exc_info=True)
                warnings.append({
                    'row': 0,
                    'type': 's3_init_failed',
                    'message': f"⚠️ Impossible d'initialiser le service S3 pour l'upload des logos. Les témoignages seront créés sans logos. Erreur: {str(e)}",
                    'data': {'error_details': str(e)}
                })
                s3_service = None
        
        add_import_log(import_id, f"Début du traitement de {total_rows} ligne(s)...", "info")
        
        BATCH_SIZE = 50
        batch_count = 0
        
        for idx, row_data in enumerate(result['data']):
            try:
                stats["total_processed"] += 1
                update_import_status(import_id, "processing", progress=idx + 1, total=total_rows)
                
                # Log progress every 10 rows
                if (idx + 1) % 10 == 0 or idx < 5:
                    add_import_log(import_id, f"📊 Ligne {idx + 1}/{total_rows}: Traitement en cours... (créés: {stats['created_new']}, erreurs: {stats['errors']})", "info", {"progress": idx + 1, "total": total_rows, "stats": stats.copy()})
                
                # Map Excel columns to Testimonial fields
                contact_name = get_field_value(row_data, [
                    'contact_name', 'contact', 'nom_contact', 'nom contact', 'client', 'client_name', 'client name'
                ])
                
                company_name = get_field_value(row_data, [
                    'company_name', 'company', 'entreprise', 'entreprise_name', 'nom_entreprise', 'société', 'societe'
                ])
                
                company_id_raw = get_field_value(row_data, [
                    'company_id', 'id_entreprise', 'entreprise_id', 'company id', 'id company', 'ID Entreprise'
                ])
                
                company_id = None
                if company_id_raw:
                    # Try to parse as ID first
                    try:
                        potential_id = int(float(str(company_id_raw)))
                        # Verify company exists with this ID
                        company_result = await db.execute(
                            select(Company).where(Company.id == potential_id)
                        )
                        if company_result.scalar_one_or_none():
                            company_id = potential_id
                            add_import_log(import_id, f"Ligne {idx + 2}: Entreprise trouvée par ID: {company_id}", "info")
                        else:
                            # ID doesn't exist, try as name
                            matched_company_id = await find_company_by_name(
                                company_name=str(company_id_raw).strip(),
                                db=db,
                                all_companies=all_companies,
                                company_name_to_id=company_name_to_id
                            )
                            if matched_company_id:
                                company_id = matched_company_id
                                add_import_log(import_id, f"Ligne {idx + 2}: '{company_id_raw}' traité comme nom d'entreprise et matché avec ID {matched_company_id}", "info")
                            else:
                                add_import_log(import_id, f"Ligne {idx + 2}: ⚠️ Entreprise '{company_id_raw}' non trouvée (ID ou nom), témoignage créé sans entreprise", "warning")
                    except (ValueError, TypeError):
                        # Not a number, try as name
                        matched_company_id = await find_company_by_name(
                            company_name=str(company_id_raw).strip(),
                            db=db,
                            all_companies=all_companies,
                            company_name_to_id=company_name_to_id
                        )
                        if matched_company_id:
                            company_id = matched_company_id
                            add_import_log(import_id, f"Ligne {idx + 2}: '{company_id_raw}' traité comme nom d'entreprise et matché avec ID {matched_company_id}", "info")
                        else:
                            add_import_log(import_id, f"Ligne {idx + 2}: ⚠️ Entreprise '{company_id_raw}' non trouvée, témoignage créé sans entreprise", "warning")
                elif company_name:
                    # Try to find existing company by name
                    matched_company_id = await find_company_by_name(
                        company_name=company_name,
                        db=db,
                        all_companies=all_companies,
                        company_name_to_id=company_name_to_id
                    )
                    if matched_company_id:
                        company_id = matched_company_id
                        add_import_log(import_id, f"Ligne {idx + 2}: Entreprise '{company_name}' matchée avec ID {matched_company_id}", "info")
                    else:
                        add_import_log(import_id, f"Ligne {idx + 2}: ⚠️ Entreprise '{company_name}' non trouvée, témoignage créé sans entreprise", "warning")
                
                # Handle contact matching - support both contact_id and contact_name
                contact_id = None
                contact_id_raw = get_field_value(row_data, [
                    'contact_id', 'id_contact', 'contact id', 'id contact', 'ID Contact'
                ])
                
                if contact_id_raw:
                    # Try to parse as ID first
                    try:
                        potential_contact_id = int(float(str(contact_id_raw)))
                        # Verify contact exists with this ID
                        contact_result = await db.execute(
                            select(Contact).where(Contact.id == potential_contact_id)
                        )
                        if contact_result.scalar_one_or_none():
                            contact_id = potential_contact_id
                            add_import_log(import_id, f"Ligne {idx + 2}: Contact trouvé par ID: {contact_id}", "info")
                        else:
                            # ID doesn't exist, try as name
                            # Parse name format: "Prénom Nom" or "Nom, Prénom"
                            contact_name_parts = str(contact_id_raw).strip().split(',')
                            if len(contact_name_parts) == 2:
                                last_name = contact_name_parts[0].strip()
                                first_name = contact_name_parts[1].strip()
                            else:
                                name_parts = str(contact_id_raw).strip().split(' ', 1)
                                if len(name_parts) == 2:
                                    first_name = name_parts[0].strip()
                                    last_name = name_parts[1].strip()
                                else:
                                    first_name = str(contact_id_raw).strip()
                                    last_name = ""
                            
                            if first_name and last_name:
                                matched_contact_id = await find_contact_by_name(
                                    first_name=first_name,
                                    last_name=last_name,
                                    company_id=company_id,
                                    db=db,
                                    all_contacts=all_contacts,
                                    contact_name_to_id=contact_name_to_id
                                )
                                if matched_contact_id:
                                    contact_id = matched_contact_id
                                    add_import_log(import_id, f"Ligne {idx + 2}: '{contact_id_raw}' traité comme nom de contact et matché avec ID {matched_contact_id}", "info")
                                else:
                                    add_import_log(import_id, f"Ligne {idx + 2}: ⚠️ Contact '{contact_id_raw}' non trouvé (ID ou nom), témoignage créé sans contact", "warning")
                            else:
                                add_import_log(import_id, f"Ligne {idx + 2}: ⚠️ Format de nom de contact invalide: '{contact_id_raw}', témoignage créé sans contact", "warning")
                    except (ValueError, TypeError):
                        # Not a number, try as name
                        contact_name_parts = str(contact_id_raw).strip().split(',')
                        if len(contact_name_parts) == 2:
                            last_name = contact_name_parts[0].strip()
                            first_name = contact_name_parts[1].strip()
                        else:
                            name_parts = str(contact_id_raw).strip().split(' ', 1)
                            if len(name_parts) == 2:
                                first_name = name_parts[0].strip()
                                last_name = name_parts[1].strip()
                            else:
                                first_name = str(contact_id_raw).strip()
                                last_name = ""
                        
                        if first_name and last_name:
                            matched_contact_id = await find_contact_by_name(
                                first_name=first_name,
                                last_name=last_name,
                                company_id=company_id,
                                db=db,
                                all_contacts=all_contacts,
                                contact_name_to_id=contact_name_to_id
                            )
                            if matched_contact_id:
                                contact_id = matched_contact_id
                                add_import_log(import_id, f"Ligne {idx + 2}: '{contact_id_raw}' traité comme nom de contact et matché avec ID {matched_contact_id}", "info")
                            else:
                                add_import_log(import_id, f"Ligne {idx + 2}: ⚠️ Contact '{contact_id_raw}' non trouvé, témoignage créé sans contact", "warning")
                        else:
                            add_import_log(import_id, f"Ligne {idx + 2}: ⚠️ Format de nom de contact invalide: '{contact_id_raw}', témoignage créé sans contact", "warning")
                elif contact_name:
                    # Try to parse contact name
                    contact_name_parts = contact_name.strip().split(',')
                    if len(contact_name_parts) == 2:
                        last_name = contact_name_parts[0].strip()
                        first_name = contact_name_parts[1].strip()
                    else:
                        name_parts = contact_name.strip().split(' ', 1)
                        if len(name_parts) == 2:
                            first_name = name_parts[0].strip()
                            last_name = name_parts[1].strip()
                        else:
                            first_name = contact_name.strip()
                            last_name = ""
                    
                    if first_name and last_name:
                        matched_contact_id = await find_contact_by_name(
                            first_name=first_name,
                            last_name=last_name,
                            company_id=company_id,
                            db=db,
                            all_contacts=all_contacts,
                            contact_name_to_id=contact_name_to_id
                        )
                        if matched_contact_id:
                            contact_id = matched_contact_id
                            add_import_log(import_id, f"Ligne {idx + 2}: Contact '{contact_name}' matché avec ID {matched_contact_id}", "info")
                        else:
                            add_import_log(import_id, f"Ligne {idx + 2}: ⚠️ Contact '{contact_name}' non trouvé, témoignage créé sans contact", "warning")
                
                title = get_field_value(row_data, ['title', 'titre', 'heading'])
                testimonial_fr = get_field_value(row_data, [
                    'testimonial_fr', 'témoignage_fr', 'temoignage_fr', 'témoignage', 'temoignage', 'testimonial', 'commentaire_fr', 'commentaire fr'
                ])
                testimonial_en = get_field_value(row_data, [
                    'testimonial_en', 'témoignage_en', 'temoignage_en', 'testimonial_en', 'commentaire_en', 'commentaire en'
                ])
                logo_url = get_field_value(row_data, ['logo_url', 'logo', 'logo url', 'url logo', 'image_url', 'image url'])
                logo_filename = get_field_value(row_data, ['logo_filename', 'nom_fichier_logo', 'nom fichier logo'])
                language = get_field_value(row_data, ['language', 'langue', 'lang'])
                rating_raw = get_field_value(row_data, ['rating', 'note', 'évaluation', 'evaluation', 'score'])
                is_published_raw = get_field_value(row_data, ['is_published', 'published', 'publié', 'publie', 'status', 'statut'])
                
                rating = None
                if rating_raw:
                    try:
                        rating = int(float(str(rating_raw)))
                        if rating < 1 or rating > 5:
                            rating = None
                    except (ValueError, TypeError):
                        pass
                
                is_published = "draft"
                if is_published_raw:
                    is_published_lower = str(is_published_raw).lower().strip()
                    if is_published_lower in ['published', 'publié', 'publie', 'true', '1', 'yes', 'oui']:
                        is_published = "published"
                
                # Handle logo upload from ZIP
                final_logo_url = logo_url
                final_logo_filename = logo_filename
                
                if logo_filename and photos_dict:
                    # Try to find matching logo in ZIP
                    normalized_logo_filename = normalize_filename(logo_filename)
                    matching_logo_data = None
                    
                    # Try exact match first
                    if logo_filename in photos_dict:
                        matching_logo_data = photos_dict[logo_filename]
                    elif normalized_logo_filename in photos_dict:
                        matching_logo_data = photos_dict[normalized_logo_filename]
                    else:
                        # Try partial match
                        for stored_filename, logo_data in photos_dict.items():
                            if normalized_logo_filename in normalize_filename(stored_filename) or normalize_filename(stored_filename) in normalized_logo_filename:
                                matching_logo_data = logo_data
                                break
                    
                    if matching_logo_data and s3_service:
                        try:
                            # Upload to S3
                            s3_file_key = f"testimonials/logos/{testimonial_id or uuid.uuid4().hex}/{logo_filename}"
                            uploaded_url = s3_service.upload_file(
                                file_content=matching_logo_data,
                                file_key=s3_file_key,
                                content_type="image/jpeg"  # Default, could be improved
                            )
                            if uploaded_url:
                                final_logo_url = uploaded_url
                                final_logo_filename = logo_filename
                                stats["logos_uploaded"] += 1
                                add_import_log(import_id, f"Ligne {idx + 2}: Logo '{logo_filename}' uploadé avec succès vers S3", "info")
                            else:
                                add_import_log(import_id, f"Ligne {idx + 2}: ⚠️ Échec de l'upload du logo '{logo_filename}' vers S3", "warning")
                        except Exception as e:
                            logger.error(f"Error uploading logo for row {idx + 2}: {e}", exc_info=True)
                            add_import_log(import_id, f"Ligne {idx + 2}: ⚠️ Erreur lors de l'upload du logo '{logo_filename}': {str(e)}", "warning")
                    elif matching_logo_data and not s3_service:
                        add_import_log(import_id, f"Ligne {idx + 2}: ⚠️ Logo '{logo_filename}' trouvé dans le ZIP mais S3 n'est pas configuré", "warning")
                    elif logo_filename and not matching_logo_data:
                        add_import_log(import_id, f"Ligne {idx + 2}: ⚠️ Logo '{logo_filename}' référencé mais non trouvé dans le ZIP", "warning")
                
                # Create testimonial
                testimonial = Testimonial(
                    contact_id=contact_id,
                    company_id=company_id,
                    title=title,
                    testimonial_fr=testimonial_fr,
                    testimonial_en=testimonial_en,
                    logo_url=final_logo_url,
                    logo_filename=final_logo_filename,
                    language=language,
                    is_published=is_published,
                    rating=rating,
                )
                
                db.add(testimonial)
                await db.flush()  # Get ID
                
                # Upload logo if we have one and haven't uploaded yet
                if matching_logo_data and s3_service and not final_logo_url:
                    try:
                        s3_file_key = f"testimonials/logos/{testimonial.id}/{logo_filename}"
                        uploaded_url = s3_service.upload_file(
                            file_content=matching_logo_data,
                            file_key=s3_file_key,
                            content_type="image/jpeg"
                        )
                        if uploaded_url:
                            testimonial.logo_url = uploaded_url
                            stats["logos_uploaded"] += 1
                            add_import_log(import_id, f"Ligne {idx + 2}: Logo '{logo_filename}' uploadé avec succès vers S3", "info")
                    except Exception as e:
                        logger.error(f"Error uploading logo for testimonial {testimonial.id}: {e}", exc_info=True)
                
                created_testimonials.append(testimonial)
                stats["created_new"] += 1
                add_import_log(import_id, f"Ligne {idx + 2}: Nouveau témoignage créé", "info", {"row": idx + 2, "action": "created"})
                
                # Commit in batches
                batch_count += 1
                if batch_count >= BATCH_SIZE:
                    await db.commit()
                    batch_count = 0
                    add_import_log(import_id, f"✅ Lot de {BATCH_SIZE} témoignage(s) sauvegardé(s)", "info")
                
            except Exception as e:
                stats["errors"] += 1
                error_msg = f"Ligne {idx + 2}: ❌ Erreur lors de l'import - {str(e)}"
                add_import_log(import_id, error_msg, "error", {"row": idx + 2, "error": str(e)})
                errors.append({
                    'row': idx + 2,
                    'data': row_data,
                    'error': str(e)
                })
                logger.error(f"Error importing testimonial row {idx + 2}: {str(e)}")
        
        # Final commit for remaining testimonials
        if batch_count > 0:
            await db.commit()
            add_import_log(import_id, f"✅ Dernier lot de {batch_count} témoignage(s) sauvegardé(s)", "info")
        
        # Refresh all created testimonials
        for testimonial in created_testimonials:
            await db.refresh(testimonial)
        
        # Final logs
        add_import_log(import_id, f"✅ Import terminé: {len(created_testimonials)} témoignage(s) importé(s), {len(errors)} erreur(s)", "success", {
            "total_valid": len(created_testimonials),
            "total_errors": len(errors)
        })
        update_import_status(import_id, "completed", progress=total_rows, total=total_rows)
        
        return {
            'total_rows': result['total_rows'],
            'valid_rows': len(created_testimonials),
            'invalid_rows': len(errors) + result['invalid_rows'],
            'errors': errors + result['errors'],
            'warnings': warnings + result['warnings'],
            'import_id': import_id,
            'logos_uploaded': stats["logos_uploaded"],
            'data': [TestimonialSchema.model_validate({
                'id': t.id,
                'contact_id': t.contact_id,
                'company_id': t.company_id,
                'title': t.title,
                'testimonial_fr': t.testimonial_fr,
                'testimonial_en': t.testimonial_en,
                'logo_url': t.logo_url,
                'logo_filename': t.logo_filename,
                'language': t.language,
                'is_published': t.is_published,
                'rating': t.rating,
                'created_at': t.created_at,
                'updated_at': t.updated_at,
            }) for t in created_testimonials]
        }
    except Exception as e:
        logger.error(f"Unexpected error in import_testimonials: {e}", exc_info=True)
        if 'import_id' in locals():
            add_import_log(import_id, f"❌ Erreur inattendue lors de l'import: {str(e)}", "error")
            update_import_status(import_id, "failed")
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
                contact_name = None
                if testimonial.contact:
                    contact_name = f"{testimonial.contact.first_name} {testimonial.contact.last_name}"
                
                export_data.append({
                    'Nom du contact': contact_name or '',
                    'Entreprise': testimonial.company.name if testimonial.company else '',
                    'Titre': testimonial.title or '',
                    'Témoignage (FR)': testimonial.testimonial_fr or '',
                    'Témoignage (EN)': testimonial.testimonial_en or '',
                    'Logo URL': testimonial.logo_url or '',
                    'Langue': testimonial.language or '',
                    'Note': testimonial.rating or '',
                    'Statut': testimonial.is_published or 'draft',
                    'Date de création': testimonial.created_at.isoformat() if testimonial.created_at else '',
                })
            except Exception as e:
                logger.error(f"Error processing testimonial {testimonial.id} for export: {e}")
                continue
        
        # Handle empty data case
        if not export_data:
            export_data = [{
                'Nom du contact': '',
                'Entreprise': '',
                'Titre': '',
                'Témoignage (FR)': '',
                'Témoignage (EN)': '',
                'Logo URL': '',
                'Langue': '',
                'Note': '',
                'Statut': '',
                'Date de création': '',
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
