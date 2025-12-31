"""
People API Endpoints
API endpoints for managing people
"""

from typing import List, Optional, Annotated
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
import logging

from app.core.database import get_db
from app.core.cache_enhanced import cache_query
from app.dependencies import get_current_user
from app.models.user import User
from app.models.people import People, PeopleStatus
from app.models.project import Project
from app.models.contact import Contact
from app.schemas.people import PeopleCreate, PeopleUpdate, People as PeopleSchema

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/projects/people", tags=["people"])


@router.get("/", response_model=List[PeopleSchema])
# Temporarily disabled cache to debug validation issue
# @cache_query(expire=60, tags=["people"])
async def list_people(
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    status: Optional[str] = Query(None, description="Filter by status"),
    search: Optional[str] = Query(None, description="Search by name"),
) -> List[PeopleSchema]:
    """
    Get list of people
    """
    # Read skip and limit directly from query params to avoid FastAPI validation issues
    skip_str = request.query_params.get("skip", "0")
    limit_str = request.query_params.get("limit", "20")
    
    # Log that we've reached the endpoint with detailed information
    logger.info(f"[PeopleAPI] ========================================")
    logger.info(f"[PeopleAPI] ✅ ENDPOINT REACHED")
    logger.info(f"[PeopleAPI] URL: {request.url}")
    logger.info(f"[PeopleAPI] Method: {request.method}")
    logger.info(f"[PeopleAPI] Query params (raw): {dict(request.query_params)}")
    logger.info(f"[PeopleAPI] Query params (items): {list(request.query_params.items())}")
    logger.info(f"[PeopleAPI] Skip from query_params (raw): {repr(skip_str)} (type: {type(skip_str).__name__})")
    logger.info(f"[PeopleAPI] Limit from query_params (raw): {repr(limit_str)} (type: {type(limit_str).__name__})")
    
    # Convert skip and limit to integers manually
    try:
        skip = int(skip_str)
        if skip < 0:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"skip must be >= 0, got: {skip}"
            )
    except (ValueError, TypeError) as e:
        logger.error(f"[PeopleAPI] Failed to parse skip: {repr(skip_str)} - {e}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"skip must be a valid integer, got: {repr(skip_str)}"
        )
    
    try:
        limit = int(limit_str)
        if limit < 1 or limit > 1000:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"limit must be between 1 and 1000, got: {limit}"
            )
    except (ValueError, TypeError) as e:
        logger.error(f"[PeopleAPI] Failed to parse limit: {repr(limit_str)} - {e}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"limit must be a valid integer, got: {repr(limit_str)}"
        )
    
    logger.info(f"[PeopleAPI] Parsed skip: {skip} (type: {type(skip).__name__})")
    logger.info(f"[PeopleAPI] Parsed limit: {limit} (type: {type(limit).__name__})")
    logger.info(f"[PeopleAPI] ========================================")
    
    query = select(People)

    # Parse status
    parsed_status: Optional[PeopleStatus] = None
    if status:
        try:
            parsed_status = PeopleStatus(status.lower())
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Invalid status value: {status}. Must be one of {', '.join([s.value for s in PeopleStatus])}"
            )

    if parsed_status:
        query = query.where(People.status == parsed_status)
    if search:
        search_term = f"%{search.lower()}%"
        query = query.where(
            func.lower(People.first_name).like(search_term) |
            func.lower(People.last_name).like(search_term) |
            func.lower(func.concat(People.first_name, ' ', People.last_name)).like(search_term)
        )

    query = query.order_by(People.created_at.desc()).offset(skip).limit(limit)
    
    logger.info(f"[PeopleAPI] Executing query with offset={skip}, limit={limit}")
    
    try:
        result = await db.execute(query)
        people_list = result.scalars().all()
        logger.info(f"[PeopleAPI] Query successful, returned {len(people_list)} people")
        
        return [PeopleSchema.model_validate(person) for person in people_list]
    except Exception as e:
        logger.error(f"[PeopleAPI] Error executing query: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )


@router.get("/{people_id}", response_model=PeopleSchema)
async def get_people(
    people_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PeopleSchema:
    """
    Get a person by ID
    """
    query = select(People).where(People.id == people_id)
    result = await db.execute(query)
    person = result.scalar_one_or_none()

    if not person:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Person with ID {people_id} not found"
        )

    return PeopleSchema.model_validate(person)


@router.post("/", response_model=PeopleSchema, status_code=status.HTTP_201_CREATED)
async def create_people(
    people_data: PeopleCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PeopleSchema:
    """
    Create a new person
    """
    person = People(**people_data.model_dump())
    db.add(person)
    await db.commit()
    await db.refresh(person)

    return PeopleSchema.model_validate(person)


@router.put("/{people_id}", response_model=PeopleSchema)
async def update_people(
    people_id: int,
    people_data: PeopleUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PeopleSchema:
    """
    Update a person
    """
    query = select(People).where(People.id == people_id)
    result = await db.execute(query)
    person = result.scalar_one_or_none()

    if not person:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Person with ID {people_id} not found"
        )

    # Update fields
    update_data = people_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(person, key, value)

    await db.commit()
    await db.refresh(person)

    return PeopleSchema.model_validate(person)


@router.delete("/{people_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_people(
    people_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Delete a person
    """
    query = select(People).where(People.id == people_id)
    result = await db.execute(query)
    person = result.scalar_one_or_none()

    if not person:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Person with ID {people_id} not found"
        )

    await db.delete(person)
    await db.commit()


@router.get("/{people_id}/projects", response_model=List[dict])
async def get_people_projects(
    people_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[dict]:
    """
    Get active projects for a person (where person is responsable)
    """
    query = select(Project).where(
        Project.responsable_id == people_id,
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


@router.get("/{people_id}/contacts", response_model=List[dict])
async def get_people_contacts(
    people_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[dict]:
    """
    Get contacts linked to a person
    Note: This requires a relationship between People and Contact to be defined
    For now, returns empty list - to be implemented based on business logic
    """
    # TODO: Implement contact linking logic
    # This might require adding a people_id field to Contact model
    return []
