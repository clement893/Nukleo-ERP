"""
ERP Portal - Dashboard Endpoints
"""

from typing import Annotated, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.permissions import Permission, require_permission
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.erp import ERPDashboardStats
from app.services.erp_service import ERPService

router = APIRouter(prefix="/erp/dashboard", tags=["ERP Portal - Dashboard"])


@router.get("/stats", response_model=ERPDashboardStats)
@require_permission(Permission.ERP_VIEW_REPORTS)
async def get_erp_dashboard_stats(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: User = Depends(get_current_user),
    department: Optional[str] = Query(None, description="Filter by department"),
) -> ERPDashboardStats:
    """
    Get dashboard statistics for ERP
    
    Returns aggregated statistics including:
    - Order counts and totals
    - Invoice counts and amounts
    - Client counts
    - Product and inventory stats
    - Revenue metrics
    
    Optionally filtered by department.
    
    Requires ERP_VIEW_REPORTS permission.
    """
    service = ERPService(db)
    stats = await service.get_erp_dashboard_stats(
        user_id=current_user.id,
        department=department,
    )
    
    return ERPDashboardStats(**stats)

