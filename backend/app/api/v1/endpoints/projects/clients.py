"""
Clients API Endpoints
API endpoints for managing clients (using People model with type='company')
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
import logging

from app.core.database import get_db
from app.core.cache_enhanced import cache_query
from app.dependencies import get_current_user
from app.models.user import User
from app.models.people import People, PeopleStatus, PeopleType
from app.models.project import Project
from app.schemas.client import ClientCreate, ClientUpdate, Client as ClientSchema

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/clients", tags=["clients"])


@router.get("", response_model=List[ClientSchema])
async def list_clients(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(1000, ge=1, le=10000, description="Maximum number of records"),
    status: Optional[str] = Query(None, description="Filter by status"),
    search: Optional[str] = Query(None, description="Search term"),
    type: Optional[str] = Query(None, description="Filter by type (person/company)"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[ClientSchema]:
    """
    Get list of clients (people with type='company' by default)
    """
    logger.info(f"[ClientsAPI] List clients - skip={skip}, limit={limit}, status={status}, search={search}, type={type}")
    
    # Build query for People with type='company' by default
    query = select(People).where(People.user_id == current_user.id)
    
    # Filter by type (default to company)
    if type:
        try:
            people_type = PeopleType(type.lower())
            query = query.where(People.type == people_type)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Invalid type value: {type}. Must be 'person' or 'company'"
            )
    else:
        # Default: only companies
        query = query.where(People.type == PeopleType.COMPANY)

    # Filter by status
    if status:
        try:
            status_enum = PeopleStatus(status.upper())
            query = query.where(People.status == status_enum)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Invalid status value: {status}"
            )

    # Search filter
    if search:
        search_term = f"%{search.lower()}%"
        query = query.where(
            func.lower(People.company_name).like(search_term) |
            func.lower(People.first_name).like(search_term) |
            func.lower(People.last_name).like(search_term) |
            func.lower(func.concat(People.first_name, ' ', People.last_name)).like(search_term)
        )

    query = query.order_by(People.created_at.desc()).offset(skip).limit(limit)
    
    try:
        result = await db.execute(query)
        people_list = result.scalars().all()
        logger.info(f"[ClientsAPI] Found {len(people_list)} clients")
        
        # Convert People to ClientSchema
        clients = []
        for person in people_list:
            client_dict = {
                "id": person.id,
                "first_name": person.first_name or "",
                "last_name": person.last_name or "",
                "company_name": person.company_name,
                "type": person.type.value,
                "email": person.email,
                "phone": person.phone,
                "linkedin": person.linkedin,
                "photo_url": person.photo_url,
                "photo_filename": person.photo_filename,
                "birthday": person.birthday.isoformat() if person.birthday else None,
                "city": person.city,
                "country": person.country,
                "notes": person.notes,
                "comments": person.comments,
                "portal_url": person.portal_url,
                "status": person.status.value.upper(),
                "user_id": person.user_id,
                "created_at": person.created_at.isoformat(),
                "updated_at": person.updated_at.isoformat(),
            }
            clients.append(ClientSchema(**client_dict))
        
        return clients
    except Exception as e:
        logger.error(f"[ClientsAPI] Error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )


@router.get("/{client_id}", response_model=ClientSchema)
async def get_client(
    client_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ClientSchema:
    """
    Get a client by ID
    """
    query = select(People).where(
        People.id == client_id,
        People.user_id == current_user.id,
        People.type == PeopleType.COMPANY
    )
    result = await db.execute(query)
    person = result.scalar_one_or_none()

    if not person:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Client with ID {client_id} not found"
        )

    client_dict = {
        "id": person.id,
        "first_name": person.first_name or "",
        "last_name": person.last_name or "",
        "company_name": person.company_name,
        "type": person.type.value,
        "email": person.email,
        "phone": person.phone,
        "linkedin": person.linkedin,
        "photo_url": person.photo_url,
        "photo_filename": person.photo_filename,
        "birthday": person.birthday.isoformat() if person.birthday else None,
        "city": person.city,
        "country": person.country,
        "notes": person.notes,
        "comments": person.comments,
        "portal_url": person.portal_url,
        "status": person.status.value.upper(),
        "user_id": person.user_id,
        "created_at": person.created_at.isoformat(),
        "updated_at": person.updated_at.isoformat(),
    }
    
    return ClientSchema(**client_dict)


@router.post("/", response_model=ClientSchema, status_code=status.HTTP_201_CREATED)
async def create_client(
    client_data: ClientCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ClientSchema:
    """
    Create a new client
    """
    person_data = client_data.model_dump()
    person_data["user_id"] = current_user.id
    person_data["type"] = PeopleType.COMPANY  # Force type to company
    
    person = People(**person_data)
    db.add(person)
    await db.commit()
    await db.refresh(person)

    client_dict = {
        "id": person.id,
        "first_name": person.first_name or "",
        "last_name": person.last_name or "",
        "company_name": person.company_name,
        "type": person.type.value,
        "email": person.email,
        "phone": person.phone,
        "linkedin": person.linkedin,
        "photo_url": person.photo_url,
        "photo_filename": person.photo_filename,
        "birthday": person.birthday.isoformat() if person.birthday else None,
        "city": person.city,
        "country": person.country,
        "notes": person.notes,
        "comments": person.comments,
        "portal_url": person.portal_url,
        "status": person.status.value.upper(),
        "user_id": person.user_id,
        "created_at": person.created_at.isoformat(),
        "updated_at": person.updated_at.isoformat(),
    }
    
    return ClientSchema(**client_dict)


@router.put("/{client_id}", response_model=ClientSchema)
async def update_client(
    client_id: int,
    client_data: ClientUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ClientSchema:
    """
    Update a client
    """
    query = select(People).where(
        People.id == client_id,
        People.user_id == current_user.id,
        People.type == PeopleType.COMPANY
    )
    result = await db.execute(query)
    person = result.scalar_one_or_none()

    if not person:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Client with ID {client_id} not found"
        )

    # Update fields
    update_data = client_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(person, key, value)

    await db.commit()
    await db.refresh(person)

    client_dict = {
        "id": person.id,
        "first_name": person.first_name or "",
        "last_name": person.last_name or "",
        "company_name": person.company_name,
        "type": person.type.value,
        "email": person.email,
        "phone": person.phone,
        "linkedin": person.linkedin,
        "photo_url": person.photo_url,
        "photo_filename": person.photo_filename,
        "birthday": person.birthday.isoformat() if person.birthday else None,
        "city": person.city,
        "country": person.country,
        "notes": person.notes,
        "comments": person.comments,
        "portal_url": person.portal_url,
        "status": person.status.value.upper(),
        "user_id": person.user_id,
        "created_at": person.created_at.isoformat(),
        "updated_at": person.updated_at.isoformat(),
    }
    
    return ClientSchema(**client_dict)


@router.delete("/{client_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_client(
    client_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Delete a client
    """
    query = select(People).where(
        People.id == client_id,
        People.user_id == current_user.id,
        People.type == PeopleType.COMPANY
    )
    result = await db.execute(query)
    person = result.scalar_one_or_none()

    if not person:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Client with ID {client_id} not found"
        )

    await db.delete(person)
    await db.commit()


@router.get("/{client_id}/projects", response_model=List[dict])
async def get_client_projects(
    client_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[dict]:
    """
    Get all projects for a client
    """
    query = select(Project).where(Project.client_id == client_id)
    result = await db.execute(query)
    projects = result.scalars().all()

    return [
        {
            "id": p.id,
            "name": p.name,
            "description": p.description,
            "status": p.status.value if hasattr(p.status, 'value') else p.status,
            "client_id": p.client_id,
            "etape": p.etape,
            "annee_realisation": p.annee_realisation,
            "budget": float(p.budget) if p.budget else None,
            "created_at": p.created_at.isoformat(),
            "updated_at": p.updated_at.isoformat(),
        }
        for p in projects
    ]


@router.get("/{client_id}/contacts", response_model=List[dict])
async def get_client_contacts(
    client_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[dict]:
    """
    Get contacts linked to a client
    """
    # TODO: Implement contact linking logic
    return []
