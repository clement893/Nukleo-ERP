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
from app.models.automation_rule import AutomationRule, AutomationRuleExecutionLog
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


async def execute_automation_action(
    action: dict,
    context: dict,
    db: AsyncSession
) -> bool:
    """
    Execute a single automation action.
    
    Args:
        action: Action configuration (type, config)
        context: Context data (opportunity, etc.)
        db: Database session
        
    Returns:
        True if action succeeded, False otherwise
    """
    try:
        action_type = action.get('type')
        action_config = action.get('config', {})
        
        if action_type == 'task.create':
            # Create a task
            title = action_config.get('title', 'Nouvelle tâche')
            description = action_config.get('description', '')
            assignee_name = action_config.get('assignee_name')  # e.g., "Clément Roy"
            due_date_today = action_config.get('due_date_today', False)
            priority = action_config.get('priority', 'high')
            
            # Find employee by name if provided
            user_id = None
            if assignee_name:
                name_parts = assignee_name.split(' ', 1)
                if len(name_parts) == 2:
                    employee_id = await find_employee_by_name(name_parts[0], name_parts[1], db)
                    if employee_id:
                        user_id = await get_or_create_user_for_employee(employee_id, db)
            
            # Get team (use first team or from config)
            team_id = action_config.get('team_id')
            if not team_id:
                team_result = await db.execute(select(Team).limit(1))
                team = team_result.scalar_one_or_none()
                if team:
                    team_id = team.id
            
            if not team_id:
                logger.warning("No team found for task creation")
                return False
            
            # Set due date
            due_date = None
            if due_date_today:
                today = datetime.now().date()
                due_date = datetime.combine(today, datetime.min.time())
            
            # Replace placeholders in title and description
            if 'opportunity' in context:
                opp = context['opportunity']
                title = title.replace('{opportunity_name}', opp.name or '')
                description = description.replace('{opportunity_name}', opp.name or '')
            
            task = ProjectTask(
                title=title,
                description=description,
                status=TaskStatus.TODO.value,
                priority=priority.upper() if isinstance(priority, str) else priority,
                team_id=team_id,
                assignee_id=user_id,
                due_date=due_date,
            )
            
            db.add(task)
            await db.commit()
            await db.refresh(task)
            
            logger.info(f"Created task {task.id} via automation")
            return True
            
        elif action_type == 'email.send':
            # TODO: Implement email sending
            logger.warning("Email sending not yet implemented in automation")
            return False
            
        elif action_type == 'notification.send':
            # TODO: Implement notification sending
            logger.warning("Notification sending not yet implemented in automation")
            return False
            
        else:
            logger.warning(f"Unknown action type: {action_type}")
            return False
            
    except Exception as e:
        logger.error(f"Error executing automation action: {e}", exc_info=True)
        return False


async def handle_opportunity_stage_change(
    opportunity: Opportunite,
    old_stage_id: Optional[UUID],
    new_stage_id: Optional[UUID],
    db: AsyncSession
) -> None:
    """
    Handle automation when an opportunity changes stage.
    
    This function loads enabled automation rules from the database
    and executes matching rules.
    """
    try:
        # Load pipeline and stage information
        await db.refresh(opportunity, ["pipeline", "stage"])
        
        if not opportunity.pipeline or not opportunity.stage:
            return
        
        pipeline_name = opportunity.pipeline.name
        stage_name = opportunity.stage.name
        
        # Find all enabled automation rules for the event 'opportunity.stage_changed'
        rules_result = await db.execute(
            select(AutomationRule).where(
                AutomationRule.enabled == True,
                AutomationRule.trigger_event == 'opportunity.stage_changed'
            )
        )
        rules = rules_result.scalars().all()
        
        # Execute matching rules
        for rule in rules:
            try:
                # Check trigger conditions
                conditions = rule.trigger_conditions or {}
                matches = True
                
                # Check pipeline condition
                if 'pipeline_name' in conditions:
                    expected_pipeline = conditions['pipeline_name']
                    if pipeline_name.upper() != expected_pipeline.upper():
                        matches = False
                
                # Check stage condition
                if 'stage_name' in conditions:
                    expected_stage = conditions['stage_name']
                    if expected_stage not in stage_name:
                        matches = False
                
                if not matches:
                    continue
                
                # Rule matches! Execute actions
                logger.info(f"Executing automation rule '{rule.name}' for opportunity {opportunity.id}")
                
                context = {
                    'opportunity': opportunity,
                    'pipeline_name': pipeline_name,
                    'stage_name': stage_name,
                    'old_stage_id': str(old_stage_id) if old_stage_id else None,
                    'new_stage_id': str(new_stage_id) if new_stage_id else None,
                }
                
                # Execute all actions
                all_succeeded = True
                for action in rule.actions:
                    success = await execute_automation_action(action, context, db)
                    if not success:
                        all_succeeded = False
                
                # Update rule statistics
                rule.trigger_count += 1
                rule.last_triggered_at = datetime.now()
                
                # Log execution
                log = AutomationRuleExecutionLog(
                    rule_id=rule.id,
                    executed_at=datetime.now(),
                    success=all_succeeded,
                    execution_data=context
                )
                db.add(log)
                
                await db.commit()
                await db.refresh(rule)
                
                logger.info(f"Automation rule '{rule.name}' executed successfully")
                
            except Exception as rule_error:
                logger.error(f"Error executing automation rule {rule.id}: {rule_error}", exc_info=True)
                # Log the error
                log = AutomationRuleExecutionLog(
                    rule_id=rule.id,
                    executed_at=datetime.now(),
                    success=False,
                    error_message=str(rule_error),
                    execution_data={'opportunity_id': str(opportunity.id)}
                )
                db.add(log)
                await db.commit()
                # Continue with other rules
            
    except Exception as e:
        logger.error(f"Error in handle_opportunity_stage_change: {e}", exc_info=True)
        # Don't raise - we don't want to break the opportunity update if automation fails
