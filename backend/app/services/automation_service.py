"""
Automation Service
Service for handling automation rules and triggers
"""

from typing import Optional
from datetime import datetime, date
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID

from app.models.pipeline import Opportunite, Pipeline, PipelineStage
from app.models.project_task import ProjectTask, TaskStatus, TaskPriority
from app.models.team import Team
from app.core.logging import logger

# Try to import Employee model (may not exist in all installations)
try:
    from templates.modules.employes.models.employe import Employee
    EMPLOYEE_MODEL_AVAILABLE = True
except ImportError:
    EMPLOYEE_MODEL_AVAILABLE = False
    Employee = None


async def get_or_create_user_for_employee(employee_id: UUID, db: AsyncSession) -> Optional[int]:
    """
    Get or create a user for an employee.
    Returns the user_id (integer) if successful, None otherwise.
    """
    if not EMPLOYEE_MODEL_AVAILABLE or not Employee:
        logger.warning("Employee model not available")
        return None
    
    try:
        # Get employee
        result = await db.execute(select(Employee).where(Employee.id == employee_id))
        employee = result.scalar_one_or_none()
        
        if not employee:
            logger.warning(f"Employee {employee_id} not found")
            return None
        
        # If employee already has a user_id, try to find the user
        # Note: employee.user_id might be UUID but User.id is integer
        # So we'll search by email instead
        from app.models.user import User
        if employee.email:
            user_result = await db.execute(select(User).where(User.email == employee.email.lower()))
            user = user_result.scalar_one_or_none()
            if user:
                # Update employee.user_id if it's not set (even if types don't match, it's stored)
                if not employee.user_id:
                    employee.user_id = user.id
                    await db.commit()
                return user.id
        
        # Create user for employee if doesn't exist
        from app.api.v1.endpoints.auth import get_password_hash
        import secrets
        
        if not employee.email:
            logger.warning(f"Employee {employee_id} has no email, cannot create user")
            return None
        
        # Check if user with this email already exists
        user_result = await db.execute(select(User).where(User.email == employee.email.lower()))
        existing_user = user_result.scalar_one_or_none()
        if existing_user:
            # Update employee with existing user_id
            employee.user_id = existing_user.id
            await db.commit()
            return existing_user.id
        
        # Generate a random password (employee will need to reset it)
        random_password = secrets.token_urlsafe(32)
        
        new_user = User(
            email=employee.email.lower(),
            hashed_password=get_password_hash(random_password),
            first_name=employee.first_name,
            last_name=employee.last_name,
            is_active=True,
        )
        db.add(new_user)
        await db.flush()
        
        # Update employee with user_id
        # Note: This might cause a type mismatch if employee.user_id expects UUID
        # but we'll try to set it anyway
        try:
            employee.user_id = new_user.id
        except (TypeError, ValueError):
            # If there's a type mismatch, just log it - the user is created anyway
            logger.warning(f"Could not set user_id on employee {employee_id} due to type mismatch")
        await db.commit()
        await db.refresh(new_user)
        
        logger.info(f"Created user {new_user.id} for employee {employee_id}")
        return new_user.id
        
    except Exception as e:
        logger.error(f"Error getting or creating user for employee {employee_id}: {e}", exc_info=True)
        return None


async def find_employee_by_name(
    first_name: str,
    last_name: str,
    db: AsyncSession
) -> Optional[UUID]:
    """
    Find an employee by first name and last name.
    Returns the employee UUID if found, None otherwise.
    """
    if not EMPLOYEE_MODEL_AVAILABLE or not Employee:
        return None
    
    try:
        result = await db.execute(
            select(Employee).where(
                Employee.first_name.ilike(f"%{first_name}%"),
                Employee.last_name.ilike(f"%{last_name}%")
            )
        )
        employee = result.scalar_one_or_none()
        
        if employee:
            return employee.id
        return None
    except Exception as e:
        logger.error(f"Error finding employee by name {first_name} {last_name}: {e}", exc_info=True)
        return None


async def handle_opportunity_stage_change(
    opportunity: Opportunite,
    old_stage_id: Optional[UUID],
    new_stage_id: Optional[UUID],
    db: AsyncSession
) -> None:
    """
    Handle automation when an opportunity changes stage.
    
    This function checks if the opportunity moved to a specific stage
    and triggers the appropriate automation.
    """
    try:
        # Load pipeline and stage information
        await db.refresh(opportunity, ["pipeline", "stage"])
        
        if not opportunity.pipeline or not opportunity.stage:
            return
        
        pipeline_name = opportunity.pipeline.name
        stage_name = opportunity.stage.name
        
        # Check if this is the MAIN pipeline and stage is "05-Proposal to do"
        if pipeline_name and pipeline_name.upper() == "MAIN" and stage_name and "05-Proposal to do" in stage_name:
            logger.info(f"Automation triggered: Opportunity {opportunity.id} moved to stage '{stage_name}' in pipeline '{pipeline_name}'")
            
            # Find employee "Clément Roy"
            employee_id = await find_employee_by_name("Clément", "Roy", db)
            
            if not employee_id:
                logger.warning("Employee 'Clément Roy' not found, cannot create task")
                return
            
            # Get or create user for employee
            user_id = await get_or_create_user_for_employee(employee_id, db)
            
            if not user_id:
                logger.warning(f"Could not get or create user for employee {employee_id}")
                return
            
            # Get the first team (or a default team)
            # You may want to make this configurable
            team_result = await db.execute(select(Team).limit(1))
            team = team_result.scalar_one_or_none()
            
            if not team:
                logger.warning("No team found, cannot create task")
                return
            
            # Create task with due date = today
            today = datetime.now().date()
            due_date = datetime.combine(today, datetime.min.time())
            
            task = ProjectTask(
                title=f"Proposition à faire - {opportunity.name}",
                description=f"Opportunité '{opportunity.name}' est passée dans le stage '05-Proposal to do'. Créer la proposition.",
                status=TaskStatus.TODO.value,
                priority=TaskPriority.HIGH.value,
                team_id=team.id,
                assignee_id=user_id,
                due_date=due_date,
            )
            
            db.add(task)
            await db.commit()
            await db.refresh(task)
            
            logger.info(f"Created task {task.id} for opportunity {opportunity.id} automation")
            
    except Exception as e:
        logger.error(f"Error in handle_opportunity_stage_change: {e}", exc_info=True)
        # Don't raise - we don't want to break the opportunity update if automation fails
