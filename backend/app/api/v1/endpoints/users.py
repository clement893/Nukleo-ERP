"""
User Endpoints with Pagination and Query Optimization
Example implementation of optimized endpoints
"""

from typing import Annotated, Optional
from fastapi import APIRouter, Depends, Query
from fastapi.responses import JSONResponse
from starlette.requests import Request
from starlette.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
import json

from app.core.database import get_db
from app.core.pagination import PaginationParams, paginate_query, PaginatedResponse, get_pagination_params
from app.core.query_optimization import QueryOptimizer
from app.core.cache_enhanced import cache_query
from app.core.rate_limit import rate_limit_decorator
from app.core.logging import logger
from app.models.user import User
from app.schemas.user import UserResponse, UserUpdate
from app.dependencies import get_current_user
from fastapi import HTTPException, status
from typing import Annotated

router = APIRouter()

from app.services.invitation_service import InvitationService
from app.schemas.invitation import InvitationResponse
from pydantic import EmailStr, Field, BaseModel


# Helper function to convert UUID user_id to integer
def uuid_to_user_id(uuid_value: Optional[str]) -> Optional[int]:
    """Convert UUID-formatted user_id back to integer"""
    if not uuid_value:
        return None
    try:
        from uuid import UUID
        uuid_obj = UUID(uuid_value)
        # Extract integer from UUID format: 00000000-0000-0000-0000-{user_id:012d}
        uuid_str = str(uuid_obj)
        parts = uuid_str.split('-')
        if len(parts) == 5:
            # Last part contains the user_id as zero-padded string
            user_id_str = parts[-1].lstrip('0') or '0'
            return int(user_id_str)
    except Exception:
        pass
    return None


@router.get("/", response_model=PaginatedResponse[UserResponse])
@rate_limit_decorator("100/hour")
@cache_query(expire=300, tags=["users"])
async def list_users(
    request: Request,
    pagination: Annotated[PaginationParams, Depends(get_pagination_params)],
    db: Annotated[AsyncSession, Depends(get_db)],
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    search: Optional[str] = Query(None, description="Search by name or email"),
) -> PaginatedResponse[UserResponse]:
    """
    List users with pagination and filtering
    
    Features:
    - Pagination support
    - Filtering by active status
    - Search functionality
    - Query optimization with eager loading
    - Result caching
    """
    # Build query
    query = select(User)
    
    # Apply filters
    filters = []
    if is_active is not None:
        filters.append(User.is_active == is_active)
    
    if search:
        search_filter = or_(
            User.email.ilike(f"%{search}%"),
            User.first_name.ilike(f"%{search}%"),
            User.last_name.ilike(f"%{search}%"),
        )
        filters.append(search_filter)
    
    if filters:
        query = query.where(and_(*filters))
    
    # Create base query for counting (without eager loading)
    from sqlalchemy import func
    # Build count query from scratch to ensure it's clean
    count_query = select(func.count()).select_from(User)
    if filters:
        count_query = count_query.where(and_(*filters))
    
    # Optimize query with eager loading (prevent N+1 queries)
    # Note: roles relationship may not exist, so we skip if it doesn't
    try:
        query = QueryOptimizer.add_eager_loading(query, ["roles"], strategy="selectin")
    except (AttributeError, Exception) as e:
        # roles relationship doesn't exist or other error, skip eager loading
        logger.warning(f"Could not add eager loading for roles: {e}")
        pass
    
    # Order by created_at (uses index)
    query = query.order_by(User.created_at.desc())
    
    # Paginate query with separate count query to avoid issues with eager loading
    try:
        # First, get the count
        count_result = await db.execute(count_query)
        total = count_result.scalar_one() or 0
        
        # Then, get the paginated items (without eager loading to avoid issues)
        paginated_query = query.offset(pagination.offset).limit(pagination.limit)
        result = await db.execute(paginated_query)
        users = result.scalars().all()
        
        # Load employees for users (to show linked employee)
        from app.models.employee import Employee
        employees_result = await db.execute(
            select(Employee).where(Employee.user_id.in_([u.id for u in users]))
        )
        employees_by_user_id = {emp.user_id: emp for emp in employees_result.scalars().all()}
        
        # Convert SQLAlchemy User objects to UserResponse schemas
        user_responses = []
        for user in users:
            try:
                # Get linked employee if exists
                linked_employee = employees_by_user_id.get(user.id)
                
                # Convert SQLAlchemy User to dict, excluding relationships
                # Handle datetime conversion explicitly
                user_dict = {
                    "id": user.id,
                    "email": user.email,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "is_active": user.is_active,
                    "created_at": user.created_at.isoformat() if hasattr(user.created_at, 'isoformat') else str(user.created_at),
                    "updated_at": user.updated_at.isoformat() if hasattr(user.updated_at, 'isoformat') else str(user.updated_at),
                }
                
                # Add employee info if linked
                if linked_employee:
                    user_dict["employee"] = {
                        "id": linked_employee.id,
                        "first_name": linked_employee.first_name,
                        "last_name": linked_employee.last_name,
                        "email": linked_employee.email,
                    }
                
                user_responses.append(UserResponse.model_validate(user_dict))
            except Exception as validation_error:
                logger.error(
                    f"Error validating user {user.id} (email: {user.email}): {validation_error}\n"
                    f"  User data: id={user.id}, email={user.email}, first_name={user.first_name}, "
                    f"last_name={user.last_name}, is_active={user.is_active}, "
                    f"created_at={user.created_at}, updated_at={user.updated_at}",
                    exc_info=True
                )
                # Skip this user if validation fails
                continue
        
        paginated_response = PaginatedResponse.create(
            items=user_responses,
            total=total,
            page=pagination.page,
            page_size=pagination.page_size,
        )
        # Convert to JSONResponse for slowapi compatibility
        # Use model_dump with mode='json' to ensure datetime serialization
        return JSONResponse(
            content=paginated_response.model_dump(mode='json'),
            status_code=200
        )
    except Exception as e:
        logger.error(f"Error paginating users query: {e}", exc_info=True)
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        # Try without eager loading as fallback
        try:
            query_fallback = select(User).order_by(User.created_at.desc())
            if filters:
                query_fallback = query_fallback.where(and_(*filters))
            paginated_result = await paginate_query(db, query_fallback, pagination, count_query=count_query)
            # Convert to UserResponse with individual error handling
            user_responses = []
            for user in paginated_result.items:
                try:
                    # Convert SQLAlchemy User to dict, excluding relationships
                    # This prevents issues with eager-loaded relationships
                    user_dict = {
                        "id": user.id,
                        "email": user.email,
                        "first_name": user.first_name,
                        "last_name": user.last_name,
                        "is_active": user.is_active,
                        "created_at": user.created_at.isoformat() if hasattr(user.created_at, 'isoformat') else str(user.created_at),
                        "updated_at": user.updated_at.isoformat() if hasattr(user.updated_at, 'isoformat') else str(user.updated_at),
                    }
                    user_responses.append(UserResponse.model_validate(user_dict))
                except Exception as validation_error:
                    logger.error(
                        f"Error validating user {user.id} (email: {user.email}) in fallback: {validation_error}\n"
                        f"  User data: id={user.id}, email={user.email}, first_name={user.first_name}, "
                        f"last_name={user.last_name}, is_active={user.is_active}, "
                        f"created_at={user.created_at}, updated_at={user.updated_at}",
                        exc_info=True
                    )
                    # Skip this user if validation fails
                    continue
            
            paginated_response = PaginatedResponse.create(
                items=user_responses,
                total=paginated_result.total,
                page=paginated_result.page,
                page_size=paginated_result.page_size,
            )
            # Convert to JSONResponse for slowapi compatibility
            # Use model_dump with mode='json' to ensure datetime serialization
            return JSONResponse(
                content=paginated_response.model_dump(mode='json'),
                status_code=200
            )
        except Exception as fallback_error:
            logger.error(f"Error in fallback query: {fallback_error}", exc_info=True)
            # Last resort: return empty result instead of crashing
            try:
                paginated_response = PaginatedResponse.create(
                    items=[],
                    total=0,
                    page=pagination.page,
                    page_size=pagination.page_size,
                )
                # Convert to JSONResponse for slowapi compatibility
                # Use model_dump with mode='json' to ensure datetime serialization
                return JSONResponse(
                    content=paginated_response.model_dump(mode='json'),
                    status_code=200
                )
            except Exception as final_error:
                logger.error(f"Error creating empty response: {final_error}", exc_info=True)
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Failed to retrieve users: {str(fallback_error)}"
                )


@router.get("/me", response_model=UserResponse)
@rate_limit_decorator("100/hour")
async def get_current_user(
    request: Request,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> UserResponse:
    """
    Get current user profile
    
    Returns the authenticated user's profile information.
    """
    try:
        logger.info(f"Getting current user profile for: {current_user.email}")
        # Build UserResponse manually to avoid lazy loading issues with SQLAlchemy relationships
        # This prevents greenlet_spawn errors when Pydantic tries to serialize the model
        return UserResponse(
            id=current_user.id,
            email=current_user.email,
            first_name=current_user.first_name,
            last_name=current_user.last_name,
            avatar=getattr(current_user, 'avatar', None),
            is_active=current_user.is_active,
            created_at=current_user.created_at,
            updated_at=current_user.updated_at,
        )
    except Exception as e:
        logger.error(f"Error getting current user profile: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve user profile: {str(e)}"
        )


@router.get("/{user_id}", response_model=UserResponse)
@rate_limit_decorator("200/hour")
@cache_query(expire=600, tags=["users"])
async def get_user(
    request: Request,
    user_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> UserResponse:
    """
    Get user by ID with query optimization
    
    Features:
    - Eager loading of relationships
    - Result caching
    """
    # Build optimized query
    query = select(User).where(User.id == user_id)
    
    # Eager load relationships to prevent N+1 queries
    # Note: relationships may not exist, so we skip if they don't
    try:
        query = QueryOptimizer.add_eager_loading(query, ["roles", "team_memberships"], strategy="selectin")
    except AttributeError:
        # relationships don't exist, skip eager loading
        pass
    
    result = await db.execute(query)
    user = result.scalar_one_or_none()
    
    if not user:
        from fastapi import HTTPException, status
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: int,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Delete a user (admin/superadmin only)
    
    Features:
    - Requires admin or superadmin permissions
    - Prevents self-deletion
    - Prevents deletion of last superadmin
    - Hard delete (removes user from database)
    """
    logger.info(f"[DELETE USER] Starting deletion process for user_id={user_id}, current_user_id={current_user.id}, current_user_email={current_user.email}")
    logger.info(f"[DELETE USER] Request method: {request.method}, path: {request.url.path}")
    user_email = None
    try:
        from app.dependencies import is_admin_or_superadmin
        
        # Check if user is admin or superadmin
        logger.info(f"[DELETE USER] Checking admin permissions for user {current_user.id}")
        is_admin = await is_admin_or_superadmin(current_user, db)
        logger.info(f"[DELETE USER] Admin check result: {is_admin}")
        if not is_admin:
            logger.warning(f"[DELETE USER] User {current_user.id} is not admin, denying deletion")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only administrators can delete users"
            )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            f"Error checking admin permissions for user {current_user.id}: {e}",
            exc_info=True
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to verify user permissions"
        )
    
    # Prevent self-deletion
    logger.info(f"[DELETE USER] Checking self-deletion prevention: user_id={user_id}, current_user_id={current_user.id}")
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot delete your own account"
        )
    
    # Get user to delete
    try:
        logger.info(f"[DELETE USER] Querying database for user {user_id}")
        result = await db.execute(select(User).where(User.id == user_id))
        user_to_delete = result.scalar_one_or_none()
        logger.info(f"[DELETE USER] User found: {user_to_delete is not None}")
        
        if not user_to_delete:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Store email before modification for logging
        user_email = user_to_delete.email if user_to_delete else f"user_id_{user_id}"
        
        # Check if user is the last superadmin
        try:
            from app.models import Role, UserRole
            superadmin_role_result = await db.execute(
                select(Role).where(Role.slug == "superadmin")
            )
            superadmin_role = superadmin_role_result.scalar_one_or_none()
            
            if superadmin_role:
                superadmin_users_result = await db.execute(
                    select(UserRole)
                    .join(Role)
                    .where(Role.slug == "superadmin")
                    .where(Role.is_active == True)
                )
                superadmin_users = list(superadmin_users_result.scalars().all())
                
                # Check if user to delete is a superadmin
                user_is_superadmin = any(
                    ur.user_id == user_id for ur in superadmin_users
                )
                
                if user_is_superadmin and len(superadmin_users) <= 1:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Cannot delete the last superadmin user"
                    )
        except HTTPException:
            raise
        except Exception as e:
            logger.warning(
                f"Error checking superadmin status for user {user_id}: {e}",
                exc_info=True
            )
            # Continue with deletion if we can't verify superadmin status
            # This is a safety measure - we'll log the warning but allow the deletion
        
        # Perform hard delete (remove from database)
        # Using hard delete like other endpoints (delete_post, delete_page, etc.)
        logger.info(f"[DELETE USER] Performing hard delete for user {user_id} ({user_email})")
        await db.delete(user_to_delete)
        logger.info(f"[DELETE USER] User deleted from session, committing transaction")
        await db.commit()
        logger.info(f"[DELETE USER] Transaction committed successfully. User {user_id} ({user_email}) deleted by {current_user.email}")
        
        # Log deletion attempt (after successful deletion)
        # Use a separate try/except to ensure audit logging failures don't break the deletion
        if user_email:
            try:
                from app.core.security_audit import SecurityAuditLogger, SecurityEventType
                # Use None for db to create a separate session for audit logging
                # This ensures the audit log is saved even if there are issues with the main transaction
                await SecurityAuditLogger.log_event(
                    db=None,  # Create separate session for audit logging
                    event_type=SecurityEventType.DATA_DELETED,
                    description=f"User '{user_email}' deleted",
                    user_id=current_user.id,
                    user_email=current_user.email,
                    ip_address=request.client.host if request.client else None,
                    user_agent=request.headers.get("user-agent"),
                    request_method=request.method,
                    request_path=str(request.url.path),
                    severity="warning",
                    success="success",
                    metadata={
                        "resource_type": "user",
                        "deleted_user_id": user_id,
                        "deleted_user_email": user_email,
                        "action": "deleted"
                    }
                )
            except Exception as e:
                # Log the error but don't fail the request - audit logging is non-critical
                logger.warning(
                    f"Failed to log user deletion event for user {user_id}: {e}",
                    exc_info=True
                )
                # Continue - the deletion was successful, audit logging failure is not critical
        
        # Invalidate cache for users list and user detail
        try:
            from app.core.cache_enhanced import enhanced_cache
            invalidated = await enhanced_cache.invalidate_by_tags(["users"])
            logger.info(f"[DELETE USER] Invalidated {invalidated} cache entries for tag 'users'")
        except Exception as cache_error:
            # Log but don't fail the request if cache invalidation fails
            logger.warning(f"[DELETE USER] Failed to invalidate cache: {cache_error}", exc_info=True)
        
        # Return None - FastAPI will automatically convert to 204 No Content
        # This avoids slowapi headers injection issues with 204 responses
        logger.info(f"[DELETE USER] User {user_id} ({user_email}) successfully deleted by {current_user.email}")
        return None
        
    except HTTPException as http_exc:
        # Re-raise HTTP exceptions as-is
        logger.warning(f"[DELETE USER] HTTPException raised for user {user_id}: {http_exc.status_code} - {http_exc.detail}")
        raise
    except Exception as db_error:
        logger.error(f"[DELETE USER] Exception occurred while deleting user {user_id}: {db_error}", exc_info=True)
        logger.error(f"[DELETE USER] Exception type: {type(db_error).__name__}")
        logger.error(f"[DELETE USER] Exception args: {db_error.args}")
        try:
            await db.rollback()
        except Exception:
            pass  # Ignore rollback errors if session is already closed
        
        error_msg = str(db_error)
        error_type = type(db_error).__name__
        
        logger.error(
            f"Failed to delete user {user_id}: {error_msg}",
            exc_info=True,
            context={
                "user_id": user_id,
                "deleted_by": current_user.id if current_user else None,
                "error_type": error_type,
                "error_message": error_msg,
                "user_email": user_email
            }
        )
        
        # Check if it's a foreign key constraint error
        if "foreign key" in error_msg.lower() or "constraint" in error_msg.lower() or "violates foreign key" in error_msg.lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete user: User has associated records that prevent deletion. Please remove or reassign related data first."
            )
        
        # Check for other database errors
        if "database" in error_msg.lower() or "connection" in error_msg.lower() or "timeout" in error_msg.lower():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database error occurred. Please try again later."
            )
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An internal error occurred. Please contact support."
        )


@router.put("/me", response_model=UserResponse)
@rate_limit_decorator("10/minute")
async def update_current_user(
    request: Request,
    user_data: UserUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> UserResponse:
    """
    Update current user profile
    
    Allows authenticated users to update their own profile information.
    Only updates fields that are provided (partial update).
    
    Args:
        user_data: User update data (email, first_name, last_name)
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        Updated user information
        
    Raises:
        HTTPException: If email is already taken by another user
    """
    try:
        logger.info(f"Updating user profile for: {current_user.email}")
        
        # Validate email format if provided
        if user_data.email is not None:
            # Email validation is handled by Pydantic EmailStr, but we check here for safety
            if not user_data.email or user_data.email.strip() == '':
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email cannot be empty"
                )
        
        # Check if email is being updated and if it's already taken
        if user_data.email and user_data.email != current_user.email:
            result = await db.execute(
                select(User).where(User.email == user_data.email)
            )
            existing_user = result.scalar_one_or_none()
            if existing_user and existing_user.id != current_user.id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email is already taken"
                )
        
        # Update only provided fields
        update_data = user_data.model_dump(exclude_unset=True, exclude_none=False)
        
        # Filter to only allow valid User model fields that users can modify themselves
        # Note: is_active should NOT be modifiable by users themselves (only admins)
        allowed_fields = {'email', 'first_name', 'last_name', 'avatar'}
        filtered_data = {}
        for k, v in update_data.items():
            if k in allowed_fields and hasattr(current_user, k):
                # Convert empty strings to None for optional string fields
                if k in ('first_name', 'last_name', 'avatar') and v == '':
                    v = None
                # Skip None email updates (email is required)
                if k == 'email' and (v is None or v == ''):
                    continue
                # Skip is_active - users cannot modify their own active status
                if k == 'is_active':
                    continue
                filtered_data[k] = v
        
        # If no valid fields to update, return current user
        if not filtered_data:
            logger.warning(f"No valid fields to update for user: {current_user.email}")
            return UserResponse(
                id=current_user.id,
                email=current_user.email,
                first_name=current_user.first_name,
                last_name=current_user.last_name,
                avatar=getattr(current_user, 'avatar', None),
                is_active=current_user.is_active,
                created_at=current_user.created_at,
                updated_at=current_user.updated_at,
            )
        
        # Update user object with filtered data
        for field, value in filtered_data.items():
            setattr(current_user, field, value)
        
        # Save changes
        await db.commit()
        await db.refresh(current_user)
        
        logger.info(f"User profile updated successfully for: {current_user.email}")
        
        # Build UserResponse manually to avoid lazy loading issues with SQLAlchemy relationships
        # This prevents greenlet_spawn errors when Pydantic tries to serialize the model
        # Note: UserResponse from schemas.user expects datetime objects, not strings
        return UserResponse(
            id=current_user.id,
            email=current_user.email,
            first_name=current_user.first_name,
            last_name=current_user.last_name,
            avatar=getattr(current_user, 'avatar', None),
            is_active=current_user.is_active,
            created_at=current_user.created_at,
            updated_at=current_user.updated_at,
        )
        
    except HTTPException:
        raise
    except ValueError as e:
        # Pydantic validation errors
        logger.error(f"Validation error updating user profile: {e}", exc_info=True)
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid data: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Error updating user profile: {e}", exc_info=True)
        await db.rollback()
        error_detail = str(e)
        error_type = type(e).__name__
        
        # Provide more specific error message if possible
        if "not-null" in error_detail.lower() or "null value" in error_detail.lower():
            error_detail = "One or more required fields are missing"
        elif "duplicate" in error_detail.lower() or "unique" in error_detail.lower():
            error_detail = "Email is already taken"
        elif "value too long" in error_detail.lower() or "string length" in error_detail.lower():
            error_detail = "One or more fields exceed maximum length"
        elif "integrity" in error_detail.lower():
            error_detail = "Database integrity constraint violation"
        elif "operational" in error_detail.lower() or "connection" in error_detail.lower():
            error_detail = "Database connection error. Please try again later."
        else:
            # For unknown errors, provide a generic message but log the full error
            error_detail = "An error occurred while updating your profile"
            logger.error(f"Unexpected error type {error_type}: {error_detail}", exc_info=True)
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=error_detail
        )


class UserInviteRequest(BaseModel):
    """Schema for inviting a user"""
    email: EmailStr = Field(..., description="Email address to invite")
    role_id: Optional[int] = Field(None, description="Role ID to assign to the user")
    message: Optional[str] = Field(None, description="Custom invitation message")
    expires_in_days: int = Field(7, ge=1, le=30, description="Days until invitation expires")


@router.post("/invite", response_model=InvitationResponse, status_code=status.HTTP_201_CREATED)
@rate_limit_decorator("10/minute")
async def invite_user(
    request: Request,
    invite_data: UserInviteRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> InvitationResponse:
    """
    Invite a user to create an account
    
    Sends an invitation email to the specified email address with a link to create an account.
    The invitation includes a token that can be used during registration.
    
    Args:
        invite_data: Invitation data (email, role_id, message, expires_in_days)
        current_user: Current authenticated user (inviter)
        db: Database session
        
    Returns:
        Created invitation
        
    Raises:
        HTTPException: If user already exists or invitation fails
    """
    try:
        logger.info(f"User invitation request from {current_user.email} to {invite_data.email}")
        
        # Check if user already exists
        result = await db.execute(
            select(User).where(User.email == invite_data.email)
        )
        existing_user = result.scalar_one_or_none()
        
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A user with this email already exists"
            )
        
        # Check if there's already a pending invitation for this email
        from app.models import Invitation
        result = await db.execute(
            select(Invitation)
            .where(Invitation.email == invite_data.email)
            .where(Invitation.status == "pending")
            .where(Invitation.team_id.is_(None))  # User invitation (no team)
        )
        existing_invitation = result.scalar_one_or_none()
        
        if existing_invitation:
            # Check if invitation is still valid
            if existing_invitation.is_valid():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="A pending invitation already exists for this email"
                )
        
        # Create invitation (without team_id for user invitation)
        invitation_service = InvitationService(db)
        invitation = await invitation_service.create_invitation(
            email=invite_data.email,
            invited_by_id=current_user.id,
            team_id=None,  # User invitation, not team invitation
            role_id=invite_data.role_id,
            message=invite_data.message,
            expires_in_days=invite_data.expires_in_days,
        )
        
        logger.info(f"User invitation created successfully: {invitation.id} for {invite_data.email}")
        
        return InvitationResponse.model_validate(invitation)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating user invitation: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create invitation: {str(e)}"
        )


class UserInviteRequestOptional(BaseModel):
    """Optional invitation data for inactive users"""
    role_id: Optional[int] = None
    message: Optional[str] = None


@router.post("/{user_id}/send-invitation", response_model=InvitationResponse, status_code=status.HTTP_201_CREATED)
@rate_limit_decorator("10/hour")
async def send_invitation_to_inactive_user(
    request: Request,
    user_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    invite_data: Optional[UserInviteRequestOptional] = None,
):
    """
    Send an invitation to an inactive user to activate their account
    
    This endpoint allows admins to send an invitation email to users who have
    inactive accounts, enabling them to create a password and activate their account.
    """
    try:
        from app.dependencies import is_admin_or_superadmin
        
        # Check if user is admin or superadmin
        is_admin = await is_admin_or_superadmin(current_user, db)
        if not is_admin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only administrators can send invitations to users"
            )
        
        # Get the target user
        result = await db.execute(select(User).where(User.id == user_id))
        target_user = result.scalar_one_or_none()
        
        if not target_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Only send invitation to inactive users
        if target_user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot send invitation to an active user. User account is already active."
            )
        
        # Check if there's already a pending invitation for this user
        from app.models import Invitation
        from datetime import datetime, timezone
        
        existing_invitation_result = await db.execute(
            select(Invitation)
            .where(Invitation.email == target_user.email.lower())
            .where(Invitation.status == "pending")
        )
        existing_invitation = existing_invitation_result.scalar_one_or_none()
        
        if existing_invitation:
            # Check if invitation is still valid (not expired)
            if existing_invitation.expires_at > datetime.now(timezone.utc):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="A pending invitation already exists for this user. Please wait for it to expire or cancel it first."
                )
            else:
                # Mark expired invitation as expired
                existing_invitation.status = "expired"
                await db.commit()
        
        # Create invitation (without team_id for user invitation)
        invitation_service = InvitationService(db)
        
        # Get default role if provided, otherwise None
        role_id = invite_data.role_id if invite_data and invite_data.role_id else None
        message = invite_data.message if invite_data and invite_data.message else "You have been invited to activate your account on our platform. Please click the link below to set your password and activate your account."
        
        invitation = await invitation_service.create_invitation(
            email=target_user.email,
            invited_by_id=current_user.id,
            team_id=None,  # User invitation, not team invitation
            role_id=role_id,
            message=message,
            expires_in_days=7,  # Default 7 days expiration
        )
        
        logger.info(f"Invitation sent to inactive user {user_id} ({target_user.email}) by {current_user.email}")
        
        return InvitationResponse.model_validate(invitation)
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending invitation to user {user_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send invitation: {str(e)}"
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending invitation to user {user_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send invitation: {str(e)}"
        )
