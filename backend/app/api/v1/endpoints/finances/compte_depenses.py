"""
Finances - Compte de Dépenses Endpoints
API endpoints for managing expense accounts
"""

from fastapi import APIRouter, Depends, Query, HTTPException, status, File, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, and_
from sqlalchemy.orm import selectinload
from typing import List, Optional
from datetime import datetime
import base64
import json
from io import BytesIO

from app.core.database import get_db
from app.dependencies import get_current_user, is_admin_or_superadmin
from app.models.user import User
from app.models.employee import Employee
from app.models.expense_account import ExpenseAccount, ExpenseAccountStatus
from app.schemas.expense_account import (
    ExpenseAccountCreate,
    ExpenseAccountUpdate,
    ExpenseAccountResponse,
    ExpenseAccountAction,
)
from app.core.logging import logger
from app.services.openai_service import OpenAIService
from app.services.s3_service import S3Service
from pydantic import BaseModel

# Try to import PyMuPDF for PDF to image conversion
try:
    import fitz  # PyMuPDF
    PYMUPDF_AVAILABLE = True
except ImportError:
    PYMUPDF_AVAILABLE = False

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
    try:
        # Validate that the employee exists
        employee_result = await db.execute(
            select(Employee).where(Employee.id == expense_account.employee_id)
        )
        employee = employee_result.scalar_one_or_none()
        
        if not employee:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Employee with ID {expense_account.employee_id} not found"
            )
        
        # Generate account number
        account_number = await generate_account_number(db)
        
        # Create expense account
        try:
            new_account = ExpenseAccount(
                account_number=account_number,
                employee_id=expense_account.employee_id,
                title=expense_account.title,
                description=expense_account.description,
                expense_period_start=expense_account.expense_period_start,
                expense_period_end=expense_account.expense_period_end,
                total_amount=expense_account.total_amount,
                currency=expense_account.currency or "EUR",
                account_metadata=expense_account.metadata,
                status=ExpenseAccountStatus.DRAFT.value,
            )
            
            db.add(new_account)
            await db.commit()
            await db.refresh(new_account, ["employee", "reviewer"])
        except Exception as e:
            await db.rollback()
            logger.error(f"Database error creating expense account: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"A database error occurred: {str(e)}"
            )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error creating expense account: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred: {str(e)}"
        )
    
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
    
    # Check permissions: user must be the owner of the expense account or an admin
    # Load employee to check user_id
    employee_result = await db.execute(
        select(Employee).where(Employee.id == account.employee_id)
    )
    employee = employee_result.scalar_one_or_none()
    
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee associated with this expense account not found"
        )
    
    # Check if user is admin/superadmin or the owner
    is_admin = await is_admin_or_superadmin(current_user, db)
    is_owner = employee.user_id == current_user.id if employee.user_id else False
    
    if not is_admin and not is_owner:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to update this expense account"
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


class ExpenseExtractionResponse(BaseModel):
    """Response model for expense extraction"""
    title: Optional[str] = None
    description: Optional[str] = None
    total_amount: Optional[str] = None
    currency: Optional[str] = None
    expense_period_start: Optional[str] = None
    expense_period_end: Optional[str] = None
    metadata: Optional[dict] = None
    confidence: float = 0.0
    extracted_items: Optional[List[dict]] = None


@router.post("/extract-from-document", response_model=ExpenseExtractionResponse)
async def extract_expense_from_document(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """
    Extract expense account details from an image or PDF using OCR + AI
    
    Supports:
    - Images: JPEG, PNG, GIF, WebP
    - PDFs: PDF files
    
    Returns structured data that can be used to pre-fill the expense account form.
    """
    # Validate file type
    allowed_types = [
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf'
    ]
    
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type: {file.content_type}. Supported types: {', '.join(allowed_types)}"
        )
    
    # Check file size (max 10MB)
    file_content = await file.read()
    if len(file_content) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds 10MB limit"
        )
    
    try:
        # Check if OpenAI is configured
        if not OpenAIService.is_configured():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="OpenAI service is not configured. Please set OPENAI_API_KEY."
            )
        
        openai_service = OpenAIService()
        
        # Prepare image for OpenAI Vision API
        # Convert PDFs to images if needed (OpenAI Vision API only accepts images)
        image_content = file_content
        image_mime_type = file.content_type
        
        if file.content_type == 'application/pdf':
            if not PYMUPDF_AVAILABLE:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="PDF processing is not available. Please install PyMuPDF: pip install PyMuPDF"
                )
            
            try:
                # Convert PDF to image using PyMuPDF
                pdf_document = fitz.open(stream=file_content, filetype="pdf")
                
                # Get the first page (most receipts/invoices are single page)
                if len(pdf_document) == 0:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="PDF file appears to be empty or corrupted"
                    )
                
                # Render first page as image (use 2x zoom for better quality)
                page = pdf_document[0]
                num_pages = len(pdf_document)
                mat = fitz.Matrix(2.0, 2.0)  # 2x zoom for better quality
                pix = page.get_pixmap(matrix=mat)
                
                # Convert to PNG bytes
                image_content = pix.tobytes("png")
                image_mime_type = "image/png"
                
                pdf_document.close()
                logger.info(f"Converted PDF to image (page 1 of {num_pages})")
                
            except Exception as e:
                logger.error(f"Error converting PDF to image: {str(e)}", exc_info=True)
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Failed to convert PDF to image: {str(e)}"
                )
        
        # Encode image as base64 for OpenAI Vision API
        image_base64 = base64.b64encode(image_content).decode('utf-8')
        image_url = f"data:{image_mime_type};base64,{image_base64}"
        
        # Create system prompt for extraction
        system_prompt = """You are an expert at extracting expense/receipt information from images.
Extract the following information from the document:
- title: A descriptive title for the expense (e.g., "Restaurant - Le Bistrot")
- description: Detailed description of the expense
- total_amount: The total amount as a string (e.g., "125.50")
- currency: The currency code (EUR, USD, CAD, GBP, etc.)
- expense_period_start: Start date in YYYY-MM-DD format if available
- expense_period_end: End date in YYYY-MM-DD format if available
- extracted_items: List of individual line items if available (each with description, amount, quantity)

Return ONLY valid JSON in this exact format:
{
  "title": "string or null",
  "description": "string or null",
  "total_amount": "string or null",
  "currency": "string or null",
  "expense_period_start": "YYYY-MM-DD or null",
  "expense_period_end": "YYYY-MM-DD or null",
  "extracted_items": [{"description": "string", "amount": "string", "quantity": "number"}],
  "confidence": 0.0-1.0
}

If information is not found, use null. Be precise with amounts and dates."""
        
        # Use OpenAI Vision API
        messages = [
            {
                "role": "system",
                "content": system_prompt
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": "Extract all expense information from this document. Return only valid JSON."
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": image_url
                        }
                    }
                ]
            }
        ]
        
        # Call OpenAI with vision model
        try:
            response = await openai_service.client.chat.completions.create(
                model="gpt-4o",  # Use vision-capable model
                messages=messages,
                max_tokens=2000,
                temperature=0.1,  # Low temperature for accuracy
            )
            
            if not response.choices or not response.choices[0].message.content:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="OpenAI API returned an empty response. Please try again."
                )
            
            content = response.choices[0].message.content
        except Exception as openai_error:
            # Handle OpenAI API errors specifically
            error_str = str(openai_error)
            logger.error(f"OpenAI API error: {error_str}", exc_info=True)
            
            # Check for specific error types
            if "invalid_image_format" in error_str or "Invalid MIME type" in error_str:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="The uploaded file format is not supported by the vision API. Please ensure the file is a valid image or PDF."
                )
            elif "400" in error_str or "Bad Request" in error_str:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid request to OpenAI API: {error_str}"
                )
            elif "401" in error_str or "authentication" in error_str.lower():
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="OpenAI API authentication failed. Please check API key configuration."
                )
            elif "429" in error_str or "rate limit" in error_str.lower():
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="OpenAI API rate limit exceeded. Please try again later."
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"OpenAI API error: {error_str}"
                )
        
        # Parse JSON response
        try:
            # Extract JSON from markdown code blocks if present
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                content = content.split("```")[1].split("```")[0].strip()
            
            extracted_data = json.loads(content)
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse OpenAI response as JSON: {e}")
            logger.error(f"Response content: {content}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to parse extracted data. Please try again or enter manually."
            )
        
        # Validate and structure response
        result = ExpenseExtractionResponse(
            title=extracted_data.get("title"),
            description=extracted_data.get("description"),
            total_amount=extracted_data.get("total_amount"),
            currency=extracted_data.get("currency", "EUR"),
            expense_period_start=extracted_data.get("expense_period_start"),
            expense_period_end=extracted_data.get("expense_period_end"),
            extracted_items=extracted_data.get("extracted_items"),
            confidence=extracted_data.get("confidence", 0.5),
            metadata={
                "extraction_method": "openai_vision",
                "original_filename": file.filename,
                "file_type": file.content_type,
                "extracted_items": extracted_data.get("extracted_items"),
            }
        )
        
        logger.info(f"Successfully extracted expense data from {file.filename}")
        return result
        
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error extracting expense data: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to extract expense data: {str(e)}"
        )
