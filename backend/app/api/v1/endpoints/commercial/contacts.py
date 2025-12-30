"""
Commercial Contacts Endpoints
API endpoints for managing commercial contacts
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

from app.core.database import get_db
from app.core.cache_enhanced import cache_query
from app.dependencies import get_current_user
from app.models.contact import Contact
from app.models.company import Company
from app.models.user import User
from app.schemas.contact import ContactCreate, ContactUpdate, Contact as ContactSchema
from app.services.import_service import ImportService
from app.services.export_service import ExportService
from app.services.s3_service import S3Service
from app.core.logging import logger
import unicodedata
import re

router = APIRouter(prefix="/commercial/contacts", tags=["commercial-contacts"])

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

# Cache for presigned URLs to avoid regenerating them unnecessarily
# Format: {file_key: (presigned_url, expiration_timestamp)}
_presigned_url_cache: dict[str, tuple[str, float]] = {}
_cache_max_size = 1000  # Maximum number of cached URLs


def regenerate_photo_url(photo_url: Optional[str], contact_id: Optional[int] = None) -> Optional[str]:
    """
    Regenerate presigned URL for a contact photo.
    
    Args:
        photo_url: The photo URL (can be a file_key or presigned URL)
        contact_id: Optional contact ID for logging
        
    Returns:
        Presigned URL if successful, None if generation fails or no photo_url
    """
    if not photo_url:
        return None
    
    if not S3Service.is_configured():
        # If S3 is not configured, return the original URL (might be a direct URL)
        logger.warning(f"S3 not configured, returning original photo_url for contact {contact_id}")
        return photo_url
    
    try:
        s3_service = S3Service()
        file_key = None
        
        # If it's a presigned URL, try to extract the file_key from it
        if photo_url.startswith('http'):
            # Try to extract file_key from presigned URL
            from urllib.parse import urlparse, parse_qs, unquote
            parsed = urlparse(photo_url)
            
            # Check query params for 'key' parameter (some S3 presigned URLs have it)
            query_params = parse_qs(parsed.query)
            if 'key' in query_params:
                file_key = unquote(query_params['key'][0])
            else:
                # Extract from path - remove bucket name if present
                path = parsed.path.strip('/')
                # Look for 'contacts/photos' in the path
                if 'contacts/photos' in path:
                    # Find the position of 'contacts/photos' and take everything after
                    idx = path.find('contacts/photos')
                    if idx != -1:
                        file_key = path[idx:]
                elif path.startswith('contacts/'):
                    file_key = path
        else:
            # It's likely already a file_key
            file_key = photo_url
        
        # Validate and normalize file_key format
        if file_key:
            # Normalize: remove leading/trailing slashes and ensure it starts with 'contacts/photos'
            file_key = file_key.strip('/')
            
            # If it doesn't start with 'contacts/photos', it might be invalid
            if not file_key.startswith('contacts/photos'):
                logger.warning(f"Invalid file_key format for contact {contact_id}: {file_key}. Expected format: contacts/photos/...")
                # Try to fix if it's just missing the prefix
                if not file_key.startswith('contacts/'):
                    logger.info(f"Attempting to fix file_key by adding contacts/photos/ prefix")
                    file_key = f"contacts/photos/{file_key}"
            
            # Skip S3 metadata check for performance (trust that file_key is valid)
            # This saves 50-100ms per photo and reduces S3 API calls
            
            # Check cache first
            import time
            if file_key in _presigned_url_cache:
                cached_url, expiration_timestamp = _presigned_url_cache[file_key]
                # If URL is still valid (not expired and not close to expiration), return cached version
                current_time = time.time()
                buffer_seconds = 3600  # Regenerate 1 hour before expiration
                if current_time < (expiration_timestamp - buffer_seconds):
                    logger.debug(f"Using cached presigned URL for contact {contact_id} with file_key: {file_key[:60]}...")
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
                    
                    logger.debug(f"Generated and cached presigned URL for contact {contact_id} with file_key: {file_key[:60]}...")
                    return presigned_url
                else:
                    logger.error(f"generate_presigned_url returned None for contact {contact_id} with file_key: {file_key}")
                    return None
            except Exception as e:
                logger.error(f"Failed to generate presigned URL for contact {contact_id} with file_key '{file_key}': {e}", exc_info=True)
                return None
        else:
            # Could not extract file_key, return original URL
            logger.warning(f"Could not extract file_key from photo_url for contact {contact_id}: {photo_url}")
            return photo_url  # Return original URL instead of None
    except Exception as e:
        logger.error(f"Failed to regenerate presigned URL for contact {contact_id}: {e}", exc_info=True)
        return None


@router.get("/", response_model=List[ContactSchema])
@cache_query(expire=60, tags=["contacts"])  # Cache for 60 seconds, invalidate on contact changes
async def list_contacts(
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    circle: Optional[str] = Query(None),
    company_id: Optional[int] = Query(None),
) -> List[Contact]:
    """
    Get list of contacts
    
    Args:
        skip: Number of records to skip
        limit: Maximum number of records to return
        circle: Optional circle filter
        company_id: Optional company filter
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        List of contacts
    """
    query = select(Contact)
    
    if circle:
        query = query.where(Contact.circle == circle)
    if company_id:
        query = query.where(Contact.company_id == company_id)
    
    query = query.options(
        selectinload(Contact.company),
        selectinload(Contact.employee)
    ).order_by(Contact.created_at.desc()).offset(skip).limit(limit)
    
    try:
        result = await db.execute(query)
        contacts = result.scalars().all()
    except Exception as e:
        error_str = str(e)
        # Check if the error is about missing photo_filename column
        if ('photo_filename' in error_str or 'logo_filename' in error_str) and 'does not exist' in error_str:
            logger.error(f"Migration 042 not executed: photo_filename column missing. Please run: alembic upgrade head", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="La colonne photo_filename n'existe pas encore. Veuillez exécuter la migration 042: alembic upgrade head"
            )
        logger.error(f"Database error in list_contacts: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"A database error occurred: {str(e)}"
        )
    
    # Convert to response format with company and employee names
    contact_list = []
    
    for contact in contacts:
        # Regenerate presigned URL for photo if it exists
        photo_url = regenerate_photo_url(contact.photo_url, contact.id)
        
        contact_dict = {
            "id": contact.id,
            "first_name": contact.first_name,
            "last_name": contact.last_name,
            "company_id": contact.company_id,
            "company_name": contact.company.name if contact.company else None,
            "position": contact.position,
            "circle": contact.circle,
            "linkedin": contact.linkedin,
            "photo_url": photo_url,
            "photo_filename": getattr(contact, 'photo_filename', None),
            "email": contact.email,
            "phone": contact.phone,
            "city": contact.city,
            "country": contact.country,
            "birthday": contact.birthday.isoformat() if contact.birthday else None,
            "language": contact.language,
            "employee_id": contact.employee_id,
            "employee_name": f"{contact.employee.first_name} {contact.employee.last_name}" if contact.employee else None,
            "created_at": contact.created_at,
            "updated_at": contact.updated_at,
        }
        contact_list.append(ContactSchema(**contact_dict))
    
    return contact_list


@router.get("/{contact_id}", response_model=ContactSchema)
async def get_contact(
    contact_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Contact:
    """
    Get a specific contact by ID
    
    Args:
        contact_id: Contact ID
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        Contact details
        
    Raises:
        HTTPException: If contact not found
    """
    try:
        result = await db.execute(
            select(Contact)
            .options(
                selectinload(Contact.company),
                selectinload(Contact.employee)
            )
            .where(Contact.id == contact_id)
        )
        contact = result.scalar_one_or_none()
    except Exception as e:
        logger.error(f"Database error in get_contact: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"A database error occurred: {str(e)}"
        )
    
    if not contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contact not found"
        )
    
    # Regenerate presigned URL for photo if it exists
    photo_url = regenerate_photo_url(contact.photo_url, contact.id)
    
    # Convert to response format
    contact_dict = {
        "id": contact.id,
        "first_name": contact.first_name,
        "last_name": contact.last_name,
        "company_id": contact.company_id,
        "company_name": contact.company.name if contact.company else None,
        "position": contact.position,
        "circle": contact.circle,
        "linkedin": contact.linkedin,
            "photo_url": photo_url,
            "photo_filename": getattr(contact, 'photo_filename', None),
            "email": contact.email,
        "phone": contact.phone,
        "city": contact.city,
        "country": contact.country,
        "birthday": contact.birthday.isoformat() if contact.birthday else None,
        "language": contact.language,
        "employee_id": contact.employee_id,
        "employee_name": f"{contact.employee.first_name} {contact.employee.last_name}" if contact.employee else None,
        "created_at": contact.created_at,
        "updated_at": contact.updated_at,
    }
    
    return ContactSchema(**contact_dict)


@router.post("/", response_model=ContactSchema, status_code=status.HTTP_201_CREATED)
async def create_contact(
    request: Request,
    contact_data: ContactCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Contact:
    """
    Create a new contact
    
    Args:
        contact_data: Contact creation data
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        Created contact
    """
    # Handle company matching: if company_name is provided but company_id is not, try to find the company
    final_company_id = contact_data.company_id
    
    if not final_company_id and contact_data.company_name:
        # Try to find company by name
        matched_company_id = await find_company_by_name(
            company_name=contact_data.company_name,
            db=db
        )
        if matched_company_id:
            final_company_id = matched_company_id
            logger.info(f"Auto-matched company '{contact_data.company_name}' to company ID {matched_company_id}")
        else:
            logger.warning(f"Company '{contact_data.company_name}' not found in database. Contact will be created without company link.")
    
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
    
    # Validate employee exists if provided
    if contact_data.employee_id:
        employee_result = await db.execute(
            select(User).where(User.id == contact_data.employee_id)
        )
        if not employee_result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Employee not found"
            )
    
    # Build contact with all fields including logo_filename
    contact = Contact(
        first_name=contact_data.first_name,
        last_name=contact_data.last_name,
        company_id=final_company_id,
        position=contact_data.position,
        circle=contact_data.circle,
        linkedin=contact_data.linkedin,
        photo_url=contact_data.photo_url,
        photo_filename=getattr(contact_data, 'photo_filename', None),
        email=contact_data.email,
        phone=contact_data.phone,
        city=contact_data.city,
        country=contact_data.country,
        birthday=contact_data.birthday,
        language=contact_data.language,
        employee_id=contact_data.employee_id,
    )
    
    db.add(contact)
    await db.commit()
    await db.refresh(contact)
    
    # Load relationships
    await db.refresh(contact, ["company", "employee"])
    
    # Regenerate presigned URL for photo if it exists
    photo_url = regenerate_photo_url(contact.photo_url, contact.id)
    
    # Convert to response format
    contact_dict = {
        "id": contact.id,
        "first_name": contact.first_name,
        "last_name": contact.last_name,
        "company_id": contact.company_id,
        "company_name": contact.company.name if contact.company else None,
        "position": contact.position,
        "circle": contact.circle,
        "linkedin": contact.linkedin,
            "photo_url": photo_url,
            "photo_filename": getattr(contact, 'photo_filename', None),
            "email": contact.email,
        "phone": contact.phone,
        "city": contact.city,
        "country": contact.country,
        "birthday": contact.birthday.isoformat() if contact.birthday else None,
        "language": contact.language,
        "employee_id": contact.employee_id,
        "employee_name": f"{contact.employee.first_name} {contact.employee.last_name}" if contact.employee else None,
        "created_at": contact.created_at,
        "updated_at": contact.updated_at,
    }
    
    return ContactSchema(**contact_dict)


@router.put("/{contact_id}", response_model=ContactSchema)
async def update_contact(
    request: Request,
    contact_id: int,
    contact_data: ContactUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Contact:
    """
    Update a contact
    
    Args:
        contact_id: Contact ID
        contact_data: Contact update data
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        Updated contact
        
    Raises:
        HTTPException: If contact not found
    """
    result = await db.execute(
        select(Contact).where(Contact.id == contact_id)
    )
    contact = result.scalar_one_or_none()
    
    if not contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contact not found"
        )
    
    # Handle company matching: if company_name is provided but company_id is not, try to find the company
    final_company_id = contact_data.company_id
    
    if final_company_id is None and contact_data.company_name:
        # Try to find company by name
        matched_company_id = await find_company_by_name(
            company_name=contact_data.company_name,
            db=db
        )
        if matched_company_id:
            final_company_id = matched_company_id
            logger.info(f"Auto-matched company '{contact_data.company_name}' to company ID {matched_company_id} for contact {contact_id}")
        else:
            logger.warning(f"Company '{contact_data.company_name}' not found in database. Contact company will remain unchanged.")
    
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
    
    # Validate employee exists if provided
    if contact_data.employee_id is not None:
        employee_result = await db.execute(
            select(User).where(User.id == contact_data.employee_id)
        )
        if not employee_result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Employee not found"
            )
    
    # Update fields (exclude company_name as it's not a database field)
    update_data = contact_data.model_dump(exclude_unset=True, exclude={'company_name'})
    
    # Set company_id if we found a match
    if final_company_id is not None:
        update_data['company_id'] = final_company_id
    
    for field, value in update_data.items():
        setattr(contact, field, value)
    
    await db.commit()
    await db.refresh(contact)
    await db.refresh(contact, ["company", "employee"])
    
    # Regenerate presigned URL for photo if it exists
    photo_url = regenerate_photo_url(contact.photo_url, contact.id)
    
    # Convert to response format
    contact_dict = {
        "id": contact.id,
        "first_name": contact.first_name,
        "last_name": contact.last_name,
        "company_id": contact.company_id,
        "company_name": contact.company.name if contact.company else None,
        "position": contact.position,
        "circle": contact.circle,
        "linkedin": contact.linkedin,
            "photo_url": photo_url,
            "photo_filename": getattr(contact, 'photo_filename', None),
            "email": contact.email,
        "phone": contact.phone,
        "city": contact.city,
        "country": contact.country,
        "birthday": contact.birthday.isoformat() if contact.birthday else None,
        "language": contact.language,
        "employee_id": contact.employee_id,
        "employee_name": f"{contact.employee.first_name} {contact.employee.last_name}" if contact.employee else None,
        "created_at": contact.created_at,
        "updated_at": contact.updated_at,
    }
    
    return ContactSchema(**contact_dict)


@router.delete("/bulk", status_code=status.HTTP_200_OK)
async def delete_all_contacts(
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """
    Delete all contacts from the database
    
    Args:
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        Dictionary with count of deleted contacts
    """
    # Count contacts before deletion
    count_result = await db.execute(select(func.count(Contact.id)))
    count = count_result.scalar_one()
    
    if count == 0:
        return {
            "message": "No contacts found",
            "deleted_count": 0
        }
    
    # Delete all contacts
    await db.execute(delete(Contact))
    await db.commit()
    
    logger.info(f"User {current_user.id} deleted all {count} contacts")
    
    return {
        "message": f"Successfully deleted {count} contact(s)",
        "deleted_count": count
    }


@router.delete("/{contact_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_contact(
    request: Request,
    contact_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    """
    Delete a contact
    
    Args:
        contact_id: Contact ID
        current_user: Current authenticated user
        db: Database session
        
    Raises:
        HTTPException: If contact not found
    """
    result = await db.execute(
        select(Contact).where(Contact.id == contact_id)
    )
    contact = result.scalar_one_or_none()
    
    if not contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contact not found"
        )
    
    await db.delete(contact)
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
async def import_contacts(
    file: UploadFile = File(...),
    import_id: Optional[str] = Query(None, description="Optional import ID for tracking logs"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Import contacts from Excel file or ZIP file (Excel + photos)
    
    Supports two formats:
    1. Excel file (.xlsx, .xls) - simple import with photo URLs
    2. ZIP file (.zip) containing:
       - contacts.xlsx or contacts.xls (Excel file with contact data)
       - photos/ folder (optional) with images named as "firstname_lastname.jpg" or referenced in Excel
    
    Supported column names (case-insensitive, accent-insensitive):
    - First Name: first_name, prénom, prenom, firstname, first name, given_name, given name
    - Last Name: last_name, nom, name, lastname, last name, surname, family_name, family name, nom de famille
    - Company: company_name, company, entreprise, entreprise_name, nom_entreprise, société, societe, organisation, organization, firme, business, client
    - Company ID: company_id, id_entreprise, entreprise_id, company id, id company, id entreprise
    - Position: position, poste, job_title, job title, titre, fonction, role, titre du poste
    - Circle: circle, cercle, network, réseau, reseau
    - LinkedIn: linkedin, linkedin_url, linkedin url, profil linkedin
    - Email: email, courriel, e-mail, mail, adresse email, adresse courriel, email address
    - Phone: phone, téléphone, telephone, tel, tél, phone_number, phone number, numéro de téléphone, numero de telephone, mobile, portable
    - City: city, ville, cité, cite, localité, localite
    - Country: country, pays, nation, nationalité, nationalite
    - Region: region, région, zone, area, location, localisation (can be parsed to extract city/country if separated by comma, dash, or slash)
    - Birthday: birthday, anniversaire, date de naissance, birth_date, birth date, dob
    - Language: language, langue, lang, idioma
    - Employee ID: employee_id, id_employé, id_employe, employé_id, employe_id, employee id, id employee, responsable_id, responsable id, assigned_to_id, assigned to id
    - Photo URL: photo_url, photo, photo url, url photo, image_url, image url, avatar, avatar_url, avatar url
    - Logo Filename: logo_filename, photo_filename, nom_fichier_photo (for matching photos in ZIP during import)
    
    Features:
    - Automatic company matching by name (exact, without legal form, or partial match)
    - Automatic extraction of city/country from region field if city/country columns are missing
    - Case-insensitive and accent-insensitive column name matching
    - Automatic type conversion for IDs (handles float strings)
    - Date parsing for birthday field (multiple formats supported)
    - Warnings for companies not found, partial matches, and invalid IDs
    
    Args:
        file: Excel file or ZIP file with contacts data and photos
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
        
        # Dictionary to store photos from ZIP (filename -> file content)
        photos_dict = {}
        excel_content = None
        
        # Check if it's a ZIP file
        if file_ext == '.zip':
            add_import_log(import_id, "Détection d'un fichier ZIP, extraction en cours...", "info")
            try:
                with zipfile.ZipFile(BytesIO(file_content), 'r') as zip_ref:
                    photo_count = 0
                    # Extract Excel file and photos
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
                        
                        # Find photos (in photos/ folder or root)
                        elif file_name_lower.endswith(('.jpg', '.jpeg', '.png', '.gif', '.webp')):
                            photo_content = zip_ref.read(file_info)
                            # Store with normalized filename (lowercase, no path, normalized)
                            photo_filename = os.path.basename(file_info)
                            # Normalize the filename for matching (remove accents, normalize spaces)
                            photo_filename_normalized = normalize_filename(photo_filename)
                            # Store both original and normalized versions for flexible matching
                            photos_dict[photo_filename.lower()] = photo_content
                            if photo_filename_normalized != photo_filename.lower():
                                photos_dict[photo_filename_normalized] = photo_content
                            photo_count += 1
                    
                    add_import_log(import_id, f"Extraction ZIP terminée: {photo_count} photo(s) trouvée(s)", "info")
                
                if excel_content is None:
                    add_import_log(import_id, "ERREUR: Aucun fichier Excel trouvé dans le ZIP", "error")
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="No Excel file found in ZIP. Please include contacts.xlsx or contacts.xls"
                    )
                
                file_content = excel_content
                logger.info(f"Extracted Excel from ZIP with {len(photos_dict)} photos")
                
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
        
        # Load all companies once to create a name -> ID mapping (case-insensitive)
        add_import_log(import_id, "Chargement des entreprises existantes...", "info")
        try:
            companies_result = await db.execute(select(Company))
            all_companies = companies_result.scalars().all()
            # Create a case-insensitive mapping: company_name_lower -> company_id
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
        
        # Load all existing contacts once to check for duplicates
        add_import_log(import_id, "Chargement des contacts existants pour détecter les doublons...", "info")
        try:
            contacts_result = await db.execute(select(Contact))
            all_existing_contacts = contacts_result.scalars().all()
            add_import_log(import_id, f"{len(all_existing_contacts)} contact(s) existant(s) chargé(s)", "info")
            # Create mappings for duplicate detection:
            # 1. By email (if email exists)
            # 2. By first_name + last_name + email (if email exists)
            # 3. By first_name + last_name + company_id (if company_id exists)
            contacts_by_email = {}  # email.lower() -> Contact
            contacts_by_name_email = {}  # (first_name.lower(), last_name.lower(), email.lower()) -> Contact
            contacts_by_name_company = {}  # (first_name.lower(), last_name.lower(), company_id) -> Contact
            
            for contact in all_existing_contacts:
                if contact.email:
                    email_lower = contact.email.lower().strip()
                    contacts_by_email[email_lower] = contact
                    name_key = (contact.first_name.lower().strip(), contact.last_name.lower().strip(), email_lower)
                    contacts_by_name_email[name_key] = contact
                
                if contact.company_id:
                    name_company_key = (contact.first_name.lower().strip(), contact.last_name.lower().strip(), contact.company_id)
                    contacts_by_name_company[name_company_key] = contact
        except Exception as e:
            logger.error(f"Error loading existing contacts: {e}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error loading existing contacts from database"
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
        
        # Helper function to parse region and extract city/country if possible
        def parse_region(region: Optional[str]) -> tuple[Optional[str], Optional[str]]:
            """Try to extract city and country from region field"""
            if not region:
                return None, None
            
            region_str = str(region).strip()
            if not region_str:
                return None, None
            
            # Common patterns: "City, Country" or "City - Country" or "City/Country"
            separators = [',', '-', '/', '|']
            for sep in separators:
                if sep in region_str:
                    parts = [p.strip() for p in region_str.split(sep, 1)]
                    if len(parts) == 2:
                        return parts[0] if parts[0] else None, parts[1] if parts[1] else None
            
            # If no separator, assume it's a city
            return region_str, None
        
        # Process imported data
        created_contacts = []
        errors = []
        warnings = []
        
        # Initialize statistics tracking
        stats = {
            "total_processed": 0,
            "skipped_missing_name": 0,
            "skipped_missing_firstname": 0,
            "skipped_missing_lastname": 0,
            "matched_existing": 0,
            "created_new": 0,
            "errors": 0
        }
        
        # Initialize S3 service for photo uploads
        s3_service = None
        s3_configured = S3Service.is_configured()
        logger.info(f"S3 configuration check: is_configured={s3_configured}, photos_dict has {len(photos_dict)} photos")
        
        if s3_configured:
            try:
                s3_service = S3Service()
                logger.info("S3Service initialized successfully for contact photo uploads")
                # Log S3 bucket name for debugging (without exposing full credentials)
                bucket_name = os.getenv("AWS_S3_BUCKET")
                if bucket_name:
                    logger.info(f"S3 bucket configured: {bucket_name}")
                else:
                    logger.warning("AWS_S3_BUCKET environment variable not set")
            except Exception as e:
                logger.error(f"Failed to initialize S3Service: {e}", exc_info=True)
                warnings.append({
                    'row': 0,
                    'type': 's3_init_failed',
                    'message': f"⚠️ Impossible d'initialiser le service S3 pour l'upload des photos. Les contacts seront créés sans photos. Erreur: {str(e)}",
                    'data': {'error_details': str(e)}
                })
                s3_service = None
        else:
            logger.warning("S3 is not configured. Photos from ZIP will not be uploaded to S3.")
            logger.warning(f"Missing S3 configuration. Check env vars: AWS_ACCESS_KEY_ID={bool(os.getenv('AWS_ACCESS_KEY_ID'))}, AWS_SECRET_ACCESS_KEY={bool(os.getenv('AWS_SECRET_ACCESS_KEY'))}, AWS_S3_BUCKET={bool(os.getenv('AWS_S3_BUCKET'))}")
            if photos_dict:
                warnings.append({
                    'row': 0,
                    'type': 's3_not_configured',
                    'message': f"⚠️ S3 n'est pas configuré. {len(photos_dict)} photo(s) trouvée(s) dans le ZIP ne seront pas uploadées.",
                    'data': {'photos_count': len(photos_dict)}
                })
        
        add_import_log(import_id, f"Début du traitement de {total_rows} ligne(s)...", "info")
        logger.info(f"Starting import loop: {total_rows} rows to process, result['data'] has {len(result['data'])} items")
        
        # DEBUG: Log total rows before loop
        add_import_log(import_id, f"🔍 DEBUG: Nombre total de lignes dans result['data']: {len(result['data'])}", "info")
        logger.info(f"DEBUG: Starting import loop with {len(result['data'])} rows")
        
        # Convert to list to ensure we iterate over all items
        data_list = list(result['data']) if not isinstance(result['data'], list) else result['data']
        add_import_log(import_id, f"🔍 DEBUG: Liste convertie, nombre d'éléments: {len(data_list)}", "info")
        logger.info(f"DEBUG: Converted to list, length: {len(data_list)}")
        
        for idx, row_data in enumerate(data_list):
            try:
                stats["total_processed"] += 1
                
                # Log every row for debugging (temporarily)
                if idx < 10 or (idx + 1) % 10 == 0:
                    add_import_log(import_id, f"📊 Ligne {idx + 1}/{total_rows}: Traitement en cours... (créés: {stats['created_new']}, mis à jour: {stats['matched_existing']}, ignorés: {stats['skipped_missing_firstname'] + stats['skipped_missing_lastname']}, erreurs: {stats['errors']})", "info", {"progress": idx + 1, "total": total_rows, "stats": stats.copy()})
                
                # Map Excel columns to Contact fields with multiple possible column names
                first_name = get_field_value(row_data, [
                    'first_name', 'prénom', 'prenom', 'firstname', 'first name',
                    'nom', 'name', 'given_name', 'given name'
                ]) or ''
                
                last_name = get_field_value(row_data, [
                    'last_name', 'nom', 'name', 'lastname', 'last name',
                    'surname', 'family_name', 'family name', 'nom de famille'
                ]) or ''
                
                # Handle company matching by name or ID
                company_id = None
                # Try to get company_id directly (as integer or string)
                company_id_raw = get_field_value(row_data, [
                    'company_id', 'id_entreprise', 'entreprise_id', 'company id',
                    'id company', 'id entreprise'
                ])
                if company_id_raw:
                    try:
                        company_id = int(float(str(company_id_raw)))  # Handle float strings
                    except (ValueError, TypeError):
                        pass
                
                # If company_id is not provided, try to find company by name
                if not company_id:
                    # Try multiple column names for company name
                    company_name = get_field_value(row_data, [
                        'company_name', 'company', 'entreprise', 'entreprise_name',
                        'nom_entreprise', 'company name', 'nom entreprise',
                        'société', 'societe', 'organisation', 'organization',
                        'firme', 'business', 'client'
                    ])
                    
                    if company_name and company_name.strip():
                        company_name_normalized = company_name.strip().lower()
                        # Remove common prefixes/suffixes for better matching
                        company_name_clean = company_name_normalized.replace('sarl', '').replace('sa', '').replace('sas', '').replace('eurl', '').strip()
                        
                        # Try exact match first
                        if company_name_normalized in company_name_to_id:
                            company_id = company_name_to_id[company_name_normalized]
                        elif company_name_clean and company_name_clean in company_name_to_id:
                            # Try match without legal form
                            company_id = company_name_to_id[company_name_clean]
                            warnings.append({
                                'row': idx + 2,
                                'type': 'company_match_without_legal_form',
                                'message': f"Entreprise '{company_name}' correspond à une entreprise existante (sans forme juridique)",
                                'data': {'company_name': company_name, 'matched_company_id': company_id}
                            })
                        else:
                            # Try partial match (contains) - check both original and cleaned
                            matched_company_id = None
                            matched_company_name = None
                            
                            # First try with cleaned name
                            for stored_name, stored_id in company_name_to_id.items():
                                stored_clean = stored_name.replace('sarl', '').replace('sa', '').replace('sas', '').replace('eurl', '').strip()
                                if (company_name_clean and stored_clean and 
                                    (company_name_clean in stored_clean or stored_clean in company_name_clean)):
                                    matched_company_id = stored_id
                                    # Find the original company name
                                    for c in all_companies:
                                        if c.id == stored_id:
                                            matched_company_name = c.name
                                            break
                                    break
                            
                            # If no match with cleaned, try original normalized
                            if not matched_company_id:
                                for stored_name, stored_id in company_name_to_id.items():
                                    if (company_name_normalized in stored_name or stored_name in company_name_normalized):
                                        matched_company_id = stored_id
                                        # Find the original company name
                                        for c in all_companies:
                                            if c.id == stored_id:
                                                matched_company_name = c.name
                                                break
                                        break
                            
                            if matched_company_id:
                                company_id = matched_company_id
                                warnings.append({
                                    'row': idx + 2,
                                    'type': 'company_partial_match',
                                    'message': f"Entreprise '{company_name}' correspond partiellement à '{matched_company_name}' (ID: {matched_company_id}). Veuillez vérifier.",
                                    'data': {
                                        'company_name': company_name,
                                        'matched_company_name': matched_company_name,
                                        'matched_company_id': matched_company_id,
                                        'contact': f"{first_name} {last_name}".strip()
                                    }
                                })
                            else:
                                # No match found - add warning
                                warnings.append({
                                    'row': idx + 2,
                                    'type': 'company_not_found',
                                    'message': f"⚠️ Entreprise '{company_name}' non trouvée dans la base de données. Veuillez réviser et créer l'entreprise si nécessaire.",
                                    'data': {
                                        'company_name': company_name,
                                        'contact': f"{first_name} {last_name}".strip()
                                    }
                                })
            
                # Handle photo upload if ZIP contains photos
                photo_url = get_field_value(row_data, [
                    'photo_url', 'photo', 'photo url', 'url photo', 'image_url',
                    'image url', 'avatar', 'avatar_url', 'avatar url'
                ])
            
                # If no photo_url but we have photos in ZIP, try to find matching photo
                if not photo_url and photos_dict:
                    if not s3_service:
                        logger.warning(f"Photo found for {first_name} {last_name} but S3 service is not available. Skipping photo upload.")
                        warnings.append({
                            'row': idx + 2,
                            'type': 'photo_upload_skipped',
                            'message': f"Photo trouvée pour {first_name} {last_name} mais S3 n'est pas disponible. La photo n'a pas été uploadée.",
                            'data': {'contact': f"{first_name} {last_name}"}
                        })
                    else:
                        # Normalize names for filename matching
                        first_name_normalized = normalize_filename(first_name)
                        last_name_normalized = normalize_filename(last_name)
                        
                        # Try multiple naming patterns
                        photo_filename_patterns = [
                            # Normalized patterns (without accents)
                            f"{first_name_normalized}_{last_name_normalized}.jpg",
                            f"{first_name_normalized}_{last_name_normalized}.jpeg",
                            f"{first_name_normalized}_{last_name_normalized}.png",
                            f"{first_name_normalized}_{last_name_normalized}.gif",
                            f"{first_name_normalized}_{last_name_normalized}.webp",
                            # Original patterns (with accents)
                            f"{first_name.lower()}_{last_name.lower()}.jpg",
                            f"{first_name.lower()}_{last_name.lower()}.jpeg",
                            f"{first_name.lower()}_{last_name.lower()}.png",
                            f"{first_name.lower()}_{last_name.lower()}.gif",
                            f"{first_name.lower()}_{last_name.lower()}.webp",
                            # Without underscores
                            f"{first_name_normalized}{last_name_normalized}.jpg",
                            f"{first_name_normalized}{last_name_normalized}.jpeg",
                            f"{first_name_normalized}{last_name_normalized}.png",
                            # From Excel column (logo_filename, photo_filename, nom_fichier_photo)
                            get_field_value(row_data, ['logo_filename', 'photo_filename', 'nom_fichier_photo']),
                        ]
                        
                        uploaded_photo_url = None
                        logger.info(f"Attempting to upload photo for {first_name} {last_name}. Available photos in ZIP: {list(photos_dict.keys())[:5]}...")
                        logger.debug(f"Normalized names: first='{first_name_normalized}', last='{last_name_normalized}'")
                        logger.debug(f"Trying patterns: {photo_filename_patterns[:5]}...")
                        
                        # First, try exact match from Excel column if provided
                        excel_photo_filename = (
                            get_field_value(row_data, ['logo_filename', 'photo_filename', 'nom_fichier_photo']) or
                            row_data.get('logo_filename') or 
                            row_data.get('photo_filename') or 
                            row_data.get('nom_fichier_photo')
                        )
                        if excel_photo_filename:
                            excel_photo_normalized = normalize_filename(excel_photo_filename)
                            if excel_photo_filename.lower() in photos_dict:
                                pattern_to_use = excel_photo_filename.lower()
                            elif excel_photo_normalized in photos_dict:
                                pattern_to_use = excel_photo_normalized
                            else:
                                pattern_to_use = None
                            
                            if pattern_to_use and pattern_to_use in photos_dict:
                                try:
                                    photo_content = photos_dict[pattern_to_use]
                                    logger.info(f"Found photo from Excel column '{excel_photo_filename}' -> '{pattern_to_use}' for {first_name} {last_name} (size: {len(photo_content)} bytes)")
                                    
                                    # Create a temporary UploadFile-like object compatible with S3Service
                                    class TempUploadFile:
                                        def __init__(self, filename: str, content: bytes):
                                            self.filename = filename
                                            self.content_type = 'image/jpeg' if filename.lower().endswith(('.jpg', '.jpeg')) else ('image/png' if filename.lower().endswith('.png') else 'image/webp')
                                            # Create BytesIO and ensure it's at position 0
                                            self.file = BytesIO(content)
                                            self.file.seek(0)
                                    
                                    temp_file = TempUploadFile(pattern_to_use, photo_content)
                                    
                                    # Upload to S3
                                    logger.info(f"Uploading photo '{pattern_to_use}' to S3 for {first_name} {last_name} (size: {len(photo_content)} bytes)...")
                                    try:
                                        upload_result = s3_service.upload_file(
                                            file=temp_file,
                                            folder='contacts/photos',
                                            user_id=str(current_user.id)
                                        )
                                        logger.info(f"Upload result for {first_name} {last_name}: {upload_result}")
                                    except Exception as upload_error:
                                        logger.error(f"Exception during upload_file call for {first_name} {last_name}: {upload_error}", exc_info=True)
                                        raise
                                    
                                    uploaded_photo_url = upload_result.get('file_key')
                                    if uploaded_photo_url:
                                        if not uploaded_photo_url.startswith('contacts/photos'):
                                            if uploaded_photo_url.startswith('contacts/'):
                                                uploaded_photo_url = uploaded_photo_url.replace('contacts/', 'contacts/photos/', 1)
                                            else:
                                                uploaded_photo_url = f"contacts/photos/{uploaded_photo_url}"
                                        
                                        try:
                                            metadata = s3_service.get_file_metadata(uploaded_photo_url)
                                            logger.info(f"Successfully uploaded and verified photo for {first_name} {last_name}: {uploaded_photo_url} (size: {metadata.get('size', 0)} bytes)")
                                        except Exception as e:
                                            logger.error(f"Photo upload verification failed for {first_name} {last_name} with file_key '{uploaded_photo_url}': {e}")
                                            uploaded_photo_url = None
                                    
                                    if uploaded_photo_url:
                                        logger.info(f"Photo ready for {first_name} {last_name}: {pattern_to_use} -> file_key: {uploaded_photo_url}")
                                        break
                                except Exception as e:
                                    logger.error(f"Failed to upload photo {pattern_to_use} for {first_name} {last_name}: {e}", exc_info=True)
                                    warnings.append({
                                        'row': idx + 2,
                                        'type': 'photo_upload_error',
                                        'message': f"Erreur lors de l'upload de la photo '{pattern_to_use}' pour {first_name} {last_name}: {str(e)}",
                                        'data': {'contact': f"{first_name} {last_name}", 'pattern': pattern_to_use, 'error': str(e)}
                                    })
                        
                        # If no match from Excel column, try name-based patterns
                        if not uploaded_photo_url:
                            for pattern in photo_filename_patterns:
                                if not pattern or pattern == excel_photo_filename:
                                    continue  # Skip if already tried
                                
                                pattern_normalized = normalize_filename(pattern)
                                # Try both original pattern and normalized pattern
                                if pattern.lower() in photos_dict:
                                    pattern_to_use = pattern.lower()
                                elif pattern_normalized in photos_dict:
                                    pattern_to_use = pattern_normalized
                                else:
                                    continue
                                
                                if pattern_to_use in photos_dict:
                                    try:
                                        # Upload photo to S3
                                        photo_content = photos_dict[pattern_to_use]
                                        logger.info(f"Found matching photo '{pattern}' for {first_name} {last_name} (size: {len(photo_content)} bytes)")
                                        
                                        # Create a temporary UploadFile-like object compatible with S3Service
                                        # S3Service.upload_file uses file.file.read() (synchronous)
                                        class TempUploadFile:
                                            def __init__(self, filename: str, content: bytes):
                                                self.filename = filename
                                                self.content_type = 'image/jpeg' if filename.lower().endswith(('.jpg', '.jpeg')) else ('image/png' if filename.lower().endswith('.png') else 'image/webp')
                                                # Create a BytesIO object that S3Service can read from
                                                # Reset position to start for each read
                                                self.file = BytesIO(content)
                                                self.file.seek(0)
                                        
                                        temp_file = TempUploadFile(pattern, photo_content)
                                        
                                        # Upload to S3
                                        logger.info(f"Uploading photo '{pattern}' to S3 for {first_name} {last_name} (size: {len(photo_content)} bytes)...")
                                        try:
                                            upload_result = s3_service.upload_file(
                                                file=temp_file,
                                                folder='contacts/photos',
                                                user_id=str(current_user.id)
                                            )
                                            logger.info(f"Upload result for {first_name} {last_name}: {upload_result}")
                                        except Exception as upload_error:
                                            logger.error(f"Exception during upload_file call for {first_name} {last_name}: {upload_error}", exc_info=True)
                                            raise
                                        
                                        # Always store the file_key (not the presigned URL) for persistence
                                        # Presigned URLs expire, but file_key is permanent
                                        uploaded_photo_url = upload_result.get('file_key')
                                        
                                        # Validate file_key format
                                        if uploaded_photo_url:
                                            # Ensure file_key is in correct format: contacts/photos/...
                                            if not uploaded_photo_url.startswith('contacts/photos'):
                                                logger.warning(f"Invalid file_key format from upload_result for {first_name} {last_name}: {uploaded_photo_url}")
                                                # Try to fix if it's missing the prefix
                                                if uploaded_photo_url.startswith('contacts/'):
                                                    uploaded_photo_url = uploaded_photo_url.replace('contacts/', 'contacts/photos/', 1)
                                                else:
                                                    uploaded_photo_url = f"contacts/photos/{uploaded_photo_url}"
                                            
                                            # Verify the file was actually uploaded by checking metadata
                                            try:
                                                metadata = s3_service.get_file_metadata(uploaded_photo_url)
                                                logger.info(f"Successfully uploaded and verified photo for {first_name} {last_name}: {uploaded_photo_url} (size: {metadata.get('size', 0)} bytes)")
                                            except Exception as e:
                                                logger.error(f"Photo upload verification failed for {first_name} {last_name} with file_key '{uploaded_photo_url}': {e}")
                                                uploaded_photo_url = None
                                        else:
                                            # Fallback to URL if file_key not available, but extract key from URL
                                            url = upload_result.get('url', '')
                                            logger.warning(f"No file_key in upload_result for {first_name} {last_name}, trying to extract from URL: {url}")
                                            if url and 'contacts/photos' in url:
                                                # Extract file_key from URL
                                                from urllib.parse import urlparse
                                                parsed = urlparse(url)
                                                path = parsed.path.strip('/')
                                                if 'contacts/photos' in path:
                                                    path_idx = path.find('contacts/photos')
                                                    uploaded_photo_url = path[path_idx:]
                                                    logger.info(f"Extracted file_key from URL for {first_name} {last_name}: {uploaded_photo_url}")
                                                else:
                                                    uploaded_photo_url = url
                                            else:
                                                uploaded_photo_url = url
                                        
                                        if uploaded_photo_url:
                                            logger.info(f"Photo ready for {first_name} {last_name}: {pattern} -> file_key: {uploaded_photo_url}")
                                            break
                                        else:
                                            logger.error(f"Failed to get valid file_key for {first_name} {last_name} after upload. Upload result: {upload_result}")
                                            warnings.append({
                                                'row': idx + 2,
                                                'type': 'photo_upload_failed',
                                                'message': f"Échec de l'upload de la photo pour {first_name} {last_name}. Le contact sera créé sans photo.",
                                                'data': {'contact': f"{first_name} {last_name}", 'pattern': pattern}
                                            })
                                    except Exception as e:
                                        logger.error(f"Failed to upload photo {pattern} for {first_name} {last_name}: {e}", exc_info=True)
                                        warnings.append({
                                            'row': idx + 2,
                                            'type': 'photo_upload_error',
                                            'message': f"Erreur lors de l'upload de la photo '{pattern}' pour {first_name} {last_name}: {str(e)}",
                                            'data': {'contact': f"{first_name} {last_name}", 'pattern': pattern, 'error': str(e)}
                                        })
                                        continue
                    
                        if uploaded_photo_url:
                            photo_url = uploaded_photo_url
                            logger.info(f"Photo successfully assigned to {first_name} {last_name}: {photo_url}")
                        else:
                            logger.warning(f"No photo uploaded for {first_name} {last_name} despite photos being available in ZIP")
            
                # Get position
                position = get_field_value(row_data, [
                'position', 'poste', 'job_title', 'job title', 'titre',
                'fonction', 'role', 'titre du poste'
                ])
            
                # Get circle
                circle = get_field_value(row_data, [
                'circle', 'cercle', 'network', 'réseau', 'reseau'
                ])
            
                # Get LinkedIn
                linkedin = get_field_value(row_data, [
                'linkedin', 'linkedin_url', 'linkedin url', 'profil linkedin'
                ])
            
                # Get email
                email = get_field_value(row_data, [
                'email', 'courriel', 'e-mail', 'mail', 'adresse email',
                'adresse courriel', 'email address'
                ])
            
                # Normalize email for matching
                email_lower = email.lower().strip() if email else None
                first_name_lower = first_name.lower().strip() if first_name else ''
                last_name_lower = last_name.lower().strip() if last_name else ''
            
                # Check if contact already exists (for reimport/update)
                existing_contact = None
                match_reason = None
                if email_lower and email_lower in contacts_by_email:
                    # Match by email (most reliable)
                    existing_contact = contacts_by_email[email_lower]
                    match_reason = f"email: {email_lower}"
                elif email_lower:
                    # Match by name + email
                    name_email_key = (first_name_lower, last_name_lower, email_lower)
                    if name_email_key in contacts_by_name_email:
                        existing_contact = contacts_by_name_email[name_email_key]
                        match_reason = f"name+email: {first_name} {last_name} + {email_lower}"
                elif company_id:
                    # Match by name + company_id (if no email)
                    name_company_key = (first_name_lower, last_name_lower, company_id)
                    if name_company_key in contacts_by_name_company:
                        existing_contact = contacts_by_name_company[name_company_key]
                        match_reason = f"name+company: {first_name} {last_name} + company_id:{company_id}"
                
                if existing_contact:
                    add_import_log(import_id, f"Ligne {idx + 2}: Contact existant trouvé ({match_reason}) - sera mis à jour", "info", {"row": idx + 2, "match_reason": match_reason, "existing_id": existing_contact.id})
            
                # Get phone
                phone = get_field_value(row_data, [
                    'phone', 'téléphone', 'telephone', 'tel', 'tél',
                    'phone_number', 'phone number', 'numéro de téléphone',
                    'numero de telephone', 'mobile', 'portable'
                ])
            
                # Get city and country - try direct fields first, then parse region
                city = get_field_value(row_data, [
                    'city', 'ville', 'cité', 'cite', 'localité', 'localite'
                ])
                country = get_field_value(row_data, [
                    'country', 'pays', 'nation', 'nationalité', 'nationalite'
                ])
            
                # If city or country not found, try to parse from region
                if not city or not country:
                    region = get_field_value(row_data, [
                        'region', 'région', 'zone', 'area', 'location', 'localisation'
                    ])
                    if region:
                        parsed_city, parsed_country = parse_region(region)
                        if parsed_city and not city:
                            city = parsed_city
                        if parsed_country and not country:
                            country = parsed_country
            
                # Get birthday
                birthday_raw = get_field_value(row_data, [
                    'birthday', 'anniversaire', 'date de naissance',
                    'date de naissance', 'birth_date', 'birth date', 'dob'
                ])
                birthday = None
                if birthday_raw:
                    try:
                        # Try to parse various date formats
                        try:
                            from dateutil import parser
                            birthday = parser.parse(str(birthday_raw)).date()
                        except ImportError:
                            # Fallback to datetime.strptime for common formats
                            date_str = str(birthday_raw).strip()
                            # Try common date formats
                            for fmt in ['%Y-%m-%d', '%d/%m/%Y', '%d-%m-%Y', '%Y/%m/%d', '%d.%m.%Y']:
                                try:
                                    birthday = dt.strptime(date_str, fmt).date()
                                    break
                                except ValueError:
                                    continue
                    except (ValueError, TypeError):
                        try:
                            # Try pandas datetime if available
                            import pandas as pd
                            if isinstance(birthday_raw, (pd.Timestamp,)):
                                birthday = birthday_raw.date()
                        except (ImportError, AttributeError, TypeError):
                            pass
            
                # Get language
                language = get_field_value(row_data, [
                    'language', 'langue', 'lang', 'idioma'
                ])
            
                # Get employee_id
                employee_id = None
                employee_id_raw = get_field_value(row_data, [
                    'employee_id', 'id_employé', 'id_employe', 'employé_id',
                    'employe_id', 'employee id', 'id employee', 'responsable_id',
                    'responsable id', 'assigned_to_id', 'assigned to id'
                ])
                if employee_id_raw:
                    try:
                        employee_id = int(float(str(employee_id_raw)))  # Handle float strings
                    except (ValueError, TypeError):
                        warnings.append({
                            'row': idx + 2,
                            'type': 'invalid_employee_id',
                            'message': f"ID employé invalide: '{employee_id_raw}'",
                        'data': {'employee_id_raw': employee_id_raw}
                    })
            
                # Validate required fields before creating contact
                if not first_name or not first_name.strip():
                    stats["skipped_missing_firstname"] += 1
                    error_msg = f"Ligne {idx + 2}: ⚠️ Prénom manquant - contact ignoré (first_name='{first_name}', last_name='{last_name}')"
                    add_import_log(import_id, error_msg, "warning", {"row": idx + 2, "contact": f"{first_name} {last_name}", "row_data_keys": list(row_data.keys())})
                    errors.append({
                        'row': idx + 2,
                        'data': row_data,
                        'error': 'Le prénom est obligatoire'
                    })
                    logger.warning(f"Row {idx + 2}: Skipping contact - missing first_name. Row keys: {list(row_data.keys())}")
                    continue
                
                if not last_name or not last_name.strip():
                    stats["skipped_missing_lastname"] += 1
                    error_msg = f"Ligne {idx + 2}: ⚠️ Nom manquant - contact ignoré (first_name='{first_name}', last_name='{last_name}')"
                    add_import_log(import_id, error_msg, "warning", {"row": idx + 2, "contact": f"{first_name} {last_name}", "row_data_keys": list(row_data.keys())})
                    errors.append({
                        'row': idx + 2,
                        'data': row_data,
                        'error': 'Le nom est obligatoire'
                    })
                    logger.warning(f"Row {idx + 2}: Skipping contact - missing last_name. Row keys: {list(row_data.keys())}")
                    continue
                
                # Get photo_filename for photo matching (from Excel column logo_filename, photo_filename, or nom_fichier_photo)
                logo_filename = get_field_value(row_data, ['logo_filename', 'photo_filename', 'nom_fichier_photo'])
                
                # Prepare contact data
                contact_data = ContactCreate(
                    first_name=first_name.strip(),
                    last_name=last_name.strip(),
                    company_id=company_id,
                    position=position,
                    circle=circle,
                    linkedin=linkedin,
                    photo_url=photo_url,  # Store file_key, not presigned URL
                    photo_filename=logo_filename,  # Store filename for photo matching (using logo_filename variable name from Excel)
                    email=email,
                    phone=phone,
                    city=city,
                    country=country,
                    birthday=birthday,
                    language=language,
                    employee_id=employee_id,
                )
            
                # Update existing contact or create new one
                if existing_contact:
                    # Update existing contact
                    update_data = contact_data.model_dump(exclude_none=True)
                    for field, value in update_data.items():
                        # Only update photo_url if a new photo was uploaded (photo_url is not None and not empty)
                        if field == 'photo_url':
                            if value:  # New photo provided
                                setattr(existing_contact, field, value)
                                # Also update photo_filename if photo_url is updated
                                if 'photo_filename' in update_data and update_data['photo_filename']:
                                    setattr(existing_contact, 'photo_filename', update_data['photo_filename'])
                                logger.info(f"Updated photo for contact {existing_contact.id}")
                            # If no new photo provided, keep existing photo (don't update field)
                        else:
                            # Update all other fields including photo_filename
                            setattr(existing_contact, field, value)
                    
                    contact = existing_contact
                    created_contacts.append(contact)  # Track as processed contact
                    stats["matched_existing"] += 1
                    add_import_log(import_id, f"Ligne {idx + 2}: Contact mis à jour - {first_name} {last_name} (ID: {existing_contact.id})", "info", {"row": idx + 2, "action": "updated", "contact_id": existing_contact.id})
                    logger.info(f"Updated existing contact: {first_name} {last_name} (ID: {existing_contact.id})")
                else:
                    # Create new contact
                    contact = Contact(**contact_data.model_dump(exclude_none=True))
                    db.add(contact)
                    created_contacts.append(contact)
                    stats["created_new"] += 1
                    add_import_log(import_id, f"Ligne {idx + 2}: Nouveau contact créé - {first_name} {last_name}", "info", {"row": idx + 2, "action": "created"})
                    logger.info(f"Created new contact: {first_name} {last_name}")
            
            except Exception as e:
                stats["errors"] += 1
                error_msg = f"Ligne {idx + 2}: ❌ Erreur lors de l'import - {str(e)}"
                add_import_log(import_id, error_msg, "error", {"row": idx + 2, "error": str(e), "row_data_keys": list(row_data.keys()) if isinstance(row_data, dict) else "not_a_dict"})
                errors.append({
                    'row': idx + 2,  # +2 because Excel is 1-indexed and has header
                    'data': row_data,
                    'error': str(e)
                })
                logger.error(f"Error importing contact row {idx + 2}: {str(e)}", exc_info=True)
                # Continue processing other rows even if one fails
                continue
        
        # Log completion of loop
        add_import_log(import_id, f"✅ Boucle de traitement terminée: {len(data_list)} ligne(s) dans la liste, {stats['total_processed']} ligne(s) réellement traitée(s)", "info", {"total_rows_in_list": len(data_list), "total_rows_processed": stats['total_processed'], "stats": stats.copy()})
        logger.info(f"Import loop completed: {len(data_list)} rows in list, {stats['total_processed']} rows actually processed, created_contacts={len(created_contacts)}, stats: {stats}")
        
        # Check if loop stopped prematurely
        if len(data_list) > stats['total_processed']:
            add_import_log(import_id, f"⚠️ ATTENTION: La boucle s'est arrêtée prématurément ! {len(data_list) - stats['total_processed']} ligne(s) n'ont pas été traitées.", "warning", {"expected": len(data_list), "processed": stats['total_processed'], "missing": len(data_list) - stats['total_processed']})
            logger.warning(f"Loop stopped prematurely: expected {len(data_list)} rows, but only processed {stats['total_processed']}")
        
        # Log final statistics
        add_import_log(import_id, f"📊 Statistiques du traitement: {stats['total_processed']} lignes traitées, {stats['created_new']} nouveaux contacts, {stats['matched_existing']} contacts mis à jour, {stats['skipped_missing_firstname']} sans prénom, {stats['skipped_missing_lastname']} sans nom, {stats['errors']} erreurs", "info", stats)
        
        # Track which contacts were updated vs created
        existing_contact_ids = {c.id for c in all_existing_contacts}
        updated_contacts = []
        new_contacts = []
        
        # Commit all contacts
        add_import_log(import_id, f"Sauvegarde de {len(created_contacts)} contact(s) dans la base de données...", "info")
        logger.info(f"DEBUG: About to commit {len(created_contacts)} contacts (total processed: {stats['total_processed']})")
        try:
            if created_contacts:
                logger.info(f"DEBUG: Committing {len(created_contacts)} contacts to database")
                await db.commit()
                logger.info(f"DEBUG: Successfully committed {len(created_contacts)} contacts")
                for contact in created_contacts:
                    await db.refresh(contact)
                    
                    # Categorize as updated or new
                    if contact.id in existing_contact_ids:
                        updated_contacts.append(contact)
                    else:
                        new_contacts.append(contact)
                    
                    # Note: Photo URLs will be regenerated during serialization via ContactSchema
                    # The contact.photo_url contains the file_key which is permanent
                
                add_import_log(import_id, f"Sauvegarde réussie: {len(new_contacts)} nouveau(x) contact(s), {len(updated_contacts)} contact(s) mis à jour", "success")
        except Exception as e:
            add_import_log(import_id, f"ERREUR lors de la sauvegarde: {str(e)}", "error")
            logger.error(f"Error committing contacts to database: {e}", exc_info=True)
            await db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error saving contacts to database: {str(e)}"
            )
        
        # Merge warnings from import service with our company matching warnings
        all_warnings = (result.get('warnings') or []) + warnings
        
        try:
            # Regenerate presigned URLs for all contacts before serialization
            serialized_contacts = []
            for contact in created_contacts:
                # Create a copy of contact data with regenerated photo URL
                contact_dict = {
                    "id": contact.id,
                    "first_name": contact.first_name,
                    "last_name": contact.last_name,
                    "company_id": contact.company_id,
                    "company_name": contact.company.name if contact.company else None,
                    "position": contact.position,
                    "circle": contact.circle,
                    "linkedin": contact.linkedin,
                    "photo_url": regenerate_photo_url(contact.photo_url, contact.id),
                    "photo_filename": getattr(contact, 'photo_filename', None),
                    "email": contact.email,
                    "phone": contact.phone,
                    "city": contact.city,
                    "country": contact.country,
                    "birthday": contact.birthday.isoformat() if contact.birthday else None,
                    "language": contact.language,
                    "employee_id": contact.employee_id,
                    "employee_name": f"{contact.employee.first_name} {contact.employee.last_name}" if contact.employee else None,
                    "created_at": contact.created_at,
                    "updated_at": contact.updated_at,
                }
                serialized_contacts.append(ContactSchema(**contact_dict))
            
            # Final summary
            total_valid = len(created_contacts)
            total_errors = len(errors) + result.get('invalid_rows', 0)
            photos_count = len(photos_dict) if photos_dict else 0
            
            add_import_log(import_id, f"✅ Import terminé: {total_valid} contact(s) importé(s), {total_errors} erreur(s)", "success", {
                "total_valid": total_valid,
                "total_errors": total_errors,
                "new_contacts": len(new_contacts),
                "updated_contacts": len(updated_contacts),
                "photos_uploaded": photos_count
            })
            update_import_status(import_id, "completed", progress=total_rows, total=total_rows)
            
            return {
                'total_rows': result.get('total_rows', 0),
                'valid_rows': len(created_contacts),
                'created_rows': len(new_contacts),
                'updated_rows': len(updated_contacts),
                'invalid_rows': len(errors) + result.get('invalid_rows', 0),
                'errors': errors + (result.get('errors') or []),
                'warnings': all_warnings,
                'photos_uploaded': len(photos_dict) if photos_dict else 0,
                'data': serialized_contacts,
                'import_id': import_id  # Return import_id for log tracking
            }
        except Exception as e:
            add_import_log(import_id, f"ERREUR lors de la sérialisation: {str(e)}", "error")
            update_import_status(import_id, "failed")
            logger.error(f"Error serializing response: {e}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error processing import results: {str(e)}"
            )
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        if import_id:
            update_import_status(import_id, "failed")
        raise
    except Exception as e:
        # Catch any other unexpected errors that weren't caught above
        if import_id:
            add_import_log(import_id, f"ERREUR inattendue: {str(e)}", "error")
            update_import_status(import_id, "failed")
        logger.error(f"Unexpected error in import_contacts: {e}", exc_info=True)
        try:
            await db.rollback()
        except Exception:
            pass  # Ignore rollback errors
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred during import: {str(e)}"
        )


@router.get("/export")
async def export_contacts(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Export contacts to Excel file
    
    Args:
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        Excel file with contacts data
    """
    try:
        # Get all contacts
        result = await db.execute(
            select(Contact)
            .options(
                selectinload(Contact.company),
                selectinload(Contact.employee)
            )
            .order_by(Contact.created_at.desc())
        )
        contacts = result.scalars().all()
        
        # Convert to dict format for export
        export_data = []
        for contact in contacts:
            try:
                # Safely handle all fields that might be None
                employee_name = ''
                if contact.employee:
                    first_name = contact.employee.first_name or ''
                    last_name = contact.employee.last_name or ''
                    employee_name = f"{first_name} {last_name}".strip()
                
                birthday_str = ''
                if contact.birthday:
                    try:
                        birthday_str = contact.birthday.isoformat()
                    except Exception:
                        birthday_str = str(contact.birthday)
                
                export_data.append({
                    'Prénom': contact.first_name or '',
                    'Nom': contact.last_name or '',
                    'Entreprise': contact.company.name if contact.company and contact.company.name else '',
                    'Poste': contact.position or '',
                    'Cercle': contact.circle or '',
                    'LinkedIn': contact.linkedin or '',
                    'Photo URL': contact.photo_url or '',
                    'Courriel': contact.email or '',
                    'Téléphone': contact.phone or '',
                    'Ville': contact.city or '',
                    'Pays': contact.country or '',
                    'Anniversaire': birthday_str,
                    'Langue': contact.language or '',
                    'Employé': employee_name,
                })
            except Exception as e:
                logger.error(f"Error processing contact {contact.id} for export: {e}")
                # Continue with other contacts even if one fails
                continue
        
        # Handle empty data case
        if not export_data:
            # Return empty Excel file with headers
            export_data = [{
                'Prénom': '',
                'Nom': '',
                'Entreprise': '',
                'Poste': '',
                'Cercle': '',
                'LinkedIn': '',
                'Photo URL': '',
                'Courriel': '',
                'Téléphone': '',
                'Ville': '',
                'Pays': '',
                'Anniversaire': '',
                'Langue': '',
                'Employé': '',
            }]
        
        # Export to Excel
        from datetime import datetime
        buffer, filename = ExportService.export_to_excel(
            data=export_data,
            filename=f"contacts_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
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
