"""
Stripe Webhooks
Handle Stripe webhook events
"""

from fastapi import APIRouter, Request, HTTPException, status, Header, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timezone
from sqlalchemy import select

from app.core.database import get_db
from app.services.stripe_service import StripeService
from app.services.subscription_service import SubscriptionService
from app.utils.stripe_helpers import map_stripe_status, parse_timestamp
from app.core.logging import logger
from app.models import Subscription

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
        event_id = event_data.get("id")  # Stripe event ID for idempotency
        
        logger.info(f"Stripe webhook received: {event_type} (event_id: {event_id})")
        
        # TODO: Implement idempotency check using event_id to prevent duplicate processing
        # This would require storing processed event IDs in database or cache
        
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
        
        else:
            logger.debug(f"Unhandled webhook event type: {event_type}")
        
        return {"status": "success"}
    
    except ValueError as e:
        logger.error(f"Invalid webhook payload: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid payload: {str(e)}"
        )
    except stripe.error.SignatureVerificationError as e:
        logger.error(f"Invalid webhook signature: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid signature"
        )
    except Exception as e:
        logger.error(f"Error handling Stripe webhook: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Webhook processing error: {str(e)}"
        )


async def handle_checkout_completed(event_object: dict, db: AsyncSession, subscription_service: SubscriptionService):
    """Handle checkout.session.completed event"""
    import stripe
    from app.core.config import settings
    
    customer_id = event_object.get("customer")
    subscription_id = event_object.get("subscription")
    metadata = event_object.get("metadata", {})
    
    # Safely extract user_id and plan_id
    user_id_str = metadata.get("user_id")
    plan_id_str = metadata.get("plan_id")
    
    if not user_id_str or not plan_id_str:
        logger.warning("Missing user_id or plan_id in checkout metadata")
        return
    
    try:
        user_id = int(user_id_str)
        plan_id = int(plan_id_str)
    except (ValueError, TypeError) as e:
        logger.error(f"Invalid user_id or plan_id in checkout metadata: {e}")
        return
    
    # Check if subscription already exists (race condition protection)
    if subscription_id:
        result = await db.execute(
            select(Subscription).where(
                Subscription.stripe_subscription_id == subscription_id
            )
        )
        existing = result.scalar_one_or_none()
        if existing:
            logger.info(f"Subscription {subscription_id} already exists, skipping creation")
            return
    
    # Get subscription details from Stripe if subscription_id exists
    trial_end = None
    current_period_start = None
    current_period_end = None
    
    if subscription_id:
        try:
            # Initialize Stripe if needed
            if not stripe.api_key and hasattr(settings, 'STRIPE_SECRET_KEY') and settings.STRIPE_SECRET_KEY:
                stripe.api_key = settings.STRIPE_SECRET_KEY
            
            stripe_subscription = stripe.Subscription.retrieve(subscription_id)
            
            if stripe_subscription.trial_end:
                trial_end = datetime.fromtimestamp(stripe_subscription.trial_end, tz=timezone.utc)
            
            if stripe_subscription.current_period_start:
                current_period_start = datetime.fromtimestamp(
                    stripe_subscription.current_period_start, 
                    tz=timezone.utc
                )
            
            if stripe_subscription.current_period_end:
                current_period_end = datetime.fromtimestamp(
                    stripe_subscription.current_period_end,
                    tz=timezone.utc
                )
        except Exception as e:
            logger.warning(f"Could not retrieve Stripe subscription details: {e}")
            # Continue without Stripe details
    
    # Create subscription
    await subscription_service.create_subscription(
        user_id=user_id,
        plan_id=plan_id,
        stripe_subscription_id=subscription_id,
        stripe_customer_id=customer_id,
        trial_end=trial_end,
        current_period_start=current_period_start,
        current_period_end=current_period_end,
    )


def _parse_subscription_periods(event_object: dict) -> tuple[datetime | None, datetime | None]:
    """Parse subscription period start and end from Stripe event"""
    period_start = None
    period_end = None
    
    if start_ts := parse_timestamp(event_object.get("current_period_start", 0)):
        period_start = datetime.fromtimestamp(start_ts, tz=timezone.utc)
    if end_ts := parse_timestamp(event_object.get("current_period_end", 0)):
        period_end = datetime.fromtimestamp(end_ts, tz=timezone.utc)
    
    return period_start, period_end


async def handle_subscription_created(
    event_object: dict, 
    db: AsyncSession, 
    subscription_service: SubscriptionService
):
    """Handle customer.subscription.created event"""
    subscription_id = event_object.get("id")
    status_str = event_object.get("status", "")
    
    status = map_stripe_status(status_str)
    period_start, period_end = _parse_subscription_periods(event_object)
    
    await subscription_service.update_subscription_status(
        stripe_subscription_id=subscription_id,
        status=status,
        current_period_start=period_start,
        current_period_end=period_end,
    )


async def handle_subscription_updated(
    event_object: dict, 
    db: AsyncSession, 
    subscription_service: SubscriptionService
):
    """Handle customer.subscription.updated event"""
    subscription_id = event_object.get("id")
    status_str = event_object.get("status", "")
    
    status = map_stripe_status(status_str)
    period_start, period_end = _parse_subscription_periods(event_object)
    
    await subscription_service.update_subscription_status(
        stripe_subscription_id=subscription_id,
        status=status,
        current_period_start=period_start,
        current_period_end=period_end,
    )


async def handle_subscription_deleted(
    event_object: dict, 
    db: AsyncSession, 
    subscription_service: SubscriptionService
):
    """Handle customer.subscription.deleted event"""
    from app.models.subscription import SubscriptionStatus
    
    subscription_id = event_object.get("id")
    
    await subscription_service.update_subscription_status(
        stripe_subscription_id=subscription_id,
        status=SubscriptionStatus.CANCELED,
    )


async def handle_invoice_paid(event_object: dict, db: AsyncSession):
    """Handle invoice.paid event"""
    # TODO: Implement invoice paid handler
    # - Update invoice status in database
    # - Send confirmation email
    # - Update subscription if needed
    logger.info(f"Invoice paid: {event_object.get('id')}")


async def handle_invoice_payment_failed(event_object: dict, db: AsyncSession):
    """Handle invoice.payment_failed event"""
    # TODO: Implement payment failed handler
    # - Update invoice status
    # - Send notification email
    # - Update subscription status if needed
    # - Log for monitoring
    logger.warning(f"Invoice payment failed: {event_object.get('id')}")

