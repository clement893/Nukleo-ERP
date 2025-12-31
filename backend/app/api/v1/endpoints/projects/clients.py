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
router = APIRouter(tags=["clients"])

# IMPORTANT: Define /{client_id}/projects BEFORE /{client_id} to ensure proper route matching


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


@router.get("/{client_id}/projects")
async def get_client_projects(
    client_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get all projects for a client
    """
    logger.info(f"[ClientsAPI] Get projects for client {client_id}")
    
    # First verify that the client exists and belongs to the current user
    client_query = select(Client).where(
        Client.id == client_id,
        Client.user_id == current_user.id
    )
    client_result = await db.execute(client_query)
    client = client_result.scalar_one_or_none()

    if not client:
        logger.warning(f"[ClientsAPI] Client {client_id} not found for user {current_user.id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Client with ID {client_id} not found"
        )

    # Get projects for this client, filtered by user_id and tenant scope
    # Use explicit column selection to avoid issues with missing columns like budget
    columns_to_select = [
        Project.id,
        Project.name,
        Project.description,
        Project.status,
        Project.user_id,
        Project.created_at,
        Project.updated_at,
    ]
    
    # Try to add optional columns
    try:
        columns_to_select.append(Project.client_id)
    except AttributeError:
        pass
    
    try:
        columns_to_select.append(Project.responsable_id)
    except AttributeError:
        pass
    
    # Add extended fields (excluding budget which may not exist)
    extended_fields = [
        ('equipe', Project.equipe),
        ('etape', Project.etape),
        ('annee_realisation', Project.annee_realisation),
        ('contact', Project.contact),
        ('proposal_url', Project.proposal_url),
        ('drive_url', Project.drive_url),
        ('slack_url', Project.slack_url),
        ('echeancier_url', Project.echeancier_url),
        ('temoignage_status', Project.temoignage_status),
        ('portfolio_status', Project.portfolio_status),
        ('start_date', Project.start_date),
        ('end_date', Project.end_date),
        ('deadline', Project.deadline),
    ]
    
    for field_name, field_column in extended_fields:
        try:
            columns_to_select.append(field_column)
        except AttributeError:
            pass
    
    query = select(*columns_to_select).where(
        Project.client_id == client_id,
        Project.user_id == current_user.id
    )
    query = apply_tenant_scope(query, Project)
    query = query.order_by(Project.created_at.desc())
    
    try:
        result = await db.execute(query)
        rows = result.all()
        
        logger.info(f"[ClientsAPI] Found {len(rows)} projects for client {client_id}")
        
        # Return projects as list of dicts with all fields
        projects_list = []
        for row in rows:
            project_dict = {
                "id": row.id,
                "name": row.name,
                "description": row.description,
                "status": row.status.value if hasattr(row.status, 'value') else str(row.status),
                "client_id": getattr(row, 'client_id', None),
                "etape": getattr(row, 'etape', None),
                "annee_realisation": getattr(row, 'annee_realisation', None),
                "created_at": row.created_at.isoformat() if row.created_at else None,
                "updated_at": p.updated_at.isoformat() if p.updated_at else None,
            }
            projects_list.append(project_dict)
        
        return projects_list
    except Exception as e:
        logger.error(f"[ClientsAPI] Error getting projects for client {client_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving projects: {str(e)}"
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
