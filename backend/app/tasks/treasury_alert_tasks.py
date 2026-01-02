"""
Treasury Alert Tasks
Periodic tasks to check treasury conditions and create notifications
"""

from decimal import Decimal
from app.celery_app import celery_app
from app.core.logging import logger
from app.utils.treasury_alerts import check_treasury_alerts_for_all_users


@celery_app.task
def check_treasury_alerts_task():
    """
    Periodic task to check treasury alerts for all users
    Should be scheduled to run daily (e.g., at 9 AM)
    """
    try:
        from app.core.config import settings
        from sqlalchemy import create_engine
        from sqlalchemy.orm import sessionmaker
        
        # Create synchronous engine for Celery
        sync_db_url = str(settings.DATABASE_URL).replace("+asyncpg", "").replace("postgresql+asyncpg", "postgresql+psycopg2")
        sync_engine = create_engine(
            sync_db_url,
            pool_pre_ping=True,
            pool_size=5,
            max_overflow=10,
        )
        SessionLocal = sessionmaker(bind=sync_engine)
        
        # Get database session (synchronous for Celery)
        db = SessionLocal()
        
        try:
            # For synchronous session, we need to use async_to_sync or create a sync version
            # For now, we'll use a workaround with async context
            import asyncio
            from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
            
            # Create async session
            async_engine = create_async_engine(
                settings.DATABASE_URL,
                pool_pre_ping=True,
                pool_size=5,
                max_overflow=10,
            )
            AsyncSessionLocal = async_sessionmaker(async_engine, expire_on_commit=False)
            
            async def check_alerts():
                async with AsyncSessionLocal() as async_db:
                    results = await check_treasury_alerts_for_all_users(
                        db=async_db,
                        low_balance_threshold=Decimal(10000),
                        warning_balance_threshold=Decimal(50000)
                    )
                    await async_db.commit()
                    return results
            
            # Run async function
            loop = asyncio.get_event_loop()
            if loop.is_running():
                # If loop is running, create a task
                import nest_asyncio
                nest_asyncio.apply()
                results = loop.run_until_complete(check_alerts())
            else:
                results = loop.run_until_complete(check_alerts())
            
            logger.info(f"Treasury alerts check completed. Created notifications for {len(results)} users.")
            return {
                "status": "success",
                "users_checked": len(results),
                "notifications_created": sum(len(ids) for ids in results.values())
            }
            
        finally:
            db.close()
            
    except Exception as exc:
        logger.error(f"Failed to check treasury alerts: {exc}", exc_info=True)
        raise


@celery_app.task
def check_treasury_alerts_for_user_task(user_id: int):
    """
    Task to check treasury alerts for a specific user
    Can be called on-demand or scheduled
    """
    try:
        from app.core.config import settings
        from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
        
        # Create async session
        async_engine = create_async_engine(
            settings.DATABASE_URL,
            pool_pre_ping=True,
            pool_size=5,
            max_overflow=10,
        )
        AsyncSessionLocal = async_sessionmaker(async_engine, expire_on_commit=False)
        
        async def check_user_alerts():
            async with AsyncSessionLocal() as async_db:
                notification_ids = await check_treasury_alerts_for_user(
                    db=async_db,
                    user_id=user_id,
                    low_balance_threshold=Decimal(10000),
                    warning_balance_threshold=Decimal(50000)
                )
                await async_db.commit()
                return notification_ids
        
        # Run async function
        import asyncio
        loop = asyncio.get_event_loop()
        if loop.is_running():
            import nest_asyncio
            nest_asyncio.apply()
            notification_ids = loop.run_until_complete(check_user_alerts())
        else:
            notification_ids = loop.run_until_complete(check_user_alerts())
        
        logger.info(f"Treasury alerts check completed for user {user_id}. Created {len(notification_ids)} notifications.")
        return {
            "status": "success",
            "user_id": user_id,
            "notifications_created": len(notification_ids),
            "notification_ids": notification_ids
        }
        
    except Exception as exc:
        logger.error(f"Failed to check treasury alerts for user {user_id}: {exc}", exc_info=True)
        raise
