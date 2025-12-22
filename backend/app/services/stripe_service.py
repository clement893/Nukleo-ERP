"""
Stripe Service
Service for handling Stripe payment operations
"""

from typing import Optional, Dict, Any
import stripe
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.config import settings
from app.core.logging import logger
from app.models import User, Plan, Subscription, Invoice
from app.models.subscription import SubscriptionStatus
from app.models.invoice import InvoiceStatus

# Initialize Stripe
stripe.api_key = getattr(settings, 'STRIPE_SECRET_KEY', '')


class StripeService:
    """Service for Stripe operations"""

    def __init__(self, db: AsyncSession):
        self.db = db
        # Ensure Stripe is initialized
        if not stripe.api_key and hasattr(settings, 'STRIPE_SECRET_KEY') and settings.STRIPE_SECRET_KEY:
            stripe.api_key = settings.STRIPE_SECRET_KEY

    async def create_customer(self, user: User) -> str:
        """Create or get Stripe customer for user"""
        try:
            # Check if user already has a Stripe customer ID
            if hasattr(user, 'stripe_customer_id') and user.stripe_customer_id:
                return user.stripe_customer_id

            # Create Stripe customer
            customer = stripe.Customer.create(
                email=user.email,
                name=f"{user.first_name} {user.last_name}".strip() or user.email,
                metadata={
                    "user_id": str(user.id),
                }
            )

            # Store customer ID (you may want to add this to User model)
            # For now, we'll store it in subscription metadata
            return customer.id

        except stripe.error.StripeError as e:
            logger.error(f"Stripe error creating customer: {e}")
            raise

    async def create_checkout_session(
        self,
        user: User,
        plan: Plan,
        success_url: str,
        cancel_url: str,
        trial_days: Optional[int] = None
    ) -> Dict[str, Any]:
        """Create Stripe checkout session"""
        try:
            customer_id = await self.create_customer(user)

            session_params = {
                "customer": customer_id,
                "payment_method_types": ["card"],
                "line_items": [{
                    "price": plan.stripe_price_id,
                    "quantity": 1,
                }],
                "mode": "subscription",
                "success_url": success_url,
                "cancel_url": cancel_url,
                "metadata": {
                    "user_id": str(user.id),
                    "plan_id": str(plan.id),
                }
            }

            if trial_days:
                session_params["subscription_data"] = {
                    "trial_period_days": trial_days,
                }

            session = stripe.checkout.Session.create(**session_params)
            return {
                "session_id": session.id,
                "url": session.url,
            }

        except stripe.error.StripeError as e:
            logger.error(f"Stripe error creating checkout session: {e}")
            raise

    async def create_portal_session(self, user: User, return_url: str) -> Dict[str, Any]:
        """Create Stripe customer portal session"""
        try:
            # Get user's subscription to find customer ID
            result = await self.db.execute(
                select(Subscription)
                .where(Subscription.user_id == user.id)
                .where(Subscription.status == SubscriptionStatus.ACTIVE)
                .limit(1)
            )
            subscription = result.scalar_one_or_none()

            if not subscription or not subscription.stripe_customer_id:
                raise ValueError("User has no active subscription")

            session = stripe.billing_portal.Session.create(
                customer=subscription.stripe_customer_id,
                return_url=return_url,
            )

            return {
                "url": session.url,
            }

        except stripe.error.StripeError as e:
            logger.error(f"Stripe error creating portal session: {e}")
            raise

    async def cancel_subscription(self, subscription: Subscription) -> bool:
        """Cancel Stripe subscription"""
        try:
            if not subscription.stripe_subscription_id:
                return False

            stripe_subscription = stripe.Subscription.modify(
                subscription.stripe_subscription_id,
                cancel_at_period_end=True,
            )

            return True

        except stripe.error.StripeError as e:
            logger.error(f"Stripe error canceling subscription: {e}")
            return False

    async def update_subscription_plan(
        self,
        subscription: Subscription,
        new_plan: Plan
    ) -> bool:
        """Update subscription to new plan"""
        try:
            if not subscription.stripe_subscription_id:
                return False

            stripe.Subscription.modify(
                subscription.stripe_subscription_id,
                items=[{
                    "id": subscription.stripe_subscription_id,
                    "price": new_plan.stripe_price_id,
                }],
                proration_behavior="always_invoice",
            )

            return True

        except stripe.error.StripeError as e:
            logger.error(f"Stripe error updating subscription: {e}")
            return False

    async def handle_webhook(self, payload: bytes, sig_header: str) -> Dict[str, Any]:
        """Handle Stripe webhook"""
        try:
            webhook_secret = getattr(settings, 'STRIPE_WEBHOOK_SECRET', '')
            event = stripe.Webhook.construct_event(
                payload, sig_header, webhook_secret
            )

            return {
                "type": event["type"],
                "data": event["data"],
            }

        except ValueError as e:
            logger.error(f"Invalid payload: {e}")
            raise
        except stripe.error.SignatureVerificationError as e:
            logger.error(f"Invalid signature: {e}")
            raise

