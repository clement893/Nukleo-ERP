"""Email endpoints using SendGrid."""

import os
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field

from app.dependencies import get_current_user
from app.models import User
from app.services.email_service import EmailService

router = APIRouter(prefix="/api/email", tags=["email"])


class SendEmailRequest(BaseModel):
    """Schema for sending a custom email."""
    to_email: EmailStr = Field(..., description="Recipient email address")
    subject: str = Field(..., description="Email subject")
    html_content: str = Field(..., description="HTML content of the email")
    text_content: Optional[str] = Field(None, description="Plain text content (optional)")
    from_email: Optional[str] = Field(None, description="Sender email (optional)")
    from_name: Optional[str] = Field(None, description="Sender name (optional)")
    reply_to: Optional[str] = Field(None, description="Reply-to email (optional)")
    cc: Optional[List[str]] = Field(None, description="CC email addresses (optional)")
    bcc: Optional[List[str]] = Field(None, description="BCC email addresses (optional)")


class EmailResponse(BaseModel):
    """Schema for email response."""
    status: str = Field(..., description="Status of the email")
    status_code: Optional[int] = Field(None, description="HTTP status code from SendGrid")
    message_id: Optional[str] = Field(None, description="Message ID from SendGrid")
    to: str = Field(..., description="Recipient email address")


class TestEmailRequest(BaseModel):
    """Schema for test email request."""
    to_email: EmailStr = Field(..., description="Recipient email address for test")


@router.get("/health")
async def email_health_check(
    current_user: User = Depends(get_current_user),
):
    """Health check for SendGrid service (requires authentication)."""
    email_service = EmailService()
    
    if not email_service.is_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="SendGrid is not configured. Please set SENDGRID_API_KEY environment variable.",
        )
    
    return {
        "configured": True,
        "from_email": email_service.from_email,
        "from_name": email_service.from_name,
        "status": "ready",
    }


@router.get("/info")
async def email_info():
    """Get information about email API endpoints (no authentication required)."""
    email_service = EmailService()
    
    return {
        "message": "Email API Information",
        "description": "This API allows you to send emails via SendGrid",
        "configured": email_service.is_configured(),
        "from_email": email_service.from_email if email_service.is_configured() else None,
        "from_name": email_service.from_name if email_service.is_configured() else None,
        "endpoints": {
            "GET /api/email/info": {
                "description": "Get API information (no auth required)",
                "method": "GET"
            },
            "GET /api/email/health": {
                "description": "Check SendGrid configuration (auth required)",
                "method": "GET",
                "auth": "Bearer token required"
            },
            "GET /api/email/test": {
                "description": "Get test email endpoint info (auth required)",
                "method": "GET",
                "auth": "Bearer token required"
            },
            "POST /api/email/test": {
                "description": "Send a test email",
                "method": "POST",
                "auth": "Bearer token required",
                "body": {
                    "to_email": "recipient@example.com"
                }
            },
            "POST /api/email/welcome": {
                "description": "Send a welcome email",
                "method": "POST",
                "auth": "Bearer token required",
                "body": {
                    "to_email": "recipient@example.com"
                }
            },
            "POST /api/email/send": {
                "description": "Send a custom email",
                "method": "POST",
                "auth": "Bearer token required",
                "body": {
                    "to_email": "recipient@example.com",
                    "subject": "Email subject",
                    "html_content": "<h1>Hello</h1>",
                    "text_content": "Hello (optional)"
                }
            }
        },
        "how_to_use": {
            "frontend": f"Use the frontend at {os.getenv('FRONTEND_URL', 'http://localhost:3000')}/email/test",
            "api": "Use POST requests with Authorization header: Bearer <your-token>",
            "get_token": f"Login at {os.getenv('FRONTEND_URL', 'http://localhost:3000')}/auth/login"
        },
        "example_curl": {
            "test_email": f'curl -X POST "{os.getenv("BASE_URL", "http://localhost:8000")}/api/email/test" \\\n  -H "Authorization: Bearer YOUR_TOKEN" \\\n  -H "Content-Type: application/json" \\\n  -d \'{{"to_email": "your-email@example.com"}}\''
        }
    }


@router.get("/test")
async def get_test_email_info(
    current_user: User = Depends(get_current_user),
):
    """Get information about test email endpoint (GET endpoint for testing)."""
    email_service = EmailService()
    
    return {
        "message": "To send a test email, use POST /api/email/test with body: {\"to_email\": \"your-email@example.com\"}",
        "configured": email_service.is_configured(),
        "from_email": email_service.from_email,
        "from_name": email_service.from_name,
        "method": "POST",
        "endpoint": "/api/email/test",
        "required_fields": ["to_email"],
    }


@router.post("/send", response_model=EmailResponse)
async def send_email_endpoint(
    request_data: SendEmailRequest,
    current_user: User = Depends(get_current_user),
):
    """Send a custom email via SendGrid."""
    email_service = EmailService()
    
    try:
        result = email_service.send_email(
            to_email=request_data.to_email,
            subject=request_data.subject,
            html_content=request_data.html_content,
            text_content=request_data.text_content,
            from_email=request_data.from_email,
            from_name=request_data.from_name,
            reply_to=request_data.reply_to,
            cc=request_data.cc,
            bcc=request_data.bcc,
        )
        return EmailResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(e))


@router.post("/test", response_model=EmailResponse)
async def send_test_email(
    request_data: TestEmailRequest,
    current_user: User = Depends(get_current_user),
):
    """Send a test email to verify SendGrid configuration."""
    email_service = EmailService()
    
    subject = "Test Email from NukleoHUB"
    html_content = f"""
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #4F46E5;">Test Email</h1>
            <p>This is a test email from NukleoHUB.</p>
            <p>If you received this email, SendGrid is configured correctly!</p>
            <p>Sent by: {current_user.name} ({current_user.email})</p>
            <p>Best regards,<br>The NukleoHUB Team</p>
        </div>
    </body>
    </html>
    """
    text_content = """
    Test Email
    
    This is a test email from NukleoHUB.
    
    If you received this email, SendGrid is configured correctly!
    
    Best regards,
    The NukleoHUB Team
    """
    
    try:
        result = email_service.send_email(
            to_email=request_data.to_email,
            subject=subject,
            html_content=html_content,
            text_content=text_content,
        )
        return EmailResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(e))


@router.post("/welcome")
async def send_welcome_email_endpoint(
    request_data: TestEmailRequest,
    current_user: User = Depends(get_current_user),
):
    """Send a welcome email."""
    from app.tasks.email_tasks import send_welcome_email_task
    
    email_service = EmailService()
    
    # Extract name from email or use a default
    name = request_data.to_email.split("@")[0].replace(".", " ").title()
    
    try:
        # Use Celery task for async processing
        task = send_welcome_email_task.delay(request_data.to_email, name)
        return {
            "status": "queued",
            "task_id": task.id,
            "to": request_data.to_email,
            "message": "Welcome email queued for sending",
        }
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


class InvoiceEmailRequest(BaseModel):
    """Schema for invoice email request."""
    to_email: EmailStr
    name: str
    invoice_number: str
    invoice_date: str
    amount: float
    currency: str = "EUR"
    invoice_url: Optional[str] = None
    items: Optional[List[Dict[str, Union[str, int, float]]]] = None


@router.post("/invoice")
async def send_invoice_email_endpoint(
    request_data: InvoiceEmailRequest,
    current_user: User = Depends(get_current_user),
):
    """Send an invoice email."""
    from app.tasks.email_tasks import send_invoice_email_task
    
    try:
        task = send_invoice_email_task.delay(
            request_data.to_email,
            request_data.name,
            request_data.invoice_number,
            request_data.invoice_date,
            request_data.amount,
            request_data.currency,
            request_data.invoice_url,
            request_data.items or [],
        )
        return {
            "status": "queued",
            "task_id": task.id,
            "to": request_data.to_email,
            "message": "Invoice email queued for sending",
        }
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


class SubscriptionEmailRequest(BaseModel):
    """Schema for subscription email request."""
    to_email: EmailStr
    name: str
    plan_name: str
    amount: float
    currency: str = "EUR"


@router.post("/subscription/created")
async def send_subscription_created_email_endpoint(
    request_data: SubscriptionEmailRequest,
    current_user: User = Depends(get_current_user),
):
    """Send subscription created email."""
    from app.tasks.email_tasks import send_subscription_created_email_task
    
    try:
        task = send_subscription_created_email_task.delay(
            request_data.to_email,
            request_data.name,
            request_data.plan_name,
            request_data.amount,
            request_data.currency,
        )
        return {
            "status": "queued",
            "task_id": task.id,
            "to": request_data.to_email,
            "message": "Subscription created email queued for sending",
        }
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


class SubscriptionCancelledEmailRequest(BaseModel):
    """Schema for subscription cancelled email request."""
    to_email: EmailStr
    name: str
    plan_name: str
    end_date: str


@router.post("/subscription/cancelled")
async def send_subscription_cancelled_email_endpoint(
    request_data: SubscriptionCancelledEmailRequest,
    current_user: User = Depends(get_current_user),
):
    """Send subscription cancelled email."""
    from app.tasks.email_tasks import send_subscription_cancelled_email_task
    
    try:
        task = send_subscription_cancelled_email_task.delay(
            request_data.to_email,
            request_data.name,
            request_data.plan_name,
            request_data.end_date,
        )
        return {
            "status": "queued",
            "task_id": task.id,
            "to": request_data.to_email,
            "message": "Subscription cancelled email queued for sending",
        }
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


class TrialEndingEmailRequest(BaseModel):
    """Schema for trial ending email request."""
    to_email: EmailStr
    name: str
    days_remaining: int
    upgrade_url: Optional[str] = None


@router.post("/trial/ending")
async def send_trial_ending_email_endpoint(
    request_data: TrialEndingEmailRequest,
    current_user: User = Depends(get_current_user),
):
    """Send trial ending soon email."""
    from app.tasks.email_tasks import send_trial_ending_email_task
    
    try:
        task = send_trial_ending_email_task.delay(
            request_data.to_email,
            request_data.name,
            request_data.days_remaining,
            request_data.upgrade_url,
        )
        return {
            "status": "queued",
            "task_id": task.id,
            "to": request_data.to_email,
            "message": "Trial ending email queued for sending",
        }
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

