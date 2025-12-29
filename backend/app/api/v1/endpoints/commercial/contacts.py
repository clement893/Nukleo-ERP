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
    Import contacts from Excel file
    
    Args:
        file: Excel file with contacts data
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        Import results with data, errors, and warnings
    """
    # Read file content
    file_content = await file.read()
    
    # Import from Excel
    result = ImportService.import_from_excel(
        file_content=file_content,
        has_headers=True
    )
    
    # Process imported data
    created_contacts = []
    errors = []
    
    for idx, row_data in enumerate(result['data']):
        try:
            # Map Excel columns to Contact fields
            contact_data = ContactCreate(
                first_name=row_data.get('first_name') or row_data.get('prénom') or '',
                last_name=row_data.get('last_name') or row_data.get('nom') or '',
                company_id=row_data.get('company_id') or None,
                position=row_data.get('position') or row_data.get('poste') or None,
                circle=row_data.get('circle') or row_data.get('cercle') or None,
                linkedin=row_data.get('linkedin') or None,
                photo_url=row_data.get('photo_url') or row_data.get('photo') or None,
                email=row_data.get('email') or row_data.get('courriel') or None,
                phone=row_data.get('phone') or row_data.get('téléphone') or row_data.get('telephone') or None,
                city=row_data.get('city') or row_data.get('ville') or None,
                country=row_data.get('country') or row_data.get('pays') or None,
                birthday=row_data.get('birthday') or row_data.get('anniversaire') or None,
                language=row_data.get('language') or row_data.get('langue') or None,
                employee_id=row_data.get('employee_id') or None,
            )
            
            # Create contact
            contact = Contact(**contact_data.model_dump(exclude_none=True))
            db.add(contact)
            created_contacts.append(contact)
            
        except Exception as e:
            errors.append({
                'row': idx + 2,  # +2 because Excel is 1-indexed and has header
                'data': row_data,
                'error': str(e)
            })
            logger.error(f"Error importing contact row {idx + 2}: {str(e)}")
    
    # Commit all contacts
    if created_contacts:
        await db.commit()
        for contact in created_contacts:
            await db.refresh(contact)
    
    return {
        'total_rows': result['total_rows'],
        'valid_rows': len(created_contacts),
        'invalid_rows': len(errors) + result['invalid_rows'],
        'errors': errors + result['errors'],
        'warnings': result['warnings'],
        'data': [ContactSchema.model_validate(c) for c in created_contacts]
    }


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
        export_data.append({
            'Prénom': contact.first_name,
            'Nom': contact.last_name,
            'Entreprise': contact.company.name if contact.company else '',
            'Poste': contact.position or '',
            'Cercle': contact.circle or '',
            'LinkedIn': contact.linkedin or '',
            'Photo URL': contact.photo_url or '',
            'Courriel': contact.email or '',
            'Téléphone': contact.phone or '',
            'Ville': contact.city or '',
            'Pays': contact.country or '',
            'Anniversaire': contact.birthday.isoformat() if contact.birthday else '',
            'Langue': contact.language or '',
            'Employé': f"{contact.employee.first_name} {contact.employee.last_name}" if contact.employee else '',
        })
    
    # Export to Excel
    from datetime import datetime
    buffer, filename = ExportService.export_to_excel(
        data=export_data,
        filename=f"contacts_export_{datetime.now().strftime('%Y%m%d')}.xlsx" if contacts else "contacts_export.xlsx"
    )
    
    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
