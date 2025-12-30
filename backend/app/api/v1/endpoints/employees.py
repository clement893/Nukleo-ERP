"""
Employee API Endpoints
Endpoints for managing employees and linking them to users
"""

from typing import Annotated, Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from starlette.requests import Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from uuid import UUID

from app.core.database import get_db
from app.dependencies import get_current_user, require_superadmin
from app.models.user import User
from app.core.logging import logger

router = APIRouter()

# Try to import Employee model, fallback to None if not available
try:
    from templates.modules.employes.models.employe import Employee
    EMPLOYEE_MODEL_AVAILABLE = True
except ImportError:
    EMPLOYEE_MODEL_AVAILABLE = False
    Employee = None


class EmployeeResponse(BaseModel):
    """Employee response model"""
    id: str
    first_name: str
    last_name: str
    email: str
    phone: Optional[str] = None
    job_title: Optional[str] = None
    department: Optional[str] = None
    hire_date: Optional[str] = None  # ISO date string
    birth_date: Optional[str] = None  # ISO date string
    photo_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    user_id: Optional[str] = None
    
    class Config:
        from_attributes = True


class EmployeeLinkRequest(BaseModel):
    """Request model for linking employee to user"""
    employee_id: str
    user_id: int


@router.get("/", response_model=List[EmployeeResponse])
async def list_employees(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_superadmin)],
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
) -> List[EmployeeResponse]:
    """
    List all employees
    
    Returns a list of all employees with their user_id if linked
    """
    if not EMPLOYEE_MODEL_AVAILABLE:
        # Return empty list if Employee model is not available
        return []
    
    try:
        query = select(Employee).offset(skip).limit(limit)
        result = await db.execute(query)
        employees = result.scalars().all()
        
        # Helper function to convert UUID user_id to integer
        def uuid_to_user_id(uuid_value):
            """Convert UUID-formatted user_id back to integer"""
            if not uuid_value:
                return None
            try:
                uuid_str = str(uuid_value)
                parts = uuid_str.split('-')
                if len(parts) == 5:
                    # Last part contains the user_id as zero-padded string
                    user_id_str = parts[-1].lstrip('0') or '0'
                    return int(user_id_str)
            except Exception:
                pass
            return None
        
        return [
            EmployeeResponse(
                id=str(emp.id),
                first_name=emp.first_name,
                last_name=emp.last_name,
                email=emp.email,
                phone=emp.phone,
                job_title=emp.job_title,
                department=emp.department,
                hire_date=emp.hire_date.isoformat() if emp.hire_date else None,
                birth_date=emp.birth_date.isoformat() if emp.birth_date else None,
                photo_url=emp.photo_url,
                linkedin_url=emp.linkedin_url,
                user_id=str(uuid_to_user_id(emp.user_id)) if emp.user_id else None,
            )
            for emp in employees
        ]
    except Exception as e:
        logger.error(f"Error listing employees: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list employees: {str(e)}"
        )


@router.put("/{employee_id}/link-user", response_model=EmployeeResponse)
async def link_employee_to_user(
    request: Request,
    employee_id: str,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_superadmin)],
    user_id: int = Query(..., description="User ID to link"),
) -> EmployeeResponse:
    """
    Link an employee to a user
    
    Updates the user_id field of an employee to link it to a user account
    """
    if not EMPLOYEE_MODEL_AVAILABLE:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Employee model is not available"
        )
    
    try:
        # Parse employee_id as UUID
        emp_uuid = UUID(employee_id)
        
        # Get employee
        result = await db.execute(
            select(Employee).where(Employee.id == emp_uuid)
        )
        employee = result.scalar_one_or_none()
        
        if not employee:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Employee not found"
            )
        
        # Verify user exists
        user_result = await db.execute(
            select(User).where(User.id == user_id)
        )
        user = user_result.scalar_one_or_none()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Check if another employee is already linked to this user
        # Convert user_id to UUID format for comparison
        user_uuid_str = f"00000000-0000-0000-0000-{user_id:012d}"
        user_uuid = UUID(user_uuid_str)
        
        existing_employee_result = await db.execute(
            select(Employee).where(
                Employee.user_id == user_uuid,
                Employee.id != emp_uuid
            )
        )
        existing_employee = existing_employee_result.scalar_one_or_none()
        
        if existing_employee:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"User is already linked to employee {existing_employee.first_name} {existing_employee.last_name}"
            )
        
        # Update employee user_id
        # Note: Employee.user_id is UUID type, but User.id is Integer
        # We need to convert the integer user_id to UUID format
        # Convert integer to UUID by padding with zeros
        from uuid import UUID, uuid4
        # Since User.id is Integer and Employee.user_id expects UUID,
        # we'll create a deterministic UUID from the integer
        # Format: 00000000-0000-0000-0000-{user_id:012d}
        user_uuid_str = f"00000000-0000-0000-0000-{user_id:012d}"
        employee.user_id = UUID(user_uuid_str)
        
        await db.commit()
        await db.refresh(employee)
        
        # Helper function to convert UUID user_id to integer
        def uuid_to_user_id(uuid_value):
            """Convert UUID-formatted user_id back to integer"""
            if not uuid_value:
                return None
            try:
                uuid_str = str(uuid_value)
                parts = uuid_str.split('-')
                if len(parts) == 5:
                    # Last part contains the user_id as zero-padded string
                    user_id_str = parts[-1].lstrip('0') or '0'
                    return int(user_id_str)
            except Exception:
                pass
            return None
        
        return EmployeeResponse(
            id=str(employee.id),
            first_name=employee.first_name,
            last_name=employee.last_name,
            email=employee.email,
            phone=employee.phone,
            job_title=employee.job_title,
            department=employee.department,
            hire_date=employee.hire_date.isoformat() if employee.hire_date else None,
            birth_date=employee.birth_date.isoformat() if employee.birth_date else None,
            photo_url=employee.photo_url,
            linkedin_url=employee.linkedin_url,
            user_id=str(uuid_to_user_id(employee.user_id)) if employee.user_id else None,
        )
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid employee ID format"
        )
    except Exception as e:
        logger.error(f"Error linking employee to user: {e}", exc_info=True)
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to link employee to user: {str(e)}"
        )


@router.delete("/{employee_id}/unlink-user", response_model=EmployeeResponse)
async def unlink_employee_from_user(
    request: Request,
    employee_id: str,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_superadmin)],
) -> EmployeeResponse:
    """
    Unlink an employee from a user
    
    Removes the user_id link from an employee
    """
    if not EMPLOYEE_MODEL_AVAILABLE:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Employee model is not available"
        )
    
    try:
        # Parse employee_id as UUID
        emp_uuid = UUID(employee_id)
        
        # Get employee
        result = await db.execute(
            select(Employee).where(Employee.id == emp_uuid)
        )
        employee = result.scalar_one_or_none()
        
        if not employee:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Employee not found"
            )
        
        # Remove user_id link
        employee.user_id = None
        await db.commit()
        await db.refresh(employee)
        
        return EmployeeResponse(
            id=str(employee.id),
            first_name=employee.first_name,
            last_name=employee.last_name,
            email=employee.email,
            job_title=employee.job_title,
            department=employee.department,
            user_id=None,
        )
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid employee ID format"
        )
    except Exception as e:
        logger.error(f"Error unlinking employee from user: {e}", exc_info=True)
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to unlink employee from user: {str(e)}"
        )
