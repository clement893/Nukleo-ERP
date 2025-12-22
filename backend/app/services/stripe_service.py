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
from app.models import User, Plan, Subscription
from app.models.subscription import SubscriptionStatus

# Import stripe.error for proper exception handling
import stripe.error


class StripeService:
    """Service for Stripe operations"""

    def __init__(self, db: AsyncSession):
        self.db = db
        self._ensure_stripe_initialized()

    def _ensure_stripe_initialized(self) -> None:
        """Ensure Stripe API key is initialized"""
        if not stripe.api_key:
            stripe_key = getattr(settings, 'STRIPE_SECRET_KEY', None)
            if stripe_key:
                stripe.api_key = stripe_key
            else:
                logger.warning("STRIPE_SECRET_KEY not configured")

    async def get_or_create_customer(self, user: User) -> str:
        """Get existing Stripe customer ID or create new one for user"""
        # Check if user already has a subscription with customer ID
        existing_customer_id = await self._get_existing_customer_id(user.id)
        if existing_customer_id:
            return existing_customer_id

        # Create new Stripe customer
        try:
            customer = stripe.Customer.create(
                email=user.email,
                name=self._format_user_name(user),
                metadata={"user_id": str(user.id)},
            )
            logger.info(f"Created Stripe customer {customer.id} for user {user.id}")
            return customer.id
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error creating customer for user {user.id}: {e}")
            raise

    async def _get_existing_customer_id(self, user_id: int) -> Optional[str]:
        """Get existing Stripe customer ID from user's subscriptions"""
        result = await self.db.execute(
            select(Subscription.stripe_customer_id)
            .where(Subscription.user_id == user_id)
            .where(Subscription.stripe_customer_id.isnot(None))
            .limit(1)
        )
        return result.scalar_one_or_none()

    @staticmethod
    def _format_user_name(user: User) -> str:
        """Format user's full name for Stripe"""
        full_name = f"{user.first_name} {user.last_name}".strip()
        return full_name if full_name else user.email

    async def create_checkout_session(
        self,
        user: User,
        plan: Plan,
        success_url: str,
        cancel_url: str,
        trial_days: Optional[int] = None
    ) -> Dict[str, Any]:
        """Create Stripe checkout session"""
        if not plan.stripe_price_id:
            raise ValueError(f"Plan {plan.id} does not have stripe_price_id configured")

        try:
            customer_id = await self.get_or_create_customer(user)

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
        customer_id = await self._get_customer_id_for_user(user.id)
        if not customer_id:
            raise ValueError("User has no Stripe customer ID")

        try:
            session = stripe.billing_portal.Session.create(
                customer=customer_id,
                return_url=return_url,
            )
            return {"url": session.url}
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error creating portal session for user {user.id}: {e}")
            raise

    async def _get_customer_id_for_user(self, user_id: int) -> Optional[str]:
        """Get Stripe customer ID for user from active subscription"""
        result = await self.db.execute(
            select(Subscription.stripe_customer_id)
            .where(Subscription.user_id == user_id)
            .where(Subscription.status.in_([
                SubscriptionStatus.ACTIVE,
                SubscriptionStatus.TRIALING,
            ]))
            .where(Subscription.stripe_customer_id.isnot(None))
            .limit(1)
        )
        return result.scalar_one_or_none()

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
        """Update subscription to new plan with proration"""
        if not subscription.stripe_subscription_id:
            logger.warning(f"Subscription {subscription.id} has no stripe_subscription_id")
            return False

        if not new_plan.stripe_price_id:
            logger.warning(f"Plan {new_plan.id} has no stripe_price_id")
            return False

        try:
            # Get current subscription to find subscription item ID
            stripe_subscription = stripe.Subscription.retrieve(subscription.stripe_subscription_id)
            
            if not stripe_subscription.items.data:
                logger.error(f"No subscription items found for {subscription.stripe_subscription_id}")
                return False

            # Update subscription with new price
            stripe.Subscription.modify(
                subscription.stripe_subscription_id,
                items=[{
                    "id": stripe_subscription.items.data[0].id,  # Use subscription item ID, not subscription ID
                    "price": new_plan.stripe_price_id,
                }],
                proration_behavior="always_invoice",
            )
            logger.info(f"Updated subscription {subscription.id} to plan {new_plan.id}")
            return True

        except stripe.error.StripeError as e:
            logger.error(f"Stripe error updating subscription {subscription.id}: {e}")
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

