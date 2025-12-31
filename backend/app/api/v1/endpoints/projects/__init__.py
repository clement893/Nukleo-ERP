"""
Project Management Endpoints
"""

from typing import Annotated, List, Optional

from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func, delete
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.cache import cached, invalidate_cache_pattern
from app.core.rate_limit import rate_limit_decorator
from app.core.tenancy_helpers import apply_tenant_scope
from app.dependencies import get_current_user
from app.models.project import Project, ProjectStatus
from app.models.user import User
from app.models.company import Company
from app.models.employee import Employee
from app.schemas.project import Project as ProjectSchema, ProjectCreate, ProjectUpdate
from sqlalchemy.orm import aliased
from app.core.logging import logger
from . import import_export

router = APIRouter()

# Include import/export routes
router.include_router(import_export.router, tags=["projects-import-export"])


@router.get("/", response_model=List[ProjectSchema])
@rate_limit_decorator("200/hour")
@cached(expire=300, key_prefix="projects")
async def get_projects(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: User = Depends(get_current_user),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of records"),
    status: ProjectStatus | None = Query(None, description="Filter by status"),
) -> List[ProjectSchema]:
    """
    Get list of projects for the current user
    
    Args:
        skip: Number of records to skip
        limit: Maximum number of records to return
        status: Optional status filter
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        List of projects
    """
    try:
        # Build query
        query = select(Project).where(Project.user_id == current_user.id)
        
        if status:
            query = query.where(Project.status == status)
        
        # Apply tenant scoping if tenancy is enabled
        query = apply_tenant_scope(query, Project)
        
        query = query.order_by(Project.created_at.desc()).offset(skip).limit(limit)
        
        # Use selectinload like get_project endpoint
        query = query.options(
            selectinload(Project.client),
            selectinload(Project.responsable)
        )
        
        # Execute query
        result = await db.execute(query)
        projects = result.scalars().all()
        
        # Convert to response format with client and responsable names
        project_list = []
        for project in projects:
            client_name = project.client.name if project.client else None
            responsable_name = None
            if project.responsable:
                responsable_name = f"{project.responsable.first_name} {project.responsable.last_name}".strip()
            
            project_list.append(ProjectSchema(
                id=project.id,
                name=project.name,
                description=project.description,
                status=project.status,
                user_id=project.user_id,
                client_id=project.client_id,
                client_name=client_name,
                responsable_id=project.responsable_id,
                responsable_name=responsable_name,
                created_at=project.created_at,
                updated_at=project.updated_at,
            ))
        
        # Return the list directly - FastAPI will serialize it correctly
        return project_list
    
    except Exception as e:
        # Log detailed error information before re-raising
        error_type = type(e).__name__
        error_message = str(e)
        
        # Get SQL statement if available (for SQLAlchemy errors)
        sql_statement = None
        if hasattr(e, "statement"):
            sql_statement = str(e.statement)
        elif hasattr(e, "orig") and hasattr(e.orig, "statement"):
            sql_statement = str(e.orig.statement)
        
        logger.error(
            f"Database error in get_projects: {error_type} - {error_message}",
            extra={
                "error_type": error_type,
                "error_message": error_message,
                "sql_statement": sql_statement[:500] if sql_statement else None,
                "user_id": current_user.id,
                "status_filter": status,
                "skip": skip,
                "limit": limit,
            },
            exc_info=True,
        )
        
        # Re-raise to let the global exception handler deal with it
        raise


@router.get("/{project_id}", response_model=ProjectSchema)
@cached(expire=300, key_prefix="project")
async def get_project(
    project_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: User = Depends(get_current_user),
) -> Project:
    """
    Get a single project by ID
    
    Args:
        project_id: Project ID
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        Project object
        
    Raises:
        HTTPException: If project not found or user doesn't have access
    """
    query = select(Project).where(
        and_(
            Project.id == project_id,
            Project.user_id == current_user.id
        )
    )
    query = apply_tenant_scope(query, Project)
    query = query.options(
        selectinload(Project.client),
        selectinload(Project.responsable)
    )
    
    result = await db.execute(query)
    project = result.scalar_one_or_none()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Convert to response format with client and responsable names
    # Safely access relationships - check if they exist before accessing attributes
    client_name = None
    if project.client:
        try:
            client_name = project.client.name
        except Exception:
            # If lazy load fails, client_name remains None
            pass
    
    responsable_name = None
    if project.responsable:
        try:
            responsable_name = f"{project.responsable.first_name} {project.responsable.last_name}"
        except Exception:
            # If lazy load fails or attributes don't exist, responsable_name remains None
            pass
    
    project_dict = {
        "id": project.id,
        "name": project.name,
        "description": project.description,
        "status": project.status,
        "user_id": project.user_id,
        "client_id": project.client_id,
        "client_name": client_name,
        "responsable_id": project.responsable_id,
        "responsable_name": responsable_name,
        "created_at": project.created_at,
        "updated_at": project.updated_at,
    }
    
    return ProjectSchema(**project_dict)


async def find_company_by_name(
    company_name: str,
    db: AsyncSession,
) -> Optional[int]:
    """Find a company ID by name using intelligent matching"""
    if not company_name or not company_name.strip():
        return None
    
    company_name_normalized = company_name.strip().lower()
    
    # Try exact match first
    result = await db.execute(
        select(Company).where(func.lower(Company.name) == company_name_normalized)
    )
    company = result.scalar_one_or_none()
    if company:
        return company.id
    
    # Try partial match
    result = await db.execute(
        select(Company).where(func.lower(Company.name).contains(company_name_normalized))
    )
    company = result.scalar_one_or_none()
    if company:
        return company.id
    
    return None


@router.post("/", response_model=ProjectSchema, status_code=status.HTTP_201_CREATED)
@rate_limit_decorator("30/hour")
@invalidate_cache_pattern("projects:*")
async def create_project(
    request: Request,
    project_data: ProjectCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: User = Depends(get_current_user),
) -> Project:
    """
    Create a new project
    
    Args:
        project_data: Project creation data
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        Created project object
    """
    # Handle client matching: if client_name is provided but client_id is not, try to find the company
    final_client_id = project_data.client_id
    
    if final_client_id is None and project_data.client_name:
        matched_client_id = await find_company_by_name(
            company_name=project_data.client_name,
            db=db
        )
        if matched_client_id:
            final_client_id = matched_client_id
            logger.info(f"Auto-matched client '{project_data.client_name}' to company ID {matched_client_id}")
    
    project = Project(
        name=project_data.name,
        description=project_data.description,
        status=project_data.status,
        user_id=current_user.id,
        client_id=final_client_id,
        responsable_id=project_data.responsable_id,
    )
    
    db.add(project)
    await db.commit()
    await db.refresh(project, ["client", "responsable"])
    
    # Convert to response format
    # Safely access relationships - check if they exist before accessing attributes
    client_name = None
    if project.client:
        try:
            client_name = project.client.name
        except Exception:
            # If lazy load fails, client_name remains None
            pass
    
    responsable_name = None
    if project.responsable:
        try:
            responsable_name = f"{project.responsable.first_name} {project.responsable.last_name}"
        except Exception:
            # If lazy load fails or attributes don't exist, responsable_name remains None
            pass
    
    project_dict = {
        "id": project.id,
        "name": project.name,
        "description": project.description,
        "status": project.status,
        "user_id": project.user_id,
        "client_id": project.client_id,
        "client_name": client_name,
        "responsable_id": project.responsable_id,
        "responsable_name": responsable_name,
        "created_at": project.created_at,
        "updated_at": project.updated_at,
    }
    
    return ProjectSchema(**project_dict)


@router.put("/{project_id}", response_model=ProjectSchema)
@rate_limit_decorator("100/hour")
@invalidate_cache_pattern("projects:*")
@invalidate_cache_pattern("project:*")
async def update_project(
    request: Request,
    project_id: int,
    project_data: ProjectUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: User = Depends(get_current_user),
) -> ProjectSchema:
    """
    Update an existing project
    
    Args:
        project_id: Project ID
        project_data: Project update data
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        Updated project object
        
    Raises:
        HTTPException: If project not found or user doesn't have access
    """
    result = await db.execute(
        select(Project).where(
            and_(Project.id == project_id, Project.user_id == current_user.id)
        )
    )
    project = result.scalar_one_or_none()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Handle client matching: if client_name is provided but client_id is not, try to find the company
    final_client_id = project_data.client_id
    
    if final_client_id is None and project_data.client_name:
        matched_client_id = await find_company_by_name(
            company_name=project_data.client_name,
            db=db
        )
        if matched_client_id:
            final_client_id = matched_client_id
            logger.info(f"Auto-matched client '{project_data.client_name}' to company ID {matched_client_id} for project {project_id}")
    
    # Update fields
    update_data = project_data.model_dump(exclude_unset=True)
    if final_client_id is not None:
        update_data["client_id"] = final_client_id
    if "client_name" in update_data:
        del update_data["client_name"]  # Remove client_name as it's not a database field
    
    for field, value in update_data.items():
        if hasattr(project, field):
            setattr(project, field, value)
    
    await db.commit()
    await db.refresh(project, ["client", "responsable"])
    
    # Convert to response format
    # Safely access relationships - check if they exist before accessing attributes
    client_name = None
    if project.client:
        try:
            client_name = project.client.name
        except Exception:
            # If lazy load fails, client_name remains None
            pass
    
    responsable_name = None
    if project.responsable:
        try:
            responsable_name = f"{project.responsable.first_name} {project.responsable.last_name}"
        except Exception:
            # If lazy load fails or attributes don't exist, responsable_name remains None
            pass
    
    project_dict = {
        "id": project.id,
        "name": project.name,
        "description": project.description,
        "status": project.status,
        "user_id": project.user_id,
        "client_id": project.client_id,
        "client_name": client_name,
        "responsable_id": project.responsable_id,
        "responsable_name": responsable_name,
        "created_at": project.created_at,
        "updated_at": project.updated_at,
    }
    
    return ProjectSchema(**project_dict)


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
@rate_limit_decorator("50/hour")
@invalidate_cache_pattern("projects:*")
@invalidate_cache_pattern("project:*")
async def delete_project(
    request: Request,
    project_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: User = Depends(get_current_user),
) -> None:
    """
    Delete a project
    
    Args:
        project_id: Project ID
        current_user: Current authenticated user
        db: Database session
        
    Raises:
        HTTPException: If project not found or user doesn't have access
    """
    result = await db.execute(
        select(Project).where(
            and_(Project.id == project_id, Project.user_id == current_user.id)
        )
    )
    project = result.scalar_one_or_none()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    await db.delete(project)
    await db.commit()


@router.delete("/bulk", status_code=status.HTTP_200_OK)
async def delete_all_projects(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: User = Depends(get_current_user),
) -> dict:
    """
    Delete all projects from the database
    
    Args:
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        Dictionary with count of deleted projects
    """
    # Count projects before deletion
    count_result = await db.execute(
        select(func.count(Project.id)).where(Project.user_id == current_user.id)
    )
    count = count_result.scalar_one()
    
    if count == 0:
        return {
            "message": "No projects found",
            "deleted_count": 0
        }
    
    # Delete all projects for the user
    await db.execute(
        delete(Project).where(Project.user_id == current_user.id)
    )
    await db.commit()
    
    logger.info(f"User {current_user.id} deleted all {count} projects")
    
    return {
        "message": f"Successfully deleted {count} project(s)",
        "deleted_count": count
    }
