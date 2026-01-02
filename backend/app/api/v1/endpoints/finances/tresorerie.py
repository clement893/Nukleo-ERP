"""
Finances - Trésorerie Endpoints
API endpoints for treasury management (cashflow, transactions, bank accounts)
"""

from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from typing import Optional, List
from datetime import datetime, timedelta
from decimal import Decimal

from app.core.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.bank_account import BankAccount, BankAccountType
from app.models.transaction import Transaction, TransactionStatus
from app.models.transaction_category import TransactionCategory, TransactionType
from app.models.invoice import Invoice, InvoiceStatus
from app.models.expense_account import ExpenseAccount, ExpenseAccountStatus
from app.core.logging import logger

from app.schemas.tresorerie import (
    BankAccountCreate,
    BankAccountUpdate,
    BankAccountResponse,
    TransactionCategoryCreate,
    TransactionCategoryUpdate,
    TransactionCategoryResponse,
    TransactionCreate,
    TransactionUpdate,
    TransactionResponse,
    CashflowWeek,
    CashflowResponse,
    TreasuryStats,
)

router = APIRouter(prefix="/finances/tresorerie", tags=["finances-tresorerie"])


# ==================== Bank Accounts Endpoints ====================

@router.get("/accounts", response_model=List[BankAccountResponse])
async def list_bank_accounts(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
):
    """List all bank accounts for the current user"""
    try:
        query = select(BankAccount).where(BankAccount.user_id == current_user.id)
        
        if is_active is not None:
            query = query.where(BankAccount.is_active == is_active)
        
        query = query.order_by(BankAccount.created_at.desc())
        
        result = await db.execute(query)
        accounts = result.scalars().all()
        
        # Calculate current balance for each account
        accounts_with_balance = []
        for account in accounts:
            # Calculate balance: initial_balance + sum(entries) - sum(exits)
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
            
            account_dict = {
                **account.__dict__,
                "current_balance": current_balance
            }
            accounts_with_balance.append(BankAccountResponse(**account_dict))
        
        return accounts_with_balance
    except Exception as e:
        logger.error(f"Error listing bank accounts: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error listing bank accounts"
        )


@router.post("/accounts", response_model=BankAccountResponse, status_code=status.HTTP_201_CREATED)
async def create_bank_account(
    account_data: BankAccountCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new bank account"""
    try:
        account = BankAccount(
            user_id=current_user.id,
            **account_data.model_dump()
        )
        db.add(account)
        await db.commit()
        await db.refresh(account)
        
        account_dict = {
            **account.__dict__,
            "current_balance": account.initial_balance
        }
        return BankAccountResponse(**account_dict)
    except Exception as e:
        await db.rollback()
        logger.error(f"Error creating bank account: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error creating bank account"
        )


@router.get("/accounts/{account_id}", response_model=BankAccountResponse)
async def get_bank_account(
    account_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a specific bank account by ID"""
    try:
        result = await db.execute(
            select(BankAccount).where(
                and_(
                    BankAccount.id == account_id,
                    BankAccount.user_id == current_user.id
                )
            )
        )
        account = result.scalar_one_or_none()
        
        if not account:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Bank account not found"
            )
        
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
        
        account_dict = {
            **account.__dict__,
            "current_balance": current_balance
        }
        return BankAccountResponse(**account_dict)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting bank account: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error getting bank account"
        )


@router.put("/accounts/{account_id}", response_model=BankAccountResponse)
async def update_bank_account(
    account_id: int,
    account_data: BankAccountUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a bank account"""
    try:
        result = await db.execute(
            select(BankAccount).where(
                and_(
                    BankAccount.id == account_id,
                    BankAccount.user_id == current_user.id
                )
            )
        )
        account = result.scalar_one_or_none()
        
        if not account:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Bank account not found"
            )
        
        # Update fields
        update_data = account_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(account, field, value)
        
        await db.commit()
        await db.refresh(account)
        
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
        
        account_dict = {
            **account.__dict__,
            "current_balance": current_balance
        }
        return BankAccountResponse(**account_dict)
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error updating bank account: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error updating bank account"
        )


@router.delete("/accounts/{account_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_bank_account(
    account_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a bank account"""
    try:
        result = await db.execute(
            select(BankAccount).where(
                and_(
                    BankAccount.id == account_id,
                    BankAccount.user_id == current_user.id
                )
            )
        )
        account = result.scalar_one_or_none()
        
        if not account:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Bank account not found"
            )
        
        await db.delete(account)
        await db.commit()
        
        return None
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error deleting bank account: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error deleting bank account"
        )


# ==================== Transaction Categories Endpoints ====================

@router.get("/categories", response_model=List[TransactionCategoryResponse])
async def list_transaction_categories(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    type: Optional[str] = Query(None, description="Filter by type: 'entry' or 'exit'"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
):
    """List all transaction categories for the current user"""
    try:
        query = select(TransactionCategory).where(TransactionCategory.user_id == current_user.id)
        
        if type:
            query = query.where(TransactionCategory.type == type)
        
        if is_active is not None:
            query = query.where(TransactionCategory.is_active == is_active)
        
        query = query.order_by(TransactionCategory.name)
        
        result = await db.execute(query)
        categories = result.scalars().all()
        
        return [TransactionCategoryResponse(**cat.__dict__) for cat in categories]
    except Exception as e:
        logger.error(f"Error listing transaction categories: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error listing transaction categories"
        )


@router.post("/categories", response_model=TransactionCategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_transaction_category(
    category_data: TransactionCategoryCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new transaction category"""
    try:
        category = TransactionCategory(
            user_id=current_user.id,
            **category_data.model_dump()
        )
        db.add(category)
        await db.commit()
        await db.refresh(category)
        
        return TransactionCategoryResponse(**category.__dict__)
    except Exception as e:
        await db.rollback()
        logger.error(f"Error creating transaction category: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error creating transaction category"
        )


@router.put("/categories/{category_id}", response_model=TransactionCategoryResponse)
async def update_transaction_category(
    category_id: int,
    category_data: TransactionCategoryUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a transaction category"""
    try:
        result = await db.execute(
            select(TransactionCategory).where(
                and_(
                    TransactionCategory.id == category_id,
                    TransactionCategory.user_id == current_user.id
                )
            )
        )
        category = result.scalar_one_or_none()
        
        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Transaction category not found"
            )
        
        # Update fields
        update_data = category_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(category, field, value)
        
        await db.commit()
        await db.refresh(category)
        
        return TransactionCategoryResponse(**category.__dict__)
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error updating transaction category: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error updating transaction category"
        )


@router.delete("/categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_transaction_category(
    category_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a transaction category"""
    try:
        result = await db.execute(
            select(TransactionCategory).where(
                and_(
                    TransactionCategory.id == category_id,
                    TransactionCategory.user_id == current_user.id
                )
            )
        )
        category = result.scalar_one_or_none()
        
        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Transaction category not found"
            )
        
        await db.delete(category)
        await db.commit()
        
        return None
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error deleting transaction category: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error deleting transaction category"
        )


# ==================== Transactions Endpoints ====================

@router.get("/transactions", response_model=List[TransactionResponse])
async def list_transactions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    bank_account_id: Optional[int] = Query(None, description="Filter by bank account"),
    type: Optional[str] = Query(None, description="Filter by type: 'entry' or 'exit'"),
    category_id: Optional[int] = Query(None, description="Filter by category"),
    status: Optional[TransactionStatus] = Query(None, description="Filter by status"),
    date_from: Optional[datetime] = Query(None, description="Filter by date from"),
    date_to: Optional[datetime] = Query(None, description="Filter by date to"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
):
    """List all transactions for the current user"""
    try:
        query = select(Transaction).where(Transaction.user_id == current_user.id)
        
        if bank_account_id:
            query = query.where(Transaction.bank_account_id == bank_account_id)
        
        if type:
            query = query.where(Transaction.type == type)
        
        if category_id:
            query = query.where(Transaction.category_id == category_id)
        
        if status:
            query = query.where(Transaction.status == status)
        
        if date_from:
            query = query.where(Transaction.date >= date_from)
        
        if date_to:
            query = query.where(Transaction.date <= date_to)
        
        query = query.order_by(Transaction.date.desc()).offset(skip).limit(limit)
        
        result = await db.execute(query)
        transactions = result.scalars().all()
        
        return [TransactionResponse(**t.__dict__) for t in transactions]
    except Exception as e:
        logger.error(f"Error listing transactions: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error listing transactions"
        )


@router.post("/transactions", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
async def create_transaction(
    transaction_data: TransactionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new transaction"""
    try:
        # Verify bank account belongs to user
        account_result = await db.execute(
            select(BankAccount).where(
                and_(
                    BankAccount.id == transaction_data.bank_account_id,
                    BankAccount.user_id == current_user.id
                )
            )
        )
        account = account_result.scalar_one_or_none()
        
        if not account:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Bank account not found"
            )
        
        # Verify category if provided
        if transaction_data.category_id:
            category_result = await db.execute(
                select(TransactionCategory).where(
                    and_(
                        TransactionCategory.id == transaction_data.category_id,
                        TransactionCategory.user_id == current_user.id
                    )
                )
            )
            category = category_result.scalar_one_or_none()
            
            if not category:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Transaction category not found"
                )
        
        transaction = Transaction(
            user_id=current_user.id,
            **transaction_data.model_dump()
        )
        db.add(transaction)
        await db.commit()
        await db.refresh(transaction)
        
        return TransactionResponse(**transaction.__dict__)
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error creating transaction: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error creating transaction"
        )


@router.get("/transactions/{transaction_id}", response_model=TransactionResponse)
async def get_transaction(
    transaction_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a specific transaction by ID"""
    try:
        result = await db.execute(
            select(Transaction).where(
                and_(
                    Transaction.id == transaction_id,
                    Transaction.user_id == current_user.id
                )
            )
        )
        transaction = result.scalar_one_or_none()
        
        if not transaction:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Transaction not found"
            )
        
        return TransactionResponse(**transaction.__dict__)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting transaction: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error getting transaction"
        )


@router.put("/transactions/{transaction_id}", response_model=TransactionResponse)
async def update_transaction(
    transaction_id: int,
    transaction_data: TransactionUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a transaction"""
    try:
        result = await db.execute(
            select(Transaction).where(
                and_(
                    Transaction.id == transaction_id,
                    Transaction.user_id == current_user.id
                )
            )
        )
        transaction = result.scalar_one_or_none()
        
        if not transaction:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Transaction not found"
            )
        
        # Update fields
        update_data = transaction_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(transaction, field, value)
        
        await db.commit()
        await db.refresh(transaction)
        
        return TransactionResponse(**transaction.__dict__)
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error updating transaction: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error updating transaction"
        )


@router.delete("/transactions/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_transaction(
    transaction_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a transaction"""
    try:
        result = await db.execute(
            select(Transaction).where(
                and_(
                    Transaction.id == transaction_id,
                    Transaction.user_id == current_user.id
                )
            )
        )
        transaction = result.scalar_one_or_none()
        
        if not transaction:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Transaction not found"
            )
        
        await db.delete(transaction)
        await db.commit()
        
        return None
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error deleting transaction: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error deleting transaction"
        )


# ==================== Cashflow Endpoints ====================

@router.get("/cashflow/weekly", response_model=CashflowResponse)
async def get_weekly_cashflow(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    bank_account_id: Optional[int] = Query(None, description="Filter by bank account"),
    date_from: Optional[datetime] = Query(None, description="Start date (default: today)"),
    date_to: Optional[datetime] = Query(None, description="End date (default: +12 weeks)"),
):
    """Get weekly cashflow for the specified period"""
    try:
        # Default dates: today to 12 weeks from now
        if not date_from:
            date_from = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        if not date_to:
            date_to = date_from + timedelta(weeks=12)
        
        # Build query for transactions
        query = select(Transaction).where(
            and_(
                Transaction.user_id == current_user.id,
                Transaction.date >= date_from,
                Transaction.date <= date_to,
                Transaction.status != TransactionStatus.CANCELLED
            )
        )
        
        if bank_account_id:
            query = query.where(Transaction.bank_account_id == bank_account_id)
        
        result = await db.execute(query)
        transactions = result.scalars().all()
        
        # Get initial balance
        if bank_account_id:
            account_result = await db.execute(
                select(BankAccount).where(
                    and_(
                        BankAccount.id == bank_account_id,
                        BankAccount.user_id == current_user.id
                    )
                )
            )
            account = account_result.scalar_one_or_none()
            if not account:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Bank account not found"
                )
            initial_balance = account.initial_balance
        else:
            # Sum all initial balances
            accounts_result = await db.execute(
                select(func.sum(BankAccount.initial_balance)).where(
                    BankAccount.user_id == current_user.id
                )
            )
            initial_balance = accounts_result.scalar() or Decimal(0)
        
        # Group transactions by week
        weeks_data = {}
        current_date = date_from
        
        while current_date <= date_to:
            week_start = current_date - timedelta(days=current_date.weekday())
            week_end = week_start + timedelta(days=6)
            
            week_key = week_start.isoformat()
            if week_key not in weeks_data:
                weeks_data[week_key] = {
                    "week_start": week_start,
                    "week_end": week_end,
                    "entries": Decimal(0),
                    "exits": Decimal(0),
                    "is_projected": week_start > datetime.utcnow()
                }
            
            current_date = week_end + timedelta(days=1)
        
        # Process transactions
        for transaction in transactions:
            transaction_date = transaction.date
            week_start = transaction_date - timedelta(days=transaction_date.weekday())
            week_key = week_start.isoformat()
            
            if week_key in weeks_data:
                if transaction.type == "entry":
                    weeks_data[week_key]["entries"] += transaction.amount
                else:
                    weeks_data[week_key]["exits"] += transaction.amount
        
        # Calculate balances
        weeks = []
        current_balance = initial_balance
        total_entries = Decimal(0)
        total_exits = Decimal(0)
        
        for week_key in sorted(weeks_data.keys()):
            week_data = weeks_data[week_key]
            week_data["entries"] += current_balance  # Add previous balance to entries for first week
            current_balance = current_balance + week_data["entries"] - week_data["exits"]
            week_data["balance"] = current_balance
            
            total_entries += week_data["entries"]
            total_exits += week_data["exits"]
            
            weeks.append(CashflowWeek(**week_data))
        
        return CashflowResponse(
            weeks=weeks,
            total_entries=total_entries,
            total_exits=total_exits,
            current_balance=current_balance,
            projected_balance=current_balance if weeks else initial_balance
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error calculating cashflow: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error calculating cashflow"
        )


@router.get("/stats", response_model=TreasuryStats)
async def get_treasury_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    bank_account_id: Optional[int] = Query(None, description="Filter by bank account"),
    period_days: int = Query(30, ge=1, le=365, description="Period in days"),
):
    """Get treasury statistics"""
    try:
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=period_days)
        
        # Build query
        query = select(Transaction).where(
            and_(
                Transaction.user_id == current_user.id,
                Transaction.date >= start_date,
                Transaction.date <= end_date,
                Transaction.status != TransactionStatus.CANCELLED
            )
        )
        
        if bank_account_id:
            query = query.where(Transaction.bank_account_id == bank_account_id)
        
        result = await db.execute(query)
        transactions = result.scalars().all()
        
        # Calculate totals
        total_entries = sum(t.amount for t in transactions if t.type == "entry")
        total_exits = sum(t.amount for t in transactions if t.type == "exit")
        
        # Get current balance
        if bank_account_id:
            account_result = await db.execute(
                select(BankAccount).where(
                    and_(
                        BankAccount.id == bank_account_id,
                        BankAccount.user_id == current_user.id
                    )
                )
            )
            account = account_result.scalar_one_or_none()
            if not account:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Bank account not found"
                )
            initial_balance = account.initial_balance
            
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
            
            current_balance = initial_balance + entries_sum - exits_sum
        else:
            # Sum all accounts
            accounts_result = await db.execute(
                select(BankAccount).where(BankAccount.user_id == current_user.id)
            )
            accounts = accounts_result.scalars().all()
            
            current_balance = Decimal(0)
            for account in accounts:
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
                
                current_balance += account.initial_balance + entries_sum - exits_sum
        
        # Calculate projected balance (30 days)
        projected_date = end_date + timedelta(days=30)
        projected_query = select(Transaction).where(
            and_(
                Transaction.user_id == current_user.id,
                Transaction.date > end_date,
                Transaction.date <= projected_date,
                Transaction.status != TransactionStatus.CANCELLED
            )
        )
        
        if bank_account_id:
            projected_query = projected_query.where(Transaction.bank_account_id == bank_account_id)
        
        projected_result = await db.execute(projected_query)
        projected_transactions = projected_result.scalars().all()
        
        projected_entries = sum(t.amount for t in projected_transactions if t.type == "entry")
        projected_exits = sum(t.amount for t in projected_transactions if t.type == "exit")
        projected_balance = current_balance + projected_entries - projected_exits
        
        # Calculate variation (vs previous period)
        prev_start_date = start_date - timedelta(days=period_days)
        prev_query = select(Transaction).where(
            and_(
                Transaction.user_id == current_user.id,
                Transaction.date >= prev_start_date,
                Transaction.date < start_date,
                Transaction.status != TransactionStatus.CANCELLED
            )
        )
        
        if bank_account_id:
            prev_query = prev_query.where(Transaction.bank_account_id == bank_account_id)
        
        prev_result = await db.execute(prev_query)
        prev_transactions = prev_result.scalars().all()
        
        prev_total_entries = sum(t.amount for t in prev_transactions if t.type == "entry")
        prev_total_exits = sum(t.amount for t in prev_transactions if t.type == "exit")
        prev_net = prev_total_entries - prev_total_exits
        current_net = total_entries - total_exits
        
        variation_percent = None
        if prev_net != 0:
            variation_percent = ((current_net - prev_net) / abs(prev_net)) * 100
        
        return TreasuryStats(
            total_entries=Decimal(str(total_entries)),
            total_exits=Decimal(str(total_exits)),
            current_balance=Decimal(str(current_balance)),
            projected_balance_30d=Decimal(str(projected_balance)),
            variation_percent=Decimal(str(variation_percent)) if variation_percent else None
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error calculating treasury stats: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error calculating treasury stats"
        )


# ==================== Integration Endpoints ====================

@router.get("/invoices")
async def get_invoices_for_treasury(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    status: Optional[InvoiceStatus] = Query(None, description="Filter by invoice status"),
):
    """Get invoices related to treasury (for integration)"""
    try:
        query = select(Invoice).where(Invoice.user_id == current_user.id)
        
        if status:
            query = query.where(Invoice.status == status)
        
        query = query.order_by(Invoice.due_date.desc())
        
        result = await db.execute(query)
        invoices = result.scalars().all()
        
        # Check which invoices have transactions
        invoice_ids = [inv.id for inv in invoices]
        transactions_query = select(Transaction.invoice_id).where(
            and_(
                Transaction.user_id == current_user.id,
                Transaction.invoice_id.in_(invoice_ids)
            )
        )
        transactions_result = await db.execute(transactions_query)
        invoices_with_transactions = set(transactions_result.scalars().all())
        
        return [
            {
                "id": inv.id,
                "invoice_number": inv.invoice_number,
                "amount_due": float(inv.amount_due),
                "amount_paid": float(inv.amount_paid),
                "status": inv.status.value,
                "due_date": inv.due_date.isoformat() if inv.due_date else None,
                "paid_at": inv.paid_at.isoformat() if inv.paid_at else None,
                "has_transaction": inv.id in invoices_with_transactions
            }
            for inv in invoices
        ]
    except Exception as e:
        logger.error(f"Error getting invoices: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error getting invoices"
        )


@router.get("/expenses")
async def get_expenses_for_treasury(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    status: Optional[str] = Query(None, description="Filter by expense account status"),
):
    """Get expense accounts related to treasury (for integration)"""
    try:
        # Note: ExpenseAccount doesn't have user_id, it has employee_id
        # We need to get expenses through employees or projects
        # For now, we'll get all approved expenses
        query = select(ExpenseAccount)
        
        if status:
            query = query.where(ExpenseAccount.status == status)
        else:
            # Default: get approved expenses
            query = query.where(ExpenseAccount.status == ExpenseAccountStatus.APPROVED.value)
        
        query = query.order_by(ExpenseAccount.submitted_at.desc())
        
        result = await db.execute(query)
        expenses = result.scalars().all()
        
        # Check which expenses have transactions
        expense_ids = [exp.id for exp in expenses]
        transactions_query = select(Transaction.expense_account_id).where(
            and_(
                Transaction.user_id == current_user.id,
                Transaction.expense_account_id.in_(expense_ids)
            )
        )
        transactions_result = await db.execute(transactions_query)
        expenses_with_transactions = set(transactions_result.scalars().all())
        
        return [
            {
                "id": exp.id,
                "account_number": exp.account_number,
                "title": exp.title,
                "total_amount": float(exp.total_amount),
                "status": exp.status,
                "submitted_at": exp.submitted_at.isoformat() if exp.submitted_at else None,
                "has_transaction": exp.id in expenses_with_transactions
            }
            for exp in expenses
        ]
    except Exception as e:
        logger.error(f"Error getting expenses: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error getting expenses"
        )
