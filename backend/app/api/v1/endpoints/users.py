"""
User Endpoints with Pagination and Query Optimization
Example implementation of optimized endpoints
"""

from typing import Annotated, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_

from app.core.database import get_db
from app.core.pagination import PaginationParams, paginate_query, PaginatedResponse
from app.core.query_optimization import QueryOptimizer
from app.core.cache_enhanced import cache_query
from app.core.rate_limit import rate_limit_decorator
from app.models.user import User
from app.schemas.user import UserResponse

router = APIRouter()


@router.get("/", response_model=PaginatedResponse[UserResponse])
@rate_limit_decorator("100/hour")
@cache_query(expire=300, tags=["users"])
async def list_users(
    pagination: Annotated[PaginationParams, Depends()],
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
    
    # Optimize query with eager loading (prevent N+1 queries)
    # Note: roles relationship may not exist, so we skip if it doesn't
    try:
        query = QueryOptimizer.add_eager_loading(query, ["roles"], strategy="selectin")
    except AttributeError:
        # roles relationship doesn't exist, skip eager loading
        pass
    
    # Order by created_at (uses index)
    query = query.order_by(User.created_at.desc())
    
    # Paginate query
    result = await paginate_query(db, query, pagination)
    
    return result


@router.get("/{user_id}", response_model=UserResponse)
@rate_limit_decorator("200/hour")
@cache_query(expire=600, tags=["users"])
async def get_user(
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
