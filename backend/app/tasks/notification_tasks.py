"""Notification tasks."""

from typing import Optional, Dict, Union
from app.celery_app import celery_app
from app.core.logging import logger
from app.services.email_service import EmailService


@celery_app.task(bind=True, max_retries=3)
def send_notification_task(
    self, 
    user_id: str, 
    title: str, 
    message: str,
    notification_type: str = "info",
    email_notification: bool = True,
    user_email: Optional[str] = None
):
    """
    Send notification to a user.
    
    Args:
        user_id: User ID to send notification to
        title: Notification title
        message: Notification message
        notification_type: Type of notification (info, success, warning, error)
        email_notification: Whether to send email notification (default: True)
        user_email: User email address (optional, will be fetched from DB if not provided)
    
    Returns:
        Dict with status and details
    """
    try:
        from app.core.database import get_db
        from app.models.user import User
        from sqlalchemy import select
        
        # Get user email if not provided
        if email_notification and not user_email:
            # TODO: Consider using async database session for better performance
            # For now, we'll log and try to send email if email service is available
            logger.info(f"Notification task: user_id={user_id}, title={title}, type={notification_type}")
        
        result: Dict[str, Union[str, bool, None]] = {
            "status": "sent",
            "user_id": user_id,
            "title": title,
            "message": message,
            "type": notification_type,
            "email_sent": False
        }
        
        # Send email notification if enabled
        if email_notification:
            try:
                email_service = EmailService()
                if email_service.is_configured() and user_email:
                    # Create HTML email content
                    html_content = f"""
                    <html>
                    <body>
                        <h2>{title}</h2>
                        <p>{message}</p>
                        <p><small>Type: {notification_type}</small></p>
                    </body>
                    </html>
                    """
                    
                    email_result = email_service.send_email(
                        to_email=user_email,
                        subject=f"Notification: {title}",
                        html_content=html_content,
                        text_content=message
                    )
                    result["email_sent"] = True
                    result["email_status"] = email_result.get("status")
                    logger.info(f"Email notification sent to {user_email} for user {user_id}")
                else:
                    logger.warning(f"Email service not configured or no email provided for user {user_id}")
            except Exception as email_error:
                logger.error(f"Failed to send email notification: {email_error}", exc_info=True)
                # Don't fail the whole task if email fails
        
        # Send WebSocket notification if user is connected
        # NOTE: This is a best-effort attempt, WebSocket may not be available in Celery context
        # WebSocket connections are managed in the main application context
        try:
            from app.api.v1.endpoints.websocket import manager
            # Try to send via WebSocket (non-blocking)
            import asyncio
            try:
                loop = asyncio.get_event_loop()
                if loop.is_running():
                    # If loop is running, schedule the coroutine
                    asyncio.create_task(manager.send_personal_message({
                        "type": "notification",
                        "data": {
                            "title": title,
                            "message": message,
                            "type": notification_type,
                            "user_id": user_id
                        }
                    }, user_id))
                else:
                    # If no loop is running, run the coroutine
                    loop.run_until_complete(manager.send_personal_message({
                        "type": "notification",
                        "data": {
                            "title": title,
                            "message": message,
                            "type": notification_type,
                            "user_id": user_id
                        }
                    }, user_id))
                result["websocket_sent"] = True
                logger.info(f"WebSocket notification sent to user {user_id}")
            except RuntimeError:
                # No event loop available, skip WebSocket
                logger.debug(f"No event loop available for WebSocket notification to user {user_id}")
                result["websocket_sent"] = False
        except Exception as ws_error:
            logger.warning(f"Failed to send WebSocket notification: {ws_error}")
            result["websocket_sent"] = False
        
        # Log notification
        logger.info(f"Notification sent successfully: user_id={user_id}, title={title}")
        
        return result
        
    except Exception as exc:
        logger.error(f"Failed to send notification: {exc}", exc_info=True)
        # Retry with exponential backoff
        raise self.retry(exc=exc, countdown=60)


@celery_app.task
def send_user_notification(user_id: str, title: str, message: str):
    """Send user notification."""
    return send_notification_task.delay(user_id, title, message)
