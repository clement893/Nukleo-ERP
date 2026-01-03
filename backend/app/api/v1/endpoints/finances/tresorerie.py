"""
Finances - Trésorerie Endpoints
API endpoints for treasury management (cashflow, transactions, bank accounts)
"""

from fastapi import APIRouter, Depends, Query, HTTPException, status, File, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, cast, String, case, text
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from decimal import Decimal
import zipfile
import os
from io import BytesIO

from app.core.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.bank_account import BankAccount, BankAccountType
from app.models.transaction import Transaction, TransactionStatus, TransactionType as TransactionTypeEnum
from app.models.transaction_category import TransactionCategory, TransactionType
from app.models.invoice import Invoice, InvoiceStatus
from app.models.expense_account import ExpenseAccount, ExpenseAccountStatus
from app.core.logging import logger
from app.utils.notifications import create_notification_async
from app.utils.notification_templates import NotificationTemplates
from app.models.notification import NotificationType

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
    InvoiceToBill,
    RevenueForecast,
    ForecastResponse,
    AlertResponse,
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
        # Note: Transaction model doesn't have bank_account_id, so we use all user transactions
        accounts_with_balance = []
        for account in accounts:
            # Calculate balance: initial_balance + sum(entries) - sum(exits)
            # Since Transaction doesn't have bank_account_id, we use all user transactions
            entries_query = select(func.coalesce(func.sum(Transaction.amount), 0)).where(
                and_(
                    Transaction.user_id == current_user.id,
                    Transaction.type == TransactionTypeEnum.REVENUE,
                    cast(Transaction.status, String) != TransactionStatus.CANCELLED.value
                )
            )
            exits_query = select(func.coalesce(func.sum(Transaction.amount), 0)).where(
                and_(
                    Transaction.user_id == current_user.id,
                    Transaction.type == TransactionTypeEnum.EXPENSE,
                    cast(Transaction.status, String) != TransactionStatus.CANCELLED.value
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
        # Note: Transaction model doesn't have bank_account_id, using all user transactions
        entries_query = select(func.coalesce(func.sum(Transaction.amount), 0)).where(
            and_(
                Transaction.user_id == current_user.id,
                Transaction.type == TransactionTypeEnum.REVENUE,
                cast(Transaction.status, String) != TransactionStatus.CANCELLED.value
            )
        )
        exits_query = select(func.coalesce(func.sum(Transaction.amount), 0)).where(
            and_(
                Transaction.user_id == current_user.id,
                Transaction.type == TransactionTypeEnum.EXPENSE,
                cast(Transaction.status, String) != TransactionStatus.CANCELLED.value
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
        # Note: Transaction model doesn't have bank_account_id, using all user transactions
        entries_query = select(func.coalesce(func.sum(Transaction.amount), 0)).where(
            and_(
                Transaction.user_id == current_user.id,
                Transaction.type == TransactionTypeEnum.REVENUE,
                cast(Transaction.status, String) != TransactionStatus.CANCELLED.value
            )
        )
        exits_query = select(func.coalesce(func.sum(Transaction.amount), 0)).where(
            and_(
                Transaction.user_id == current_user.id,
                Transaction.type == TransactionTypeEnum.EXPENSE,
                cast(Transaction.status, String) != TransactionStatus.CANCELLED.value
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
    transaction_status: Optional[TransactionStatus] = Query(None, alias="status", description="Filter by status"),
    date_from: Optional[datetime] = Query(None, description="Filter by date from"),
    date_to: Optional[datetime] = Query(None, description="Filter by date to"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
):
    """List all transactions for the current user"""
    try:
        # Check which columns exist in the database
        columns_result = await db.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'transactions'
        """))
        existing_columns = {row[0] for row in columns_result}
        
        # Determine which columns to select (only those that exist)
        base_columns = ['id', 'user_id', 'type', 'description', 'amount', 'status', 'notes', 'created_at', 'updated_at']
        optional_columns = {
            'tax_amount': 'tax_amount',
            'currency': 'currency',
            'category_id': 'category_id',
            'transaction_date': 'transaction_date',
            'date': 'transaction_date',  # Fallback: use 'date' as 'transaction_date'
            'expected_payment_date': 'expected_payment_date',
            'payment_date': 'payment_date',
            'client_id': 'client_id',
            'client_name': 'client_name',
            'supplier_id': 'supplier_id',
            'supplier_name': 'supplier_name',
            'invoice_number': 'invoice_number',
            'is_recurring': 'is_recurring',
            'recurring_id': 'recurring_id',
            'transaction_metadata': 'transaction_metadata',
        }
        
        # Build SELECT clause with only existing columns
        select_parts = []
        
        # Add base columns (should always exist)
        for col in base_columns:
            if col in existing_columns:
                select_parts.append(f"transactions.{col}")
        
        # Add optional columns
        date_column_used = None
        for db_col, response_field in optional_columns.items():
            if db_col in existing_columns:
                if db_col == 'date' and 'transaction_date' not in existing_columns:
                    # Use 'date' column as 'transaction_date' if transaction_date doesn't exist
                    select_parts.append(f"transactions.date AS transaction_date")
                    date_column_used = 'date'
                elif db_col == 'transaction_date':
                    select_parts.append(f"transactions.transaction_date")
                    date_column_used = 'transaction_date'
                elif db_col != 'date':  # Skip 'date' if we already have transaction_date
                    select_parts.append(f"transactions.{db_col}")
        
        # Ensure we have a date column
        if not date_column_used:
            if 'created_at' in existing_columns:
                select_parts.append("transactions.created_at AS transaction_date")
                date_column_used = 'created_at'
            else:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="No date column found in transactions table"
                )
        
        # Ensure currency exists (default to CAD if not in DB)
        if 'currency' not in existing_columns:
            select_parts.append("'CAD' AS currency")
        
        # Ensure tax_amount exists (default to 0 if not in DB)
        if 'tax_amount' not in existing_columns:
            select_parts.append("0 AS tax_amount")
        
        # Build WHERE clause with parameters
        where_parts = ["transactions.user_id = :user_id"]
        params = {"user_id": current_user.id}
        
        # Note: Transaction model doesn't have bank_account_id field
        if bank_account_id:
            logger.warning(f"bank_account_id filter requested but Transaction model doesn't support it, using all transactions")
        
        if type:
            # Map 'entry'/'exit' to TransactionType enum values
            if type.lower() in ['entry', 'entree', 'entrée']:
                type_value = 'revenue'
            elif type.lower() in ['exit', 'sortie']:
                type_value = 'expense'
            else:
                type_value = type.lower()
            where_parts.append("transactions.type = :type")
            params["type"] = type_value
        
        if category_id and 'category_id' in existing_columns:
            where_parts.append("transactions.category_id = :category_id")
            params["category_id"] = category_id
        
        if transaction_status:
            where_parts.append("transactions.status = :status")
            params["status"] = transaction_status.value
        
        # Date filters
        if date_from:
            where_parts.append(f"transactions.{date_column_used} >= :date_from")
            params["date_from"] = date_from
        if date_to:
            where_parts.append(f"transactions.{date_column_used} <= :date_to")
            params["date_to"] = date_to
        
        # Build ORDER BY
        order_by_col = date_column_used if date_column_used in existing_columns else 'created_at'
        
        # Construct full SQL query with parameterized values
        sql_query = f"""
            SELECT {', '.join(select_parts)}
            FROM transactions
            WHERE {' AND '.join(where_parts)}
            ORDER BY transactions.{order_by_col} DESC
            LIMIT :limit OFFSET :offset
        """
        params["limit"] = limit
        params["offset"] = skip
        
        # Execute raw SQL with parameters
        result = await db.execute(text(sql_query), params)
        rows = result.fetchall()
        
        # Get column names from the result
        result_keys = result.keys()
        
        # Convert rows to TransactionResponse
        transaction_responses = []
        for row in rows:
            try:
                # Convert row to dict using column names
                row_dict = {}
                for idx, key in enumerate(result_keys):
                    row_dict[key] = row[idx]
                
                # Map database columns to response fields
                # Handle type conversion for enum fields
                type_value = row_dict.get('type')
                if isinstance(type_value, str):
                    if type_value.lower() in ['revenue', 'entry', 'entree', 'entrée']:
                        type_enum = TransactionTypeEnum.REVENUE
                    elif type_value.lower() in ['expense', 'exit', 'sortie']:
                        type_enum = TransactionTypeEnum.EXPENSE
                    else:
                        type_enum = TransactionTypeEnum.REVENUE  # Default
                else:
                    type_enum = type_value if hasattr(type_value, 'value') else TransactionTypeEnum.REVENUE
                
                status_value = row_dict.get('status')
                if isinstance(status_value, str):
                    status_enum = TransactionStatus(status_value)
                else:
                    status_enum = status_value if hasattr(status_value, 'value') else TransactionStatus.PENDING
                
                response_dict = {
                    'id': row_dict.get('id'),
                    'user_id': row_dict.get('user_id'),
                    'type': type_enum,
                    'description': row_dict.get('description'),
                    'amount': Decimal(str(row_dict.get('amount', 0))),
                    'tax_amount': Decimal(str(row_dict.get('tax_amount', 0))) if row_dict.get('tax_amount') is not None else Decimal(0),
                    'currency': row_dict.get('currency', 'CAD'),
                    'category_id': row_dict.get('category_id'),
                    'transaction_date': row_dict.get('transaction_date') or row_dict.get('created_at') or datetime.now(),
                    'expected_payment_date': row_dict.get('expected_payment_date'),
                    'payment_date': row_dict.get('payment_date'),
                    'status': status_enum,
                    'client_id': row_dict.get('client_id'),
                    'client_name': row_dict.get('client_name'),
                    'supplier_id': row_dict.get('supplier_id'),
                    'supplier_name': row_dict.get('supplier_name'),
                    'invoice_number': row_dict.get('invoice_number'),
                    'notes': row_dict.get('notes'),
                    'is_recurring': row_dict.get('is_recurring', 'false'),
                    'recurring_id': row_dict.get('recurring_id'),
                    'transaction_metadata': row_dict.get('transaction_metadata'),
                    'created_at': row_dict.get('created_at'),
                    'updated_at': row_dict.get('updated_at'),
                }
                
                # Create TransactionResponse
                transaction_responses.append(TransactionResponse(**response_dict))
            except Exception as validation_error:
                logger.error(f"Error validating transaction row: {validation_error}", exc_info=True)
                continue
        
        return transaction_responses
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error listing transactions: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error listing transactions: {str(e)}"
        )


@router.post("/transactions", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
async def create_transaction(
    transaction_data: TransactionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new transaction"""
    try:
        # Note: Transaction model doesn't have bank_account_id field
        # We verify the bank account exists but don't store it in the transaction
        if transaction_data.bank_account_id:
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
        
        # Create transaction without bank_account_id (model doesn't support it)
        transaction_data_dict = transaction_data.model_dump(exclude={'bank_account_id'})
        # Map 'date' to 'transaction_date' if present
        if 'date' in transaction_data_dict:
            transaction_data_dict['transaction_date'] = transaction_data_dict.pop('date')
        
        transaction = Transaction(
            user_id=current_user.id,
            **transaction_data_dict
        )
        db.add(transaction)
        await db.commit()
        await db.refresh(transaction)
        
        # Create notifications for important transactions
        try:
            transaction_amount = Decimal(str(transaction.amount))
            # Notify for large transactions (> $10,000)
            if transaction_amount > Decimal(10000):
                await create_notification_async(
                    db=db,
                    user_id=current_user.id,
                    title="Transaction importante créée",
                    message=f"Une transaction de {transaction_amount:,.2f} $ a été créée sur le compte '{account.name}'.",
                    notification_type=NotificationType.INFO,
                    action_url=f"/dashboard/finances/tresorerie?transaction={transaction.id}",
                    action_label="Voir la transaction",
                    metadata={
                        "event_type": "large_transaction",
                        "transaction_id": transaction.id,
                        "amount": float(transaction_amount),
                        "account_id": account.id
                    }
                )
                logger.info(f"Created notification for large transaction {transaction.id}")
            
            # Check for low balance after transaction
            entries_query = select(func.coalesce(func.sum(Transaction.amount), 0)).where(
                and_(
                    Transaction.user_id == current_user.id,
                    Transaction.type == TransactionTypeEnum.REVENUE,
                    cast(Transaction.status, String) != TransactionStatus.CANCELLED.value
                )
            )
            exits_query = select(func.coalesce(func.sum(Transaction.amount), 0)).where(
                and_(
                    Transaction.user_id == current_user.id,
                    Transaction.type == TransactionTypeEnum.EXPENSE,
                    cast(Transaction.status, String) != TransactionStatus.CANCELLED.value
                )
            )
            
            entries_result = await db.execute(entries_query)
            exits_result = await db.execute(exits_query)
            
            entries_sum = entries_result.scalar() or Decimal(0)
            exits_sum = exits_result.scalar() or Decimal(0)
            current_balance = account.initial_balance + entries_sum - exits_sum
            
            # Alert for low balance (< $10,000)
            if current_balance < Decimal(10000):
                template = NotificationTemplates.treasury_low_balance(
                    account_name=account.name,
                    balance=float(current_balance),
                    account_id=account.id
                )
                await create_notification_async(
                    db=db,
                    user_id=current_user.id,
                    **template
                )
                logger.info(f"Created low balance notification for account {account.id}")
        except Exception as notif_error:
            # Don't fail transaction creation if notification fails
            logger.error(f"Failed to create notification for transaction {transaction.id}: {notif_error}", exc_info=True)
        
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
        # Cast enum to string for comparison to avoid PostgreSQL type mismatch
        query = select(Transaction).where(
            and_(
                Transaction.user_id == current_user.id,
                Transaction.transaction_date >= date_from,
                Transaction.transaction_date <= date_to,
                cast(Transaction.status, String) != TransactionStatus.CANCELLED.value
            )
        )
        
        # Note: Transaction model doesn't have bank_account_id field
        # Filtering by bank_account_id is not supported for Transaction model
        # For now, we'll use all transactions for the user
        if bank_account_id:
            logger.warning(f"bank_account_id filter requested but Transaction model doesn't support it, using all transactions")
        
        result = await db.execute(query)
        transactions = result.scalars().all()
        
        # Get initial balance - calculate from all transactions before date_from
        # Since Transaction model doesn't have bank_account_id, we calculate balance from all user transactions
        # Sum revenues (positive) and subtract expenses (negative)
        revenue_query = select(func.coalesce(func.sum(Transaction.amount), 0)).where(
            and_(
                Transaction.user_id == current_user.id,
                Transaction.transaction_date < date_from,
                Transaction.type == TransactionTypeEnum.REVENUE,
                cast(Transaction.status, String) != TransactionStatus.CANCELLED.value
            )
        )
        expense_query = select(func.coalesce(func.sum(Transaction.amount), 0)).where(
            and_(
                Transaction.user_id == current_user.id,
                Transaction.transaction_date < date_from,
                Transaction.type == TransactionTypeEnum.EXPENSE,
                cast(Transaction.status, String) != TransactionStatus.CANCELLED.value
            )
        )
        revenue_result = await db.execute(revenue_query)
        expense_result = await db.execute(expense_query)
        total_revenues = revenue_result.scalar() or Decimal(0)
        total_expenses = expense_result.scalar() or Decimal(0)
        initial_balance = total_revenues - total_expenses
        
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
            transaction_date = transaction.transaction_date
            if not transaction_date:
                logger.warning(f"Transaction {transaction.id} has no transaction_date, skipping")
                continue
            week_start = transaction_date - timedelta(days=transaction_date.weekday())
            week_key = week_start.isoformat()
            
            if week_key in weeks_data:
                # Transaction.type is an enum: TransactionTypeEnum.REVENUE or TransactionTypeEnum.EXPENSE
                # Map to entry/exit for cashflow calculation
                if transaction.type == TransactionTypeEnum.REVENUE:
                    weeks_data[week_key]["entries"] += transaction.amount
                elif transaction.type == TransactionTypeEnum.EXPENSE:
                    weeks_data[week_key]["exits"] += transaction.amount
        
        # Calculate balances
        weeks = []
        current_balance = initial_balance
        total_entries = Decimal(0)
        total_exits = Decimal(0)
        
        for week_key in sorted(weeks_data.keys()):
            week_data = weeks_data[week_key]
            # Calculate balance: accumulate from initial balance
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
        # Cast enum to string for comparison to avoid PostgreSQL type mismatch
        query = select(Transaction).where(
            and_(
                Transaction.user_id == current_user.id,
                Transaction.transaction_date >= start_date,
                Transaction.transaction_date <= end_date,
                cast(Transaction.status, String) != TransactionStatus.CANCELLED.value
            )
        )
        
        # Note: Transaction model doesn't have bank_account_id field
        # Filtering by bank_account_id is not supported for Transaction model
        if bank_account_id:
            logger.warning(f"bank_account_id filter requested but Transaction model doesn't support it, using all transactions")
        
        result = await db.execute(query)
        transactions = result.scalars().all()
        
        # Calculate totals
        total_entries = sum(t.amount for t in transactions if t.type == TransactionTypeEnum.REVENUE)
        total_exits = sum(t.amount for t in transactions if t.type == TransactionTypeEnum.EXPENSE)
        
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
                    Transaction.user_id == current_user.id,
                    Transaction.type == TransactionTypeEnum.REVENUE,
                    cast(Transaction.status, String) != TransactionStatus.CANCELLED.value
                )
            )
            exits_query = select(func.coalesce(func.sum(Transaction.amount), 0)).where(
                and_(
                    Transaction.user_id == current_user.id,
                    Transaction.type == TransactionTypeEnum.EXPENSE,
                    cast(Transaction.status, String) != TransactionStatus.CANCELLED.value
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
                        Transaction.user_id == current_user.id,
                        Transaction.type == "entry",
                        cast(Transaction.status, String) != TransactionStatus.CANCELLED.value
                    )
                )
                exits_query = select(func.coalesce(func.sum(Transaction.amount), 0)).where(
                    and_(
                        Transaction.user_id == current_user.id,
                        Transaction.type == "exit",
                        cast(Transaction.status, String) != TransactionStatus.CANCELLED.value
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
                Transaction.transaction_date > end_date,
                Transaction.transaction_date <= projected_date,
                cast(Transaction.status, String) != TransactionStatus.CANCELLED.value
            )
        )
        
        if bank_account_id:
            # Note: Transaction model doesn't have bank_account_id, ignoring filter
            logger.warning(f"bank_account_id filter requested but Transaction model doesn't support it")
        
        projected_result = await db.execute(projected_query)
        projected_transactions = projected_result.scalars().all()
        
        projected_entries = sum(t.amount for t in projected_transactions if t.type == TransactionTypeEnum.REVENUE)
        projected_exits = sum(t.amount for t in projected_transactions if t.type == TransactionTypeEnum.EXPENSE)
        projected_balance = current_balance + projected_entries - projected_exits
        
        # Calculate variation (vs previous period)
        prev_start_date = start_date - timedelta(days=period_days)
        prev_query = select(Transaction).where(
            and_(
                Transaction.user_id == current_user.id,
                Transaction.transaction_date >= prev_start_date,
                Transaction.transaction_date < start_date,
                cast(Transaction.status, String) != TransactionStatus.CANCELLED.value
            )
        )
        
        if bank_account_id:
            # Note: Transaction model doesn't have bank_account_id, ignoring filter
            logger.warning(f"bank_account_id filter requested but Transaction model doesn't support it")
        
        prev_result = await db.execute(prev_query)
        prev_transactions = prev_result.scalars().all()
        
        prev_total_entries = sum(t.amount for t in prev_transactions if t.type == TransactionTypeEnum.REVENUE)
        prev_total_exits = sum(t.amount for t in prev_transactions if t.type == TransactionTypeEnum.EXPENSE)
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
    invoice_status: Optional[InvoiceStatus] = Query(None, alias="status", description="Filter by invoice status"),
):
    """Get invoices related to treasury (for integration)"""
    try:
        query = select(Invoice).where(Invoice.user_id == current_user.id)
        
        if invoice_status:
            query = query.where(Invoice.status == invoice_status)
        
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
    expense_status: Optional[str] = Query(None, alias="status", description="Filter by expense account status"),
):
    """Get expense accounts related to treasury (for integration)"""
    try:
        # Note: ExpenseAccount doesn't have user_id, it has employee_id
        # We need to get expenses through employees or projects
        # For now, we'll get all approved expenses
        query = select(ExpenseAccount)
        
        if expense_status:
            query = query.where(ExpenseAccount.status == expense_status)
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


# ==================== Forecast Endpoints ====================

@router.get("/forecast/invoices-to-bill", response_model=List[InvoiceToBill])
async def get_invoices_to_bill(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    include_draft: bool = Query(True, description="Include draft invoices"),
    include_open: bool = Query(True, description="Include open invoices"),
    days_ahead: int = Query(90, ge=1, le=365, description="Look ahead days"),
):
    """Get invoices that need to be billed (DRAFT or OPEN status)"""
    try:
        today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        future_date = today + timedelta(days=days_ahead)
        
        query = select(Invoice).where(Invoice.user_id == current_user.id)
        
        # Build status filter
        statuses = []
        if include_draft:
            statuses.append(InvoiceStatus.DRAFT)
        if include_open:
            statuses.append(InvoiceStatus.OPEN)
        
        if not statuses:
            return []
        
        query = query.where(Invoice.status.in_(statuses))
        
        # Filter by due date if exists, or created date
        query = query.where(
            or_(
                Invoice.due_date.is_(None),
                Invoice.due_date <= future_date
            )
        )
        
        query = query.order_by(Invoice.due_date.asc().nulls_last())
        
        result = await db.execute(query)
        invoices = result.scalars().all()
        
        invoices_to_bill = []
        for inv in invoices:
            # Calculate probability based on status
            # DRAFT = 50% (not sent yet)
            # OPEN = 80% (sent, likely to be paid)
            probability = Decimal(50) if inv.status == InvoiceStatus.DRAFT else Decimal(80)
            
            # Calculate days until due
            days_until_due = None
            is_overdue = False
            if inv.due_date:
                delta = (inv.due_date.date() - today.date()).days
                days_until_due = delta
                is_overdue = delta < 0
            
            invoices_to_bill.append(InvoiceToBill(
                id=inv.id,
                invoice_number=inv.invoice_number,
                amount_due=inv.amount_due,
                due_date=inv.due_date,
                status=inv.status.value,
                probability=probability,
                days_until_due=days_until_due,
                is_overdue=is_overdue
            ))
        
        return invoices_to_bill
    except Exception as e:
        logger.error(f"Error getting invoices to bill: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error getting invoices to bill"
        )


@router.get("/forecast/detailed", response_model=ForecastResponse)
async def get_detailed_forecast(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    bank_account_id: Optional[int] = Query(None, description="Filter by bank account"),
    weeks: int = Query(12, ge=1, le=52, description="Number of weeks to forecast"),
):
    """Get detailed forecast including invoices to bill"""
    try:
        today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        end_date = today + timedelta(weeks=weeks)
        
        # Get invoices to bill
        invoices_query = select(Invoice).where(
            and_(
                Invoice.user_id == current_user.id,
                Invoice.status.in_([InvoiceStatus.DRAFT, InvoiceStatus.OPEN]),
                or_(
                    Invoice.due_date.is_(None),
                    Invoice.due_date <= end_date
                )
            )
        )
        invoices_result = await db.execute(invoices_query)
        invoices = invoices_result.scalars().all()
        
        # Process invoices
        invoices_to_bill = []
        for inv in invoices:
            probability = Decimal(50) if inv.status == InvoiceStatus.DRAFT else Decimal(80)
            days_until_due = None
            is_overdue = False
            if inv.due_date:
                delta = (inv.due_date.date() - today.date()).days
                days_until_due = delta
                is_overdue = delta < 0
            
            invoices_to_bill.append(InvoiceToBill(
                id=inv.id,
                invoice_number=inv.invoice_number,
                amount_due=inv.amount_due,
                due_date=inv.due_date,
                status=inv.status.value,
                probability=probability,
                days_until_due=days_until_due,
                is_overdue=is_overdue
            ))
        
        # Group invoices by week for revenue forecast
        weeks_data = {}
        current_date = today
        
        while current_date <= end_date:
            week_start = current_date - timedelta(days=current_date.weekday())
            week_end = week_start + timedelta(days=6)
            
            week_key = week_start.isoformat()
            if week_key not in weeks_data:
                weeks_data[week_key] = {
                    "week_start": week_start,
                    "week_end": week_end,
                    "confirmed_amount": Decimal(0),
                    "probable_amount": Decimal(0),
                    "projected_amount": Decimal(0),
                    "invoices_count": 0
                }
            
            current_date = week_end + timedelta(days=1)
        
        # Distribute invoices across weeks
        for inv_bill in invoices_to_bill:
            # Determine which week this invoice belongs to
            invoice_date = inv_bill.due_date if inv_bill.due_date else today + timedelta(days=30)  # Default to 30 days if no due date
            
            week_start = invoice_date - timedelta(days=invoice_date.weekday())
            week_key = week_start.isoformat()
            
            if week_key in weeks_data:
                week_data = weeks_data[week_key]
                week_data["invoices_count"] += 1
                
                # Add to confirmed if probability > 90%
                if inv_bill.probability >= 90:
                    week_data["confirmed_amount"] += inv_bill.amount_due
                # Add weighted amount to probable
                probable_weight = inv_bill.probability / 100
                week_data["probable_amount"] += inv_bill.amount_due * probable_weight
                # Add full amount to projected
                week_data["projected_amount"] += inv_bill.amount_due
        
        # Convert to response format
        revenue_forecast = [
            RevenueForecast(**week_data)
            for week_key in sorted(weeks_data.keys())
            for week_data in [weeks_data[week_key]]
        ]
        
        # Calculate totals
        total_confirmed = sum(w.confirmed_amount for w in revenue_forecast)
        total_probable = sum(w.probable_amount for w in revenue_forecast)
        total_projected = sum(w.projected_amount for w in revenue_forecast)
        
        return ForecastResponse(
            revenue_forecast=revenue_forecast,
            invoices_to_bill=invoices_to_bill,
            total_confirmed=total_confirmed,
            total_probable=total_probable,
            total_projected=total_projected
        )
    except Exception as e:
        logger.error(f"Error getting detailed forecast: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error getting detailed forecast"
        )


@router.get("/forecast/revenue", response_model=List[RevenueForecast])
async def get_revenue_forecast(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    weeks: int = Query(12, ge=1, le=52, description="Number of weeks to forecast"),
):
    """Get revenue forecast by week based on invoices to bill"""
    try:
        # Reuse the logic from get_detailed_forecast
        today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        end_date = today + timedelta(weeks=weeks)
        
        # Get invoices to bill
        invoices_query = select(Invoice).where(
            and_(
                Invoice.user_id == current_user.id,
                Invoice.status.in_([InvoiceStatus.DRAFT, InvoiceStatus.OPEN]),
                or_(
                    Invoice.due_date.is_(None),
                    Invoice.due_date <= end_date
                )
            )
        )
        invoices_result = await db.execute(invoices_query)
        invoices = invoices_result.scalars().all()
        
        # Group invoices by week for revenue forecast
        weeks_data = {}
        current_date = today
        
        while current_date <= end_date:
            week_start = current_date - timedelta(days=current_date.weekday())
            week_end = week_start + timedelta(days=6)
            
            week_key = week_start.isoformat()
            if week_key not in weeks_data:
                weeks_data[week_key] = {
                    "week_start": week_start,
                    "week_end": week_end,
                    "confirmed_amount": Decimal(0),
                    "probable_amount": Decimal(0),
                    "projected_amount": Decimal(0),
                    "invoices_count": 0
                }
            
            current_date = week_end + timedelta(days=1)
        
        # Distribute invoices across weeks
        for inv in invoices:
            probability = Decimal(50) if inv.status == InvoiceStatus.DRAFT else Decimal(80)
            invoice_date = inv.due_date if inv.due_date else today + timedelta(days=30)
            
            week_start = invoice_date - timedelta(days=invoice_date.weekday())
            week_key = week_start.isoformat()
            
            if week_key in weeks_data:
                week_data = weeks_data[week_key]
                week_data["invoices_count"] += 1
                
                if probability >= 90:
                    week_data["confirmed_amount"] += inv.amount_due
                
                probable_weight = probability / 100
                week_data["probable_amount"] += inv.amount_due * probable_weight
                week_data["projected_amount"] += inv.amount_due
        
        # Convert to response format
        revenue_forecast = [
            RevenueForecast(**week_data)
            for week_key in sorted(weeks_data.keys())
            for week_data in [weeks_data[week_key]]
        ]
        
        return revenue_forecast
    except Exception as e:
        logger.error(f"Error getting revenue forecast: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error getting revenue forecast"
        )


@router.get("/alerts", response_model=AlertResponse)
async def get_treasury_alerts(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    low_balance_threshold: Decimal = Query(50000, description="Low balance threshold"),
    days_ahead: int = Query(7, ge=1, le=30, description="Days ahead for upcoming due dates"),
):
    """Get treasury alerts (overdue invoices, low balance, upcoming due dates)"""
    try:
        today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        future_date = today + timedelta(days=days_ahead)
        
        # Get overdue invoices
        overdue_query = select(Invoice).where(
            and_(
                Invoice.user_id == current_user.id,
                Invoice.status.in_([InvoiceStatus.DRAFT, InvoiceStatus.OPEN]),
                Invoice.due_date.isnot(None),
                Invoice.due_date < today
            )
        )
        overdue_result = await db.execute(overdue_query)
        overdue_invoices_list = overdue_result.scalars().all()
        
        overdue_invoices = []
        for inv in overdue_invoices_list:
            delta = (inv.due_date.date() - today.date()).days
            overdue_invoices.append(InvoiceToBill(
                id=inv.id,
                invoice_number=inv.invoice_number,
                amount_due=inv.amount_due,
                due_date=inv.due_date,
                status=inv.status.value,
                probability=Decimal(80) if inv.status == InvoiceStatus.OPEN else Decimal(50),
                days_until_due=delta,
                is_overdue=True
            ))
        
        # Get upcoming due dates
        upcoming_query = select(Invoice).where(
            and_(
                Invoice.user_id == current_user.id,
                Invoice.status.in_([InvoiceStatus.DRAFT, InvoiceStatus.OPEN]),
                Invoice.due_date.isnot(None),
                Invoice.due_date >= today,
                Invoice.due_date <= future_date
            )
        )
        upcoming_result = await db.execute(upcoming_query)
        upcoming_invoices_list = upcoming_result.scalars().all()
        
        upcoming_due_dates = []
        for inv in upcoming_invoices_list:
            delta = (inv.due_date.date() - today.date()).days
            upcoming_due_dates.append(InvoiceToBill(
                id=inv.id,
                invoice_number=inv.invoice_number,
                amount_due=inv.amount_due,
                due_date=inv.due_date,
                status=inv.status.value,
                probability=Decimal(80) if inv.status == InvoiceStatus.OPEN else Decimal(50),
                days_until_due=delta,
                is_overdue=False
            ))
        
        # Get low balance accounts
        accounts_query = select(BankAccount).where(BankAccount.user_id == current_user.id)
        accounts_result = await db.execute(accounts_query)
        accounts = accounts_result.scalars().all()
        
        low_balance_accounts = []
        for account in accounts:
            # Calculate current balance
            entries_query = select(func.coalesce(func.sum(Transaction.amount), 0)).where(
                and_(
                    Transaction.user_id == current_user.id,
                    Transaction.type == TransactionTypeEnum.REVENUE,
                    cast(Transaction.status, String) != TransactionStatus.CANCELLED.value
                )
            )
            exits_query = select(func.coalesce(func.sum(Transaction.amount), 0)).where(
                and_(
                    Transaction.user_id == current_user.id,
                    Transaction.type == TransactionTypeEnum.EXPENSE,
                    cast(Transaction.status, String) != TransactionStatus.CANCELLED.value
                )
            )
            
            entries_result = await db.execute(entries_query)
            exits_result = await db.execute(exits_query)
            
            entries_sum = entries_result.scalar() or Decimal(0)
            exits_sum = exits_result.scalar() or Decimal(0)
            
            current_balance = account.initial_balance + entries_sum - exits_sum
            
            if current_balance < low_balance_threshold:
                low_balance_accounts.append({
                    "id": account.id,
                    "name": account.name,
                    "current_balance": float(current_balance),
                    "threshold": float(low_balance_threshold)
                })
        
        return AlertResponse(
            overdue_invoices=overdue_invoices,
            low_balance_accounts=low_balance_accounts,
            upcoming_due_dates=upcoming_due_dates
        )
    except Exception as e:
        logger.error(f"Error getting treasury alerts: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error getting treasury alerts"
        )


# ==================== Import Endpoints ====================

def normalize_field_name(field_name: str) -> str:
    """Normalize field name for flexible matching"""
    if not field_name:
        return ""
    # Remove accents, lowercase, strip
    import unicodedata
    normalized = unicodedata.normalize('NFD', field_name.lower().strip())
    normalized = ''.join(c for c in normalized if unicodedata.category(c) != 'Mn')
    return normalized.replace(' ', '_').replace('-', '_')


def get_field_value(row_data: Dict[str, Any], possible_names: List[str]) -> Optional[Any]:
    """Get field value from row using multiple possible column names"""
    for name in possible_names:
        normalized_name = normalize_field_name(name)
        for key, value in row_data.items():
            if normalize_field_name(key) == normalized_name:
                return value if value else None
    return None


@router.post("/import")
async def import_transactions(
    file: UploadFile = File(...),
    bank_account_id: Optional[int] = Query(None, description="Default bank account ID for transactions"),
    dry_run: bool = Query(False, description="Dry run mode (validate without importing)"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Import transactions from CSV, Excel, or ZIP file
    
    Supports three formats:
    1. CSV file (.csv) - Simple CSV with transaction data
    2. Excel file (.xlsx, .xls) - Excel file with transaction data
    3. ZIP file (.zip) containing:
       - transactions.xlsx or transactions.csv (transaction data)
       - INSTRUCTIONS.txt (import instructions)
    
    Required columns (case-insensitive, accent-insensitive):
    - Type: type, type_transaction, entree_sortie, entry_exit
      Values: 'entry', 'exit', 'entree', 'sortie', 'entrée', 'sortie'
    - Amount: amount, montant, montant_transaction
    - Date: date, date_transaction, date_operation
    - Description: description, libelle, libellé, description_transaction
    
    Optional columns:
    - Bank Account: bank_account, compte_bancaire, bank_account_name, compte
    - Category: category, categorie, category_name, nom_categorie
    - Status: status, statut, etat, state
      Values: 'confirmed', 'pending', 'projected', 'confirme', 'en_attente', 'projete'
    - Payment Method: payment_method, methode_paiement, moyen_paiement
    - Reference: reference, reference_number, numero_reference, numero
    - Notes: notes, remarques, commentaires
    
    Returns:
        Import results with created transactions, errors, and warnings
    """
    try:
        from app.services.import_service import ImportService
        
        # Read file content
        file_content = await file.read()
        filename = file.filename or ""
        file_ext = os.path.splitext(filename.lower())[1]
        
        excel_content = None
        csv_content = None
        instructions_content = None
        
        # Check if it's a ZIP file
        if file_ext == '.zip':
            try:
                with zipfile.ZipFile(BytesIO(file_content), 'r') as zip_ref:
                    for file_info in zip_ref.namelist():
                        file_name_lower = file_info.lower()
                        
                        # Find Excel file
                        if file_name_lower.endswith(('.xlsx', '.xls')):
                            if excel_content is None:
                                excel_content = zip_ref.read(file_info)
                            else:
                                logger.warning(f"Multiple Excel files found in ZIP, using first: {file_info}")
                        
                        # Find CSV file
                        elif file_name_lower.endswith('.csv'):
                            if csv_content is None:
                                csv_content = zip_ref.read(file_info)
                            else:
                                logger.warning(f"Multiple CSV files found in ZIP, using first: {file_info}")
                        
                        # Find instructions file
                        elif 'instructions' in file_name_lower and file_name_lower.endswith('.txt'):
                            instructions_content = zip_ref.read(file_info).decode('utf-8')
                    
                    if excel_content is None and csv_content is None:
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail="No Excel or CSV file found in ZIP. Please include transactions.xlsx or transactions.csv"
                        )
                    
                    file_content = excel_content if excel_content else csv_content
                    logger.info(f"Extracted {'Excel' if excel_content else 'CSV'} from ZIP")
                    
            except zipfile.BadZipFile:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid ZIP file format"
                )
            except Exception as e:
                logger.error(f"Error extracting ZIP: {e}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Error processing ZIP file: {str(e)}"
                )
        
        # Determine format
        if file_ext == '.zip':
            format_type = 'excel' if excel_content else 'csv'
        elif file_ext in ['.xlsx', '.xls']:
            format_type = 'excel'
        elif file_ext == '.csv':
            format_type = 'csv'
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unsupported file format. Supported: CSV, Excel (.xlsx, .xls), or ZIP"
            )
        
        # Validate transaction data function
        def validate_transaction(row_data: Dict[str, Any]) -> tuple[bool, Optional[str]]:
            """Validate transaction row"""
            # Check required fields
            transaction_type = get_field_value(row_data, [
                'type', 'type_transaction', 'entree_sortie', 'entry_exit'
            ])
            if not transaction_type:
                return False, "Missing required field: type"
            
            # Normalize type
            type_str = str(transaction_type).lower().strip()
            if type_str in ['entree', 'entrée', 'entry', 'entrées']:
                transaction_type = 'entry'
            elif type_str in ['sortie', 'exit', 'sorties']:
                transaction_type = 'exit'
            elif type_str not in ['entry', 'exit']:
                return False, f"Invalid type: {transaction_type}. Must be 'entry' or 'exit'"
            
            amount = get_field_value(row_data, ['amount', 'montant', 'montant_transaction'])
            if not amount:
                return False, "Missing required field: amount"
            
            try:
                amount_decimal = Decimal(str(amount))
                if amount_decimal <= 0:
                    return False, "Amount must be greater than 0"
            except (ValueError, TypeError):
                return False, f"Invalid amount: {amount}"
            
            date_str = get_field_value(row_data, ['date', 'date_transaction', 'date_operation'])
            if not date_str:
                return False, "Missing required field: date"
            
            try:
                # Try parsing date
                if isinstance(date_str, datetime):
                    pass  # Already a datetime
                elif isinstance(date_str, str):
                    # Try multiple date formats
                    for fmt in ['%Y-%m-%d', '%d/%m/%Y', '%m/%d/%Y', '%Y-%m-%d %H:%M:%S']:
                        try:
                            datetime.strptime(date_str, fmt)
                            break
                        except ValueError:
                            continue
                    else:
                        return False, f"Invalid date format: {date_str}"
            except Exception:
                return False, f"Invalid date: {date_str}"
            
            description = get_field_value(row_data, ['description', 'libelle', 'libellé', 'description_transaction'])
            if not description:
                return False, "Missing required field: description"
            
            return True, None
        
        # Import data
        if format_type == 'excel':
            result = ImportService.import_from_excel(
                file_content=file_content,
                has_headers=True,
                validator=validate_transaction
            )
        else:  # CSV
            result = ImportService.import_from_csv(
                file_content=file_content,
                encoding='utf-8',
                has_headers=True,
                validator=validate_transaction
            )
        
        if dry_run:
            return {
                "dry_run": True,
                "total_rows": result['total_rows'],
                "valid_rows": result['valid_rows'],
                "invalid_rows": result['invalid_rows'],
                "errors": result['errors'],
                "warnings": result['warnings'],
                "preview": result['data'][:5] if result['data'] else []
            }
        
        # Get default bank account if not provided
        default_account_id = bank_account_id
        if not default_account_id:
            account_result = await db.execute(
                select(BankAccount).where(
                    and_(
                        BankAccount.user_id == current_user.id,
                        BankAccount.is_active == True
                    )
                ).limit(1)
            )
            default_account = account_result.scalar_one_or_none()
            if not default_account:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No active bank account found. Please create one or specify bank_account_id"
                )
            default_account_id = default_account.id
        
        # Verify bank account belongs to user
        account_result = await db.execute(
            select(BankAccount).where(
                and_(
                    BankAccount.id == default_account_id,
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
        
        # Process valid rows and create transactions
        created_transactions = []
        import_errors = []
        import_warnings = []
        
        for row_data in result['data']:
            try:
                # Extract and normalize fields
                transaction_type = get_field_value(row_data, [
                    'type', 'type_transaction', 'entree_sortie', 'entry_exit'
                ])
                type_str = str(transaction_type).lower().strip()
                if type_str in ['entree', 'entrée', 'entry', 'entrées']:
                    transaction_type = 'entry'
                else:
                    transaction_type = 'exit'
                
                amount = Decimal(str(get_field_value(row_data, ['amount', 'montant', 'montant_transaction'])))
                
                date_str = get_field_value(row_data, ['date', 'date_transaction', 'date_operation'])
                if isinstance(date_str, str):
                    # Parse date
                    transaction_date = None
                    for fmt in ['%Y-%m-%d', '%d/%m/%Y', '%m/%d/%Y', '%Y-%m-%d %H:%M:%S']:
                        try:
                            transaction_date = datetime.strptime(date_str, fmt)
                            break
                        except ValueError:
                            continue
                    if not transaction_date:
                        import_errors.append({
                            'row': row_data,
                            'error': f"Could not parse date: {date_str}"
                        })
                        continue
                else:
                    transaction_date = date_str
                
                description = str(get_field_value(row_data, ['description', 'libelle', 'libellé', 'description_transaction']))
                
                # Optional fields
                category_name = get_field_value(row_data, ['category', 'categorie', 'category_name', 'nom_categorie'])
                category_id = None
                if category_name:
                    # Try to find category by name
                    category_result = await db.execute(
                        select(TransactionCategory).where(
                            and_(
                                TransactionCategory.user_id == current_user.id,
                                TransactionCategory.name.ilike(f"%{category_name}%")
                            )
                        ).limit(1)
                    )
                    category = category_result.scalar_one_or_none()
                    if category:
                        category_id = category.id
                    else:
                        import_warnings.append({
                            'row': row_data,
                            'warning': f"Category '{category_name}' not found, transaction created without category"
                        })
                
                status_str = get_field_value(row_data, ['status', 'statut', 'etat', 'state'])
                transaction_status = TransactionStatus.PENDING
                if status_str:
                    status_lower = str(status_str).lower()
                    if status_lower in ['pending', 'en_attente', 'pending']:
                        transaction_status = TransactionStatus.PENDING
                    elif status_lower in ['paid', 'paye', 'payé', 'confirmed', 'confirme', 'confirmé']:
                        transaction_status = TransactionStatus.PAID
                    elif status_lower in ['cancelled', 'annule', 'annulé']:
                        transaction_status = TransactionStatus.CANCELLED
                
                payment_method = get_field_value(row_data, ['payment_method', 'methode_paiement', 'moyen_paiement'])
                reference_number = get_field_value(row_data, ['reference', 'reference_number', 'numero_reference', 'numero'])
                notes = get_field_value(row_data, ['notes', 'remarques', 'commentaires'])
                
                # Create transaction
                transaction = Transaction(
                    user_id=current_user.id,
                    bank_account_id=default_account_id,
                    type=transaction_type,
                    amount=amount,
                    date=transaction_date,
                    description=description,
                    notes=notes,
                    category_id=category_id,
                    status=transaction_status,
                    payment_method=payment_method,
                    reference_number=reference_number
                )
                
                db.add(transaction)
                created_transactions.append(transaction)
                
            except Exception as e:
                import_errors.append({
                    'row': row_data,
                    'error': str(e)
                })
                logger.error(f"Error creating transaction from row: {e}", exc_info=True)
        
        # Commit all transactions
        await db.commit()
        
        # Refresh transactions to get IDs
        for transaction in created_transactions:
            await db.refresh(transaction)
        
        logger.info(f"User {current_user.id} imported {len(created_transactions)} transactions")
        
        return {
            "success": True,
            "total_rows": result['total_rows'],
            "valid_rows": result['valid_rows'],
            "invalid_rows": result['invalid_rows'],
            "created_count": len(created_transactions),
            "errors": result['errors'] + import_errors,
            "warnings": result['warnings'] + import_warnings,
            "instructions": instructions_content,
            "transactions": [
                {
                    "id": t.id,
                    "type": t.type,
                    "amount": float(t.amount),
                    "date": t.transaction_date.isoformat() if t.transaction_date else None,
                    "description": t.description
                }
                for t in created_transactions[:10]  # Return first 10
            ]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error importing transactions: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error importing transactions: {str(e)}"
        )


@router.get("/import/template")
async def download_import_template(
    format: str = Query("zip", description="Template format: zip, csv, or excel"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Download import template file
    
    Returns a template file (ZIP with CSV/Excel + instructions, or standalone CSV/Excel)
    """
    try:
        from fastapi.responses import Response
        from app.services.export_service import ExportService
        
        # Create sample data for template
        sample_data = [
            {
                "Type": "entry",
                "Montant": 1000.00,
                "Date": "2025-01-15",
                "Description": "Exemple de revenu",
                "Compte Bancaire": "Compte Principal",
                "Catégorie": "Vente",
                "Statut": "confirmed",
                "Méthode de Paiement": "Virement",
                "Référence": "VIR-001",
                "Notes": "Exemple de transaction d'entrée"
            },
            {
                "Type": "exit",
                "Montant": 500.00,
                "Date": "2025-01-16",
                "Description": "Exemple de dépense",
                "Compte Bancaire": "Compte Principal",
                "Catégorie": "Fournisseur",
                "Statut": "confirmed",
                "Méthode de Paiement": "Chèque",
                "Référence": "CHQ-001",
                "Notes": "Exemple de transaction de sortie"
            }
        ]
        
        if format == "zip":
            # Create ZIP with CSV and instructions
            import zipfile
            from io import BytesIO
            
            zip_buffer = BytesIO()
            
            with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
                # Add CSV template
                csv_buffer, csv_filename = ExportService.export_to_csv(
                    data=sample_data,
                    headers=["Type", "Montant", "Date", "Description", "Compte Bancaire", "Catégorie", "Statut", "Méthode de Paiement", "Référence", "Notes"],
                    filename="transactions.csv"
                )
                zip_file.writestr("transactions.csv", csv_buffer.getvalue())
                
                # Add instructions
                instructions = """INSTRUCTIONS D'IMPORT - TRÉSORERIE
=====================================

FORMAT DU FICHIER
-----------------
Le fichier transactions.csv contient les transactions à importer.

COLONNES REQUISES
-----------------
- Type: 'entry' (entrée) ou 'exit' (sortie)
- Montant: Montant numérique (ex: 1000.00)
- Date: Date au format YYYY-MM-DD (ex: 2025-01-15)
- Description: Description de la transaction

COLONNES OPTIONNELLES
---------------------
- Compte Bancaire: Nom du compte (sera créé si n'existe pas)
- Catégorie: Nom de la catégorie (sera créée si n'existe pas)
- Statut: 'confirmed', 'pending', ou 'projected'
- Méthode de Paiement: Chèque, Virement, Carte, etc.
- Référence: Numéro de référence (chèque, virement, etc.)
- Notes: Notes supplémentaires

FORMATS DE DATE ACCEPTÉS
------------------------
- YYYY-MM-DD (ex: 2025-01-15)
- DD/MM/YYYY (ex: 15/01/2025)
- MM/DD/YYYY (ex: 01/15/2025)

EXEMPLES
--------
entry,1000.00,2025-01-15,"Facture client #123",Compte Principal,Vente,confirmed,Virement,VIR-001,"Paiement reçu"
exit,500.00,2025-01-16,"Loyer bureau",Compte Principal,Charge fixe,confirmed,Chèque,CHQ-001,"Paiement loyer"

IMPORT
------
1. Modifiez le fichier transactions.csv avec vos données
2. Compressez le fichier en ZIP (optionnel)
3. Uploadez via l'interface d'import
4. Vérifiez les erreurs et warnings avant de confirmer

LIMITES
-------
- Taille max: 10MB
- Formats: CSV, Excel (.xlsx, .xls), ou ZIP
- Encodage: UTF-8 recommandé
"""
                zip_file.writestr("INSTRUCTIONS.txt", instructions.encode('utf-8'))
            
            zip_buffer.seek(0)
            
            return Response(
                content=zip_buffer.getvalue(),
                media_type="application/zip",
                headers={
                    "Content-Disposition": "attachment; filename=template_import_tresorerie.zip"
                }
            )
        
        elif format == "csv":
            csv_buffer, csv_filename = ExportService.export_to_csv(
                data=sample_data,
                headers=["Type", "Montant", "Date", "Description", "Compte Bancaire", "Catégorie", "Statut", "Méthode de Paiement", "Référence", "Notes"],
                filename="template_transactions.csv"
            )
            
            return Response(
                content=csv_buffer.getvalue(),
                media_type="text/csv",
                headers={
                    "Content-Disposition": f"attachment; filename={csv_filename}"
                }
            )
        
        elif format == "excel":
            excel_buffer, excel_filename = ExportService.export_to_excel(
                data=sample_data,
                headers=["Type", "Montant", "Date", "Description", "Compte Bancaire", "Catégorie", "Statut", "Méthode de Paiement", "Référence", "Notes"],
                filename="template_transactions.xlsx"
            )
            
            return Response(
                content=excel_buffer.getvalue(),
                media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                headers={
                    "Content-Disposition": f"attachment; filename={excel_filename}"
                }
            )
        
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported format: {format}. Supported: zip, csv, excel"
            )
            
    except Exception as e:
        logger.error(f"Error generating template: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating template: {str(e)}"
        )
