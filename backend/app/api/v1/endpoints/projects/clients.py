"""
Clients API Endpoints
API endpoints for managing clients (companies)
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
import logging

from app.core.database import get_db
from app.core.tenancy_helpers import apply_tenant_scope
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
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[ClientSchema]:
    """
    Get list of clients (companies only)
    """
    logger.info(f"[ClientsAPI] List clients - skip={skip}, limit={limit}, status={status}, search={search}")
    
    # Build query - filter by user_id and type=company
    query = select(
        Client,
        func.count(Project.id).label('project_count')
    ).outerjoin(
        Project, Client.id == Project.client_id
    ).where(
        Client.user_id == current_user.id,
        Client.type == 'company'
    ).group_by(Client.id)

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
        query = query.where(func.lower(Client.company_name).like(search_term))

    query = query.order_by(Client.created_at.desc()).offset(skip).limit(limit)
    
    try:
        result = await db.execute(query)
        rows = result.all()
        
        # Build response with project count
        clients_list = []
        for client, project_count in rows:
            client_dict = {
                "id": client.id,
                "company_name": client.company_name,
                "type": client.type,
                "user_id": client.user_id,
                "portal_url": client.portal_url,
                "status": client.status,
                "created_at": client.created_at,
                "updated_at": client.updated_at,
                "project_count": project_count or 0,
            }
            clients_list.append(ClientSchema(**client_dict))
        
        logger.info(f"[ClientsAPI] Found {len(clients_list)} clients")
        return clients_list
    except Exception as e:
        logger.error(f"[ClientsAPI] Error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )


@router.get("/{client_id}/projects", response_model=List[dict])
async def get_client_projects(
    client_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[dict]:
    """
    Get all projects for a client
    """
    # First verify that the client exists and belongs to the current user
    client_query = select(Client).where(
        Client.id == client_id,
        Client.user_id == current_user.id
    )
    client_result = await db.execute(client_query)
    client = client_result.scalar_one_or_none()

    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Client with ID {client_id} not found"
        )

    # Get projects for this client, filtered by user_id and tenant scope
    query = select(Project).where(
        Project.client_id == client_id,
        Project.user_id == current_user.id
    )
    query = apply_tenant_scope(query, Project)
    query = query.order_by(Project.created_at.desc())
    
    result = await db.execute(query)
    projects = result.scalars().all()

    return [
        {
            "id": p.id,
            "name": p.name,
            "description": p.description,
            "status": p.status.value if hasattr(p.status, 'value') else str(p.status),
            "client_id": p.client_id,
            "etape": p.etape,
            "annee_realisation": p.annee_realisation,
            "created_at": p.created_at.isoformat() if p.created_at else None,
            "updated_at": p.updated_at.isoformat() if p.updated_at else None,
        }
        for p in projects
    ]


@router.get("/{client_id}", response_model=ClientSchema)
async def get_client(
    client_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ClientSchema:
    """
    Get a client by ID
    """
    # Get client with project count
    query = select(
        Client,
        func.count(Project.id).label('project_count')
    ).outerjoin(
        Project, Client.id == Project.client_id
    ).where(
        Client.id == client_id,
        Client.user_id == current_user.id
    ).group_by(Client.id)
    
    result = await db.execute(query)
    row = result.first()

    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Client with ID {client_id} not found"
        )

    client, project_count = row
    client_dict = {
        "id": client.id,
        "company_name": client.company_name,
        "type": client.type,
        "user_id": client.user_id,
        "portal_url": client.portal_url,
        "status": client.status,
        "created_at": client.created_at,
        "updated_at": client.updated_at,
        "project_count": project_count or 0,
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
    client_dict = client_data.model_dump()
    client_dict["user_id"] = current_user.id
    client_dict["type"] = "company"  # Force type to company
    
    client = Client(**client_dict)
    db.add(client)
    await db.commit()
    await db.refresh(client)

    return ClientSchema(
        **{
            "id": client.id,
            "company_name": client.company_name,
            "type": client.type,
            "user_id": client.user_id,
            "portal_url": client.portal_url,
            "status": client.status,
            "created_at": client.created_at,
            "updated_at": client.updated_at,
            "project_count": 0,
        }
    )


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

    # Get project count
    count_query = select(func.count(Project.id)).where(Project.client_id == client_id)
    count_result = await db.execute(count_query)
    project_count = count_result.scalar() or 0

    return ClientSchema(
        **{
            "id": client.id,
            "company_name": client.company_name,
            "type": client.type,
            "user_id": client.user_id,
            "portal_url": client.portal_url,
            "status": client.status,
            "created_at": client.created_at,
            "updated_at": client.updated_at,
            "project_count": project_count,
        }
    )


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


@router.post("/{client_id}/portal", response_model=ClientSchema)
async def create_client_portal(
    client_id: int,
    portal_url: str = Query(..., description="Portal URL to assign"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ClientSchema:
    """
    Create/update portal URL for a client
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

    client.portal_url = portal_url
    await db.commit()
    await db.refresh(client)

    # Get project count
    count_query = select(func.count(Project.id)).where(Project.client_id == client_id)
    count_result = await db.execute(count_query)
    project_count = count_result.scalar() or 0

    return ClientSchema(
        **{
            "id": client.id,
            "company_name": client.company_name,
            "type": client.type,
            "user_id": client.user_id,
            "portal_url": client.portal_url,
            "status": client.status,
            "created_at": client.created_at,
            "updated_at": client.updated_at,
            "project_count": project_count,
        }
    )
