"""
Treasury Alerts Utility
Functions to check treasury conditions and create notifications
"""

from typing import List
from decimal import Decimal
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_

from app.models.bank_account import BankAccount
from app.models.transaction import Transaction, TransactionStatus
from app.models.user import User
from app.utils.notifications import create_notification_async
from app.utils.notification_templates import NotificationTemplates
from app.models.notification import NotificationType
from app.core.logging import logger


async def check_treasury_alerts_for_user(
    db: AsyncSession,
    user_id: int,
    low_balance_threshold: Decimal = Decimal(10000),
    warning_balance_threshold: Decimal = Decimal(50000)
) -> List[int]:
    """
    Check treasury conditions for a user and create notifications
    Returns list of notification IDs created
    """
    notification_ids = []
    
    try:
        # Get all active bank accounts for user
        accounts_query = select(BankAccount).where(
            and_(
                BankAccount.user_id == user_id,
                BankAccount.is_active == True
            )
        )
        accounts_result = await db.execute(accounts_query)
        accounts = accounts_result.scalars().all()
        
        # Check each account for low balance
        for account in accounts:
            # Calculate current balance
            entries_query = select(func.coalesce(func.sum(Transaction.amount), 0)).where(
                and_(
                    Transaction.bank_account_id == account.id,
                    Transaction.type == "entry",
                    Transaction.status != TransactionStatus.CANCELLED
                )
            )
            exits_query = select(func.coalesce(func.sum(Transaction.amount), 0)).where(
                and_(
                    Transaction.bank_account_id == account.id,
                    Transaction.type == "exit",
                    Transaction.status != TransactionStatus.CANCELLED
                )
            )
            
            entries_result = await db.execute(entries_query)
            exits_result = await db.execute(exits_query)
            
            entries_sum = entries_result.scalar() or Decimal(0)
            exits_sum = exits_result.scalar() or Decimal(0)
            current_balance = account.initial_balance + entries_sum - exits_sum
            
            # Check for low balance
            if current_balance < low_balance_threshold:
                template = NotificationTemplates.treasury_low_balance(
                    account_name=account.name,
                    balance=float(current_balance),
                    account_id=account.id
                )
                notification_id = await create_notification_async(
                    db=db,
                    user_id=user_id,
                    **template
                )
                notification_ids.append(notification_id)
                logger.info(f"Created low balance alert for account {account.id}, user {user_id}")
            elif current_balance < warning_balance_threshold:
                # Warning level (not critical)
                await create_notification_async(
                    db=db,
                    user_id=user_id,
                    title="Solde à surveiller",
                    message=f"Le compte '{account.name}' a un solde de {current_balance:,.2f} $.",
                    notification_type=NotificationType.WARNING,
                    action_url=f"/dashboard/finances/tresorerie?account={account.id}",
                    action_label="Voir la trésorerie"
                )
                logger.info(f"Created warning balance alert for account {account.id}, user {user_id}")
        
        # Check for negative cashflow (last 4 weeks)
        today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        four_weeks_ago = today - timedelta(weeks=4)
        
        # Get transactions for last 4 weeks
        transactions_query = select(Transaction).where(
            and_(
                Transaction.user_id == user_id,
                Transaction.date >= four_weeks_ago,
                Transaction.status != TransactionStatus.CANCELLED
            )
        )
        transactions_result = await db.execute(transactions_query)
        transactions = transactions_result.scalars().all()
        
        # Group by week
        weeks = {}
        for transaction in transactions:
            transaction_date = transaction.date if isinstance(transaction.date, datetime) else datetime.fromisoformat(str(transaction.date))
            week_start = transaction_date - timedelta(days=transaction_date.weekday())
            week_key = week_start.isoformat()
            
            if week_key not in weeks:
                weeks[week_key] = {"entries": Decimal(0), "exits": Decimal(0)}
            
            amount = Decimal(str(transaction.amount))
            if transaction.type == "entry":
                weeks[week_key]["entries"] += amount
            else:
                weeks[week_key]["exits"] += amount
        
        # Check for negative cashflow weeks
        negative_weeks = 0
        for week_data in weeks.values():
            if week_data["entries"] - week_data["exits"] < 0:
                negative_weeks += 1
        
        if negative_weeks >= 2:
            template = NotificationTemplates.treasury_negative_cashflow(
                weeks_count=negative_weeks
            )
            notification_id = await create_notification_async(
                db=db,
                user_id=user_id,
                **template
            )
            notification_ids.append(notification_id)
            logger.info(f"Created negative cashflow alert for user {user_id}")
        
    except Exception as e:
        logger.error(f"Error checking treasury alerts for user {user_id}: {e}", exc_info=True)
    
    return notification_ids


async def check_treasury_alerts_for_all_users(
    db: AsyncSession,
    low_balance_threshold: Decimal = Decimal(10000),
    warning_balance_threshold: Decimal = Decimal(50000)
) -> dict:
    """
    Check treasury conditions for all users and create notifications
    Returns dict with user_id -> list of notification IDs
    """
    results = {}
    
    try:
        # Get all active users
        users_query = select(User).where(User.is_active == True)
        users_result = await db.execute(users_query)
        users = users_result.scalars().all()
        
        for user in users:
            notification_ids = await check_treasury_alerts_for_user(
                db=db,
                user_id=user.id,
                low_balance_threshold=low_balance_threshold,
                warning_balance_threshold=warning_balance_threshold
            )
            if notification_ids:
                results[user.id] = notification_ids
        
    except Exception as e:
        logger.error(f"Error checking treasury alerts for all users: {e}", exc_info=True)
    
    return results
