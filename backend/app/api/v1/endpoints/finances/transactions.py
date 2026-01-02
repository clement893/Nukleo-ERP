"""
Finances - Transactions Endpoints
API endpoints for managing financial transactions (revenues and expenses)
"""

from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func
from typing import List, Optional
from datetime import datetime

from app.core.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.transaction import Transaction, TransactionType, TransactionStatus
from app.schemas.transaction import (
    TransactionCreate,
    TransactionUpdate,
    TransactionResponse,
)
from app.core.logging import logger

router = APIRouter(prefix="/finances/transactions", tags=["finances-transactions"])


@router.get("", response_model=List[TransactionResponse])
async def get_transactions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    type: Optional[TransactionType] = Query(None, description="Filter by type: revenue or expense"),
    status: Optional[TransactionStatus] = Query(None, description="Filter by status"),
    category: Optional[str] = Query(None, description="Filter by category"),
    start_date: Optional[datetime] = Query(None, description="Start date filter"),
    end_date: Optional[datetime] = Query(None, description="End date filter"),
):
    """
    Get list of transactions for the current user
    """
    try:
        query = select(Transaction).where(Transaction.user_id == current_user.id)
        
        if type:
            query = query.where(Transaction.type == type)
        if status:
            query = query.where(Transaction.status == status)
        if category:
            query = query.where(Transaction.category == category)
        if start_date:
            query = query.where(Transaction.transaction_date >= start_date)
        if end_date:
            query = query.where(Transaction.transaction_date <= end_date)
        
        query = query.order_by(Transaction.transaction_date.desc())
        query = query.offset(skip).limit(limit)
        
        result = await db.execute(query)
        transactions = result.scalars().all()
        
        return [TransactionResponse.model_validate(t) for t in transactions]
    except Exception as e:
        logger.error(f"Error fetching transactions: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error fetching transactions"
        )


@router.get("/{transaction_id}", response_model=TransactionResponse)
async def get_transaction(
    transaction_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get a specific transaction by ID
    """
    try:
        query = select(Transaction).where(
            and_(
                Transaction.id == transaction_id,
                Transaction.user_id == current_user.id
            )
        )
        result = await db.execute(query)
        transaction = result.scalar_one_or_none()
        
        if not transaction:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Transaction not found"
            )
        
        return TransactionResponse.model_validate(transaction)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching transaction: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error fetching transaction"
        )


@router.post("", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
async def create_transaction(
    transaction_data: TransactionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create a new transaction (revenue or expense)
    """
    try:
        transaction = Transaction(
            user_id=current_user.id,
            type=transaction_data.type,
            description=transaction_data.description,
            amount=transaction_data.amount,
            tax_amount=transaction_data.tax_amount or 0,
            currency=transaction_data.currency,
            category=transaction_data.category,
            transaction_date=transaction_data.transaction_date,
            expected_payment_date=transaction_data.expected_payment_date,
            payment_date=transaction_data.payment_date,
            status=transaction_data.status,
            client_id=transaction_data.client_id,
            client_name=transaction_data.client_name,
            supplier_id=transaction_data.supplier_id,
            supplier_name=transaction_data.supplier_name,
            invoice_number=transaction_data.invoice_number,
            notes=transaction_data.notes,
            is_recurring=transaction_data.is_recurring,
            recurring_id=transaction_data.recurring_id,
            transaction_metadata=transaction_data.transaction_metadata,
        )
        
        db.add(transaction)
        await db.commit()
        await db.refresh(transaction)
        
        logger.info(f"Transaction created: {transaction.id} by user {current_user.id}")
        
        return TransactionResponse.model_validate(transaction)
    except Exception as e:
        await db.rollback()
        logger.error(f"Error creating transaction: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error creating transaction"
        )


@router.put("/{transaction_id}", response_model=TransactionResponse)
async def update_transaction(
    transaction_id: int,
    transaction_data: TransactionUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Update an existing transaction
    """
    try:
        query = select(Transaction).where(
            and_(
                Transaction.id == transaction_id,
                Transaction.user_id == current_user.id
            )
        )
        result = await db.execute(query)
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
        
        logger.info(f"Transaction updated: {transaction.id} by user {current_user.id}")
        
        return TransactionResponse.model_validate(transaction)
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error updating transaction: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error updating transaction"
        )


@router.delete("/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_transaction(
    transaction_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Delete a transaction
    """
    try:
        query = select(Transaction).where(
            and_(
                Transaction.id == transaction_id,
                Transaction.user_id == current_user.id
            )
        )
        result = await db.execute(query)
        transaction = result.scalar_one_or_none()
        
        if not transaction:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Transaction not found"
            )
        
        await db.delete(transaction)
        await db.commit()
        
        logger.info(f"Transaction deleted: {transaction_id} by user {current_user.id}")
        
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


@router.get("/stats/summary", response_model=dict)
async def get_transaction_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
):
    """
    Get transaction summary statistics
    """
    try:
        query = select(Transaction).where(Transaction.user_id == current_user.id)
        
        if start_date:
            query = query.where(Transaction.transaction_date >= start_date)
        if end_date:
            query = query.where(Transaction.transaction_date <= end_date)
        
        result = await db.execute(query)
        transactions = result.scalars().all()
        
        total_revenue = sum(
            float(t.amount) for t in transactions 
            if t.type == TransactionType.REVENUE and t.status != TransactionStatus.CANCELLED
        )
        total_expenses = sum(
            float(t.amount) for t in transactions 
            if t.type == TransactionType.EXPENSE and t.status != TransactionStatus.CANCELLED
        )
        profit = total_revenue - total_expenses
        
        return {
            "total_revenue": total_revenue,
            "total_expenses": total_expenses,
            "profit": profit,
            "transaction_count": len(transactions),
        }
    except Exception as e:
        logger.error(f"Error getting transaction summary: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error getting transaction summary"
        )
