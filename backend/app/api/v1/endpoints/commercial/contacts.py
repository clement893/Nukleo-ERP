"""
Commercial Contacts Endpoints
API endpoints for managing commercial contacts
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from sqlalchemy.orm import selectinload
import zipfile
import os
import unicodedata
from io import BytesIO
from datetime import datetime as dt

from app.core.database import get_db
from app.dependencies import get_current_user
from app.models.contact import Contact
from app.models.company import Company
from app.models.user import User
from app.schemas.contact import ContactCreate, ContactUpdate, Contact as ContactSchema
from app.services.import_service import ImportService
from app.services.export_service import ExportService
from app.services.s3_service import S3Service
from app.core.logging import logger

router = APIRouter(prefix="/commercial/contacts", tags=["commercial-contacts"])


@router.get("/", response_model=List[ContactSchema])
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
    
    result = await db.execute(query)
    contacts = result.scalars().all()
    
    # Convert to response format with company and employee names
    contact_list = []
    s3_service = S3Service() if S3Service.is_configured() else None
    
    for contact in contacts:
        # Regenerate presigned URL for photo if it exists and S3 is configured
        photo_url = contact.photo_url
        if photo_url and s3_service:
            try:
                # Try to extract file_key from presigned URL or use photo_url as file_key
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
                
                # Regenerate presigned URL if we have a file_key
                if file_key:
                    photo_url = s3_service.generate_presigned_url(file_key, expiration=604800)  # 7 days (AWS S3 maximum)
            except Exception as e:
                logger.warning(f"Failed to regenerate presigned URL for contact {contact.id}: {e}")
                # Keep original URL if regeneration fails
                pass
        
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
    result = await db.execute(
        select(Contact)
        .options(
            selectinload(Contact.company),
            selectinload(Contact.employee)
        )
        .where(Contact.id == contact_id)
    )
    contact = result.scalar_one_or_none()
    
    if not contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contact not found"
        )
    
    # Regenerate presigned URL for photo if it exists and S3 is configured
    photo_url = contact.photo_url
    if photo_url and S3Service.is_configured():
        try:
            s3_service = S3Service()
            # Try to extract file_key from presigned URL or use photo_url as file_key
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
            
            # Regenerate presigned URL if we have a file_key
            if file_key:
                photo_url = s3_service.generate_presigned_url(file_key, expiration=604800)  # 7 days (AWS S3 maximum)
        except Exception as e:
            logger.warning(f"Failed to regenerate presigned URL for contact {contact.id}: {e}")
            # Keep original URL if regeneration fails
            pass
    
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
    # Validate company exists if provided
    if contact_data.company_id:
        company_result = await db.execute(
            select(Company).where(Company.id == contact_data.company_id)
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
    
    contact = Contact(
        first_name=contact_data.first_name,
        last_name=contact_data.last_name,
        company_id=contact_data.company_id,
        position=contact_data.position,
        circle=contact_data.circle,
        linkedin=contact_data.linkedin,
        photo_url=contact_data.photo_url,
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
    
    # Regenerate presigned URL for photo if it exists and S3 is configured
    photo_url = contact.photo_url
    if photo_url and S3Service.is_configured():
        try:
            s3_service = S3Service()
            # Try to extract file_key from presigned URL or use photo_url as file_key
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
            
            # Regenerate presigned URL if we have a file_key
            if file_key:
                photo_url = s3_service.generate_presigned_url(file_key, expiration=604800)  # 7 days (AWS S3 maximum)
        except Exception as e:
            logger.warning(f"Failed to regenerate presigned URL for contact {contact.id}: {e}")
            # Keep original URL if regeneration fails
            pass
    
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
    
    # Validate company exists if provided
    if contact_data.company_id is not None:
        company_result = await db.execute(
            select(Company).where(Company.id == contact_data.company_id)
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
    
    # Update fields
    update_data = contact_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(contact, field, value)
    
    await db.commit()
    await db.refresh(contact)
    await db.refresh(contact, ["company", "employee"])
    
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
        "photo_url": contact.photo_url,
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


@router.post("/import")
async def import_contacts(
    file: UploadFile = File(...),
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
    try:
        # Read file content
        file_content = await file.read()
        filename = file.filename or ""
        file_ext = os.path.splitext(filename.lower())[1]
        
        # Dictionary to store photos from ZIP (filename -> file content)
        photos_dict = {}
        excel_content = None
        
        # Check if it's a ZIP file
        if file_ext == '.zip':
            try:
                with zipfile.ZipFile(BytesIO(file_content), 'r') as zip_ref:
                    # Extract Excel file and photos
                    for file_info in zip_ref.namelist():
                        file_name_lower = file_info.lower()
                        
                        # Find Excel file
                        if file_name_lower.endswith(('.xlsx', '.xls')):
                            if excel_content is None:
                                excel_content = zip_ref.read(file_info)
                            else:
                                logger.warning(f"Multiple Excel files found in ZIP, using first: {file_info}")
                        
                        # Find photos (in photos/ folder or root)
                        elif file_name_lower.endswith(('.jpg', '.jpeg', '.png', '.gif', '.webp')):
                            photo_content = zip_ref.read(file_info)
                            # Store with normalized filename (lowercase, no path)
                            photo_filename = os.path.basename(file_info).lower()
                            photos_dict[photo_filename] = photo_content
                
                if excel_content is None:
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
        
        # Load all companies once to create a name -> ID mapping (case-insensitive)
        try:
            companies_result = await db.execute(select(Company))
            all_companies = companies_result.scalars().all()
            # Create a case-insensitive mapping: company_name_lower -> company_id
            company_name_to_id = {}
            for company in all_companies:
                if company.name:
                    company_name_to_id[company.name.lower().strip()] = company.id
        except Exception as e:
            logger.error(f"Error loading companies: {e}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error loading companies from database"
            )
        
        # Load all existing contacts once to check for duplicates
        try:
            contacts_result = await db.execute(select(Contact))
            all_existing_contacts = contacts_result.scalars().all()
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
        s3_service = S3Service() if S3Service.is_configured() else None
        
        for idx, row_data in enumerate(result['data']):
            try:
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
                if not photo_url and photos_dict and s3_service:
                # Try multiple naming patterns
                photo_filename_patterns = [
                    f"{first_name.lower()}_{last_name.lower()}.jpg",
                    f"{first_name.lower()}_{last_name.lower()}.jpeg",
                    f"{first_name.lower()}_{last_name.lower()}.png",
                    f"{first_name}_{last_name}.jpg",
                    f"{first_name}_{last_name}.jpeg",
                    f"{first_name}_{last_name}.png",
                    row_data.get('photo_filename') or row_data.get('nom_fichier_photo'),
                ]
                
                uploaded_photo_url = None
                for pattern in photo_filename_patterns:
                    if pattern and pattern.lower() in photos_dict:
                        try:
                            # Upload photo to S3
                            photo_content = photos_dict[pattern.lower()]
                            
                            # Create a temporary UploadFile-like object compatible with S3Service
                            class TempUploadFile:
                                def __init__(self, filename: str, content: bytes):
                                    self.filename = filename
                                    self.content = content
                                    self.content_type = 'image/jpeg' if filename.lower().endswith(('.jpg', '.jpeg')) else ('image/png' if filename.lower().endswith('.png') else 'image/webp')
                                    # Create a file-like object
                                    self.file = BytesIO(content)
                            
                            temp_file = TempUploadFile(pattern, photo_content)
                            
                            # Upload to S3
                            upload_result = s3_service.upload_file(
                                file=temp_file,
                                folder='contacts/photos',
                                user_id=str(current_user.id)
                            )
                            
                            # Always store the file_key (not the presigned URL) for persistence
                            # Presigned URLs expire, but file_key is permanent
                            uploaded_photo_url = upload_result.get('file_key')
                            if not uploaded_photo_url:
                                # Fallback to URL if file_key not available, but extract key from URL
                                url = upload_result.get('url', '')
                                if url and 'contacts/photos' in url:
                                    # Extract file_key from URL
                                    from urllib.parse import urlparse
                                    parsed = urlparse(url)
                                    path = parsed.path.strip('/')
                                    if 'contacts/photos' in path:
                                        idx = path.find('contacts/photos')
                                        uploaded_photo_url = path[idx:]
                                    else:
                                        uploaded_photo_url = url
                                else:
                                    uploaded_photo_url = url
                            
                            logger.info(f"Uploaded photo for {first_name} {last_name}: {pattern} -> {uploaded_photo_url}")
                            break
                        except Exception as e:
                            logger.warning(f"Failed to upload photo {pattern}: {e}")
                            continue
                
                if uploaded_photo_url:
                    photo_url = uploaded_photo_url
            
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
                if email_lower and email_lower in contacts_by_email:
                # Match by email (most reliable)
                existing_contact = contacts_by_email[email_lower]
                elif email_lower:
                # Match by name + email
                name_email_key = (first_name_lower, last_name_lower, email_lower)
                if name_email_key in contacts_by_name_email:
                    existing_contact = contacts_by_name_email[name_email_key]
                elif company_id:
                # Match by name + company_id (if no email)
                name_company_key = (first_name_lower, last_name_lower, company_id)
                if name_company_key in contacts_by_name_company:
                    existing_contact = contacts_by_name_company[name_company_key]
            
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
            
                # Prepare contact data
                contact_data = ContactCreate(
                first_name=first_name,
                last_name=last_name,
                company_id=company_id,
                position=position,
                circle=circle,
                linkedin=linkedin,
                photo_url=photo_url,  # Store file_key, not presigned URL
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
                            logger.info(f"Updated photo for contact {existing_contact.id}")
                        # If no new photo provided, keep existing photo (don't update field)
                    else:
                        # Update all other fields
                        setattr(existing_contact, field, value)
                
                contact = existing_contact
                created_contacts.append(contact)  # Track as processed contact
                logger.info(f"Updated existing contact: {first_name} {last_name} (ID: {existing_contact.id})")
                else:
                # Create new contact
                contact = Contact(**contact_data.model_dump(exclude_none=True))
                db.add(contact)
                created_contacts.append(contact)
                logger.info(f"Created new contact: {first_name} {last_name}")
            
        except Exception as e:
            errors.append({
                'row': idx + 2,  # +2 because Excel is 1-indexed and has header
                'data': row_data,
                'error': str(e)
            })
            logger.error(f"Error importing contact row {idx + 2}: {str(e)}")
        
        # Track which contacts were updated vs created
        existing_contact_ids = {c.id for c in all_existing_contacts}
        updated_contacts = []
        new_contacts = []
        
        # Commit all contacts
        try:
            if created_contacts:
                await db.commit()
                for contact in created_contacts:
                    await db.refresh(contact)
                    
                    # Categorize as updated or new
                    if contact.id in existing_contact_ids:
                        updated_contacts.append(contact)
                    else:
                        new_contacts.append(contact)
                    
                    # Regenerate presigned URL for photo if it exists and S3 is configured
                    # This ensures photos are accessible even after import
                    if contact.photo_url and s3_service:
                        try:
                            # Extract file_key from photo_url (it should be a file_key, not a presigned URL)
                            file_key = contact.photo_url
                            
                            # If it's already a presigned URL, try to extract file_key
                            if file_key.startswith('http'):
                                from urllib.parse import urlparse
                                parsed = urlparse(file_key)
                                path = parsed.path.strip('/')
                                if 'contacts/photos' in path:
                                    idx = path.find('contacts/photos')
                                    file_key = path[idx:]
                                else:
                                    # Keep original if we can't extract
                                    continue
                            
                            # Generate presigned URL for display (but keep file_key in DB)
                            presigned_url = s3_service.generate_presigned_url(file_key, expiration=3600 * 24 * 7)  # 7 days
                            if presigned_url:
                                # Temporarily set presigned URL for response (but don't save it to DB)
                                # The DB still has the file_key, which is permanent
                                contact.photo_url = presigned_url
                                logger.info(f"Generated presigned URL for contact {contact.id}")
                        except Exception as e:
                            logger.warning(f"Failed to generate presigned URL for contact {contact.id}: {e}")
                            # Keep original file_key if presigned URL generation fails
        except Exception as e:
            logger.error(f"Error committing contacts to database: {e}", exc_info=True)
            await db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error saving contacts to database: {str(e)}"
            )
        
        # Merge warnings from import service with our company matching warnings
        all_warnings = (result.get('warnings') or []) + warnings
        
        try:
            return {
                'total_rows': result.get('total_rows', 0),
                'valid_rows': len(created_contacts),
                'created_rows': len(new_contacts),
                'updated_rows': len(updated_contacts),
                'invalid_rows': len(errors) + result.get('invalid_rows', 0),
                'errors': errors + (result.get('errors') or []),
                'warnings': all_warnings,
                'photos_uploaded': len(photos_dict) if photos_dict else 0,
                'data': [ContactSchema.model_validate(c) for c in created_contacts]
            }
        except Exception as e:
            logger.error(f"Error serializing response: {e}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error processing import results: {str(e)}"
            )
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        # Catch any other unexpected errors that weren't caught above
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
