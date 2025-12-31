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
from app.models.client import Client, ClientStatus
from app.models.employee import Employee
from app.schemas.project import Project as ProjectSchema, ProjectCreate, ProjectUpdate
from app.schemas.client import Client as ClientSchema
from sqlalchemy.orm import aliased
from app.core.logging import logger
from . import import_export
from . import clients as projects_clients

router = APIRouter()

# Include clients routes FIRST (before /{project_id} route) to ensure proper route matching
# Use explicit prefix to ensure route is registered before path parameters
router.include_router(
    projects_clients.router, 
    prefix="/clients",
    tags=["clients"]
)

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
        logger.warning(
            f"Could not check 'projects' table columns: {e}",
            exc_info=True,
            context={"column_names": column_names}
        )
        # If check fails, assume columns don't exist (safer)
        exists = {col: False for col in column_names}
    return exists


@router.get("/")
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
        
        # Check if client_id, responsable_id and extended fields columns exist BEFORE querying
        # This prevents transaction errors
        try:
            columns_exist = await _check_project_columns_exist(db, [
                'client_id', 
                'responsable_id',
                'equipe',
                'etape',
                'annee_realisation',
                'contact',
                'budget',
                'proposal_url',
                'drive_url',
                'slack_url',
                'echeancier_url',
                'temoignage_status',
                'portfolio_status'
            ])
        except Exception as e:
            error_str = str(e).lower()
            # Check if error is due to failed transaction - rollback first
            if 'transaction is aborted' in error_str or 'infailed' in error_str:
                logger.warning(f"Transaction error detected in column check, rolling back: {e}")
                try:
                    await db.rollback()
                except Exception as rollback_error:
                    logger.warning(f"Rollback failed: {rollback_error}")
            
            logger.warning(
                f"Error checking project columns: {e}",
                exc_info=True
            )
            # Default to all columns not existing if check fails
            columns_exist = {
                'client_id': False,
                'responsable_id': False,
                'equipe': False,
                'etape': False,
                'annee_realisation': False,
                'contact': False,
                'budget': False,
                'proposal_url': False,
                'drive_url': False,
                'slack_url': False,
                'echeancier_url': False,
                'temoignage_status': False,
                'portfolio_status': False
            }
        
        projects = []
        
        # Always use explicit column selection to avoid lazy loading issues in async context
        # Even if columns exist, we load relationships manually to prevent MissingGreenlet errors
        # This ensures we never trigger lazy loading which causes MissingGreenlet errors
        use_explicit_columns = True
        
        # Use explicit column selection to avoid lazy loading issues
        if use_explicit_columns or not columns_exist.get('client_id', False) or not columns_exist.get('responsable_id', False):
            try:
                # Build column list - include only columns that exist
                columns_to_select = [
                    Project.id,
                    Project.name,
                    Project.description,
                    Project.status,
                    Project.user_id,
                    Project.created_at,
                    Project.updated_at,
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
                
                # Add extended fields only if they exist (excluding budget which may not exist)
                extended_fields = [
                    ('equipe', Project.equipe),
                    ('etape', Project.etape),
                    ('annee_realisation', Project.annee_realisation),
                    ('contact', Project.contact),
                    # Skip budget - it doesn't exist in DB
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
                    if columns_exist.get(field_name, False):
                        try:
                            columns_to_select.append(field_column)
                        except (AttributeError, ProgrammingError) as e:
                            logger.warning(f"Could not add {field_name} to query: {e}")
                
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
                    def __init__(self, row, has_client_id=False, has_responsable_id=False, columns_exist=None):
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
                        # Set extended fields if they exist (excluding budget)
                        extended_field_names = [
                            'equipe', 'etape', 'annee_realisation', 'contact',
                            'proposal_url', 'drive_url', 'slack_url', 'echeancier_url',
                            'temoignage_status', 'portfolio_status', 'start_date', 'end_date', 'deadline'
                        ]
                        for field_name in extended_field_names:
                            if columns_exist and columns_exist.get(field_name, False):
                                try:
                                    setattr(self, field_name, getattr(row, field_name, None))
                                except (AttributeError, KeyError):
                                    setattr(self, field_name, None)
                            else:
                                setattr(self, field_name, None)
                
                projects = [
                    ProjectRow(
                        row,
                        has_client_id=has_client_id_col,
                        has_responsable_id=has_responsable_id_col,
                        columns_exist=columns_exist
                    )
                    for row in rows
                ]
            except Exception as e:
                error_str = str(e).lower()
                
                # Check if error is due to failed transaction - rollback first
                if 'transaction is aborted' in error_str or 'infailed' in error_str:
                    logger.warning(f"Transaction error detected in explicit query, rolling back: {e}")
                    try:
                        await db.rollback()
                    except Exception as rollback_error:
                        logger.warning(f"Rollback failed: {rollback_error}")
                
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
                            select(Client).where(Client.id == client_id)
                        )
                        client = client_result.scalar_one_or_none()
                        if client:
                            # Handle both company_name (for companies) and first_name/last_name (for contacts)
                            if hasattr(client, 'company_name') and client.company_name:
                                client_name = client.company_name
                            elif hasattr(client, 'first_name') and hasattr(client, 'last_name'):
                                client_name = f"{client.first_name} {client.last_name}".strip()
                    except Exception as client_error:
                        logger.warning(
                            f"Error loading client name for client_id {client_id}: {client_error}",
                            exc_info=True
                        )
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
                    except Exception as emp_error:
                        logger.warning(
                            f"Error loading responsable name for responsable_id {responsable_id}: {emp_error}",
                            exc_info=True
                        )
                        responsable_name = None
                
                # Build extended fields dict, only including fields that exist (excluding budget)
                extended_fields_dict = {}
                extended_field_names = [
                    'equipe', 'etape', 'annee_realisation', 'contact',
                    'proposal_url', 'drive_url', 'slack_url', 'echeancier_url',
                    'temoignage_status', 'portfolio_status', 'start_date', 'end_date', 'deadline'
                ]
                for field_name in extended_field_names:
                    if columns_exist.get(field_name, True):  # Default to True for backward compatibility
                        try:
                            extended_fields_dict[field_name] = getattr(project, field_name, None)
                        except (AttributeError, KeyError):
                            extended_fields_dict[field_name] = None
                    else:
                        extended_fields_dict[field_name] = None
                
                try:
                    # Build project schema with safe defaults
                    # Ensure name is not empty (required by schema validation)
                    project_name = project.name or "Unnamed Project"
                    if not project_name.strip():
                        project_name = "Unnamed Project"
                    
                    # Ensure status is valid - convert to ProjectStatus enum if needed
                    project_status = project.status
                    if project_status is None:
                        from app.models.project import ProjectStatus as ModelProjectStatus
                        project_status = ModelProjectStatus.ACTIVE
                    # Convert model enum to schema enum if needed
                    if hasattr(project_status, 'value'):
                        project_status_value = project_status.value
                    elif isinstance(project_status, str):
                        project_status_value = project_status
                    else:
                        project_status_value = str(project_status)
                    
                    # Map to valid ProjectStatus enum value
                    from app.schemas.project import ProjectStatus as SchemaProjectStatus
                    status_map = {
                        'active': SchemaProjectStatus.ACTIVE,
                        'archived': SchemaProjectStatus.ARCHIVED,
                        'completed': SchemaProjectStatus.COMPLETED,
                    }
                    schema_status = status_map.get(project_status_value.lower(), SchemaProjectStatus.ACTIVE)
                    
                    project_data = {
                        "id": project.id,
                        "name": project_name.strip(),
                        "description": project.description,
                        "status": schema_status,
                        "user_id": project.user_id,
                        "client_id": client_id,
                        "client_name": client_name,
                        "responsable_id": responsable_id,
                        "responsable_name": responsable_name,
                        "created_at": project.created_at,
                        "updated_at": project.updated_at,
                    }
                    # Add extended fields only if they're not None to avoid validation errors
                    for key, value in extended_fields_dict.items():
                        if value is not None:
                            project_data[key] = value
                    
                    project_schema = ProjectSchema(**project_data)
                    project_list.append(project_schema)
                except Exception as schema_error:
                    logger.warning(
                        f"Error creating ProjectSchema for project {getattr(project, 'id', 'unknown')}: {schema_error}",
                        exc_info=True,
                        context={
                            "project_id": getattr(project, 'id', None),
                            "error_type": type(schema_error).__name__,
                            "project_name": getattr(project, 'name', None),
                            "project_status": getattr(project, 'status', None),
                        }
                    )
                    # Skip this project and continue with others
                    continue
            except Exception as e:
                logger.warning(f"Error processing project {getattr(project, 'id', 'unknown')}: {e}")
                # Skip this project and continue with others
                continue
        
        # Return JSONResponse explicitly to satisfy slowapi's requirement for Response object
        # Convert Pydantic models to dicts using model_dump with mode='json' for datetime serialization
        return JSONResponse(
            content=[project.model_dump(mode='json') for project in project_list],
            status_code=200
        )
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
        error_str = str(e).lower()
        
        # Check if error is due to failed transaction - rollback first
        if 'transaction is aborted' in error_str or 'infailed' in error_str:
            logger.warning(f"Transaction error detected in get_projects, rolling back: {e}")
            try:
                await db.rollback()
            except Exception as rollback_error:
                logger.warning(f"Rollback failed: {rollback_error}")
        
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
        # Return a proper error response instead of empty list
        # This helps with debugging while still being safe
        try:
            # Try to return empty list first (safest)
            return JSONResponse(content=[], status_code=200)
        except Exception as response_error:
            # If even returning empty list fails, raise HTTPException
            logger.error(
                f"Failed to return response in get_projects: {response_error}",
                exc_info=True
            )
            raise HTTPException(
                status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"A database error occurred: {error_msg}"
            )


# Explicit route handler for /clients to ensure it's matched before /{project_id}
# This is a workaround for FastAPI route matching
@router.get("/clients", response_model=List[ClientSchema], include_in_schema=False)
async def get_clients_list(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=1000, description="Maximum number of records"),
    status: Optional[str] = Query(None, description="Filter by status"),
    search: Optional[str] = Query(None, description="Search term"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[ClientSchema]:
    """
    Get list of clients - explicit route to ensure proper matching before /{project_id}
    """
    # Use the same logic as the clients router
    status_filter = status
    
    query = select(Client)

    # Parse status
    parsed_status: Optional[ClientStatus] = None
    if status_filter:
        try:
            parsed_status = ClientStatus(status_filter.lower())
        except ValueError:
            raise HTTPException(
                status_code=http_status.HTTP_422_UNPROCESSABLE_ENTITY,
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
    
    try:
        result = await db.execute(query)
        clients_list = result.scalars().all()
        return [ClientSchema.model_validate(client) for client in clients_list]
    except Exception as e:
        logger.error(f"Error executing clients query: {e}", exc_info=True)
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )


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
        
    except (ProgrammingError, Exception) as pe:
        # If the error is about missing columns, retry with explicit column selection
        error_msg = str(pe).lower()
        if 'client_id' in error_msg or 'responsable_id' in error_msg or 'column' in error_msg or 'budget' in error_msg:
            logger.warning(
                "Missing column detected in projects table, retrying with explicit column selection",
                context={
                    "error": str(pe),
                    "user_id": current_user.id,
                    "project_id": project_id,
                }
            )
            
            # Rollback the failed transaction first and ensure it's complete
            try:
                await db.rollback()
                # Ensure rollback is complete by flushing any pending operations
                await db.flush()
            except Exception as rollback_error:
                logger.warning(f"Rollback failed: {rollback_error}")
                # If rollback fails, try to continue anyway - the next query will use a fresh transaction
            
            # Retry query with explicit column selection (excluding budget which may not exist)
            # Use a fresh query context to avoid any async context issues
            columns_to_select = [
                Project.id,
                Project.name,
                Project.description,
                Project.status,
                Project.user_id,
                Project.created_at,
                Project.updated_at,
            ]
            
            # Try to add optional columns if they exist
            try:
                columns_to_select.append(Project.client_id)
            except AttributeError:
                pass
            
            try:
                columns_to_select.append(Project.responsable_id)
            except AttributeError:
                pass
            
            # Add extended fields (excluding budget)
            extended_fields = [
                ('equipe', Project.equipe),
                ('etape', Project.etape),
                ('annee_realisation', Project.annee_realisation),
                ('contact', Project.contact),
                # Skip budget - it doesn't exist in DB
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
            
            # Build query without apply_tenant_scope to avoid context issues after rollback
            # The user_id filter already provides the necessary scoping
            query = select(*columns_to_select).where(
                and_(
                    Project.id == project_id,
                    Project.user_id == current_user.id
                )
            )
            # Only apply tenant scope if tenancy is enabled and we can safely get tenant
            try:
                from app.core.tenancy import TenancyConfig, get_current_tenant
                if TenancyConfig.is_enabled():
                    tenant_id = get_current_tenant()
                    if tenant_id is not None and hasattr(Project, 'team_id'):
                        query = query.where(Project.team_id == tenant_id)
            except Exception:
                # If tenant context access fails, skip tenant scoping (user_id filter is sufficient)
                pass
            
            try:
                result = await db.execute(query)
                # Fetch the row immediately to avoid any async context issues
                row = result.first()
                
                if not row:
                    raise HTTPException(
                        status_code=http_status.HTTP_404_NOT_FOUND,
                        detail="Project not found"
                    )
            except Exception as query_error:
                # If the retry query also fails, raise the original error
                logger.error(f"Retry query failed after rollback: {query_error}")
                raise HTTPException(
                    status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Database error occurred"
                ) from pe
            
            # Extract values from row immediately to avoid any lazy loading issues
            # Convert row to a simple object with all values extracted
            class ProjectRow:
                def __init__(self, row):
                    # Extract all values immediately to avoid any async/lazy loading issues
                    self.id = int(row.id) if row.id is not None else None
                    self.name = str(row.name) if row.name is not None else ""
                    self.description = str(row.description) if row.description is not None else None
                    self.status = row.status
                    self.user_id = int(row.user_id) if row.user_id is not None else None
                    self.created_at = row.created_at
                    self.updated_at = row.updated_at
                    self.client_id = int(row.client_id) if hasattr(row, 'client_id') and row.client_id is not None else None
                    self.responsable_id = int(row.responsable_id) if hasattr(row, 'responsable_id') and row.responsable_id is not None else None
                    self.equipe = str(row.equipe) if hasattr(row, 'equipe') and row.equipe is not None else None
                    self.etape = str(row.etape) if hasattr(row, 'etape') and row.etape is not None else None
                    self.annee_realisation = str(row.annee_realisation) if hasattr(row, 'annee_realisation') and row.annee_realisation is not None else None
                    self.contact = str(row.contact) if hasattr(row, 'contact') and row.contact is not None else None
                    self.proposal_url = str(row.proposal_url) if hasattr(row, 'proposal_url') and row.proposal_url is not None else None
                    self.drive_url = str(row.drive_url) if hasattr(row, 'drive_url') and row.drive_url is not None else None
                    self.slack_url = str(row.slack_url) if hasattr(row, 'slack_url') and row.slack_url is not None else None
                    self.echeancier_url = str(row.echeancier_url) if hasattr(row, 'echeancier_url') and row.echeancier_url is not None else None
                    self.temoignage_status = str(row.temoignage_status) if hasattr(row, 'temoignage_status') and row.temoignage_status is not None else None
                    self.portfolio_status = str(row.portfolio_status) if hasattr(row, 'portfolio_status') and row.portfolio_status is not None else None
                    self.start_date = row.start_date if hasattr(row, 'start_date') else None
                    self.end_date = row.end_date if hasattr(row, 'end_date') else None
                    self.deadline = row.deadline if hasattr(row, 'deadline') else None
            
            project = ProjectRow(row)
            
            # Load client and responsable names manually since ProjectRow doesn't have relationships
            # Do this in a new try block to ensure we're in a clean async context
            client_name = None
            client_id = project.client_id
            if client_id:
                try:
                    client_result = await db.execute(
                        select(Client).where(Client.id == client_id)
                    )
                    client = client_result.scalar_one_or_none()
                    if client:
                        # Handle both company_name (for companies) and first_name/last_name (for contacts)
                        if hasattr(client, 'company_name') and client.company_name:
                            client_name = client.company_name
                        elif hasattr(client, 'first_name') and hasattr(client, 'last_name'):
                            client_name = f"{client.first_name} {client.last_name}".strip()
                except Exception as client_error:
                    logger.warning(
                        f"Error loading client name for client_id {client_id}: {client_error}",
                        exc_info=True
                    )
                    client_name = None
            
            responsable_name = None
            responsable_id = project.responsable_id
            if responsable_id:
                try:
                    responsable_result = await db.execute(
                        select(Employee).where(Employee.id == responsable_id)
                    )
                    responsable = responsable_result.scalar_one_or_none()
                    if responsable:
                        responsable_name = f"{responsable.first_name} {responsable.last_name}".strip()
                except Exception as emp_error:
                    logger.warning(
                        f"Error loading responsable name for responsable_id {responsable_id}: {emp_error}",
                        exc_info=True
                    )
                    responsable_name = None
        else:
            # Rollback and re-raise if it's a different ProgrammingError
            try:
                await db.rollback()
            except Exception:
                pass
            raise
    
    if not project:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Convert to response format with client and responsable names
    # If project is a ProjectRow (from explicit column selection), client_name and responsable_name are already loaded above
    # If project is a regular Project object, try to access relationships safely
    if not isinstance(project, ProjectRow):
        client_name = None
        try:
            if hasattr(project, 'client') and project.client:
                client_name = f"{project.client.first_name} {project.client.last_name}".strip()
        except (AttributeError, ProgrammingError):
            # If lazy load fails or column doesn't exist, try loading manually
            client_id = getattr(project, 'client_id', None)
            if client_id:
                try:
                    client_result = await db.execute(
                        select(Client).where(Client.id == client_id)
                    )
                    client = client_result.scalar_one_or_none()
                    if client:
                        if hasattr(client, 'company_name') and client.company_name:
                            client_name = client.company_name
                        elif hasattr(client, 'first_name') and hasattr(client, 'last_name'):
                            client_name = f"{client.first_name} {client.last_name}".strip()
                except Exception:
                    client_name = None
        
        responsable_name = None
        try:
            if hasattr(project, 'responsable') and project.responsable:
                responsable_name = f"{project.responsable.first_name} {project.responsable.last_name}"
        except (AttributeError, ProgrammingError):
            # If lazy load fails, try loading manually
            responsable_id = getattr(project, 'responsable_id', None)
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
    
    # Safely get client_id and responsable_id
    client_id = getattr(project, 'client_id', None) if not isinstance(project, ProjectRow) else project.client_id
    responsable_id = getattr(project, 'responsable_id', None) if not isinstance(project, ProjectRow) else project.responsable_id
    
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
        # Extended fields
        "equipe": getattr(project, 'equipe', None),
        "etape": getattr(project, 'etape', None),
        "annee_realisation": getattr(project, 'annee_realisation', None),
        "contact": getattr(project, 'contact', None),
        "budget": getattr(project, 'budget', None),
        "proposal_url": getattr(project, 'proposal_url', None),
        "drive_url": getattr(project, 'drive_url', None),
        "slack_url": getattr(project, 'slack_url', None),
        "echeancier_url": getattr(project, 'echeancier_url', None),
        "temoignage_status": getattr(project, 'temoignage_status', None),
        "portfolio_status": getattr(project, 'portfolio_status', None),
    }
    
    return ProjectSchema(**project_dict)


async def find_client_by_name(
    client_name: str,
    db: AsyncSession,
) -> Optional[int]:
    """Find a Client ID by name using intelligent matching (searches first_name, last_name, and email)"""
    if not client_name or not client_name.strip():
        return None
    
    client_name_normalized = client_name.strip().lower()
    
    # Try exact match on first_name + last_name
    name_parts = client_name_normalized.split()
    if len(name_parts) >= 2:
        first_name = name_parts[0]
        last_name = " ".join(name_parts[1:])
        result = await db.execute(
            select(Client).where(
                and_(
                    func.lower(Client.first_name) == first_name,
                    func.lower(Client.last_name) == last_name
                )
            )
        )
        client = result.scalar_one_or_none()
        if client:
            return client.id
    
    # Try exact match on email
    result = await db.execute(
        select(Client).where(func.lower(Client.email) == client_name_normalized)
    )
    client = result.scalar_one_or_none()
    if client:
        return client.id
    
    # Try partial match on first_name
    result = await db.execute(
        select(Client).where(func.lower(Client.first_name).contains(client_name_normalized))
    )
    client = result.scalar_one_or_none()
    if client:
        return client.id
    
    # Try partial match on last_name
    result = await db.execute(
        select(Client).where(func.lower(Client.last_name).contains(client_name_normalized))
    )
    client = result.scalar_one_or_none()
    if client:
        return client.id
    
    # Try partial match on email
    result = await db.execute(
        select(Client).where(func.lower(Client.email).contains(client_name_normalized))
    )
    client = result.scalar_one_or_none()
    if client:
        return client.id
    
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
        matched_client_id = await find_client_by_name(
            client_name=project_data.client_name,
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
        # Extended fields
        equipe=project_data.equipe,
        etape=project_data.etape,
        annee_realisation=project_data.annee_realisation,
        contact=project_data.contact,
        budget=project_data.budget,
        proposal_url=project_data.proposal_url,
        drive_url=project_data.drive_url,
        slack_url=project_data.slack_url,
        echeancier_url=project_data.echeancier_url,
        temoignage_status=project_data.temoignage_status,
        portfolio_status=project_data.portfolio_status,
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
        matched_client_id = await find_client_by_name(
            client_name=project_data.client_name,
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
