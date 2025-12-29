"""
Finances - Rapport Endpoints
API endpoints for financial reports
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from datetime import datetime

from app.core.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.core.logging import logger

router = APIRouter(prefix="/finances/rapport", tags=["finances-rapport"])


@router.get("/")
async def list_rapports(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
):
    """
    List all financial reports
    TODO: Implement report listing logic
    """
    logger.info(f"Listing reports for user {current_user.id}")
    # TODO: Implement report listing
    return []


@router.get("/{report_id}")
async def get_rapport(
    report_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get a specific financial report by ID
    TODO: Implement report retrieval logic
    """
    logger.info(f"Getting report {report_id} for user {current_user.id}")
    # TODO: Implement report retrieval
    return {"id": report_id, "message": "Not implemented yet"}
