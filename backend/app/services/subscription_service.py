"""
Subscription Service
Service for managing subscriptions
"""

from typing import List, Optional
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.models import Plan, Subscription, User
from app.models.subscription import SubscriptionStatus
from app.services.stripe_service import StripeService


class SubscriptionService:
    """Service for managing subscriptions"""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.stripe_service = StripeService(db)

    async def get_user_subscription(self, user_id: int) -> Optional[Subscription]:
        """Get user's active subscription"""
        result = await self.db.execute(
            select(Subscription)
            .where(Subscription.user_id == user_id)
            .where(Subscription.status.in_([
                SubscriptionStatus.ACTIVE,
                SubscriptionStatus.TRIALING,
            ]))
            .order_by(Subscription.created_at.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def get_all_plans(self, active_only: bool = True) -> List[Plan]:
        """Get all plans"""
        query = select(Plan)
        if active_only:
            from app.models.plan import PlanStatus
            query = query.where(Plan.status == PlanStatus.ACTIVE)
        query = query.order_by(Plan.amount.asc())
        
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_plan(self, plan_id: int) -> Optional[Plan]:
        """Get plan by ID"""
        result = await self.db.execute(
            select(Plan).where(Plan.id == plan_id)
        )
        return result.scalar_one_or_none()

    async def create_subscription(
        self,
        user_id: int,
        plan_id: int,
        stripe_subscription_id: str,
        stripe_customer_id: str,
        trial_end: Optional[datetime] = None
    ) -> Subscription:
        """Create subscription from Stripe"""
        plan = await self.get_plan(plan_id)
        if not plan:
            raise ValueError(f"Plan {plan_id} not found")

        subscription = Subscription(
            user_id=user_id,
            plan_id=plan_id,
            stripe_subscription_id=stripe_subscription_id,
            stripe_customer_id=stripe_customer_id,
            status=SubscriptionStatus.TRIALING if trial_end else SubscriptionStatus.ACTIVE,
            trial_end=trial_end,
            current_period_start=datetime.utcnow(),
            current_period_end=trial_end if trial_end else datetime.utcnow() + timedelta(days=30),
        )

        self.db.add(subscription)
        await self.db.commit()
        await self.db.refresh(subscription)

        return subscription

    async def update_subscription_status(
        self,
        stripe_subscription_id: str,
        status: SubscriptionStatus,
        current_period_start: Optional[datetime] = None,
        current_period_end: Optional[datetime] = None
    ) -> Optional[Subscription]:
        """Update subscription status from webhook"""
        result = await self.db.execute(
            select(Subscription).where(
                Subscription.stripe_subscription_id == stripe_subscription_id
            )
        )
        subscription = result.scalar_one_or_none()

        if not subscription:
            return None

        subscription.status = status
        if current_period_start:
            subscription.current_period_start = current_period_start
        if current_period_end:
            subscription.current_period_end = current_period_end

        await self.db.commit()
        await self.db.refresh(subscription)

        return subscription

    async def cancel_subscription(self, subscription_id: int) -> bool:
        """Cancel subscription"""
        result = await self.db.execute(
            select(Subscription).where(Subscription.id == subscription_id)
        )
        subscription = result.scalar_one_or_none()

        if not subscription:
            return False

        # Cancel in Stripe
        success = await self.stripe_service.cancel_subscription(subscription)
        if success:
            subscription.cancel_at_period_end = True
            subscription.canceled_at = datetime.utcnow()
            await self.db.commit()

        return success

    async def upgrade_plan(
        self,
        subscription_id: int,
        new_plan_id: int
    ) -> Optional[Subscription]:
        """Upgrade subscription to new plan"""
        result = await self.db.execute(
            select(Subscription).where(Subscription.id == subscription_id)
        )
        subscription = result.scalar_one_or_none()

        if not subscription:
            return None

        new_plan = await self.get_plan(new_plan_id)
        if not new_plan:
            raise ValueError(f"Plan {new_plan_id} not found")

        # Update in Stripe
        success = await self.stripe_service.update_subscription_plan(subscription, new_plan)
        if success:
            subscription.plan_id = new_plan_id
            await self.db.commit()
            await self.db.refresh(subscription)

        return subscription

    async def check_subscription_expired(self, user_id: int) -> bool:
        """Check if user's subscription has expired"""
        subscription = await self.get_user_subscription(user_id)
        if not subscription:
            return True

        if subscription.current_period_end and subscription.current_period_end < datetime.utcnow():
            return True

        return False

