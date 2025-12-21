"""Notification tasks."""

from app.celery_app import celery_app


@celery_app.task(bind=True, max_retries=3)
def send_notification_task(self, user_id: str, title: str, message: str):
    """Send notification task."""
    try:
        # TODO: Implement notification sending
        print(f"Sending notification to user {user_id}")
        print(f"Title: {title}")
        print(f"Message: {message}")
        return {"status": "sent", "user_id": user_id}
    except Exception as exc:
        # Retry with exponential backoff
        raise self.retry(exc=exc, countdown=60)


@celery_app.task
def send_user_notification(user_id: str, title: str, message: str):
    """Send user notification."""
    return send_notification_task.delay(user_id, title, message)
