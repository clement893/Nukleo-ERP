"""
Vacation Requests API Endpoints
API endpoints for managing employee vacation requests
"""

from typing import List, Optional
from datetime import date, datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.dependencies import get_current_user
from app.models.vacation_request import VacationRequest
from app.models.employee import Employee
from app.models.user import User
from app.models.calendar_event import CalendarEvent
from app.schemas.vacation_request import (
    VacationRequestCreate,
    VacationRequestUpdate,
    VacationRequest as VacationRequestSchema,
    VacationRequestWithEmployee,
    VacationRequestApprove,
    VacationRequestReject
)
from app.core.logging import logger

router = APIRouter(prefix="/management/vacation-requests", tags=["vacation-requests"])


def vacation_request_to_dict(vr: VacationRequest) -> dict:
    """Convert SQLAlchemy VacationRequest model to dict"""
    result = {
        'id': vr.id,
        'employee_id': vr.employee_id,
        'start_date': vr.start_date,
        'end_date': vr.end_date,
        'reason': vr.reason,
        'status': vr.status,
        'approved_by_id': vr.approved_by_id,
        'approved_at': vr.approved_at.isoformat() if vr.approved_at else None,
        'rejection_reason': vr.rejection_reason,
        'created_at': vr.created_at,
        'updated_at': vr.updated_at,
    }
    
    # Add employee info if available
    if vr.employee:
        result['employee_first_name'] = vr.employee.first_name
        result['employee_last_name'] = vr.employee.last_name
        result['employee_email'] = vr.employee.email
    
    # Add approver info if available
    if vr.approved_by:
        result['approved_by_name'] = f"{vr.approved_by.first_name or ''} {vr.approved_by.last_name or ''}".strip()
    
    return result


@router.get("/", response_model=List[VacationRequestWithEmployee])
async def list_vacation_requests(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    employee_id: Optional[int] = Query(None, description="Filter by employee ID"),
    status: Optional[str] = Query(None, description="Filter by status (pending, approved, rejected, cancelled)"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
):
    """
    List vacation requests with optional filters
    Employees can only see their own requests, admins/managers can see all
    """
    query = select(VacationRequest).options(
        selectinload(VacationRequest.employee),
        selectinload(VacationRequest.approved_by)
    )
    
    conditions = []
    
    # Filter by employee_id if provided
    if employee_id:
        conditions.append(VacationRequest.employee_id == employee_id)
    
    # Filter by status if provided
    if status:
        conditions.append(VacationRequest.status == status)
    
    # If user is not admin, only show their own requests
    # Check if current_user is linked to an employee
    employee_query = select(Employee).where(Employee.user_id == current_user.id)
    employee_result = await db.execute(employee_query)
    employee = employee_result.scalar_one_or_none()
    
    if employee:
        # User is an employee, only show their requests
        conditions.append(VacationRequest.employee_id == employee.id)
    # Otherwise, user is admin/manager and can see all requests
    
    if conditions:
        query = query.where(and_(*conditions))
    
    query = query.order_by(VacationRequest.created_at.desc()).offset(skip).limit(limit)
    
    result = await db.execute(query)
    vacation_requests = result.scalars().all()
    
    return [vacation_request_to_dict(vr) for vr in vacation_requests]


@router.get("/{request_id}", response_model=VacationRequestWithEmployee)
async def get_vacation_request(
    request_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a specific vacation request by ID"""
    query = select(VacationRequest).options(
        selectinload(VacationRequest.employee),
        selectinload(VacationRequest.approved_by)
    ).where(VacationRequest.id == request_id)
    
    result = await db.execute(query)
    vacation_request = result.scalar_one_or_none()
    
    if not vacation_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vacation request {request_id} not found"
        )
    
    # Check if user has permission to view this request
    employee_query = select(Employee).where(Employee.user_id == current_user.id)
    employee_result = await db.execute(employee_query)
    employee = employee_result.scalar_one_or_none()
    
    if employee and vacation_request.employee_id != employee.id:
        # Employee trying to view someone else's request
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to view this vacation request"
        )
    
    return vacation_request_to_dict(vacation_request)


@router.post("/", response_model=VacationRequestSchema, status_code=status.HTTP_201_CREATED)
async def create_vacation_request(
    request_data: VacationRequestCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new vacation request"""
    # Verify employee exists
    employee_query = select(Employee).where(Employee.id == request_data.employee_id)
    employee_result = await db.execute(employee_query)
    employee = employee_result.scalar_one_or_none()
    
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Employee {request_data.employee_id} not found"
        )
    
    # If user is an employee, verify they're creating request for themselves
    current_employee_query = select(Employee).where(Employee.user_id == current_user.id)
    current_employee_result = await db.execute(current_employee_query)
    current_employee = current_employee_result.scalar_one_or_none()
    
    if current_employee and current_employee.id != request_data.employee_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only create vacation requests for yourself"
        )
    
    # Create vacation request
    vacation_request = VacationRequest(
        employee_id=request_data.employee_id,
        start_date=request_data.start_date,
        end_date=request_data.end_date,
        reason=request_data.reason,
        status='pending',
    )
    
    db.add(vacation_request)
    await db.commit()
    await db.refresh(vacation_request)
    
    logger.info(f"Created vacation request {vacation_request.id} for employee {request_data.employee_id}")
    
    return vacation_request_to_dict(vacation_request)


@router.put("/{request_id}", response_model=VacationRequestSchema)
async def update_vacation_request(
    request_id: int,
    request_data: VacationRequestUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a vacation request (only pending requests can be updated by employee)"""
    query = select(VacationRequest).where(VacationRequest.id == request_id)
    result = await db.execute(query)
    vacation_request = result.scalar_one_or_none()
    
    if not vacation_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vacation request {request_id} not found"
        )
    
    # Check permissions
    current_employee_query = select(Employee).where(Employee.user_id == current_user.id)
    current_employee_result = await db.execute(current_employee_query)
    current_employee = current_employee_result.scalar_one_or_none()
    
    is_owner = current_employee and vacation_request.employee_id == current_employee.id
    is_admin = False  # TODO: Check if user is admin/manager
    
    if not is_owner and not is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to update this vacation request"
        )
    
    # Employees can only update pending requests
    if is_owner and vacation_request.status != 'pending':
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only pending vacation requests can be updated"
        )
    
    # Update fields
    if request_data.start_date is not None:
        vacation_request.start_date = request_data.start_date
    if request_data.end_date is not None:
        vacation_request.end_date = request_data.end_date
    if request_data.reason is not None:
        vacation_request.reason = request_data.reason
    if request_data.status is not None:
        vacation_request.status = request_data.status
    if request_data.rejection_reason is not None:
        vacation_request.rejection_reason = request_data.rejection_reason
    
    await db.commit()
    await db.refresh(vacation_request)
    
    logger.info(f"Updated vacation request {request_id}")
    
    return vacation_request_to_dict(vacation_request)


@router.post("/{request_id}/approve", response_model=VacationRequestSchema)
async def approve_vacation_request(
    request_id: int,
    approve_data: VacationRequestApprove,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Approve a vacation request (admin/manager only)"""
    query = select(VacationRequest).options(
        selectinload(VacationRequest.employee)
    ).where(VacationRequest.id == request_id)
    result = await db.execute(query)
    vacation_request = result.scalar_one_or_none()
    
    if not vacation_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vacation request {request_id} not found"
        )
    
    if vacation_request.status != 'pending':
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot approve vacation request with status '{vacation_request.status}'"
        )
    
    # TODO: Check if user is admin/manager
    # For now, allow any authenticated user to approve
    
    # Update status
    vacation_request.status = 'approved'
    vacation_request.approved_by_id = current_user.id
    vacation_request.approved_at = datetime.now(timezone.utc)
    
    await db.commit()
    await db.refresh(vacation_request)
    
    logger.info(f"Approved vacation request {request_id} by user {current_user.id}")
    
    # Create calendar event for approved vacation
    try:
        # Get employee's user_id to link calendar event
        employee_query = select(Employee).where(Employee.id == vacation_request.employee_id)
        employee_result = await db.execute(employee_query)
        employee = employee_result.scalar_one_or_none()
        
        if employee and employee.user_id:
            # Create calendar event
            calendar_event = CalendarEvent(
                user_id=employee.user_id,
                title=f"Vacances - {employee.first_name} {employee.last_name}",
                description=vacation_request.reason or "Vacances approuvées",
                date=vacation_request.start_date,
                end_date=vacation_request.end_date,
                type='vacation',
                color='#10B981',  # Green color for vacations
            )
            db.add(calendar_event)
            await db.commit()
            logger.info(f"Created calendar event for approved vacation request {request_id}")
    except Exception as e:
        # Log error but don't fail the approval
        logger.error(f"Failed to create calendar event for vacation request {request_id}: {e}")
    
    return vacation_request_to_dict(vacation_request)


@router.post("/{request_id}/reject", response_model=VacationRequestSchema)
async def reject_vacation_request(
    request_id: int,
    reject_data: VacationRequestReject,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Reject a vacation request (admin/manager only)"""
    query = select(VacationRequest).where(VacationRequest.id == request_id)
    result = await db.execute(query)
    vacation_request = result.scalar_one_or_none()
    
    if not vacation_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vacation request {request_id} not found"
        )
    
    if vacation_request.status != 'pending':
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot reject vacation request with status '{vacation_request.status}'"
        )
    
    # TODO: Check if user is admin/manager
    # For now, allow any authenticated user to reject
    
    # Update status
    vacation_request.status = 'rejected'
    vacation_request.approved_by_id = current_user.id
    vacation_request.approved_at = datetime.now(timezone.utc)
    vacation_request.rejection_reason = reject_data.rejection_reason
    
    await db.commit()
    await db.refresh(vacation_request)
    
    logger.info(f"Rejected vacation request {request_id} by user {current_user.id}")
    
    return vacation_request_to_dict(vacation_request)


@router.delete("/{request_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_vacation_request(
    request_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a vacation request (only pending requests can be deleted by employee)"""
    query = select(VacationRequest).where(VacationRequest.id == request_id)
    result = await db.execute(query)
    vacation_request = result.scalar_one_or_none()
    
    if not vacation_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vacation request {request_id} not found"
        )
    
    # Check permissions
    current_employee_query = select(Employee).where(Employee.user_id == current_user.id)
    current_employee_result = await db.execute(current_employee_query)
    current_employee = current_employee_result.scalar_one_or_none()
    
    is_owner = current_employee and vacation_request.employee_id == current_employee.id
    is_admin = False  # TODO: Check if user is admin/manager
    
    if not is_owner and not is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to delete this vacation request"
        )
    
    # Employees can only delete pending requests
    if is_owner and vacation_request.status != 'pending':
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only pending vacation requests can be deleted"
        )
    
    await db.delete(vacation_request)
    await db.commit()
    
    logger.info(f"Deleted vacation request {request_id}")
    
    return None
