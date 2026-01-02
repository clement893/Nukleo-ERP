"""
Finances - Facturations Endpoints
API endpoints for managing invoices
"""

from datetime import datetime, timedelta
from decimal import Decimal
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, desc
from sqlalchemy.orm import selectinload
from typing import List, Optional
import json

from app.core.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.finance_invoice import FinanceInvoice, FinanceInvoicePayment, FinanceInvoiceStatus
from app.models.project import Project
from app.models.transaction import Transaction, TransactionStatus, TransactionType
from app.schemas.finance_invoice import (
    FinanceInvoiceCreate,
    FinanceInvoiceUpdate,
    FinanceInvoiceResponse,
    FinanceInvoiceListResponse,
    PaymentCreate,
    PaymentResponse,
)
from app.core.logging import logger
from app.utils.notifications import create_notification_async
from app.utils.notification_templates import NotificationTemplates
from app.models.notification import NotificationType

router = APIRouter(prefix="/finances/facturations", tags=["finances-facturations"])


async def generate_invoice_number(db: AsyncSession, issue_date: datetime) -> str:
    """Generate a unique invoice number"""
    year = issue_date.year
    # Get the last invoice number for this year
    result = await db.execute(
        select(func.max(FinanceInvoice.invoice_number))
        .where(func.extract('year', FinanceInvoice.issue_date) == year)
    )
    last_number = result.scalar()
    
    if last_number and last_number.startswith(f'INV-{year}-'):
        try:
            last_seq = int(last_number.split('-')[-1])
            next_seq = last_seq + 1
        except (ValueError, IndexError):
            next_seq = 1
    else:
        next_seq = 1
    
    return f'INV-{year}-{str(next_seq).zfill(3)}'


def calculate_invoice_status(invoice: FinanceInvoice) -> str:
    """Calculate invoice status based on dates and payments"""
    if invoice.status == FinanceInvoiceStatus.CANCELLED:
        return "cancelled"
    
    if invoice.amount_paid >= invoice.total:
        return "paid"
    elif invoice.amount_paid > 0:
        return "partial"
    elif invoice.status == FinanceInvoiceStatus.SENT:
        # Check if overdue
        if invoice.due_date and datetime.now(invoice.due_date.tzinfo) > invoice.due_date:
            return "overdue"
        return "sent"
    else:
        return invoice.status.value


@router.get("/", response_model=FinanceInvoiceListResponse)
async def list_facturations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status: Optional[str] = Query(None, description="Filter by status"),
    project_id: Optional[int] = Query(None, description="Filter by project ID"),
):
    """
    List all invoices (facturations) for the current user
    """
    query = select(FinanceInvoice).where(FinanceInvoice.user_id == current_user.id)
    
    if status:
        query = query.where(FinanceInvoice.status == status)
    
    if project_id:
        query = query.where(FinanceInvoice.project_id == project_id)
    
    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    
    # Get invoices with payments
    query = query.options(selectinload(FinanceInvoice.payments))
    query = query.order_by(desc(FinanceInvoice.issue_date))
    query = query.offset(skip).limit(limit)
    
    result = await db.execute(query)
    invoices = result.scalars().all()
    
    # Convert to response format
    invoice_responses = []
    for invoice in invoices:
        # Calculate actual status
        actual_status = calculate_invoice_status(invoice)
        
        # Get project name if project_id exists
        project_name = None
        if invoice.project_id:
            project_result = await db.execute(
                select(Project).where(Project.id == invoice.project_id)
            )
            project = project_result.scalar_one_or_none()
            if project:
                project_name = project.name
        
        # Convert payments
        payments = [
            PaymentResponse(
                id=payment.id,
                invoice_id=payment.invoice_id,
                amount=payment.amount,
                payment_date=payment.payment_date,
                payment_method=payment.payment_method,
                reference=payment.reference,
                notes=payment.notes,
                created_at=payment.created_at,
                updated_at=payment.updated_at,
            )
            for payment in invoice.payments
        ]
        
        invoice_data = {
            "id": invoice.id,
            "user_id": invoice.user_id,
            "invoice_number": invoice.invoice_number,
            "project_id": invoice.project_id,
            "client_data": invoice.client_data if isinstance(invoice.client_data, dict) else json.loads(invoice.client_data) if invoice.client_data else {},
            "line_items": invoice.line_items if isinstance(invoice.line_items, list) else json.loads(invoice.line_items) if invoice.line_items else [],
            "subtotal": invoice.subtotal,
            "tax_rate": float(invoice.tax_rate),
            "tax_amount": invoice.tax_amount,
            "total": invoice.total,
            "issue_date": invoice.issue_date,
            "due_date": invoice.due_date,
            "status": actual_status,
            "amount_paid": invoice.amount_paid,
            "amount_due": invoice.amount_due,
            "paid_date": invoice.paid_date,
            "last_reminder_date": invoice.last_reminder_date,
            "notes": invoice.notes,
            "terms": invoice.terms,
            "pdf_url": invoice.pdf_url,
            "created_at": invoice.created_at,
            "updated_at": invoice.updated_at,
            "payments": payments,
        }
        invoice_responses.append(FinanceInvoiceResponse(**invoice_data))
    
    return FinanceInvoiceListResponse(
        items=invoice_responses,
        total=total,
        skip=skip,
        limit=limit,
    )


@router.get("/{invoice_id}", response_model=FinanceInvoiceResponse)
async def get_facturation(
    invoice_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get a specific invoice by ID
    """
    result = await db.execute(
        select(FinanceInvoice)
        .where(FinanceInvoice.id == invoice_id)
        .where(FinanceInvoice.user_id == current_user.id)
        .options(selectinload(FinanceInvoice.payments))
    )
    invoice = result.scalar_one_or_none()
    
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found"
        )
    
    # Calculate actual status
    actual_status = calculate_invoice_status(invoice)
    
    # Get project name if project_id exists
    project_name = None
    if invoice.project_id:
        project_result = await db.execute(
            select(Project).where(Project.id == invoice.project_id)
        )
        project = project_result.scalar_one_or_none()
        if project:
            project_name = project.name
    
    # Convert payments
    payments = [
        PaymentResponse(
            id=payment.id,
            invoice_id=payment.invoice_id,
            amount=payment.amount,
            payment_date=payment.payment_date,
            payment_method=payment.payment_method,
            reference=payment.reference,
            notes=payment.notes,
            created_at=payment.created_at,
            updated_at=payment.updated_at,
        )
        for payment in invoice.payments
    ]
    
    invoice_data = {
        "id": invoice.id,
        "user_id": invoice.user_id,
        "invoice_number": invoice.invoice_number,
        "project_id": invoice.project_id,
        "client_data": invoice.client_data if isinstance(invoice.client_data, dict) else json.loads(invoice.client_data) if invoice.client_data else {},
        "line_items": invoice.line_items if isinstance(invoice.line_items, list) else json.loads(invoice.line_items) if invoice.line_items else [],
        "subtotal": invoice.subtotal,
        "tax_rate": float(invoice.tax_rate),
        "tax_amount": invoice.tax_amount,
        "total": invoice.total,
        "issue_date": invoice.issue_date,
        "due_date": invoice.due_date,
        "status": actual_status,
        "amount_paid": invoice.amount_paid,
        "amount_due": invoice.amount_due,
        "paid_date": invoice.paid_date,
        "last_reminder_date": invoice.last_reminder_date,
        "notes": invoice.notes,
        "terms": invoice.terms,
        "pdf_url": invoice.pdf_url,
        "created_at": invoice.created_at,
        "updated_at": invoice.updated_at,
        "payments": payments,
    }
    
    return FinanceInvoiceResponse(**invoice_data)


@router.post("/", response_model=FinanceInvoiceResponse, status_code=status.HTTP_201_CREATED)
async def create_facturation(
    invoice_data: FinanceInvoiceCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create a new invoice
    """
    # Generate invoice number if not provided
    invoice_number = invoice_data.invoice_number
    if not invoice_number:
        invoice_number = await generate_invoice_number(db, invoice_data.issue_date)
    
    # Check if invoice number already exists
    existing = await db.execute(
        select(FinanceInvoice).where(FinanceInvoice.invoice_number == invoice_number)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invoice number {invoice_number} already exists"
        )
    
    # Calculate amounts if not provided
    subtotal = invoice_data.subtotal
    tax_rate = invoice_data.tax_rate
    tax_amount = invoice_data.tax_amount
    total = invoice_data.total
    
    if not tax_amount and tax_rate > 0:
        tax_amount = subtotal * (tax_rate / 100)
    
    if not total:
        total = subtotal + tax_amount
    
    amount_due = total - Decimal(0)  # Start with 0 paid
    
    # Create invoice
    invoice = FinanceInvoice(
        user_id=current_user.id,
        project_id=invoice_data.project_id,
        invoice_number=invoice_number,
        client_data=invoice_data.client_data,
        line_items=invoice_data.line_items,
        subtotal=subtotal,
        tax_rate=tax_rate,
        tax_amount=tax_amount,
        total=total,
        amount_paid=Decimal(0),
        amount_due=amount_due,
        issue_date=invoice_data.issue_date,
        due_date=invoice_data.due_date,
        status=FinanceInvoiceStatus(invoice_data.status),
        notes=invoice_data.notes,
        terms=invoice_data.terms,
    )
    
    db.add(invoice)
    await db.commit()
    await db.refresh(invoice)
    
    # Create corresponding revenue transaction
    try:
        client_data = invoice_data.client_data if isinstance(invoice_data.client_data, dict) else {}
        client_name = client_data.get('name', '') or ''
        
        # Convert dates to datetime objects
        if isinstance(invoice_data.issue_date, datetime):
            issue_datetime = invoice_data.issue_date
        elif isinstance(invoice_data.issue_date, str):
            # Handle ISO format strings
            issue_datetime = datetime.fromisoformat(invoice_data.issue_date.replace('Z', '+00:00'))
        else:
            issue_datetime = datetime.now()
        
        if isinstance(invoice_data.due_date, datetime):
            due_datetime = invoice_data.due_date
        elif isinstance(invoice_data.due_date, str):
            # Handle ISO format strings
            due_datetime = datetime.fromisoformat(invoice_data.due_date.replace('Z', '+00:00'))
        else:
            due_datetime = None
        
        transaction = Transaction(
            user_id=current_user.id,
            type=TransactionType.REVENUE,
            description=f"Facture {invoice_number} - {client_name}",
            amount=total,
            tax_amount=tax_amount,
            currency='CAD',
            category='Ventes',
            transaction_date=issue_datetime,
            expected_payment_date=due_datetime,
            status=TransactionStatus.PENDING,
            client_name=client_name,
            invoice_number=invoice_number,
            notes=f"Facture créée automatiquement depuis la facturation {invoice_number}",
        )
        db.add(transaction)
        await db.commit()
        await db.refresh(transaction)
        logger.info(f"Created revenue transaction {transaction.id} for invoice {invoice_number}")
    except Exception as e:
        # Log error but don't fail invoice creation
        logger.error(f"Failed to create revenue transaction for invoice {invoice_number}: {e}", exc_info=True)
    
    # Return response
    invoice_response_data = {
        "id": invoice.id,
        "user_id": invoice.user_id,
        "invoice_number": invoice.invoice_number,
        "project_id": invoice.project_id,
        "client_data": invoice.client_data if isinstance(invoice.client_data, dict) else json.loads(invoice.client_data) if invoice.client_data else {},
        "line_items": invoice.line_items if isinstance(invoice.line_items, list) else json.loads(invoice.line_items) if invoice.line_items else [],
        "subtotal": invoice.subtotal,
        "tax_rate": float(invoice.tax_rate),
        "tax_amount": invoice.tax_amount,
        "total": invoice.total,
        "issue_date": invoice.issue_date,
        "due_date": invoice.due_date,
        "status": invoice.status.value,
        "amount_paid": invoice.amount_paid,
        "amount_due": invoice.amount_due,
        "paid_date": invoice.paid_date,
        "last_reminder_date": invoice.last_reminder_date,
        "notes": invoice.notes,
        "terms": invoice.terms,
        "pdf_url": invoice.pdf_url,
        "created_at": invoice.created_at,
        "updated_at": invoice.updated_at,
        "payments": [],
    }
    
    return FinanceInvoiceResponse(**invoice_response_data)


@router.put("/{invoice_id}", response_model=FinanceInvoiceResponse)
async def update_facturation(
    invoice_id: int,
    invoice_data: FinanceInvoiceUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Update an existing invoice
    """
    result = await db.execute(
        select(FinanceInvoice)
        .where(FinanceInvoice.id == invoice_id)
        .where(FinanceInvoice.user_id == current_user.id)
    )
    invoice = result.scalar_one_or_none()
    
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found"
        )
    
    # Update fields
    if invoice_data.invoice_number is not None:
        # Check if new invoice number already exists
        if invoice_data.invoice_number != invoice.invoice_number:
            existing = await db.execute(
                select(FinanceInvoice).where(FinanceInvoice.invoice_number == invoice_data.invoice_number)
            )
            if existing.scalar_one_or_none():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invoice number {invoice_data.invoice_number} already exists"
                )
        invoice.invoice_number = invoice_data.invoice_number
    
    if invoice_data.project_id is not None:
        invoice.project_id = invoice_data.project_id
    
    if invoice_data.client_data is not None:
        invoice.client_data = invoice_data.client_data
    
    if invoice_data.line_items is not None:
        invoice.line_items = invoice_data.line_items
    
    if invoice_data.subtotal is not None:
        invoice.subtotal = invoice_data.subtotal
    
    if invoice_data.tax_rate is not None:
        invoice.tax_rate = invoice_data.tax_rate
    
    if invoice_data.tax_amount is not None:
        invoice.tax_amount = invoice_data.tax_amount
    
    if invoice_data.total is not None:
        invoice.total = invoice_data.total
    
    if invoice_data.issue_date is not None:
        invoice.issue_date = invoice_data.issue_date
    
    if invoice_data.due_date is not None:
        invoice.due_date = invoice_data.due_date
    
    if invoice_data.status is not None:
        invoice.status = FinanceInvoiceStatus(invoice_data.status)
    
    if invoice_data.notes is not None:
        invoice.notes = invoice_data.notes
    
    if invoice_data.terms is not None:
        invoice.terms = invoice_data.terms
    
    if invoice_data.last_reminder_date is not None:
        invoice.last_reminder_date = invoice_data.last_reminder_date
    
    # Recalculate amounts if needed
    if invoice_data.subtotal is not None or invoice_data.tax_rate is not None:
        if invoice.tax_rate > 0 and invoice.subtotal > 0:
            invoice.tax_amount = invoice.subtotal * (invoice.tax_rate / 100)
            invoice.total = invoice.subtotal + invoice.tax_amount
    
    # Recalculate amount_due
    invoice.amount_due = invoice.total - invoice.amount_paid
    
    await db.commit()
    await db.refresh(invoice)
    
    # Load payments
    await db.refresh(invoice, ["payments"])
    
    # Return response
    payments = [
        PaymentResponse(
            id=payment.id,
            invoice_id=payment.invoice_id,
            amount=payment.amount,
            payment_date=payment.payment_date,
            payment_method=payment.payment_method,
            reference=payment.reference,
            notes=payment.notes,
            created_at=payment.created_at,
            updated_at=payment.updated_at,
        )
        for payment in invoice.payments
    ]
    
    actual_status = calculate_invoice_status(invoice)
    
    invoice_response_data = {
        "id": invoice.id,
        "user_id": invoice.user_id,
        "invoice_number": invoice.invoice_number,
        "project_id": invoice.project_id,
        "client_data": invoice.client_data if isinstance(invoice.client_data, dict) else json.loads(invoice.client_data) if invoice.client_data else {},
        "line_items": invoice.line_items if isinstance(invoice.line_items, list) else json.loads(invoice.line_items) if invoice.line_items else [],
        "subtotal": invoice.subtotal,
        "tax_rate": float(invoice.tax_rate),
        "tax_amount": invoice.tax_amount,
        "total": invoice.total,
        "issue_date": invoice.issue_date,
        "due_date": invoice.due_date,
        "status": actual_status,
        "amount_paid": invoice.amount_paid,
        "amount_due": invoice.amount_due,
        "paid_date": invoice.paid_date,
        "last_reminder_date": invoice.last_reminder_date,
        "notes": invoice.notes,
        "terms": invoice.terms,
        "pdf_url": invoice.pdf_url,
        "created_at": invoice.created_at,
        "updated_at": invoice.updated_at,
        "payments": payments,
    }
    
    return FinanceInvoiceResponse(**invoice_response_data)


@router.delete("/{invoice_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_facturation(
    invoice_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Delete an invoice
    """
    result = await db.execute(
        select(FinanceInvoice)
        .where(FinanceInvoice.id == invoice_id)
        .where(FinanceInvoice.user_id == current_user.id)
    )
    invoice = result.scalar_one_or_none()
    
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found"
        )
    
    # Only allow deletion of draft invoices
    if invoice.status != FinanceInvoiceStatus.DRAFT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only draft invoices can be deleted"
        )
    
    await db.delete(invoice)
    await db.commit()
    
    return None


@router.post("/{invoice_id}/send", response_model=FinanceInvoiceResponse)
async def send_facturation(
    invoice_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Send an invoice (mark as sent and update last reminder date)
    """
    result = await db.execute(
        select(FinanceInvoice)
        .where(FinanceInvoice.id == invoice_id)
        .where(FinanceInvoice.user_id == current_user.id)
    )
    invoice = result.scalar_one_or_none()
    
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found"
        )
    
    if invoice.status == FinanceInvoiceStatus.CANCELLED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot send a cancelled invoice"
        )
    
    # Mark as sent
    invoice.status = FinanceInvoiceStatus.SENT
    invoice.last_reminder_date = datetime.now()
    
    await db.commit()
    await db.refresh(invoice)
    
    # TODO: Send email to client
    
    # Return response
    await db.refresh(invoice, ["payments"])
    actual_status = calculate_invoice_status(invoice)
    
    payments = [
        PaymentResponse(
            id=payment.id,
            invoice_id=payment.invoice_id,
            amount=payment.amount,
            payment_date=payment.payment_date,
            payment_method=payment.payment_method,
            reference=payment.reference,
            notes=payment.notes,
            created_at=payment.created_at,
            updated_at=payment.updated_at,
        )
        for payment in invoice.payments
    ]
    
    invoice_response_data = {
        "id": invoice.id,
        "user_id": invoice.user_id,
        "invoice_number": invoice.invoice_number,
        "project_id": invoice.project_id,
        "client_data": invoice.client_data if isinstance(invoice.client_data, dict) else json.loads(invoice.client_data) if invoice.client_data else {},
        "line_items": invoice.line_items if isinstance(invoice.line_items, list) else json.loads(invoice.line_items) if invoice.line_items else [],
        "subtotal": invoice.subtotal,
        "tax_rate": float(invoice.tax_rate),
        "tax_amount": invoice.tax_amount,
        "total": invoice.total,
        "issue_date": invoice.issue_date,
        "due_date": invoice.due_date,
        "status": actual_status,
        "amount_paid": invoice.amount_paid,
        "amount_due": invoice.amount_due,
        "paid_date": invoice.paid_date,
        "last_reminder_date": invoice.last_reminder_date,
        "notes": invoice.notes,
        "terms": invoice.terms,
        "pdf_url": invoice.pdf_url,
        "created_at": invoice.created_at,
        "updated_at": invoice.updated_at,
        "payments": payments,
    }
    
    return FinanceInvoiceResponse(**invoice_response_data)


@router.post("/{invoice_id}/payments", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
async def create_payment(
    invoice_id: int,
    payment_data: PaymentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Record a payment for an invoice
    """
    result = await db.execute(
        select(FinanceInvoice)
        .where(FinanceInvoice.id == invoice_id)
        .where(FinanceInvoice.user_id == current_user.id)
    )
    invoice = result.scalar_one_or_none()
    
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found"
        )
    
    if invoice.status == FinanceInvoiceStatus.CANCELLED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot record payment for a cancelled invoice"
        )
    
    # Create payment
    payment = FinanceInvoicePayment(
        invoice_id=invoice_id,
        amount=payment_data.amount,
        payment_date=payment_data.payment_date,
        payment_method=payment_data.payment_method,
        reference=payment_data.reference,
        notes=payment_data.notes,
    )
    
    db.add(payment)
    
    # Update invoice amounts
    invoice.amount_paid += payment_data.amount
    invoice.amount_due = invoice.total - invoice.amount_paid
    
    # Update status
    if invoice.amount_paid >= invoice.total:
        invoice.status = FinanceInvoiceStatus.PAID
        invoice.paid_date = payment_data.payment_date
    elif invoice.amount_paid > 0:
        invoice.status = FinanceInvoiceStatus.SENT  # Will be calculated as "partial"
    
    await db.commit()
    await db.refresh(payment)
    
    # Update corresponding revenue transaction
    try:
        transaction_result = await db.execute(
            select(Transaction)
            .where(Transaction.invoice_number == invoice.invoice_number)
            .where(Transaction.user_id == current_user.id)
            .where(Transaction.type == TransactionType.REVENUE)
        )
        transaction = transaction_result.scalar_one_or_none()
        
        if transaction:
            # Update transaction status based on payment
            if invoice.amount_paid >= invoice.total:
                transaction.status = TransactionStatus.PAID
                transaction.payment_date = payment_data.payment_date
            elif invoice.amount_paid > 0:
                # Partial payment - keep as pending but update notes
                transaction.notes = f"Facture {invoice.invoice_number} - Paiement partiel: {invoice.amount_paid} / {invoice.total}"
            
            await db.commit()
            await db.refresh(transaction)
            logger.info(f"Updated revenue transaction {transaction.id} for invoice {invoice.invoice_number}")
    except Exception as e:
        # Log error but don't fail payment creation
        logger.error(f"Failed to update revenue transaction for invoice {invoice.invoice_number}: {e}", exc_info=True)
    
    # Create notification for invoice payment
    try:
        # Check if invoice is fully paid
        if invoice.amount_paid >= invoice.total:
            template = NotificationTemplates.invoice_paid(
                invoice_number=invoice.invoice_number,
                amount=float(invoice.amount_paid),
                invoice_id=invoice.id
            )
            await create_notification_async(
                db=db,
                user_id=current_user.id,
                **template
            )
            logger.info(f"Created invoice paid notification for invoice {invoice.id}")
    except Exception as notif_error:
        logger.error(f"Failed to create notification for invoice {invoice.id} payment: {notif_error}", exc_info=True)
    
    return PaymentResponse(
        id=payment.id,
        invoice_id=payment.invoice_id,
        amount=payment.amount,
        payment_date=payment.payment_date,
        payment_method=payment.payment_method,
        reference=payment.reference,
        notes=payment.notes,
        created_at=payment.created_at,
        updated_at=payment.updated_at,
    )


@router.delete("/{invoice_id}/payments/{payment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_payment(
    invoice_id: int,
    payment_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Delete a payment
    """
    # Verify invoice belongs to user
    invoice_result = await db.execute(
        select(FinanceInvoice)
        .where(FinanceInvoice.id == invoice_id)
        .where(FinanceInvoice.user_id == current_user.id)
    )
    invoice = invoice_result.scalar_one_or_none()
    
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found"
        )
    
    # Get payment
    payment_result = await db.execute(
        select(FinanceInvoicePayment)
        .where(FinanceInvoicePayment.id == payment_id)
        .where(FinanceInvoicePayment.invoice_id == invoice_id)
    )
    payment = payment_result.scalar_one_or_none()
    
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found"
        )
    
    # Update invoice amounts
    invoice.amount_paid -= payment.amount
    invoice.amount_due = invoice.total - invoice.amount_paid
    
    # Update status
    if invoice.amount_paid <= 0:
        invoice.amount_paid = Decimal(0)
        invoice.status = FinanceInvoiceStatus.SENT
        invoice.paid_date = None
    elif invoice.amount_paid < invoice.total:
        invoice.status = FinanceInvoiceStatus.SENT  # Will be calculated as "partial"
    
    # Delete payment
    await db.delete(payment)
    await db.commit()
    
    return None
