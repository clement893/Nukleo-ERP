"""
Task Due Alerts Tasks
Periodic tasks to check task due dates and create notifications
"""

from datetime import datetime, timedelta, timezone
from app.celery_app import celery_app
from app.core.logging import logger
from app.utils.notifications import create_notification_async
from app.utils.notification_templates import NotificationTemplates
from app.models.notification import NotificationType


@celery_app.task
def check_task_due_dates_task():
    """
    Periodic task to check task due dates and create notifications
    Should be scheduled to run daily (e.g., at 8 AM)
    """
    try:
        from app.core.config import settings
        from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
        from sqlalchemy import select, and_
        from app.models.project_task import ProjectTask, TaskStatus
        from app.models.user import User
        
        # Create async session
        async_engine = create_async_engine(
            settings.DATABASE_URL,
            pool_pre_ping=True,
            pool_size=5,
            max_overflow=10,
        )
        AsyncSessionLocal = async_sessionmaker(async_engine, expire_on_commit=False)
        
        async def check_due_dates():
            async with AsyncSessionLocal() as async_db:
                today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
                three_days_from_now = today + timedelta(days=3)
                
                # Get all active tasks with due dates in the next 3 days
                tasks_query = select(ProjectTask).where(
                    and_(
                        ProjectTask.due_date.isnot(None),
                        ProjectTask.due_date >= today,
                        ProjectTask.due_date <= three_days_from_now,
                        ProjectTask.status != TaskStatus.COMPLETED
                    )
                )
                
                tasks_result = await async_db.execute(tasks_query)
                tasks = tasks_result.scalars().all()
                
                notification_count = 0
                
                for task in tasks:
                    if not task.assignee_id:
                        continue
                    
                    # Calculate days until due
                    due_date = task.due_date
                    if isinstance(due_date, str):
                        due_date = datetime.fromisoformat(due_date.replace('Z', '+00:00'))
                    
                    days_until_due = (due_date.date() - today.date()).days
                    
                    # Only notify if due in 1-3 days (avoid duplicates)
                    if 1 <= days_until_due <= 3:
                        try:
                            template = NotificationTemplates.task_due_soon(
                                task_title=task.title or "Untitled Task",
                                days_until_due=days_until_due,
                                task_id=task.id
                            )
                            await create_notification_async(
                                db=async_db,
                                user_id=task.assignee_id,
                                **template
                            )
                            notification_count += 1
                            logger.info(f"Created due soon notification for task {task.id}, user {task.assignee_id}")
                        except Exception as e:
                            logger.error(f"Failed to create notification for task {task.id}: {e}", exc_info=True)
                
                # Check for overdue tasks
                overdue_tasks_query = select(ProjectTask).where(
                    and_(
                        ProjectTask.due_date.isnot(None),
                        ProjectTask.due_date < today,
                        ProjectTask.status != TaskStatus.COMPLETED
                    )
                )
                
                overdue_result = await async_db.execute(overdue_tasks_query)
                overdue_tasks = overdue_result.scalars().all()
                
                for task in overdue_tasks:
                    if not task.assignee_id:
                        continue
                    
                    # Calculate days overdue
                    due_date = task.due_date
                    if isinstance(due_date, str):
                        due_date = datetime.fromisoformat(due_date.replace('Z', '+00:00'))
                    
                    days_overdue = (today.date() - due_date.date()).days
                    
                    # Only notify once per day for overdue tasks (check metadata to avoid duplicates)
                    try:
                        template = NotificationTemplates.task_overdue(
                            task_title=task.title or "Untitled Task",
                            days_overdue=days_overdue,
                            task_id=task.id
                        )
                        await create_notification_async(
                            db=async_db,
                            user_id=task.assignee_id,
                            **template
                        )
                        
                        # Also notify creator if different
                        if task.created_by_id and task.created_by_id != task.assignee_id:
                            await create_notification_async(
                                db=async_db,
                                user_id=task.created_by_id,
                                **template
                            )
                        
                        notification_count += 1
                        logger.info(f"Created overdue notification for task {task.id}")
                    except Exception as e:
                        logger.error(f"Failed to create overdue notification for task {task.id}: {e}", exc_info=True)
                
                await async_db.commit()
                logger.info(f"Task due dates check completed. Created {notification_count} notifications.")
                return {
                    "status": "success",
                    "notifications_created": notification_count
                }
        
        # Run async function
        import asyncio
        loop = asyncio.get_event_loop()
        if loop.is_running():
            import nest_asyncio
            nest_asyncio.apply()
            return loop.run_until_complete(check_due_dates())
        else:
            return loop.run_until_complete(check_due_dates())
            
    except Exception as exc:
        logger.error(f"Failed to check task due dates: {exc}", exc_info=True)
        raise
