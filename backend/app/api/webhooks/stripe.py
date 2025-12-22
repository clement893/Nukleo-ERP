"""
Stripe Webhooks
Handle Stripe webhook events
"""

from fastapi import APIRouter, Request, HTTPException, status, Header, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime

from app.core.database import get_db
from app.services.stripe_service import StripeService
from app.services.subscription_service import SubscriptionService
from app.models.subscription import SubscriptionStatus
from app.models.invoice import InvoiceStatus
from app.core.logging import logger

router = APIRouter(prefix="/webhooks/stripe", tags=["webhooks"])


@router.post("")
async def stripe_webhook(
    request: Request,
    stripe_signature: str = Header(..., alias="stripe-signature"),
    db: AsyncSession = Depends(get_db),
):
    """Handle Stripe webhook events"""
    payload = await request.body()
    
    stripe_service = StripeService(db)
    subscription_service = SubscriptionService(db)
    
    try:
        event_data = await stripe_service.handle_webhook(payload, stripe_signature)
        event_type = event_data["type"]
        event_object = event_data["data"]["object"]
        
        logger.info(f"Stripe webhook received: {event_type}")
        
        # Handle different event types
        if event_type == "checkout.session.completed":
            await handle_checkout_completed(event_object, db, subscription_service)
        
        elif event_type == "customer.subscription.created":
            await handle_subscription_created(event_object, db, subscription_service)
        
        elif event_type == "customer.subscription.updated":
            await handle_subscription_updated(event_object, db, subscription_service)
        
        elif event_type == "customer.subscription.deleted":
            await handle_subscription_deleted(event_object, db, subscription_service)
        
        elif event_type == "invoice.paid":
            await handle_invoice_paid(event_object, db)
        
        elif event_type == "invoice.payment_failed":
            await handle_invoice_payment_failed(event_object, db)
        
        return {"status": "success"}
    
    except Exception as e:
        logger.error(f"Error handling Stripe webhook: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Webhook error: {str(e)}"
        )


async def handle_checkout_completed(event_object: dict, db: AsyncSession, subscription_service: SubscriptionService):
    """Handle checkout.session.completed event"""
    customer_id = event_object.get("customer")
    subscription_id = event_object.get("subscription")
    metadata = event_object.get("metadata", {})
    
    user_id = int(metadata.get("user_id", 0))
    plan_id = int(metadata.get("plan_id", 0))
    
    if not user_id or not plan_id:
        logger.warning("Missing user_id or plan_id in checkout metadata")
        return
    
    # Create subscription
    await subscription_service.create_subscription(
        user_id=user_id,
        plan_id=plan_id,
        stripe_subscription_id=subscription_id,
        stripe_customer_id=customer_id,
    )


async def handle_subscription_created(event_object: dict, db: AsyncSession, subscription_service: SubscriptionService):
    """Handle customer.subscription.created event"""
    subscription_id = event_object.get("id")
    customer_id = event_object.get("customer")
    status_str = event_object.get("status")
    
    # Map Stripe status to our status
    status_map = {
        "active": SubscriptionStatus.ACTIVE,
        "trialing": SubscriptionStatus.TRIALING,
        "past_due": SubscriptionStatus.PAST_DUE,
        "canceled": SubscriptionStatus.CANCELED,
        "unpaid": SubscriptionStatus.UNPAID,
    }
    
    status = status_map.get(status_str, SubscriptionStatus.INCOMPLETE)
    
    current_period_start = None
    current_period_end = None
    
    if event_object.get("current_period_start"):
        current_period_start = datetime.fromtimestamp(event_object.get("current_period_start"))
    if event_object.get("current_period_end"):
        current_period_end = datetime.fromtimestamp(event_object.get("current_period_end"))
    
    await subscription_service.update_subscription_status(
        stripe_subscription_id=subscription_id,
        status=status,
        current_period_start=current_period_start,
        current_period_end=current_period_end,
    )


async def handle_subscription_updated(event_object: dict, db: AsyncSession, subscription_service: SubscriptionService):
    """Handle customer.subscription.updated event"""
    subscription_id = event_object.get("id")
    status_str = event_object.get("status")
    
    status_map = {
        "active": SubscriptionStatus.ACTIVE,
        "trialing": SubscriptionStatus.TRIALING,
        "past_due": SubscriptionStatus.PAST_DUE,
        "canceled": SubscriptionStatus.CANCELED,
        "unpaid": SubscriptionStatus.UNPAID,
    }
    
    status = status_map.get(status_str, SubscriptionStatus.INCOMPLETE)
    
    current_period_start = None
    current_period_end = None
    
    if event_object.get("current_period_start"):
        current_period_start = datetime.fromtimestamp(event_object.get("current_period_start"))
    if event_object.get("current_period_end"):
        current_period_end = datetime.fromtimestamp(event_object.get("current_period_end"))
    
    await subscription_service.update_subscription_status(
        stripe_subscription_id=subscription_id,
        status=status,
        current_period_start=current_period_start,
        current_period_end=current_period_end,
    )


async def handle_subscription_deleted(event_object: dict, db: AsyncSession, subscription_service: SubscriptionService):
    """Handle customer.subscription.deleted event"""
    subscription_id = event_object.get("id")
    
    await subscription_service.update_subscription_status(
        stripe_subscription_id=subscription_id,
        status=SubscriptionStatus.CANCELED,
    )


async def handle_invoice_paid(event_object: dict, db: AsyncSession):
    """Handle invoice.paid event"""
    # Update invoice status in database
    # Implementation depends on your Invoice model
    pass


async def handle_invoice_payment_failed(event_object: dict, db: AsyncSession):
    """Handle invoice.payment_failed event"""
    # Handle failed payment
    # Send notification, update subscription status, etc.
    pass

