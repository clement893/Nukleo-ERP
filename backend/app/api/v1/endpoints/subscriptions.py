"""
Subscription Endpoints
API endpoints for subscription management
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies import get_current_user
from app.models import User, Plan, Subscription
from app.services.subscription_service import SubscriptionService
from app.services.stripe_service import StripeService
from app.schemas.subscription import (
    PlanResponse,
    PlanListResponse,
    SubscriptionResponse,
    CheckoutSessionCreate,
    CheckoutSessionResponse,
    PortalSessionResponse,
)

router = APIRouter(prefix="/subscriptions", tags=["subscriptions"])


@router.get("/plans", response_model=PlanListResponse)
async def list_plans(
    active_only: bool = Query(True, description="Only return active plans"),
    db: AsyncSession = Depends(get_db),
):
    """List all available subscription plans"""
    subscription_service = SubscriptionService(db)
    plans = await subscription_service.get_all_plans(active_only=active_only)
    
    return PlanListResponse(
        plans=[PlanResponse.model_validate(plan) for plan in plans],
        total=len(plans)
    )


@router.get("/plans/{plan_id}", response_model=PlanResponse)
async def get_plan(
    plan_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Get plan by ID"""
    subscription_service = SubscriptionService(db)
    plan = await subscription_service.get_plan(plan_id)
    
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Plan not found"
        )
    
    return PlanResponse.model_validate(plan)


@router.get("/me", response_model=SubscriptionResponse)
async def get_my_subscription(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get current user's subscription"""
    subscription_service = SubscriptionService(db)
    subscription = await subscription_service.get_user_subscription(current_user.id)
    
    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active subscription found"
        )
    
    # Ensure plan is loaded
    if not subscription.plan:
        from sqlalchemy.orm import selectinload
        from sqlalchemy import select
        result = await db.execute(
            select(Subscription)
            .where(Subscription.id == subscription.id)
            .options(selectinload(Subscription.plan))
        )
        subscription = result.scalar_one()
    
    return SubscriptionResponse.model_validate(subscription)


@router.post("/checkout", response_model=CheckoutSessionResponse)
async def create_checkout_session(
    checkout_data: CheckoutSessionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create Stripe checkout session"""
    subscription_service = SubscriptionService(db)
    stripe_service = StripeService(db)
    
    plan = await subscription_service.get_plan(checkout_data.plan_id)
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Plan not found"
        )
    
    if not plan.stripe_price_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Plan is not configured for Stripe"
        )
    
    # Create checkout session
    session = await stripe_service.create_checkout_session(
        user=current_user,
        plan=plan,
        success_url=checkout_data.success_url,
        cancel_url=checkout_data.cancel_url,
        trial_days=checkout_data.trial_days,
    )
    
    return CheckoutSessionResponse(**session)


@router.post("/portal", response_model=PortalSessionResponse)
async def create_portal_session(
    return_url: str = Query(..., description="URL to return to after portal"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create Stripe customer portal session"""
    stripe_service = StripeService(db)
    
    session = await stripe_service.create_portal_session(
        user=current_user,
        return_url=return_url,
    )
    
    return PortalSessionResponse(**session)


@router.post("/cancel", status_code=status.HTTP_204_NO_CONTENT)
async def cancel_subscription(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Cancel current user's subscription"""
    subscription_service = SubscriptionService(db)
    subscription = await subscription_service.get_user_subscription(current_user.id)
    
    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active subscription found"
        )
    
    success = await subscription_service.cancel_subscription(subscription.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to cancel subscription"
        )
    
    return None


@router.post("/upgrade/{plan_id}", response_model=SubscriptionResponse)
async def upgrade_subscription(
    plan_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Upgrade subscription to new plan"""
    subscription_service = SubscriptionService(db)
    subscription = await subscription_service.get_user_subscription(current_user.id)
    
    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active subscription found"
        )
    
    updated_subscription = await subscription_service.upgrade_plan(
        subscription.id,
        plan_id
    )
    
    if not updated_subscription:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to upgrade subscription"
        )
    
    return SubscriptionResponse.model_validate(updated_subscription)

