"""
Invoice Alert Tasks
Periodic tasks to check invoice due dates and create notifications
"""

from datetime import datetime, timedelta, timezone
from app.celery_app import celery_app
from app.core.logging import logger
from app.utils.notifications import create_notification_async
from app.utils.notification_templates import NotificationTemplates


@celery_app.task
def check_invoice_due_dates_task():
    """
    Periodic task to check invoice due dates and create notifications
    Should be scheduled to run daily (e.g., at 8 AM)
    """
    try:
        from app.core.config import settings
        from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
        from sqlalchemy import select, and_, or_
        from app.models.finance_invoice import FinanceInvoice, FinanceInvoiceStatus
        from app.models.user import User
        
        # Create async session
        async_engine = create_async_engine(
            settings.DATABASE_URL,
            pool_pre_ping=True,
            pool_size=5,
            max_overflow=10,
        )
        AsyncSessionLocal = async_sessionmaker(async_engine, expire_on_commit=False)
        
        async def check_due_dates():
            async with AsyncSessionLocal() as async_db:
                today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
                seven_days_from_now = today + timedelta(days=7)
                
                # Get all unpaid invoices with due dates in the next 7 days or overdue
                invoices_query = select(FinanceInvoice).where(
                    and_(
                        FinanceInvoice.due_date.isnot(None),
                        FinanceInvoice.due_date <= seven_days_from_now,
                        FinanceInvoice.status.in_([
                            FinanceInvoiceStatus.DRAFT,
                            FinanceInvoiceStatus.SENT
                        ]),
                        # Only invoices that are not fully paid
                        FinanceInvoice.amount_paid < FinanceInvoice.total
                    )
                )
                
                invoices_result = await async_db.execute(invoices_query)
                invoices = invoices_result.scalars().all()
                
                notification_count = 0
                
                for invoice in invoices:
                    # Calculate days until due or overdue
                    due_date = invoice.due_date
                    if isinstance(due_date, str):
                        due_date = datetime.fromisoformat(due_date.replace('Z', '+00:00'))
                    
                    days_diff = (due_date.date() - today.date()).days
                    
                    try:
                        if days_diff < 0:
                            # Overdue
                            template = NotificationTemplates.invoice_overdue(
                                invoice_number=invoice.invoice_number,
                                days_overdue=abs(days_diff),
                                amount=float(invoice.amount_due),
                                invoice_id=invoice.id
                            )
                            await create_notification_async(
                                db=async_db,
                                user_id=invoice.user_id,
                                **template
                            )
                            notification_count += 1
                            logger.info(f"Created overdue invoice notification for invoice {invoice.id}, user {invoice.user_id}")
                        elif days_diff <= 3:
                            # Due soon (within 3 days)
                            await create_notification_async(
                                db=async_db,
                                user_id=invoice.user_id,
                                title="Échéance de paiement approchante",
                                message=f"La facture '{invoice.invoice_number}' est due dans {days_diff} jour{'s' if days_diff > 1 else ''} ({invoice.amount_due:,.2f} $).",
                                notification_type=NotificationType.WARNING,
                                action_url=f"/dashboard/finances/facturations?invoice={invoice.id}",
                                action_label="Voir la facture",
                                metadata={
                                    "event_type": "invoice_due_soon",
                                    "invoice_id": invoice.id,
                                    "invoice_number": invoice.invoice_number,
                                    "days_until_due": days_diff,
                                    "amount": float(invoice.amount_due)
                                }
                            )
                            notification_count += 1
                            logger.info(f"Created due soon invoice notification for invoice {invoice.id}, user {invoice.user_id}")
                    except Exception as e:
                        logger.error(f"Failed to create notification for invoice {invoice.id}: {e}", exc_info=True)
                
                await async_db.commit()
                logger.info(f"Invoice due dates check completed. Created {notification_count} notifications.")
                return {
                    "status": "success",
                    "notifications_created": notification_count
                }
        
        # Run async function
        import asyncio
        loop = asyncio.get_event_loop()
        if loop.is_running():
            import nest_asyncio
            nest_asyncio.apply()
            return loop.run_until_complete(check_due_dates())
        else:
            return loop.run_until_complete(check_due_dates())
            
    except Exception as exc:
        logger.error(f"Failed to check invoice due dates: {exc}", exc_info=True)
        raise
