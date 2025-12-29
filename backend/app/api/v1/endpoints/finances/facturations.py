"""
Finances - Facturations Endpoints
API endpoints for managing invoices
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from app.core.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.core.logging import logger

router = APIRouter(prefix="/finances/facturations", tags=["finances-facturations"])


@router.get("/")
async def list_facturations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
):
    """
    List all invoices (facturations)
    TODO: Implement invoice listing logic
    """
    logger.info(f"Listing invoices for user {current_user.id}")
    # TODO: Implement invoice listing
    return []


@router.get("/{invoice_id}")
async def get_facturation(
    invoice_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get a specific invoice by ID
    TODO: Implement invoice retrieval logic
    """
    logger.info(f"Getting invoice {invoice_id} for user {current_user.id}")
    # TODO: Implement invoice retrieval
    return {"id": invoice_id, "message": "Not implemented yet"}
