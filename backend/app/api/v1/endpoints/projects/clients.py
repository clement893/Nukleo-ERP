"""
Clients API Endpoints
API endpoints for managing clients
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
from app.models.client import Client, ClientStatus
from app.models.project import Project
from app.models.contact import Contact
from app.schemas.client import ClientCreate, ClientUpdate, Client as ClientSchema

logger = logging.getLogger(__name__)
router = APIRouter(prefix="", tags=["clients"])  # Prefix will be /clients when included in projects router


@router.get("/test", response_model=List[ClientSchema])
async def list_clients_test(
    request: Request,
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=1000, description="Maximum number of records"),
) -> List[ClientSchema]:
    """
    TEST endpoint without dependencies to isolate validation issue
    """
    logger.info(f"[ClientsAPI] ========================================")
    logger.info(f"[ClientsAPI] ✅ TEST ENDPOINT REACHED")
    logger.info(f"[ClientsAPI] URL: {request.url}")
    logger.info(f"[ClientsAPI] Query params (raw): {dict(request.query_params)}")
    logger.info(f"[ClientsAPI] Parsed skip: {skip} (type: {type(skip).__name__})")
    logger.info(f"[ClientsAPI] Parsed limit: {limit} (type: {type(limit).__name__})")
    logger.info(f"[ClientsAPI] ========================================")
    return []


@router.get("/", response_model=List[ClientSchema])
# Temporarily removed @cache_query to debug validation issue
async def list_clients(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=1000, description="Maximum number of records"),
    status: Optional[str] = Query(None, description="Filter by status"),
    search: Optional[str] = Query(None, description="Search term"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[ClientSchema]:
    """
    Get list of clients
    """
    # Parse status parameter
    status_filter = status
    
    # Log that we've reached the endpoint with detailed information
    logger.info(f"[ClientsAPI] ========================================")
    logger.info(f"[ClientsAPI] ✅ ENDPOINT REACHED")
    logger.info(f"[ClientsAPI] Parsed skip: {skip} (type: {type(skip).__name__})")
    logger.info(f"[ClientsAPI] Parsed limit: {limit} (type: {type(limit).__name__})")
    logger.info(f"[ClientsAPI] Status: {status_filter}")
    logger.info(f"[ClientsAPI] Search: {search}")
    logger.info(f"[ClientsAPI] ========================================")
    
    query = select(Client)

    # Parse status
    parsed_status: Optional[ClientStatus] = None
    if status_filter:
        try:
            parsed_status = ClientStatus(status_filter.lower())
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Invalid status value: {status_filter}. Must be one of {', '.join([s.value for s in ClientStatus])}"
            )

    if parsed_status:
        query = query.where(Client.status == parsed_status)
    if search:
        search_term = f"%{search.lower()}%"
        query = query.where(
            func.lower(Client.first_name).like(search_term) |
            func.lower(Client.last_name).like(search_term) |
            func.lower(func.concat(Client.first_name, ' ', Client.last_name)).like(search_term)
        )

    query = query.order_by(Client.created_at.desc()).offset(skip).limit(limit)
    
    logger.info(f"[ClientsAPI] Executing query with offset={skip}, limit={limit}")
    
    try:
        result = await db.execute(query)
        clients_list = result.scalars().all()
        logger.info(f"[ClientsAPI] Query successful, returned {len(clients_list)} clients")
        
        return [ClientSchema.model_validate(client) for client in clients_list]
    except Exception as e:
        logger.error(f"[ClientsAPI] Error executing query: {e}", exc_info=True)
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
    query = select(Client).where(Client.id == client_id)
    result = await db.execute(query)
    client = result.scalar_one_or_none()

    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Client with ID {client_id} not found"
        )

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
    client = Client(**client_data.model_dump())
    db.add(client)
    await db.commit()
    await db.refresh(client)

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
    query = select(Client).where(Client.id == client_id)
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
    query = select(Client).where(Client.id == client_id)
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
    Get active projects for a client (where client is connected)
    """
    query = select(Project).where(
        Project.client_id == client_id,
        Project.status == "active"
    )
    result = await db.execute(query)
    projects = result.scalars().all()

    return [
        {
            "id": p.id,
            "name": p.name,
            "description": p.description,
            "status": p.status,
            "client_id": p.client_id,
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
    Note: This requires a relationship between Client and Contact to be defined
    For now, returns empty list - to be implemented based on business logic
    """
    # TODO: Implement contact linking logic
    # This might require adding a client_id field to Contact model
    return []
