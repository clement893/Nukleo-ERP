"""Email tasks."""

from app.celery_app import celery_app


@celery_app.task(bind=True, max_retries=3)
def send_email_task(self, to_email: str, subject: str, body: str):
    """Send email task."""
    try:
        # TODO: Implement email sending with SendGrid, Mailgun, etc.
        print(f"Sending email to {to_email}")
        print(f"Subject: {subject}")
        print(f"Body: {body}")
        return {"status": "sent", "to": to_email}
    except Exception as exc:
        # Retry with exponential backoff
        raise self.retry(exc=exc, countdown=60)


@celery_app.task
def send_welcome_email(email: str, name: str):
    """Send welcome email."""
    subject = f"Welcome {name}!"
    body = f"Hello {name}, welcome to MODELE-NEXTJS-FULLSTACK!"
    return send_email_task.delay(email, subject, body)


@celery_app.task
def send_password_reset_email(email: str, reset_token: str):
    """Send password reset email."""
    subject = "Password Reset Request"
    body = f"Click here to reset your password: http://localhost:3000/reset?token={reset_token}"
    return send_email_task.delay(email, subject, body)
