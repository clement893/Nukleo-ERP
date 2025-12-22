"""
Stripe Webhooks
Handle Stripe webhook events
"""

from fastapi import APIRouter, Request, HTTPException, status, Header, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timezone
from sqlalchemy import select
import stripe
import stripe.error

from app.core.database import get_db
from app.services.stripe_service import StripeService
from app.services.subscription_service import SubscriptionService
from app.services.invoice_service import InvoiceService
from app.utils.stripe_helpers import map_stripe_status, parse_timestamp
from app.core.logging import logger
from app.models import Subscription, WebhookEvent
from app.models.invoice import InvoiceStatus

router = APIRouter(prefix="/webhooks/stripe", tags=["webhooks"])


async def check_event_processed(event_id: str, db: AsyncSession) -> bool:
    """Check if webhook event has already been processed (idempotency)"""
    if not event_id:
        return False
    
    result = await db.execute(
        select(WebhookEvent).where(WebhookEvent.stripe_event_id == event_id)
    )
    return result.scalar_one_or_none() is not None


async def mark_event_processed(
    event_id: str,
    event_type: str,
    event_data: dict,
    db: AsyncSession
) -> None:
    """Mark webhook event as processed"""
    if not event_id:
        return
    
    import json
    
    webhook_event = WebhookEvent(
        stripe_event_id=event_id,
        event_type=event_type,
        event_data=json.dumps(event_data) if event_data else None,
    )
    db.add(webhook_event)
    await db.commit()


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
    invoice_service = InvoiceService(db)
    
    try:
        event_data = await stripe_service.handle_webhook(payload, stripe_signature)
        event_type = event_data["type"]
        event_object = event_data["data"]["object"]
        event_id = event_data.get("id")  # Stripe event ID for idempotency
        
        logger.info(f"Stripe webhook received: {event_type} (event_id: {event_id})")
        
        # Idempotency check: prevent duplicate processing
        if await check_event_processed(event_id, db):
            logger.info(f"Event {event_id} already processed, skipping")
            return {"status": "success", "message": "Event already processed"}
        
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
            await handle_invoice_paid(event_object, db, invoice_service, subscription_service)
        
        elif event_type == "invoice.payment_failed":
            await handle_invoice_payment_failed(event_object, db, invoice_service, subscription_service)
        
        else:
            logger.debug(f"Unhandled webhook event type: {event_type}")
        
        # Mark event as processed after successful handling
        await mark_event_processed(event_id, event_type, event_data, db)
        
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
    
    # For checkout.session.completed, subscription_id might be None for one-time payments
    # In that case, we should still create a subscription record if it's a subscription checkout
    if not subscription_id:
        logger.warning(f"Checkout completed but no subscription_id for user {user_id}, plan {plan_id}")
        # Check if this is a subscription checkout by checking mode
        # If it's not a subscription, we might not want to create a subscription record
        # For now, we'll skip creation if no subscription_id
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
    if not subscription_id:
        logger.warning("customer.subscription.created event missing subscription ID")
        return
    
    status_str = event_object.get("status", "")
    status = map_stripe_status(status_str)
    period_start, period_end = _parse_subscription_periods(event_object)
    
    result = await subscription_service.update_subscription_status(
        stripe_subscription_id=subscription_id,
        status=status,
        current_period_start=period_start,
        current_period_end=period_end,
    )
    
    if not result:
        logger.warning(f"Could not update subscription {subscription_id} - may not exist yet")


async def handle_subscription_updated(
    event_object: dict, 
    db: AsyncSession, 
    subscription_service: SubscriptionService
):
    """Handle customer.subscription.updated event"""
    subscription_id = event_object.get("id")
    if not subscription_id:
        logger.warning("customer.subscription.updated event missing subscription ID")
        return
    
    status_str = event_object.get("status", "")
    status = map_stripe_status(status_str)
    period_start, period_end = _parse_subscription_periods(event_object)
    
    result = await subscription_service.update_subscription_status(
        stripe_subscription_id=subscription_id,
        status=status,
        current_period_start=period_start,
        current_period_end=period_end,
    )
    
    if not result:
        logger.warning(f"Could not update subscription {subscription_id} - subscription not found")


async def handle_subscription_deleted(
    event_object: dict, 
    db: AsyncSession, 
    subscription_service: SubscriptionService
):
    """Handle customer.subscription.deleted event"""
    from app.models.subscription import SubscriptionStatus
    
    subscription_id = event_object.get("id")
    if not subscription_id:
        logger.warning("customer.subscription.deleted event missing subscription ID")
        return
    
    result = await subscription_service.update_subscription_status(
        stripe_subscription_id=subscription_id,
        status=SubscriptionStatus.CANCELED,
    )
    
    if not result:
        logger.warning(f"Could not cancel subscription {subscription_id} - subscription not found")


async def handle_invoice_paid(
    event_object: dict,
    db: AsyncSession,
    invoice_service: InvoiceService,
    subscription_service: SubscriptionService
):
    """Handle invoice.paid event"""
    from decimal import Decimal
    
    stripe_invoice_id = event_object.get("id")
    if not stripe_invoice_id:
        logger.warning("invoice.paid event missing invoice ID")
        return
    
    try:
        # Extract invoice data from Stripe event
        customer_id = event_object.get("customer")
        subscription_id = event_object.get("subscription")
        amount_due = Decimal(str(event_object.get("amount_due", 0))) / 100  # Convert from cents
        amount_paid = Decimal(str(event_object.get("amount_paid", 0))) / 100
        currency = event_object.get("currency", "usd")
        due_date_ts = event_object.get("due_date")
        paid_at_ts = event_object.get("status_transitions", {}).get("paid_at")
        
        due_date = None
        if due_date_ts:
            due_date = datetime.fromtimestamp(due_date_ts, tz=timezone.utc)
        
        paid_at = None
        if paid_at_ts:
            paid_at = datetime.fromtimestamp(paid_at_ts, tz=timezone.utc)
        else:
            paid_at = datetime.now(timezone.utc)  # Use current time if not provided
        
        invoice_pdf_url = event_object.get("invoice_pdf")
        hosted_invoice_url = event_object.get("hosted_invoice_url")
        payment_intent_id = event_object.get("payment_intent")
        
        # Get user_id from subscription if available
        user_id = None
        subscription_db_id = None
        
        if subscription_id:
            result = await db.execute(
                select(Subscription).where(
                    Subscription.stripe_subscription_id == subscription_id
                )
            )
            subscription = result.scalar_one_or_none()
            if subscription:
                user_id = subscription.user_id
                subscription_db_id = subscription.id
        
        # If no subscription, try to get user_id from customer metadata
        if not user_id and customer_id:
            # Try to find user by customer_id in subscriptions
            result = await db.execute(
                select(Subscription).where(
                    Subscription.stripe_customer_id == customer_id
                ).order_by(Subscription.created_at.desc()).limit(1)
            )
            subscription = result.scalar_one_or_none()
            if subscription:
                user_id = subscription.user_id
                subscription_db_id = subscription.id
        
        if not user_id:
            logger.warning(f"Could not find user_id for invoice {stripe_invoice_id}")
            return
        
        # Create or update invoice
        invoice = await invoice_service.create_or_update_invoice(
            stripe_invoice_id=stripe_invoice_id,
            user_id=user_id,
            subscription_id=subscription_db_id,
            amount_due=amount_due,
            amount_paid=amount_paid,
            currency=currency,
            status=InvoiceStatus.PAID,
            due_date=due_date,
            paid_at=paid_at,
            invoice_pdf_url=invoice_pdf_url,
            hosted_invoice_url=hosted_invoice_url,
            stripe_payment_intent_id=payment_intent_id,
        )
        
        logger.info(f"Invoice {invoice.id} marked as paid (Stripe invoice: {stripe_invoice_id})")
        
        # TODO: Send confirmation email to user
        # This would require email service integration
        
    except Exception as e:
        logger.error(f"Error handling invoice.paid event: {e}", exc_info=True)
        raise


async def handle_invoice_payment_failed(
    event_object: dict,
    db: AsyncSession,
    invoice_service: InvoiceService,
    subscription_service: SubscriptionService
):
    """Handle invoice.payment_failed event"""
    from decimal import Decimal
    from app.models.subscription import SubscriptionStatus
    
    stripe_invoice_id = event_object.get("id")
    if not stripe_invoice_id:
        logger.warning("invoice.payment_failed event missing invoice ID")
        return
    
    try:
        # Extract invoice data
        customer_id = event_object.get("customer")
        subscription_id = event_object.get("subscription")
        amount_due = Decimal(str(event_object.get("amount_due", 0))) / 100
        currency = event_object.get("currency", "usd")
        attempt_count = event_object.get("attempt_count", 0)
        next_payment_attempt_ts = event_object.get("next_payment_attempt")
        
        due_date = None
        if due_date_ts := event_object.get("due_date"):
            due_date = datetime.fromtimestamp(due_date_ts, tz=timezone.utc)
        
        next_payment_attempt = None
        if next_payment_attempt_ts:
            next_payment_attempt = datetime.fromtimestamp(next_payment_attempt_ts, tz=timezone.utc)
        
        # Get user_id from subscription
        user_id = None
        subscription_db_id = None
        
        if subscription_id:
            result = await db.execute(
                select(Subscription).where(
                    Subscription.stripe_subscription_id == subscription_id
                )
            )
            subscription = result.scalar_one_or_none()
            if subscription:
                user_id = subscription.user_id
                subscription_db_id = subscription.id
        
        # If no subscription, try to get user_id from customer
        if not user_id and customer_id:
            result = await db.execute(
                select(Subscription).where(
                    Subscription.stripe_customer_id == customer_id
                ).order_by(Subscription.created_at.desc()).limit(1)
            )
            subscription = result.scalar_one_or_none()
            if subscription:
                user_id = subscription.user_id
                subscription_db_id = subscription.id
        
        if not user_id:
            logger.warning(f"Could not find user_id for invoice {stripe_invoice_id}")
            return
        
        # Determine invoice status based on attempt count
        # After multiple failures, Stripe may mark it as uncollectible
        invoice_status = InvoiceStatus.OPEN
        if attempt_count >= 3:  # After 3 failed attempts, consider uncollectible
            invoice_status = InvoiceStatus.UNCOLLECTIBLE
        
        # Create or update invoice with failed status
        invoice = await invoice_service.create_or_update_invoice(
            stripe_invoice_id=stripe_invoice_id,
            user_id=user_id,
            subscription_id=subscription_db_id,
            amount_due=amount_due,
            amount_paid=Decimal("0.00"),
            currency=currency,
            status=invoice_status,
            due_date=due_date,
        )
        
        logger.warning(
            f"Invoice {invoice.id} payment failed (Stripe invoice: {stripe_invoice_id}, "
            f"attempts: {attempt_count})"
        )
        
        # Update subscription status if this is the final attempt
        if subscription_db_id and attempt_count >= 3:
            result = await db.execute(
                select(Subscription).where(Subscription.id == subscription_db_id)
            )
            subscription = result.scalar_one_or_none()
            if subscription and subscription.status == SubscriptionStatus.ACTIVE:
                # Don't immediately cancel, but log for monitoring
                logger.warning(
                    f"Subscription {subscription.id} has multiple payment failures, "
                    f"consider updating status"
                )
        
        # TODO: Send notification email to user about payment failure
        # TODO: Log to monitoring system for alerting
        
    except Exception as e:
        logger.error(f"Error handling invoice.payment_failed event: {e}", exc_info=True)
        raise

