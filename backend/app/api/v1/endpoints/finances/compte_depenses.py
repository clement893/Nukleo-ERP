"""
Finances - Compte de Dépenses Endpoints
API endpoints for managing expense accounts
"""

from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, and_
from sqlalchemy.orm import selectinload
from typing import List, Optional
from datetime import datetime

from app.core.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.expense_account import ExpenseAccount, ExpenseAccountStatus
from app.schemas.expense_account import (
    ExpenseAccountCreate,
    ExpenseAccountUpdate,
    ExpenseAccountResponse,
    ExpenseAccountAction,
)
from app.core.logging import logger

router = APIRouter(prefix="/finances/compte-depenses", tags=["finances-compte-depenses"])


async def generate_account_number(db: AsyncSession) -> str:
    """Generate a unique account number"""
    year = datetime.now().year
    # Get the last account number for this year
    result = await db.execute(
        select(func.max(ExpenseAccount.account_number))
        .where(ExpenseAccount.account_number.like(f"EXP-{year}-%"))
    )
    last_number = result.scalar()
    
    if last_number:
        # Extract the number part and increment
        try:
            last_num = int(last_number.split("-")[-1])
            new_num = last_num + 1
        except (ValueError, IndexError):
            new_num = 1
    else:
        new_num = 1
    
    return f"EXP-{year}-{new_num:04d}"


@router.get("/", response_model=List[ExpenseAccountResponse])
async def list_compte_depenses(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status: Optional[str] = Query(None, description="Filter by status"),
    employee_id: Optional[int] = Query(None, description="Filter by employee ID"),
    search: Optional[str] = Query(None, description="Search by title or account number"),
):
    """
    List all expense accounts
    Admin can see all, employees see only their own
    """
    query = select(ExpenseAccount).options(
        selectinload(ExpenseAccount.employee),
        selectinload(ExpenseAccount.reviewer)
    )
    
    # Filter by employee if not admin
    # TODO: Add proper admin check
    # For now, allow filtering by employee_id
    if employee_id is not None:
        query = query.where(ExpenseAccount.employee_id == employee_id)
    
    # Filter by status
    if status:
        try:
            status_enum = ExpenseAccountStatus(status)
            query = query.where(ExpenseAccount.status == status_enum.value)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status: {status}"
            )
    
    # Search
    if search:
        search_term = f"%{search.lower()}%"
        query = query.where(
            or_(
                func.lower(ExpenseAccount.title).like(search_term),
                func.lower(ExpenseAccount.account_number).like(search_term),
            )
        )
    
    query = query.order_by(ExpenseAccount.created_at.desc()).offset(skip).limit(limit)
    
    result = await db.execute(query)
    accounts = result.scalars().all()
    
    # Convert to response format
    response = []
    for account in accounts:
        account_dict = {
            "id": account.id,
            "account_number": account.account_number,
            "employee_id": account.employee_id,
            "employee_name": f"{account.employee.first_name} {account.employee.last_name}" if account.employee else None,
            "title": account.title,
            "description": account.description,
            "status": account.status,
            "expense_period_start": account.expense_period_start,
            "expense_period_end": account.expense_period_end,
            "total_amount": account.total_amount,
            "currency": account.currency,
            "submitted_at": account.submitted_at,
            "reviewed_at": account.reviewed_at,
            "reviewed_by_id": account.reviewed_by_id,
            "reviewer_name": f"{account.reviewer.first_name} {account.reviewer.last_name}" if account.reviewer else None,
            "review_notes": account.review_notes,
            "clarification_request": account.clarification_request,
            "rejection_reason": account.rejection_reason,
            "metadata": account.account_metadata,
            "created_at": account.created_at,
            "updated_at": account.updated_at,
        }
        response.append(ExpenseAccountResponse(**account_dict))
    
    return response


@router.get("/{expense_account_id}", response_model=ExpenseAccountResponse)
async def get_compte_depenses(
    expense_account_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get a specific expense account by ID
    """
    result = await db.execute(
        select(ExpenseAccount)
        .options(
            selectinload(ExpenseAccount.employee),
            selectinload(ExpenseAccount.reviewer)
        )
        .where(ExpenseAccount.id == expense_account_id)
    )
    account = result.scalar_one_or_none()
    
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expense account not found"
        )
    
    # TODO: Check permissions (admin or owner)
    
    account_dict = {
        "id": account.id,
        "account_number": account.account_number,
        "employee_id": account.employee_id,
        "employee_name": f"{account.employee.first_name} {account.employee.last_name}" if account.employee else None,
        "title": account.title,
        "description": account.description,
        "status": account.status,
        "expense_period_start": account.expense_period_start,
        "expense_period_end": account.expense_period_end,
        "total_amount": account.total_amount,
        "currency": account.currency,
        "submitted_at": account.submitted_at,
        "reviewed_at": account.reviewed_at,
        "reviewed_by_id": account.reviewed_by_id,
        "reviewer_name": f"{account.reviewer.first_name} {account.reviewer.last_name}" if account.reviewer else None,
        "review_notes": account.review_notes,
        "clarification_request": account.clarification_request,
        "rejection_reason": account.rejection_reason,
            "metadata": account.account_metadata,
        "created_at": account.created_at,
        "updated_at": account.updated_at,
    }
    
    return ExpenseAccountResponse(**account_dict)


@router.post("/", response_model=ExpenseAccountResponse, status_code=status.HTTP_201_CREATED)
async def create_compte_depenses(
    expense_account: ExpenseAccountCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create a new expense account
    """
    # Generate account number
    account_number = await generate_account_number(db)
    
    # Create expense account
    new_account = ExpenseAccount(
        account_number=account_number,
        employee_id=expense_account.employee_id,
        title=expense_account.title,
        description=expense_account.description,
        expense_period_start=expense_account.expense_period_start,
        expense_period_end=expense_account.expense_period_end,
        total_amount=expense_account.total_amount,
        currency=expense_account.currency,
        account_metadata=expense_account.metadata,
        status=ExpenseAccountStatus.DRAFT.value,
    )
    
    db.add(new_account)
    await db.commit()
    await db.refresh(new_account, ["employee", "reviewer"])
    
    account_dict = {
        "id": new_account.id,
        "account_number": new_account.account_number,
        "employee_id": new_account.employee_id,
        "employee_name": f"{new_account.employee.first_name} {new_account.employee.last_name}" if new_account.employee else None,
        "title": new_account.title,
        "description": new_account.description,
        "status": new_account.status,
        "expense_period_start": new_account.expense_period_start,
        "expense_period_end": new_account.expense_period_end,
        "total_amount": new_account.total_amount,
        "currency": new_account.currency,
        "submitted_at": new_account.submitted_at,
        "reviewed_at": new_account.reviewed_at,
        "reviewed_by_id": new_account.reviewed_by_id,
        "reviewer_name": None,
        "review_notes": new_account.review_notes,
        "clarification_request": new_account.clarification_request,
        "rejection_reason": new_account.rejection_reason,
        "metadata": new_account.account_metadata,
        "created_at": new_account.created_at,
        "updated_at": new_account.updated_at,
    }
    
    return ExpenseAccountResponse(**account_dict)


@router.put("/{expense_account_id}", response_model=ExpenseAccountResponse)
async def update_compte_depenses(
    expense_account_id: int,
    expense_account: ExpenseAccountUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Update an expense account
    Only allowed for DRAFT status
    """
    result = await db.execute(
        select(ExpenseAccount).where(ExpenseAccount.id == expense_account_id)
    )
    account = result.scalar_one_or_none()
    
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expense account not found"
        )
    
    # Only allow updates for DRAFT status
    if account.status != ExpenseAccountStatus.DRAFT.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot update expense account that is not in DRAFT status"
        )
    
    # Update fields
    update_data = expense_account.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(account, field, value)
    
    await db.commit()
    await db.refresh(account, ["employee", "reviewer"])
    
    account_dict = {
        "id": account.id,
        "account_number": account.account_number,
        "employee_id": account.employee_id,
        "employee_name": f"{account.employee.first_name} {account.employee.last_name}" if account.employee else None,
        "title": account.title,
        "description": account.description,
        "status": account.status,
        "expense_period_start": account.expense_period_start,
        "expense_period_end": account.expense_period_end,
        "total_amount": account.total_amount,
        "currency": account.currency,
        "submitted_at": account.submitted_at,
        "reviewed_at": account.reviewed_at,
        "reviewed_by_id": account.reviewed_by_id,
        "reviewer_name": f"{account.reviewer.first_name} {account.reviewer.last_name}" if account.reviewer else None,
        "review_notes": account.review_notes,
        "clarification_request": account.clarification_request,
        "rejection_reason": account.rejection_reason,
            "metadata": account.account_metadata,
        "created_at": account.created_at,
        "updated_at": account.updated_at,
    }
    
    return ExpenseAccountResponse(**account_dict)


@router.post("/{expense_account_id}/submit", response_model=ExpenseAccountResponse)
async def submit_compte_depenses(
    expense_account_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Submit an expense account for review
    Changes status from DRAFT to SUBMITTED
    """
    result = await db.execute(
        select(ExpenseAccount).where(ExpenseAccount.id == expense_account_id)
    )
    account = result.scalar_one_or_none()
    
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expense account not found"
        )
    
    if account.status != ExpenseAccountStatus.DRAFT.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only submit expense accounts in DRAFT status"
        )
    
    account.status = ExpenseAccountStatus.SUBMITTED.value
    account.submitted_at = datetime.now()
    
    await db.commit()
    await db.refresh(account, ["employee", "reviewer"])
    
    account_dict = {
        "id": account.id,
        "account_number": account.account_number,
        "employee_id": account.employee_id,
        "employee_name": f"{account.employee.first_name} {account.employee.last_name}" if account.employee else None,
        "title": account.title,
        "description": account.description,
        "status": account.status,
        "expense_period_start": account.expense_period_start,
        "expense_period_end": account.expense_period_end,
        "total_amount": account.total_amount,
        "currency": account.currency,
        "submitted_at": account.submitted_at,
        "reviewed_at": account.reviewed_at,
        "reviewed_by_id": account.reviewed_by_id,
        "reviewer_name": None,
        "review_notes": account.review_notes,
        "clarification_request": account.clarification_request,
        "rejection_reason": account.rejection_reason,
            "metadata": account.account_metadata,
        "created_at": account.created_at,
        "updated_at": account.updated_at,
    }
    
    return ExpenseAccountResponse(**account_dict)


@router.post("/{expense_account_id}/approve", response_model=ExpenseAccountResponse)
async def approve_compte_depenses(
    expense_account_id: int,
    action: ExpenseAccountAction,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Approve an expense account
    Admin only - Changes status to APPROVED
    """
    result = await db.execute(
        select(ExpenseAccount).where(ExpenseAccount.id == expense_account_id)
    )
    account = result.scalar_one_or_none()
    
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expense account not found"
        )
    
    if account.status not in [ExpenseAccountStatus.SUBMITTED.value, ExpenseAccountStatus.UNDER_REVIEW.value]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only approve expense accounts in SUBMITTED or UNDER_REVIEW status"
        )
    
    account.status = ExpenseAccountStatus.APPROVED.value
    account.reviewed_at = datetime.now()
    account.reviewed_by_id = current_user.id
    account.review_notes = action.notes
    
    await db.commit()
    await db.refresh(account, ["employee", "reviewer"])
    
    account_dict = {
        "id": account.id,
        "account_number": account.account_number,
        "employee_id": account.employee_id,
        "employee_name": f"{account.employee.first_name} {account.employee.last_name}" if account.employee else None,
        "title": account.title,
        "description": account.description,
        "status": account.status,
        "expense_period_start": account.expense_period_start,
        "expense_period_end": account.expense_period_end,
        "total_amount": account.total_amount,
        "currency": account.currency,
        "submitted_at": account.submitted_at,
        "reviewed_at": account.reviewed_at,
        "reviewed_by_id": account.reviewed_by_id,
        "reviewer_name": f"{account.reviewer.first_name} {account.reviewer.last_name}" if account.reviewer else None,
        "review_notes": account.review_notes,
        "clarification_request": account.clarification_request,
        "rejection_reason": account.rejection_reason,
            "metadata": account.account_metadata,
        "created_at": account.created_at,
        "updated_at": account.updated_at,
    }
    
    return ExpenseAccountResponse(**account_dict)


@router.post("/{expense_account_id}/reject", response_model=ExpenseAccountResponse)
async def reject_compte_depenses(
    expense_account_id: int,
    action: ExpenseAccountAction,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Reject an expense account
    Admin only - Changes status to REJECTED
    """
    if not action.rejection_reason:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Rejection reason is required"
        )
    
    result = await db.execute(
        select(ExpenseAccount).where(ExpenseAccount.id == expense_account_id)
    )
    account = result.scalar_one_or_none()
    
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expense account not found"
        )
    
    if account.status not in [ExpenseAccountStatus.SUBMITTED.value, ExpenseAccountStatus.UNDER_REVIEW.value]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only reject expense accounts in SUBMITTED or UNDER_REVIEW status"
        )
    
    account.status = ExpenseAccountStatus.REJECTED.value
    account.reviewed_at = datetime.now()
    account.reviewed_by_id = current_user.id
    account.review_notes = action.notes
    account.rejection_reason = action.rejection_reason
    
    await db.commit()
    await db.refresh(account, ["employee", "reviewer"])
    
    account_dict = {
        "id": account.id,
        "account_number": account.account_number,
        "employee_id": account.employee_id,
        "employee_name": f"{account.employee.first_name} {account.employee.last_name}" if account.employee else None,
        "title": account.title,
        "description": account.description,
        "status": account.status,
        "expense_period_start": account.expense_period_start,
        "expense_period_end": account.expense_period_end,
        "total_amount": account.total_amount,
        "currency": account.currency,
        "submitted_at": account.submitted_at,
        "reviewed_at": account.reviewed_at,
        "reviewed_by_id": account.reviewed_by_id,
        "reviewer_name": f"{account.reviewer.first_name} {account.reviewer.last_name}" if account.reviewer else None,
        "review_notes": account.review_notes,
        "clarification_request": account.clarification_request,
        "rejection_reason": account.rejection_reason,
            "metadata": account.account_metadata,
        "created_at": account.created_at,
        "updated_at": account.updated_at,
    }
    
    return ExpenseAccountResponse(**account_dict)


@router.post("/{expense_account_id}/request-clarification", response_model=ExpenseAccountResponse)
async def request_clarification_compte_depenses(
    expense_account_id: int,
    action: ExpenseAccountAction,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Request clarification for an expense account
    Admin only - Changes status to NEEDS_CLARIFICATION
    """
    if not action.clarification_request:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Clarification request is required"
        )
    
    result = await db.execute(
        select(ExpenseAccount).where(ExpenseAccount.id == expense_account_id)
    )
    account = result.scalar_one_or_none()
    
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expense account not found"
        )
    
    if account.status not in [ExpenseAccountStatus.SUBMITTED.value, ExpenseAccountStatus.UNDER_REVIEW.value]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only request clarification for expense accounts in SUBMITTED or UNDER_REVIEW status"
        )
    
    account.status = ExpenseAccountStatus.NEEDS_CLARIFICATION.value
    account.reviewed_at = datetime.now()
    account.reviewed_by_id = current_user.id
    account.review_notes = action.notes
    account.clarification_request = action.clarification_request
    
    await db.commit()
    await db.refresh(account, ["employee", "reviewer"])
    
    account_dict = {
        "id": account.id,
        "account_number": account.account_number,
        "employee_id": account.employee_id,
        "employee_name": f"{account.employee.first_name} {account.employee.last_name}" if account.employee else None,
        "title": account.title,
        "description": account.description,
        "status": account.status,
        "expense_period_start": account.expense_period_start,
        "expense_period_end": account.expense_period_end,
        "total_amount": account.total_amount,
        "currency": account.currency,
        "submitted_at": account.submitted_at,
        "reviewed_at": account.reviewed_at,
        "reviewed_by_id": account.reviewed_by_id,
        "reviewer_name": f"{account.reviewer.first_name} {account.reviewer.last_name}" if account.reviewer else None,
        "review_notes": account.review_notes,
        "clarification_request": account.clarification_request,
        "rejection_reason": account.rejection_reason,
            "metadata": account.account_metadata,
        "created_at": account.created_at,
        "updated_at": account.updated_at,
    }
    
    return ExpenseAccountResponse(**account_dict)


@router.post("/{expense_account_id}/set-under-review", response_model=ExpenseAccountResponse)
async def set_under_review_compte_depenses(
    expense_account_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Set expense account status to UNDER_REVIEW
    Admin only
    """
    result = await db.execute(
        select(ExpenseAccount).where(ExpenseAccount.id == expense_account_id)
    )
    account = result.scalar_one_or_none()
    
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expense account not found"
        )
    
    if account.status != ExpenseAccountStatus.SUBMITTED.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only set to UNDER_REVIEW expense accounts in SUBMITTED status"
        )
    
    account.status = ExpenseAccountStatus.UNDER_REVIEW.value
    
    await db.commit()
    await db.refresh(account, ["employee", "reviewer"])
    
    account_dict = {
        "id": account.id,
        "account_number": account.account_number,
        "employee_id": account.employee_id,
        "employee_name": f"{account.employee.first_name} {account.employee.last_name}" if account.employee else None,
        "title": account.title,
        "description": account.description,
        "status": account.status,
        "expense_period_start": account.expense_period_start,
        "expense_period_end": account.expense_period_end,
        "total_amount": account.total_amount,
        "currency": account.currency,
        "submitted_at": account.submitted_at,
        "reviewed_at": account.reviewed_at,
        "reviewed_by_id": account.reviewed_by_id,
        "reviewer_name": f"{account.reviewer.first_name} {account.reviewer.last_name}" if account.reviewer else None,
        "review_notes": account.review_notes,
        "clarification_request": account.clarification_request,
        "rejection_reason": account.rejection_reason,
            "metadata": account.account_metadata,
        "created_at": account.created_at,
        "updated_at": account.updated_at,
    }
    
    return ExpenseAccountResponse(**account_dict)


@router.delete("/{expense_account_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_compte_depenses(
    expense_account_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Delete an expense account
    Only allowed for DRAFT status
    """
    result = await db.execute(
        select(ExpenseAccount).where(ExpenseAccount.id == expense_account_id)
    )
    account = result.scalar_one_or_none()
    
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expense account not found"
        )
    
    # Only allow deletion for DRAFT status
    if account.status != ExpenseAccountStatus.DRAFT.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete expense account that is not in DRAFT status"
        )
    
    await db.delete(account)
    await db.commit()
    
    return None
