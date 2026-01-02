"""
Notification Helper Utilities
Centralized functions for creating notifications
"""

from typing import Optional, Dict, Any, List
from app.tasks.notification_tasks import send_notification_task
from app.services.notification_service import NotificationService
from app.models.notification import NotificationType
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.logging import logger


async def create_notification_async(
    db: AsyncSession,
    user_id: int,
    title: str,
    message: str,
    notification_type: NotificationType = NotificationType.INFO,
    action_url: Optional[str] = None,
    action_label: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
    send_email: bool = False
) -> int:
    """
    Create a notification synchronously (for immediate use in endpoints)
    Returns notification ID
    """
    try:
        service = NotificationService(db)
        notification = await service.create_notification(
            user_id=user_id,
            title=title,
            message=message,
            notification_type=notification_type,
            action_url=action_url,
            action_label=action_label,
            metadata=metadata
        )
        
        # Optionally send email via Celery
        if send_email:
            send_notification_task.delay(
                user_id=user_id,
                title=title,
                message=message,
                notification_type=notification_type.value,
                email_notification=True
            )
        
        logger.info(f"Created notification {notification.id} for user {user_id}")
        return notification.id
    except Exception as e:
        logger.error(f"Failed to create notification for user {user_id}: {e}", exc_info=True)
        raise


def create_notification_async_task(
    user_id: int,
    title: str,
    message: str,
    notification_type: str = "info",
    action_url: Optional[str] = None,
    action_label: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
    send_email: bool = True
):
    """
    Create a notification via Celery task (for background processing)
    Returns Celery task result
    """
    try:
        return send_notification_task.delay(
            user_id=user_id,
            title=title,
            message=message,
            notification_type=notification_type,
            email_notification=send_email,
            action_url=action_url,
            action_label=action_label,
            metadata=metadata
        )
    except Exception as e:
        logger.error(f"Failed to queue notification task for user {user_id}: {e}", exc_info=True)
        raise


async def create_notifications_for_users(
    db: AsyncSession,
    user_ids: List[int],
    title: str,
    message: str,
    notification_type: NotificationType = NotificationType.INFO,
    action_url: Optional[str] = None,
    action_label: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
    use_async_task: bool = False
) -> List[int]:
    """
    Create notifications for multiple users
    Returns list of notification IDs
    """
    notification_ids = []
    
    for user_id in user_ids:
        try:
            if use_async_task:
                # Use Celery for background processing
                create_notification_async_task(
                    user_id=user_id,
                    title=title,
                    message=message,
                    notification_type=notification_type.value,
                    action_url=action_url,
                    action_label=action_label,
                    metadata=metadata,
                    send_email=False  # Don't send email for bulk notifications
                )
            else:
                # Create synchronously
                notification_id = await create_notification_async(
                    db=db,
                    user_id=user_id,
                    title=title,
                    message=message,
                    notification_type=notification_type,
                    action_url=action_url,
                    action_label=action_label,
                    metadata=metadata,
                    send_email=False
                )
                notification_ids.append(notification_id)
        except Exception as e:
            logger.error(f"Failed to create notification for user {user_id}: {e}", exc_info=True)
            # Continue with other users even if one fails
    
    return notification_ids
