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
        from sqlalchemy import and_
        # Try exact match first
        result = await db.execute(
            select(Employee).where(
                and_(
                    Employee.first_name.ilike(f"%{first_name}%"),
                    Employee.last_name.ilike(f"%{last_name}%")
                )
            )
        )
        employee = result.scalar_one_or_none()
        
        if employee:
            logger.debug(f"Found employee: {employee.first_name} {employee.last_name} (ID: {employee.id})")
            return employee.id
        
        # If not found, try case-insensitive exact match
        result = await db.execute(
            select(Employee).where(
                and_(
                    Employee.first_name.ilike(first_name),
                    Employee.last_name.ilike(last_name)
                )
            )
        )
        employee = result.scalar_one_or_none()
        
        if employee:
            logger.debug(f"Found employee (exact match): {employee.first_name} {employee.last_name} (ID: {employee.id})")
            return employee.id
        
        logger.warning(f"Employee not found: {first_name} {last_name}")
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
                logger.debug(f"Looking for employee with name: '{assignee_name}'")
                name_parts = assignee_name.split(' ', 1)
                if len(name_parts) == 2:
                    employee_id = await find_employee_by_name(name_parts[0], name_parts[1], db)
                    if employee_id:
                        logger.debug(f"Found employee ID: {employee_id}")
                        user_id = await get_or_create_user_for_employee(employee_id, db)
                        if user_id:
                            logger.debug(f"Got or created user ID: {user_id} for employee")
                        else:
                            logger.warning(f"Could not get or create user for employee {employee_id}")
                    else:
                        logger.warning(f"Employee not found: {assignee_name}")
                else:
                    logger.warning(f"Invalid assignee_name format: '{assignee_name}' (expected 'First Last')")
            
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
        # Note: We load rules for ALL users, not just the opportunity owner
        # This allows admins to create global automation rules
        rules_result = await db.execute(
            select(AutomationRule).where(
                AutomationRule.enabled == True,
                AutomationRule.trigger_event == 'opportunity.stage_changed'
            )
        )
        rules = rules_result.scalars().all()
        
        logger.info(f"Loaded {len(rules)} enabled automation rules for 'opportunity.stage_changed'")
        for rule in rules:
            logger.debug(f"  - Rule '{rule.name}' (ID: {rule.id}, User: {rule.user_id}, Enabled: {rule.enabled})")
        
        logger.info(f"Found {len(rules)} enabled automation rules for 'opportunity.stage_changed'")
        logger.info(f"Opportunity {opportunity.id}: pipeline='{pipeline_name}', stage='{stage_name}'")
        logger.info(f"Stage changed from {old_stage_id} to {new_stage_id}")
        
        if len(rules) == 0:
            logger.warning(f"No automation rules found for event 'opportunity.stage_changed'. Check if rules are enabled and exist in database.")
        
        # Execute matching rules
        for rule in rules:
            logger.info(f"Evaluating rule '{rule.name}' (ID: {rule.id}, User: {rule.user_id})")
            try:
                # Check trigger conditions
                conditions = rule.trigger_conditions or {}
                matches = True
                
                logger.debug(f"Checking rule '{rule.name}' (ID: {rule.id})")
                
                # Check pipeline condition
                if 'pipeline_name' in conditions:
                    expected_pipeline = conditions['pipeline_name']
                    pipeline_match = pipeline_name.upper() == expected_pipeline.upper()
                    if not pipeline_match:
                        matches = False
                        logger.debug(f"Pipeline condition not met: expected '{expected_pipeline}', got '{pipeline_name}'")
                    else:
                        logger.debug(f"Pipeline condition met: '{pipeline_name}' matches '{expected_pipeline}'")
                
                # Check stage condition
                if 'stage_name' in conditions:
                    expected_stage = conditions['stage_name']
                    # Normalize both strings for comparison (remove extra spaces, convert to lowercase, remove special chars)
                    def normalize_stage_name(name: str) -> str:
                        # Remove extra spaces, convert to lowercase, remove dashes and special formatting
                        normalized = ' '.join(name.lower().split())
                        # Remove leading numbers and dashes for better matching (e.g., "05-proposal to do" -> "proposal to do")
                        # But keep the full string for exact match first
                        return normalized
                    
                    normalized_expected = normalize_stage_name(expected_stage)
                    normalized_stage = normalize_stage_name(stage_name)
                    
                    # Try exact match first (case-insensitive)
                    stage_match_exact = normalized_expected == normalized_stage
                    # Then try substring match
                    stage_match_substring = normalized_expected in normalized_stage or normalized_stage in normalized_expected
                    stage_match = stage_match_exact or stage_match_substring
                    
                    if not stage_match:
                        matches = False
                        logger.debug(f"Stage condition not met: expected '{expected_stage}' (normalized: '{normalized_expected}') not found in '{stage_name}' (normalized: '{normalized_stage}')")
                        logger.debug(f"  Exact match: {stage_match_exact}, Substring match: {stage_match_substring}")
                    else:
                        logger.debug(f"Stage condition met: '{stage_name}' matches '{expected_stage}' (exact: {stage_match_exact}, substring: {stage_match_substring})")
                
                if not matches:
                    logger.debug(f"Rule '{rule.name}' does not match conditions, skipping")
                    continue
                
                logger.info(f"Rule '{rule.name}' matches! Executing actions...")
                
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
                
                # Send WebSocket notification to user about automation trigger
                try:
                    from app.api.v1.endpoints.websocket import manager
                    from app.models.user import User
                    
                    # Get user to send notification to
                    user_result = await db.execute(select(User).where(User.id == rule.user_id))
                    user = user_result.scalar_one_or_none()
                    
                    if user:
                        # Send WebSocket notification
                        notification_data = {
                            "type": "automation_triggered",
                            "data": {
                                "rule_id": rule.id,
                                "rule_name": rule.name,
                                "trigger_event": rule.trigger_event,
                                "success": all_succeeded,
                                "opportunity_name": opportunity.name if 'opportunity' in context else None,
                                "pipeline_name": pipeline_name,
                                "stage_name": stage_name,
                                "timestamp": datetime.now().isoformat()
                            }
                        }
                        await manager.send_personal_message(notification_data, str(user.id))
                except Exception as ws_error:
                    # Don't fail automation if WebSocket fails
                    logger.warning(f"Failed to send WebSocket notification for automation: {ws_error}")
                
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
