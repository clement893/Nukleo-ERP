"""
Finances - Compte de Dépenses Endpoints
API endpoints for managing expense accounts
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from app.core.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.core.logging import logger

router = APIRouter(prefix="/finances/compte-depenses", tags=["finances-compte-depenses"])


@router.get("/")
async def list_compte_depenses(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
):
    """
    List all expense accounts
    TODO: Implement expense account listing logic
    """
    logger.info(f"Listing expense accounts for user {current_user.id}")
    # TODO: Implement expense account listing
    return []


@router.get("/{expense_account_id}")
async def get_compte_depenses(
    expense_account_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get a specific expense account by ID
    TODO: Implement expense account retrieval logic
    """
    logger.info(f"Getting expense account {expense_account_id} for user {current_user.id}")
    # TODO: Implement expense account retrieval
    return {"id": expense_account_id, "message": "Not implemented yet"}
