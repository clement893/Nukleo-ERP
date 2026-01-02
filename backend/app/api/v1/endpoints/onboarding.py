"""
Onboarding API Endpoints
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.services.onboarding_service import OnboardingService
from app.models.user import User
from app.models.onboarding import OnboardingStep
from app.dependencies import get_current_user
from app.core.database import get_db
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()


class OnboardingStepResponse(BaseModel):
    id: int
    key: str
    title: str
    description: Optional[str]
    order: int
    step_type: str
    step_data: Optional[dict]
    required: bool

    class Config:
        from_attributes = True


class OnboardingProgressResponse(BaseModel):
    is_completed: bool
    current_step: Optional[str]
    completed_count: int
    total_count: int
    progress_percentage: float


@router.get("/onboarding/steps", response_model=List[OnboardingStepResponse], tags=["onboarding"])
async def get_onboarding_steps(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get active onboarding steps for the current user"""
    from app.services.rbac_service import RBACService
    
    service = OnboardingService(db)
    rbac_service = RBACService(db)
    user_roles = await rbac_service.get_user_roles(current_user.id)
    # Convert roles to list of role slugs for the service
    user_role_slugs = [role.slug for role in user_roles] if user_roles else None
    steps = await service.get_active_steps(user_roles=user_role_slugs)
    return [OnboardingStepResponse.model_validate(s) for s in steps]


@router.get("/onboarding/progress", response_model=OnboardingProgressResponse, tags=["onboarding"])
async def get_onboarding_progress(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get onboarding progress for the current user"""
    service = OnboardingService(db)
    progress = await service.get_progress(current_user.id)
    return OnboardingProgressResponse(**progress)


@router.get("/onboarding/next-step", response_model=Optional[OnboardingStepResponse], tags=["onboarding"])
async def get_next_step(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the next onboarding step for the current user"""
    service = OnboardingService(db)
    # Initialize if needed
    await service.initialize_onboarding(current_user.id)
    step = await service.get_next_step(current_user.id)
    if step:
        return OnboardingStepResponse.model_validate(step)
    return None


@router.post("/onboarding/initialize", tags=["onboarding"])
async def initialize_onboarding(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Initialize onboarding for the current user"""
    from app.services.rbac_service import RBACService
    
    service = OnboardingService(db)
    rbac_service = RBACService(db)
    user_roles = await rbac_service.get_user_roles(current_user.id)
    # Convert roles to list of role slugs for the service
    user_role_slugs = [role.slug for role in user_roles] if user_roles else None
    onboarding = await service.initialize_onboarding(current_user.id, user_roles=user_role_slugs)
    return {"success": True, "message": "Onboarding initialized"}


@router.post("/onboarding/steps/{step_key}/complete", tags=["onboarding"])
async def complete_step(
    step_key: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mark an onboarding step as completed"""
    service = OnboardingService(db)
    onboarding = await service.complete_step(current_user.id, step_key)
    if not onboarding:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Onboarding not initialized"
        )
    return {"success": True, "message": "Step completed"}


@router.post("/onboarding/steps/{step_key}/skip", tags=["onboarding"])
async def skip_step(
    step_key: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Skip an onboarding step"""
    service = OnboardingService(db)
    onboarding = await service.skip_step(current_user.id, step_key)
    if not onboarding:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Onboarding not initialized"
        )
    return {"success": True, "message": "Step skipped"}


# Employee onboarding endpoints
@router.get("/employees/{employee_id}/onboarding/progress", response_model=OnboardingProgressResponse, tags=["onboarding", "employees"])
async def get_employee_onboarding_progress(
    employee_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get onboarding progress for an employee"""
    from app.models.employee import Employee
    from sqlalchemy import select
    
    # Get employee
    result = await db.execute(select(Employee).where(Employee.id == employee_id))
    employee = result.scalar_one_or_none()
    
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found"
        )
    
    if not employee.user_id:
        # Employee doesn't have a user account yet
        return {
            "is_completed": False,
            "current_step": None,
            "completed_count": 0,
            "total_count": 0,
            "progress_percentage": 0.0
        }
    
    service = OnboardingService(db)
    progress = await service.get_progress(employee.user_id)
    return OnboardingProgressResponse(**progress)


@router.get("/employees/{employee_id}/onboarding/steps", response_model=List[OnboardingStepResponse], tags=["onboarding", "employees"])
async def get_employee_onboarding_steps(
    employee_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get onboarding steps for an employee"""
    from app.models.employee import Employee
    from app.services.rbac_service import RBACService
    from sqlalchemy import select
    
    # Get employee
    result = await db.execute(select(Employee).where(Employee.id == employee_id))
    employee = result.scalar_one_or_none()
    
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found"
        )
    
    service = OnboardingService(db)
    
    # Get user roles if employee has a user account
    user_role_slugs = None
    if employee.user_id:
        rbac_service = RBACService(db)
        user_roles = await rbac_service.get_user_roles(employee.user_id)
        user_role_slugs = [role.slug for role in user_roles] if user_roles else None
    
    steps = await service.get_active_steps(user_roles=user_role_slugs)
    return [OnboardingStepResponse.model_validate(s) for s in steps]


@router.post("/employees/{employee_id}/onboarding/initialize", tags=["onboarding", "employees"])
async def initialize_employee_onboarding(
    employee_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Initialize onboarding for an employee"""
    from app.models.employee import Employee
    from app.services.rbac_service import RBACService
    from sqlalchemy import select
    
    # Get employee
    result = await db.execute(select(Employee).where(Employee.id == employee_id))
    employee = result.scalar_one_or_none()
    
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found"
        )
    
    if not employee.user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Employee must have a user account to initialize onboarding"
        )
    
    service = OnboardingService(db)
    rbac_service = RBACService(db)
    user_roles = await rbac_service.get_user_roles(employee.user_id)
    user_role_slugs = [role.slug for role in user_roles] if user_roles else None
    onboarding = await service.initialize_onboarding(employee.user_id, user_roles=user_role_slugs)
    return {"success": True, "message": "Onboarding initialized"}


@router.post("/employees/{employee_id}/onboarding/steps/{step_key}/complete", tags=["onboarding", "employees"])
async def complete_employee_onboarding_step(
    employee_id: int,
    step_key: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mark an onboarding step as completed for an employee"""
    from app.models.employee import Employee
    from sqlalchemy import select
    
    # Get employee
    result = await db.execute(select(Employee).where(Employee.id == employee_id))
    employee = result.scalar_one_or_none()
    
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found"
        )
    
    if not employee.user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Employee must have a user account"
        )
    
    service = OnboardingService(db)
    onboarding = await service.complete_step(employee.user_id, step_key)
    if not onboarding:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Onboarding not initialized"
        )
    return {"success": True, "message": "Step completed"}


@router.get("/employees/onboarding/list", tags=["onboarding", "employees"])
async def list_employees_onboarding(
    team_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 1000,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all employees with their onboarding status"""
    from app.models.employee import Employee
    from sqlalchemy import select, and_
    
    query = select(Employee)
    if team_id:
        query = query.where(Employee.team_id == team_id)
    
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    employees = result.scalars().all()
    
    service = OnboardingService(db)
    onboarding_list = []
    
    for employee in employees:
        progress_data = {
            "is_completed": False,
            "current_step": None,
            "completed_count": 0,
            "total_count": 0,
            "progress_percentage": 0.0
        }
        
        if employee.user_id:
            progress_data = await service.get_progress(employee.user_id)
        
        onboarding_list.append({
            "employee_id": employee.id,
            "employee_name": f"{employee.first_name} {employee.last_name}",
            "employee_email": employee.email,
            "hire_date": employee.hire_date.isoformat() if employee.hire_date else None,
            "team_id": employee.team_id,
            "user_id": employee.user_id,
            "progress": progress_data
        })
    
    return onboarding_list

