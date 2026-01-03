"""
Project Budget Items Endpoints
API endpoints for managing project budget items
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status as http_status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from decimal import Decimal

from app.core.database import get_db
from app.dependencies import get_current_user
from app.models.project import Project
from app.models.user import User
from app.models.project_budget_item import ProjectBudgetItem, BudgetCategory
from app.schemas.project_budget_item import (
    ProjectBudgetItem as ProjectBudgetItemSchema,
    ProjectBudgetItemCreate,
    ProjectBudgetItemUpdate,
    ProjectBudgetSummary,
)
from app.core.logging import logger

router = APIRouter()


@router.get("/{project_id}/budget-items", response_model=List[ProjectBudgetItemSchema])
async def get_project_budget_items(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all budget items for a project"""
    try:
        # Check if project exists and user has access
        project_result = await db.execute(
            select(Project).where(Project.id == project_id)
        )
        project = project_result.scalar_one_or_none()
        
        if not project:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND,
                detail="Project not found"
            )
        
        # Check if user owns the project
        if project.user_id != current_user.id:
            raise HTTPException(
                status_code=http_status.HTTP_403_FORBIDDEN,
                detail="You don't have access to this project"
            )
        
        # Get all budget items for the project
        result = await db.execute(
            select(ProjectBudgetItem)
            .where(ProjectBudgetItem.project_id == project_id)
            .order_by(ProjectBudgetItem.created_at)
        )
        
        items = result.scalars().all()
        return [ProjectBudgetItemSchema.model_validate(item) for item in items]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting project budget items: {e}", exc_info=True)
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error getting project budget items"
        )


@router.get("/{project_id}/budget-items/summary", response_model=ProjectBudgetSummary)
async def get_project_budget_summary(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get budget summary for a project"""
    try:
        # Check if project exists and user has access
        project_result = await db.execute(
            select(Project).where(Project.id == project_id)
        )
        project = project_result.scalar_one_or_none()
        
        if not project:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND,
                detail="Project not found"
            )
        
        # Check if user owns the project
        if project.user_id != current_user.id:
            raise HTTPException(
                status_code=http_status.HTTP_403_FORBIDDEN,
                detail="You don't have access to this project"
            )
        
        # Get all budget items for the project
        result = await db.execute(
            select(ProjectBudgetItem)
            .where(ProjectBudgetItem.project_id == project_id)
        )
        
        items = result.scalars().all()
        
        # Calculate summary
        total_budget = Decimal('0.00')
        by_category = {}
        
        for item in items:
            total_budget += item.amount
            category_key = item.category.value
            if category_key not in by_category:
                by_category[category_key] = Decimal('0.00')
            by_category[category_key] += item.amount
        
        return ProjectBudgetSummary(
            total_budget=total_budget,
            items_count=len(items),
            by_category=by_category
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting project budget summary: {e}", exc_info=True)
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error getting project budget summary"
        )


@router.post("/{project_id}/budget-items", response_model=ProjectBudgetItemSchema, status_code=http_status.HTTP_201_CREATED)
async def create_project_budget_item(
    project_id: int,
    item_data: ProjectBudgetItemCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new budget item for a project"""
    try:
        # Check if project exists and user has access
        project_result = await db.execute(
            select(Project).where(Project.id == project_id)
        )
        project = project_result.scalar_one_or_none()
        
        if not project:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND,
                detail="Project not found"
            )
        
        # Check if user owns the project
        if project.user_id != current_user.id:
            raise HTTPException(
                status_code=http_status.HTTP_403_FORBIDDEN,
                detail="You don't have access to this project"
            )
        
        # Create new budget item
        new_item = ProjectBudgetItem(
            project_id=project_id,
            category=item_data.category,
            description=item_data.description,
            amount=item_data.amount,
            quantity=item_data.quantity,
            unit_price=item_data.unit_price,
            notes=item_data.notes,
        )
        
        db.add(new_item)
        await db.commit()
        await db.refresh(new_item)
        
        logger.info(f"Created budget item {new_item.id} for project {project_id}")
        
        return ProjectBudgetItemSchema.model_validate(new_item)
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error creating project budget item: {e}", exc_info=True)
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error creating project budget item"
        )


@router.put("/{project_id}/budget-items/{item_id}", response_model=ProjectBudgetItemSchema)
async def update_project_budget_item(
    project_id: int,
    item_id: int,
    item_data: ProjectBudgetItemUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a budget item for a project"""
    try:
        # Check if project exists and user has access
        project_result = await db.execute(
            select(Project).where(Project.id == project_id)
        )
        project = project_result.scalar_one_or_none()
        
        if not project:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND,
                detail="Project not found"
            )
        
        # Check if user owns the project
        if project.user_id != current_user.id:
            raise HTTPException(
                status_code=http_status.HTTP_403_FORBIDDEN,
                detail="You don't have access to this project"
            )
        
        # Get the budget item
        item_result = await db.execute(
            select(ProjectBudgetItem).where(
                and_(
                    ProjectBudgetItem.id == item_id,
                    ProjectBudgetItem.project_id == project_id
                )
            )
        )
        item = item_result.scalar_one_or_none()
        
        if not item:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND,
                detail="Budget item not found"
            )
        
        # Update the item
        update_data = item_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(item, field, value)
        
        await db.commit()
        await db.refresh(item)
        
        logger.info(f"Updated budget item {item_id} for project {project_id}")
        
        return ProjectBudgetItemSchema.model_validate(item)
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error updating project budget item: {e}", exc_info=True)
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error updating project budget item"
        )


@router.delete("/{project_id}/budget-items/{item_id}", status_code=http_status.HTTP_204_NO_CONTENT)
async def delete_project_budget_item(
    project_id: int,
    item_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a budget item from a project"""
    try:
        # Check if project exists and user has access
        project_result = await db.execute(
            select(Project).where(Project.id == project_id)
        )
        project = project_result.scalar_one_or_none()
        
        if not project:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND,
                detail="Project not found"
            )
        
        # Check if user owns the project
        if project.user_id != current_user.id:
            raise HTTPException(
                status_code=http_status.HTTP_403_FORBIDDEN,
                detail="You don't have access to this project"
            )
        
        # Get the budget item
        item_result = await db.execute(
            select(ProjectBudgetItem).where(
                and_(
                    ProjectBudgetItem.id == item_id,
                    ProjectBudgetItem.project_id == project_id
                )
            )
        )
        item = item_result.scalar_one_or_none()
        
        if not item:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND,
                detail="Budget item not found"
            )
        
        await db.delete(item)
        await db.commit()
        
        logger.info(f"Deleted budget item {item_id} from project {project_id}")
        
        return None
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error deleting project budget item: {e}", exc_info=True)
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error deleting project budget item"
        )
