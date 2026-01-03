"""
Finances - Facturations Endpoints
API endpoints for managing invoices
"""

from datetime import datetime, timedelta, timezone
from decimal import Decimal
from fastapi import APIRouter, Depends, Query, HTTPException, status, File, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, desc
from sqlalchemy.orm import selectinload
from typing import List, Optional
import json
import os
import boto3
from io import BytesIO
import uuid
from fastapi.responses import StreamingResponse

from app.core.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.finance_invoice import FinanceInvoice, FinanceInvoicePayment, FinanceInvoiceStatus
from app.models.project import Project
from app.models.transaction import Transaction, TransactionStatus, TransactionType
from app.models.transaction_category import TransactionCategory
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
from app.services.invoice_pdf_service import InvoicePDFService
from app.services.email_service import EmailService
from app.services.email_templates import EmailTemplates
from app.services.s3_service import S3Service
from fastapi.responses import StreamingResponse
from io import BytesIO
import uuid

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
        if invoice.due_date:
            try:
                # Use UTC timezone for consistent comparison
                from datetime import timezone as tz
                now_utc = datetime.now(tz.utc)
                # Ensure due_date is timezone-aware
                if invoice.due_date.tzinfo is None:
                    due_date_utc = invoice.due_date.replace(tzinfo=tz.utc)
                else:
                    due_date_utc = invoice.due_date.astimezone(tz.utc)
                if now_utc > due_date_utc:
                    return "overdue"
            except Exception as e:
                logger.warning(f"Error checking overdue status for invoice {invoice.id}: {e}")
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
    
    # Get total count - use a simpler approach
    try:
        count_query = select(func.count(FinanceInvoice.id)).where(FinanceInvoice.user_id == current_user.id)
        if status:
            count_query = count_query.where(FinanceInvoice.status == status)
        if project_id:
            count_query = count_query.where(FinanceInvoice.project_id == project_id)
        total_result = await db.execute(count_query)
        total = total_result.scalar() or 0
    except Exception as e:
        logger.error(f"Error counting invoices: {e}", exc_info=True)
        total = 0
    
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
        
        # Safely parse JSON fields
        try:
            client_data = invoice.client_data
            if not isinstance(client_data, dict):
                if isinstance(client_data, str):
                    client_data = json.loads(client_data) if client_data else {}
                else:
                    client_data = {}
        except (json.JSONDecodeError, TypeError) as e:
            logger.warning(f"Error parsing client_data for invoice {invoice.id}: {e}")
            client_data = {}
        
        try:
            line_items = invoice.line_items
            if not isinstance(line_items, list):
                if isinstance(line_items, str):
                    line_items = json.loads(line_items) if line_items else []
                else:
                    line_items = []
        except (json.JSONDecodeError, TypeError) as e:
            logger.warning(f"Error parsing line_items for invoice {invoice.id}: {e}")
            line_items = []
        
        invoice_data = {
            "id": invoice.id,
            "user_id": invoice.user_id,
            "invoice_number": invoice.invoice_number,
            "project_id": invoice.project_id,
            "client_data": client_data,
            "line_items": line_items,
            "subtotal": invoice.subtotal,
            "tax_rate": float(invoice.tax_rate) if invoice.tax_rate is not None else 0.0,
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
        try:
            invoice_responses.append(FinanceInvoiceResponse(**invoice_data))
        except Exception as e:
            logger.error(f"Error creating FinanceInvoiceResponse for invoice {invoice.id}: {e}", exc_info=True)
            # Skip this invoice if it can't be serialized
            continue
    
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
        
        # Find or create "Ventes" category
        category_id = None
        try:
            category_result = await db.execute(
                select(TransactionCategory)
                .where(TransactionCategory.name == 'Ventes')
                .where(TransactionCategory.type == TransactionType.REVENUE)
                .where(TransactionCategory.user_id == current_user.id)
            )
            category = category_result.scalar_one_or_none()
            if category:
                category_id = category.id
        except Exception as cat_error:
            logger.warning(f"Could not find category 'Ventes': {cat_error}")
        
        transaction = Transaction(
            user_id=current_user.id,
            type=TransactionType.REVENUE,
            description=f"Facture {invoice_number} - {client_name}",
            amount=total,
            tax_amount=tax_amount,
            currency='CAD',
            category_id=category_id,  # Use category_id instead of category
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
    
    # Send email to client
    try:
        client_data = invoice.client_data if isinstance(invoice.client_data, dict) else json.loads(invoice.client_data) if invoice.client_data else {}
        client_email = client_data.get('email')
        client_name = client_data.get('name', 'Client')
        
        if client_email:
            email_service = EmailService()
            if email_service.is_configured():
                # Generate PDF if not already generated
                pdf_url = invoice.pdf_url
                if not pdf_url:
                    # Generate PDF and upload to S3
                    try:
                        invoice_dict = {
                            "id": invoice.id,
                            "invoice_number": invoice.invoice_number,
                            "client_data": client_data,
                            "line_items": invoice.line_items if isinstance(invoice.line_items, list) else json.loads(invoice.line_items) if invoice.line_items else [],
                            "subtotal": float(invoice.subtotal),
                            "tax_rate": float(invoice.tax_rate),
                            "tax_amount": float(invoice.tax_amount),
                            "total": float(invoice.total),
                            "issue_date": invoice.issue_date.isoformat() if invoice.issue_date else "",
                            "due_date": invoice.due_date.isoformat() if invoice.due_date else "",
                            "status": invoice.status.value,
                            "amount_paid": float(invoice.amount_paid),
                            "amount_due": float(invoice.amount_due),
                            "terms": invoice.terms or "",
                            "notes": invoice.notes or "",
                        }
                        pdf_buffer = InvoicePDFService.generate_pdf(invoice_dict)
                        
                        # Upload PDF to S3
                        if S3Service.is_configured():
                            s3_service = S3Service()
                            file_key = f"invoices/{invoice.user_id}/{invoice.invoice_number}_{uuid.uuid4().hex[:8]}.pdf"
                            s3_client.put_object(
                                Bucket=os.getenv("AWS_S3_BUCKET"),
                                Key=file_key,
                                Body=pdf_buffer.getvalue(),
                                ContentType="application/pdf",
                            )
                            pdf_url = s3_service.generate_presigned_url(file_key, expiration=604800)  # 7 days
                            invoice.pdf_url = pdf_url
                            await db.commit()
                    except Exception as pdf_error:
                        logger.error(f"Failed to generate PDF for invoice {invoice.id}: {pdf_error}", exc_info=True)
                
                # Prepare email template data
                issue_date_str = invoice.issue_date.strftime('%d %B %Y') if invoice.issue_date else ''
                
                email_template = EmailTemplates.invoice(
                    name=client_name,
                    invoice_number=invoice.invoice_number,
                    invoice_date=issue_date_str,
                    amount=float(invoice.total),
                    currency="CAD",
                    invoice_url=pdf_url or f"#",  # You can create a public invoice view URL
                    items=invoice.line_items if isinstance(invoice.line_items, list) else json.loads(invoice.line_items) if invoice.line_items else [],
                )
                
                email_service.send_email(
                    to_email=client_email,
                    subject=email_template['subject'],
                    html_content=email_template['html_content'],
                    text_content=email_template.get('text_content'),
                )
                logger.info(f"Sent invoice email to {client_email} for invoice {invoice.invoice_number}")
            else:
                logger.warning("Email service not configured, skipping email send")
        else:
            logger.warning(f"No email address for client in invoice {invoice.id}")
    except Exception as email_error:
        logger.error(f"Failed to send invoice email for invoice {invoice.id}: {email_error}", exc_info=True)
        # Don't fail the request if email fails
    
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


@router.get("/{invoice_id}/pdf")
async def generate_invoice_pdf(
    invoice_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Generate and download PDF for an invoice
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
    
    try:
        # Prepare invoice data for PDF generation
        invoice_dict = {
            "id": invoice.id,
            "invoice_number": invoice.invoice_number,
            "client_data": invoice.client_data if isinstance(invoice.client_data, dict) else json.loads(invoice.client_data) if invoice.client_data else {},
            "line_items": invoice.line_items if isinstance(invoice.line_items, list) else json.loads(invoice.line_items) if invoice.line_items else [],
            "subtotal": float(invoice.subtotal),
            "tax_rate": float(invoice.tax_rate),
            "tax_amount": float(invoice.tax_amount),
            "total": float(invoice.total),
            "issue_date": invoice.issue_date.isoformat() if invoice.issue_date else "",
            "due_date": invoice.due_date.isoformat() if invoice.due_date else "",
            "status": invoice.status.value,
            "amount_paid": float(invoice.amount_paid),
            "amount_due": float(invoice.amount_due),
            "terms": invoice.terms or "",
            "notes": invoice.notes or "",
        }
        
        # Generate PDF
        pdf_buffer = InvoicePDFService.generate_pdf(invoice_dict)
        
        # Upload to S3 if configured
        if S3Service.is_configured() and not invoice.pdf_url:
            try:
                s3_service = S3Service()
                file_key = f"invoices/{invoice.user_id}/{invoice.invoice_number}_{uuid.uuid4().hex[:8]}.pdf"
                s3_client = boto3.client(
                    's3',
                    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
                    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
                    region_name=os.getenv("AWS_REGION", "us-east-1"),
                    endpoint_url=os.getenv("AWS_S3_ENDPOINT_URL"),
                )
                s3_client.put_object(
                    Bucket=os.getenv("AWS_S3_BUCKET"),
                    Key=file_key,
                    Body=pdf_buffer.getvalue(),
                    ContentType="application/pdf",
                )
                pdf_url = s3_service.generate_presigned_url(file_key, expiration=604800)  # 7 days
                invoice.pdf_url = pdf_url
                await db.commit()
            except Exception as s3_error:
                logger.warning(f"Failed to upload PDF to S3: {s3_error}")
        
        # Return PDF as download
        pdf_buffer.seek(0)
        return StreamingResponse(
            pdf_buffer,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="facture_{invoice.invoice_number}.pdf"'
            }
        )
    except Exception as e:
        logger.error(f"Failed to generate PDF for invoice {invoice_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate PDF: {str(e)}"
        )


@router.post("/{invoice_id}/send-email")
async def send_invoice_email(
    invoice_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Send invoice by email to client
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
    
    client_data = invoice.client_data if isinstance(invoice.client_data, dict) else json.loads(invoice.client_data) if invoice.client_data else {}
    client_email = client_data.get('email')
    client_name = client_data.get('name', 'Client')
    
    if not client_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Client email address is required"
        )
    
    try:
        email_service = EmailService()
        if not email_service.is_configured():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Email service is not configured"
            )
        
        # Generate PDF if not exists (will be generated on demand)
        # The PDF generation endpoint will handle S3 upload if needed
        # For now, we'll generate it inline if needed
        if not invoice.pdf_url:
            try:
                invoice_dict = {
                    "id": invoice.id,
                    "invoice_number": invoice.invoice_number,
                    "client_data": client_data,
                    "line_items": invoice.line_items if isinstance(invoice.line_items, list) else json.loads(invoice.line_items) if invoice.line_items else [],
                    "subtotal": float(invoice.subtotal),
                    "tax_rate": float(invoice.tax_rate),
                    "tax_amount": float(invoice.tax_amount),
                    "total": float(invoice.total),
                    "issue_date": invoice.issue_date.isoformat() if invoice.issue_date else "",
                    "due_date": invoice.due_date.isoformat() if invoice.due_date else "",
                    "status": invoice.status.value,
                    "amount_paid": float(invoice.amount_paid),
                    "amount_due": float(invoice.amount_due),
                    "terms": invoice.terms or "",
                    "notes": invoice.notes or "",
                }
                pdf_buffer = InvoicePDFService.generate_pdf(invoice_dict)
                
                # Upload to S3 if configured
                if S3Service.is_configured():
                    try:
                        s3_service = S3Service()
                        file_key = f"invoices/{invoice.user_id}/{invoice.invoice_number}_{uuid.uuid4().hex[:8]}.pdf"
                        s3_client_inst = boto3.client(
                            's3',
                            aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
                            aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
                            region_name=os.getenv("AWS_REGION", "us-east-1"),
                            endpoint_url=os.getenv("AWS_S3_ENDPOINT_URL"),
                        )
                        s3_client_inst.put_object(
                            Bucket=os.getenv("AWS_S3_BUCKET"),
                            Key=file_key,
                            Body=pdf_buffer.getvalue(),
                            ContentType="application/pdf",
                        )
                        pdf_url = s3_service.generate_presigned_url(file_key, expiration=604800)  # 7 days
                        invoice.pdf_url = pdf_url
                        await db.commit()
                    except Exception as s3_error:
                        logger.warning(f"Failed to upload PDF to S3: {s3_error}")
            except Exception as pdf_error:
                logger.warning(f"Failed to generate PDF: {pdf_error}")
        
        issue_date_str = invoice.issue_date.strftime('%d %B %Y') if invoice.issue_date else ''
        
        email_template = EmailTemplates.invoice(
            name=client_name,
            invoice_number=invoice.invoice_number,
            invoice_date=issue_date_str,
            amount=float(invoice.total),
            currency="CAD",
            invoice_url=invoice.pdf_url or "#",
            items=invoice.line_items if isinstance(invoice.line_items, list) else json.loads(invoice.line_items) if invoice.line_items else [],
        )
        
        email_service.send_email(
            to_email=client_email,
            subject=email_template['subject'],
            html_content=email_template['html_content'],
            text_content=email_template.get('text_content'),
        )
        
        # Update last reminder date
        invoice.last_reminder_date = datetime.now(timezone.utc)
        await db.commit()
        
        return {"message": "Invoice email sent successfully", "email": client_email}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to send invoice email: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send email: {str(e)}"
        )


@router.post("/{invoice_id}/duplicate", response_model=FinanceInvoiceResponse, status_code=status.HTTP_201_CREATED)
async def duplicate_invoice(
    invoice_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Duplicate an existing invoice
    """
    result = await db.execute(
        select(FinanceInvoice)
        .where(FinanceInvoice.id == invoice_id)
        .where(FinanceInvoice.user_id == current_user.id)
    )
    original_invoice = result.scalar_one_or_none()
    
    if not original_invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found"
        )
    
    # Generate new invoice number
    new_invoice_number = await generate_invoice_number(db, datetime.now(timezone.utc))
    
    # Create duplicate
    duplicate = FinanceInvoice(
        user_id=current_user.id,
        project_id=original_invoice.project_id,
        invoice_number=new_invoice_number,
        client_data=original_invoice.client_data,
        line_items=original_invoice.line_items,
        subtotal=original_invoice.subtotal,
        tax_rate=original_invoice.tax_rate,
        tax_amount=original_invoice.tax_amount,
        total=original_invoice.total,
        amount_paid=Decimal(0),
        amount_due=original_invoice.total,
        issue_date=datetime.now(timezone.utc),
        due_date=original_invoice.due_date,
        status=FinanceInvoiceStatus.DRAFT,
        notes=original_invoice.notes,
        terms=original_invoice.terms,
    )
    
    db.add(duplicate)
    await db.commit()
    await db.refresh(duplicate)
    
    # Return response
    await db.refresh(duplicate, ["payments"])
    actual_status = calculate_invoice_status(duplicate)
    
    payments = []
    invoice_response_data = {
        "id": duplicate.id,
        "user_id": duplicate.user_id,
        "invoice_number": duplicate.invoice_number,
        "project_id": duplicate.project_id,
        "client_data": duplicate.client_data if isinstance(duplicate.client_data, dict) else json.loads(duplicate.client_data) if duplicate.client_data else {},
        "line_items": duplicate.line_items if isinstance(duplicate.line_items, list) else json.loads(duplicate.line_items) if duplicate.line_items else [],
        "subtotal": duplicate.subtotal,
        "tax_rate": float(duplicate.tax_rate),
        "tax_amount": duplicate.tax_amount,
        "total": duplicate.total,
        "issue_date": duplicate.issue_date,
        "due_date": duplicate.due_date,
        "status": actual_status,
        "amount_paid": duplicate.amount_paid,
        "amount_due": duplicate.amount_due,
        "paid_date": duplicate.paid_date,
        "last_reminder_date": duplicate.last_reminder_date,
        "notes": duplicate.notes,
        "terms": duplicate.terms,
        "pdf_url": duplicate.pdf_url,
        "created_at": duplicate.created_at,
        "updated_at": duplicate.updated_at,
        "payments": payments,
    }
    
    return FinanceInvoiceResponse(**invoice_response_data)


@router.post("/{invoice_id}/cancel", response_model=FinanceInvoiceResponse)
async def cancel_invoice(
    invoice_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Cancel an invoice
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
    
    if invoice.status == FinanceInvoiceStatus.PAID:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot cancel a paid invoice"
        )
    
    if invoice.status == FinanceInvoiceStatus.CANCELLED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invoice is already cancelled"
        )
    
    invoice.status = FinanceInvoiceStatus.CANCELLED
    await db.commit()
    await db.refresh(invoice)
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


@router.post("/{invoice_id}/remind", response_model=FinanceInvoiceResponse)
async def remind_invoice(
    invoice_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Send a reminder for an invoice
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
            detail="Cannot send reminder for cancelled invoice"
        )
    
    if invoice.status == FinanceInvoiceStatus.PAID:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot send reminder for paid invoice"
        )
    
    # Send email reminder (reuse send email logic)
    try:
        await send_invoice_email(invoice_id, db, current_user)
    except Exception as e:
        logger.error(f"Failed to send reminder email: {e}", exc_info=True)
        # Continue anyway
    
    # Update last reminder date
    invoice.last_reminder_date = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(invoice)
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


@router.get("/stats")
async def get_invoice_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
):
    """
    Get invoice statistics
    """
    query = select(FinanceInvoice).where(FinanceInvoice.user_id == current_user.id)
    
    if start_date:
        query = query.where(FinanceInvoice.issue_date >= start_date)
    if end_date:
        query = query.where(FinanceInvoice.issue_date <= end_date)
    
    result = await db.execute(query)
    invoices = result.scalars().all()
    
    total_amount = sum(float(inv.total) for inv in invoices)
    paid_amount = sum(float(inv.amount_paid) for inv in invoices)
    pending_amount = sum(float(inv.amount_due) for inv in invoices if inv.status in [FinanceInvoiceStatus.SENT, FinanceInvoiceStatus.DRAFT])
    overdue_amount = sum(float(inv.amount_due) for inv in invoices if calculate_invoice_status(inv) == "overdue")
    
    stats = {
        "total": {
            "amount": total_amount,
            "count": len(invoices),
        },
        "paid": {
            "amount": paid_amount,
            "count": len([inv for inv in invoices if inv.status == FinanceInvoiceStatus.PAID]),
        },
        "pending": {
            "amount": pending_amount,
            "count": len([inv for inv in invoices if inv.status in [FinanceInvoiceStatus.SENT, FinanceInvoiceStatus.DRAFT]]),
        },
        "overdue": {
            "amount": overdue_amount,
            "count": len([inv for inv in invoices if calculate_invoice_status(inv) == "overdue"]),
        },
        "by_status": {
            "draft": len([inv for inv in invoices if inv.status == FinanceInvoiceStatus.DRAFT]),
            "sent": len([inv for inv in invoices if inv.status == FinanceInvoiceStatus.SENT]),
            "paid": len([inv for inv in invoices if inv.status == FinanceInvoiceStatus.PAID]),
            "partial": len([inv for inv in invoices if calculate_invoice_status(inv) == "partial"]),
            "overdue": len([inv for inv in invoices if calculate_invoice_status(inv) == "overdue"]),
            "cancelled": len([inv for inv in invoices if inv.status == FinanceInvoiceStatus.CANCELLED]),
        },
    }
    
    return stats


@router.get("/export")
async def export_invoices(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    format: str = Query("csv", description="Export format: csv or excel"),
    status: Optional[str] = Query(None),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
):
    """
    Export invoices to CSV or Excel
    """
    from app.services.export_service import ExportService
    from fastapi.responses import Response
    
    query = select(FinanceInvoice).where(FinanceInvoice.user_id == current_user.id)
    
    if status:
        query = query.where(FinanceInvoice.status == status)
    if start_date:
        query = query.where(FinanceInvoice.issue_date >= start_date)
    if end_date:
        query = query.where(FinanceInvoice.issue_date <= end_date)
    
    result = await db.execute(query.order_by(desc(FinanceInvoice.issue_date)))
    invoices = result.scalars().all()
    
    # Prepare data for export
    export_data = []
    for invoice in invoices:
        client_data = invoice.client_data if isinstance(invoice.client_data, dict) else json.loads(invoice.client_data) if invoice.client_data else {}
        export_data.append({
            "Numéro": invoice.invoice_number,
            "Client": client_data.get('name', ''),
            "Email": client_data.get('email', ''),
            "Téléphone": client_data.get('phone', ''),
            "Sous-total": float(invoice.subtotal),
            "Taux de taxe": float(invoice.tax_rate),
            "Montant taxes": float(invoice.tax_amount),
            "Total": float(invoice.total),
            "Montant payé": float(invoice.amount_paid),
            "Montant dû": float(invoice.amount_due),
            "Date d'émission": invoice.issue_date.isoformat() if invoice.issue_date else "",
            "Date d'échéance": invoice.due_date.isoformat() if invoice.due_date else "",
            "Statut": invoice.status.value,
            "Date de paiement": invoice.paid_date.isoformat() if invoice.paid_date else "",
        })
    
    if format.lower() == "excel":
        buffer, filename = ExportService.export_to_excel(export_data, filename=f"factures_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx")
        return Response(
            content=buffer.getvalue(),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'}
        )
    else:
        buffer, filename = ExportService.export_to_csv(export_data, filename=f"factures_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv")
        return Response(
            content=buffer.getvalue(),
            media_type="text/csv",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'}
        )


@router.get("/import/template")
async def get_import_template(
    format: str = Query("csv", description="Template format: csv or excel"),
):
    """
    Get import template file
    """
    from app.services.export_service import ExportService
    from fastapi.responses import Response
    
    # Sample data for template
    template_data = [{
        "Numéro": "INV-2024-001",
        "Client": "Nom du client",
        "Email": "client@example.com",
        "Téléphone": "+1 (555) 123-4567",
        "Adresse": "123 Rue Example, Ville, Pays",
        "Sous-total": "1000.00",
        "Taux de taxe": "15.00",
        "Montant taxes": "150.00",
        "Total": "1150.00",
        "Date d'émission": "2024-01-15",
        "Date d'échéance": "2024-02-15",
        "Statut": "draft",
        "Notes": "Notes internes",
        "Conditions": "Paiement net 30 jours",
        "Articles (JSON)": json.dumps([{"description": "Service 1", "quantity": 1, "unitPrice": 1000, "total": 1000}]),
    }]
    
    if format.lower() == "excel":
        buffer, filename = ExportService.export_to_excel(template_data, filename="template_factures.xlsx")
        return Response(
            content=buffer.getvalue(),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'}
        )
    else:
        buffer, filename = ExportService.export_to_csv(template_data, filename="template_factures.csv")
        return Response(
            content=buffer.getvalue(),
            media_type="text/csv",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'}
        )
