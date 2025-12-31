"""
Clients API Endpoints
API endpoints for managing clients
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
import logging

from app.core.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.client import Client, ClientStatus
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
    Get list of clients
    """
    logger.info(f"[ClientsAPI] List clients - skip={skip}, limit={limit}, status={status}, search={search}, type={type}")
    
    # Build query - filter by user_id
    query = select(Client).where(Client.user_id == current_user.id)
    
    # Filter by type (default to company)
    if type:
        query = query.where(Client.type == type.lower())
    else:
        # Default: only companies
        query = query.where(Client.type == 'company')

    # Filter by status
    if status:
        try:
            status_enum = ClientStatus(status.upper())
            query = query.where(Client.status == status_enum)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Invalid status value: {status}"
            )

    # Search filter
    if search:
        search_term = f"%{search.lower()}%"
        query = query.where(
            func.lower(Client.company_name).like(search_term) |
            func.lower(Client.first_name).like(search_term) |
            func.lower(Client.last_name).like(search_term) |
            func.lower(func.concat(Client.first_name, ' ', Client.last_name)).like(search_term)
        )

    query = query.order_by(Client.created_at.desc()).offset(skip).limit(limit)
    
    try:
        result = await db.execute(query)
        clients_list = result.scalars().all()
        logger.info(f"[ClientsAPI] Found {len(clients_list)} clients")
        
        # The validator in ClientSchema will handle empty strings
        return [ClientSchema.model_validate(client) for client in clients_list]
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
    query = select(Client).where(
        Client.id == client_id,
        Client.user_id == current_user.id
    )
    result = await db.execute(query)
    client = result.scalar_one_or_none()

    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Client with ID {client_id} not found"
        )

    # The validator in ClientSchema will handle empty strings
    return ClientSchema.model_validate(client)


@router.post("/", response_model=ClientSchema, status_code=status.HTTP_201_CREATED)
async def create_client(
    client_data: ClientCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ClientSchema:
    """
    Create a new client
    """
    client_dict = client_data.model_dump()
    client_dict["user_id"] = current_user.id
    
    # Default type to company if not specified
    if "type" not in client_dict or not client_dict["type"]:
        client_dict["type"] = "company"
    
    client = Client(**client_dict)
    db.add(client)
    await db.commit()
    await db.refresh(client)

    # The validator in ClientSchema will handle empty strings
    return ClientSchema.model_validate(client)


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
    query = select(Client).where(
        Client.id == client_id,
        Client.user_id == current_user.id
    )
    result = await db.execute(query)
    client = result.scalar_one_or_none()

    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Client with ID {client_id} not found"
        )

    # Update fields
    update_data = client_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(client, key, value)

    await db.commit()
    await db.refresh(client)

    # The validator in ClientSchema will handle empty strings
    return ClientSchema.model_validate(client)


@router.delete("/{client_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_client(
    client_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Delete a client
    """
    query = select(Client).where(
        Client.id == client_id,
        Client.user_id == current_user.id
    )
    result = await db.execute(query)
    client = result.scalar_one_or_none()

    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Client with ID {client_id} not found"
        )

    await db.delete(client)
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
