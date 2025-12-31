"""
Project Management Endpoints
"""

from typing import Annotated, List, Optional

from fastapi import APIRouter, Depends, HTTPException, status as http_status, Query, Request
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func, delete, text
from sqlalchemy.orm import selectinload
from sqlalchemy.exc import ProgrammingError

from app.core.database import get_db
from app.core.cache import cached, invalidate_cache_pattern
from app.core.rate_limit import rate_limit_decorator
from app.core.tenancy_helpers import apply_tenant_scope
from app.dependencies import get_current_user
from app.models.project import Project, ProjectStatus
from app.models.user import User
from app.models.people import People
from app.models.employee import Employee
from app.schemas.project import Project as ProjectSchema, ProjectCreate, ProjectUpdate
from sqlalchemy.orm import aliased
from app.core.logging import logger
from . import import_export

router = APIRouter()

# Include import/export routes
router.include_router(import_export.router, tags=["projects-import-export"])


async def _check_project_columns_exist(db: AsyncSession, column_names: List[str]) -> dict[str, bool]:
    """Check if columns exist in the projects table"""
    exists = {col: False for col in column_names}
    if not column_names:
        return exists
    
    try:
        # Use raw SQL query to check columns (works with async sessions)
        # Use IN clause with tuple unpacking for PostgreSQL
        placeholders = ','.join([f':col_{i}' for i in range(len(column_names))])
        query = text(f"""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_schema = 'public'
            AND table_name = 'projects' 
            AND column_name IN ({placeholders})
        """)
        params = {f'col_{i}': col for i, col in enumerate(column_names)}
        result = await db.execute(query, params)
        existing_columns = {row[0] for row in result}
        for col in column_names:
            if col in existing_columns:
                exists[col] = True
    except Exception as e:
        logger.warning(f"Could not check 'projects' table columns: {e}")
        # If check fails, assume columns don't exist (safer)
        exists = {col: False for col in column_names}
    return exists


@router.get("/", response_model=List[ProjectSchema])
@rate_limit_decorator("200/hour")
@cached(expire=300, key_prefix="projects")
async def get_projects(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: User = Depends(get_current_user),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of records"),
    status: str | None = Query(None, description="Filter by status (active, archived, completed)"),
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
    # Initialize variables outside try block to ensure they're always defined
    project_list: List[ProjectSchema] = []
    
    try:
        # Convert status string to enum if provided (case-insensitive)
        status_enum: ProjectStatus | None = None
        if status:
            status_lower = status.strip().lower()
            # Map common status values (case-insensitive)
            # Also handle enum values that might come from the frontend
            status_map = {
                'active': ProjectStatus.ACTIVE,
                'archived': ProjectStatus.ARCHIVED,
                'completed': ProjectStatus.COMPLETED,
                # Handle enum string values
                'projectstatus.active': ProjectStatus.ACTIVE,
                'projectstatus.archived': ProjectStatus.ARCHIVED,
                'projectstatus.completed': ProjectStatus.COMPLETED,
            }
            status_enum = status_map.get(status_lower)
            if status_enum is None:
                # Try to match enum name directly
                try:
                    status_enum = ProjectStatus[status.upper()]
                except (KeyError, AttributeError):
                    raise HTTPException(
                        status_code=http_status.HTTP_422_UNPROCESSABLE_ENTITY,
                        detail=f"Invalid status value: {status}. Must be one of: active, archived, completed (case-insensitive)"
                    )
        
        # Check if client_id and responsable_id columns exist BEFORE querying
        # This prevents transaction errors
        columns_exist = await _check_project_columns_exist(db, ['client_id', 'responsable_id'])
        
        projects = []
        use_explicit_columns = False
        
        # Try to use normal query with relationships if columns exist
        if columns_exist.get('client_id', False) and columns_exist.get('responsable_id', False):
            try:
                query = select(Project).where(Project.user_id == current_user.id)
                
                if status_enum:
                    query = query.where(Project.status == status_enum)
                
                query = apply_tenant_scope(query, Project)
                query = query.order_by(Project.created_at.desc()).offset(skip).limit(limit)
                
                result = await db.execute(query)
                projects = result.scalars().all()
            except (ProgrammingError, Exception) as e:
                # If query fails, rollback and use explicit column selection
                try:
                    await db.rollback()
                except Exception:
                    pass  # Ignore rollback errors
                logger.warning(
                    "Query failed, using explicit column selection",
                    context={"error": str(e)}
                )
                use_explicit_columns = True
        
        # Use explicit column selection if columns don't exist or query failed
        if use_explicit_columns or not columns_exist.get('client_id', False) or not columns_exist.get('responsable_id', False):
            try:
                # Build column list - include client_id and responsable_id if they exist
                columns_to_select = [
                    Project.id,
                    Project.name,
                    Project.description,
                    Project.status,
                    Project.user_id,
                    Project.created_at,
                    Project.updated_at
                ]
                
                # Track which optional columns we're trying to select
                has_client_id_col = False
                has_responsable_id_col = False
                
                # Try to add client_id and responsable_id if columns exist
                # Wrap in try-except in case column check was wrong
                if columns_exist.get('client_id', False):
                    try:
                        columns_to_select.append(Project.client_id)
                        has_client_id_col = True
                    except (AttributeError, ProgrammingError) as e:
                        logger.warning(f"Could not add client_id to query: {e}")
                        has_client_id_col = False
                
                if columns_exist.get('responsable_id', False):
                    try:
                        columns_to_select.append(Project.responsable_id)
                        has_responsable_id_col = True
                    except (AttributeError, ProgrammingError) as e:
                        logger.warning(f"Could not add responsable_id to query: {e}")
                        has_responsable_id_col = False
                
                query = select(*columns_to_select).where(Project.user_id == current_user.id)
                
                if status_enum:
                    query = query.where(Project.status == status_enum)
                
                query = apply_tenant_scope(query, Project)
                query = query.order_by(Project.created_at.desc()).offset(skip).limit(limit)
                
                result = await db.execute(query)
                rows = result.all()
                
                # Convert rows to ProjectRow objects
                # SQLAlchemy Row objects from explicit column selection can be accessed by index or attribute
                class ProjectRow:
                    def __init__(self, row, has_client_id=False, has_responsable_id=False):
                        self.id = row.id
                        self.name = row.name
                        self.description = row.description
                        self.status = row.status
                        self.user_id = row.user_id
                        self.created_at = row.created_at
                        self.updated_at = row.updated_at
                        # Set client_id and responsable_id if they were selected
                        try:
                            self.client_id = getattr(row, 'client_id', None) if has_client_id else None
                        except (AttributeError, KeyError):
                            self.client_id = None
                        try:
                            self.responsable_id = getattr(row, 'responsable_id', None) if has_responsable_id else None
                        except (AttributeError, KeyError):
                            self.responsable_id = None
                
                projects = [
                    ProjectRow(
                        row,
                        has_client_id=has_client_id_col,
                        has_responsable_id=has_responsable_id_col
                    )
                    for row in rows
                ]
            except Exception as e:
                logger.error(
                    f"Failed to execute explicit column query: {e}",
                    context={"user_id": current_user.id, "error_type": type(e).__name__},
                    exc_info=e
                )
                # Return empty list if even explicit query fails
                projects = []
        
        # Convert to response format
        project_list = []
        for project in projects:
            try:
                # Get client_id and responsable_id
                client_id = getattr(project, 'client_id', None) if columns_exist.get('client_id', False) else None
                responsable_id = getattr(project, 'responsable_id', None) if columns_exist.get('responsable_id', False) else None
                
                # Try to load client name if client_id exists
                client_name = None
                if client_id:
                    try:
                        client_result = await db.execute(
                            select(People).where(People.id == client_id)
                        )
                        client = client_result.scalar_one_or_none()
                        if client:
                            client_name = f"{client.first_name} {client.last_name}".strip()
                    except Exception:
                        client_name = None
                
                # Try to load responsable name if responsable_id exists
                responsable_name = None
                if responsable_id:
                    try:
                        responsable_result = await db.execute(
                            select(Employee).where(Employee.id == responsable_id)
                        )
                        responsable = responsable_result.scalar_one_or_none()
                        if responsable:
                            responsable_name = f"{responsable.first_name} {responsable.last_name}".strip()
                    except Exception:
                        responsable_name = None
                
                project_list.append(ProjectSchema(
                    id=project.id,
                    name=project.name,
                    description=project.description,
                    status=project.status,
                    user_id=project.user_id,
                    client_id=client_id,
                    client_name=client_name,
                    responsable_id=responsable_id,
                    responsable_name=responsable_name,
                    created_at=project.created_at,
                    updated_at=project.updated_at,
                ))
            except Exception as e:
                logger.warning(f"Error processing project {getattr(project, 'id', 'unknown')}: {e}")
                # Skip this project and continue with others
                continue
        
        return project_list
    except HTTPException as he:
        # Re-raise HTTP exceptions (like validation errors)
        logger.warning(
            f"HTTPException in get_projects: {he.detail}",
            context={"status_code": he.status_code, "user_id": current_user.id}
        )
        raise
    except Exception as e:
        # Log unexpected errors with full context
        error_type = type(e).__name__
        error_msg = str(e)
        logger.error(
            f"Unexpected error in get_projects: {error_type}: {error_msg}",
            context={
                "user_id": getattr(current_user, 'id', None),
                "skip": skip,
                "limit": limit,
                "status": status,
                "error_type": error_type
            },
            exc_info=e
        )
        # Return empty list instead of raising to prevent slowapi Response error
        # This ensures we always return a valid response
        return []


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
    try:
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
        
    except ProgrammingError as pe:
        # If the error is about missing columns, retry without relationship loading
        error_msg = str(pe).lower()
        if 'client_id' in error_msg or 'responsable_id' in error_msg or 'column' in error_msg:
            logger.warning(
                "Missing column detected in projects table, retrying without relationship loading",
                context={
                    "error": str(pe),
                    "user_id": current_user.id,
                    "project_id": project_id,
                }
            )
            
            # Retry query without relationship loading
            query = select(Project).where(
                and_(
                    Project.id == project_id,
                    Project.user_id == current_user.id
                )
            )
            query = apply_tenant_scope(query, Project)
            
            result = await db.execute(query)
            project = result.scalar_one_or_none()
        else:
            # Re-raise if it's a different ProgrammingError
            raise
    
    if not project:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Convert to response format with client and responsable names
    # Safely access relationships - check if they exist before accessing attributes
    client_name = None
    try:
        if project.client:
            client_name = f"{project.client.first_name} {project.client.last_name}".strip()
    except (AttributeError, ProgrammingError):
        # If lazy load fails or column doesn't exist, client_name remains None
        pass
    
    responsable_name = None
    try:
        if project.responsable:
            responsable_name = f"{project.responsable.first_name} {project.responsable.last_name}"
    except (AttributeError, ProgrammingError):
        # If lazy load fails or attributes don't exist, responsable_name remains None
        pass
    
    # Safely get client_id and responsable_id
    client_id = None
    responsable_id = None
    try:
        client_id = getattr(project, 'client_id', None)
    except (AttributeError, ProgrammingError):
        pass
    
    try:
        responsable_id = getattr(project, 'responsable_id', None)
    except (AttributeError, ProgrammingError):
        pass
    
    project_dict = {
        "id": project.id,
        "name": project.name,
        "description": project.description,
        "status": project.status,
        "user_id": project.user_id,
        "client_id": client_id,
        "client_name": client_name,
        "responsable_id": responsable_id,
        "responsable_name": responsable_name,
        "created_at": project.created_at,
        "updated_at": project.updated_at,
    }
    
    return ProjectSchema(**project_dict)


async def find_people_by_name(
    people_name: str,
    db: AsyncSession,
) -> Optional[int]:
    """Find a People ID by name using intelligent matching (searches first_name, last_name, and email)"""
    if not people_name or not people_name.strip():
        return None
    
    people_name_normalized = people_name.strip().lower()
    
    # Try exact match on first_name + last_name
    name_parts = people_name_normalized.split()
    if len(name_parts) >= 2:
        first_name = name_parts[0]
        last_name = " ".join(name_parts[1:])
        result = await db.execute(
            select(People).where(
                and_(
                    func.lower(People.first_name) == first_name,
                    func.lower(People.last_name) == last_name
                )
            )
        )
        people = result.scalar_one_or_none()
        if people:
            return people.id
    
    # Try exact match on email
    result = await db.execute(
        select(People).where(func.lower(People.email) == people_name_normalized)
    )
    people = result.scalar_one_or_none()
    if people:
        return people.id
    
    # Try partial match on first_name
    result = await db.execute(
        select(People).where(func.lower(People.first_name).contains(people_name_normalized))
    )
    people = result.scalar_one_or_none()
    if people:
        return people.id
    
    # Try partial match on last_name
    result = await db.execute(
        select(People).where(func.lower(People.last_name).contains(people_name_normalized))
    )
    people = result.scalar_one_or_none()
    if people:
        return people.id
    
    # Try partial match on email
    result = await db.execute(
        select(People).where(func.lower(People.email).contains(people_name_normalized))
    )
    people = result.scalar_one_or_none()
    if people:
        return people.id
    
    return None


@router.post("/", response_model=ProjectSchema, status_code=http_status.HTTP_201_CREATED)
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
    # Handle client matching: if client_name is provided but client_id is not, try to find the people
    final_client_id = project_data.client_id
    
    if final_client_id is None and project_data.client_name:
        matched_client_id = await find_people_by_name(
            people_name=project_data.client_name,
            db=db
        )
        if matched_client_id:
            final_client_id = matched_client_id
            logger.info(f"Auto-matched client '{project_data.client_name}' to people ID {matched_client_id}")
    
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
            client_name = f"{project.client.first_name} {project.client.last_name}".strip()
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
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Handle client matching: if client_name is provided but client_id is not, try to find the people
    final_client_id = project_data.client_id
    
    if final_client_id is None and project_data.client_name:
        matched_client_id = await find_people_by_name(
            people_name=project_data.client_name,
            db=db
        )
        if matched_client_id:
            final_client_id = matched_client_id
            logger.info(f"Auto-matched client '{project_data.client_name}' to people ID {matched_client_id} for project {project_id}")
    
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
            client_name = f"{project.client.first_name} {project.client.last_name}".strip()
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


@router.delete("/{project_id}", status_code=http_status.HTTP_204_NO_CONTENT)
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
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    await db.delete(project)
    await db.commit()


@router.delete("/bulk", status_code=http_status.HTTP_200_OK)
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
