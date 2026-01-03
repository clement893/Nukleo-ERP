"""
Finances - Transactions Endpoints
API endpoints for managing financial transactions (revenues and expenses)
"""

from fastapi import APIRouter, Depends, Query, HTTPException, status as http_status, File, UploadFile
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func, cast, String, text, inspect
from sqlalchemy.exc import ProgrammingError
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from decimal import Decimal
import zipfile
import os
from io import BytesIO

from app.core.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.transaction import Transaction, TransactionType, TransactionStatus
from app.models.transaction_category import TransactionCategory
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
        column_mapping = {}  # Maps DB column name to response field name
        
        # Add base columns (should always exist)
        for col in base_columns:
            if col in existing_columns:
                select_parts.append(f"transactions.{col}")
                column_mapping[col] = col
        
        # Add optional columns
        date_column_used = None
        for db_col, response_field in optional_columns.items():
            if db_col in existing_columns:
                if db_col == 'date' and 'transaction_date' not in existing_columns:
                    # Use 'date' column as 'transaction_date' if transaction_date doesn't exist
                    select_parts.append(f"transactions.date AS transaction_date")
                    column_mapping['transaction_date'] = 'date'
                    date_column_used = 'date'
                elif db_col == 'transaction_date':
                    select_parts.append(f"transactions.transaction_date")
                    column_mapping['transaction_date'] = 'transaction_date'
                    date_column_used = 'transaction_date'
                elif db_col != 'date':  # Skip 'date' if we already have transaction_date
                    select_parts.append(f"transactions.{db_col}")
                    column_mapping[response_field] = db_col
        
        # Ensure we have a date column
        if not date_column_used:
            if 'created_at' in existing_columns:
                select_parts.append("transactions.created_at AS transaction_date")
                column_mapping['transaction_date'] = 'created_at'
            else:
                raise HTTPException(
                    status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
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
        
        if type:
            where_parts.append("transactions.type = :type")
            params["type"] = type.value
        if status:
            where_parts.append("transactions.status = :status")
            params["status"] = status.value
        if category:
            try:
                category_id = int(category)
                if 'category_id' in existing_columns:
                    where_parts.append("transactions.category_id = :category_id")
                    params["category_id"] = category_id
            except ValueError:
                pass  # Skip if not a valid integer
        
        # Date filters
        date_col_for_filter = date_column_used or 'transaction_date'
        if start_date:
            where_parts.append(f"transactions.{date_col_for_filter} >= :start_date")
            params["start_date"] = start_date
        if end_date:
            where_parts.append(f"transactions.{date_col_for_filter} <= :end_date")
            params["end_date"] = end_date
        
        # Build ORDER BY
        order_by_col = date_col_for_filter if date_col_for_filter in existing_columns else 'created_at'
        
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
                response_dict = {
                    'id': row_dict.get('id'),
                    'user_id': row_dict.get('user_id'),
                    'type': TransactionType(row_dict.get('type')),
                    'description': row_dict.get('description'),
                    'amount': Decimal(str(row_dict.get('amount', 0))),
                    'tax_amount': Decimal(str(row_dict.get('tax_amount', 0))) if row_dict.get('tax_amount') is not None else Decimal(0),
                    'currency': row_dict.get('currency', 'CAD'),
                    'category_id': row_dict.get('category_id'),
                    'transaction_date': row_dict.get('transaction_date') or row_dict.get('created_at') or datetime.now(),
                    'expected_payment_date': row_dict.get('expected_payment_date'),
                    'payment_date': row_dict.get('payment_date'),
                    'status': TransactionStatus(row_dict.get('status', 'pending')),
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
    except ProgrammingError as e:
        error_str = str(e).lower()
        logger.error(f"Database programming error in list_transactions: {e}", exc_info=True)
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database schema error. Please ensure all migrations are run. Error: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Unexpected error in list_transactions: {e}", exc_info=True)
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching transactions: {str(e)}"
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
                status_code=http_status.HTTP_404_NOT_FOUND,
                detail="Transaction not found"
            )
        
        return TransactionResponse.model_validate(transaction)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching transaction: {e}", exc_info=True)
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error fetching transaction"
        )


@router.post("", response_model=TransactionResponse, status_code=http_status.HTTP_201_CREATED)
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
            category_id=transaction_data.category_id,  # Use category_id instead of category
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
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
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
                status_code=http_status.HTTP_404_NOT_FOUND,
                detail="Transaction not found"
            )
        
        # Update fields
        update_data = transaction_data.model_dump(exclude_unset=True)
        # Remove deprecated 'category' field if present, use category_id instead
        if 'category' in update_data:
            update_data.pop('category')
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
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error updating transaction"
        )


@router.delete("/{transaction_id}", status_code=http_status.HTTP_204_NO_CONTENT)
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
                status_code=http_status.HTTP_404_NOT_FOUND,
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
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
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
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error getting transaction summary"
        )


@router.post("/import", status_code=http_status.HTTP_201_CREATED)
async def import_transactions(
    file: UploadFile = File(...),
    dry_run: bool = Query(False, description="Dry run mode (validate without importing)"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Import transactions from CSV, Excel, or ZIP file"""
    logger.info(f"Import request from user {current_user.id}, file: {file.filename}, dry_run: {dry_run}")
    """
    Import transactions (revenues and expenses) from CSV, Excel, or ZIP file
    
    Required columns:
    - Type: 'revenue' or 'expense'
    - Description: Transaction description
    - Amount: Transaction amount (HT)
    - Transaction Date: Date d'émission (YYYY-MM-DD)
    
    Optional columns:
    - Tax Amount: Montant des taxes
    - Currency: CAD, USD, EUR (default: CAD)
    - Category: Transaction category
    - Expected Payment Date: Date de réception prévue
    - Payment Date: Date de réception réelle
    - Status: 'pending', 'paid', 'cancelled' (default: pending)
    - Client Name: For revenues
    - Supplier Name: For expenses
    - Invoice Number: Invoice number
    - Notes: Additional notes
    """
    try:
        from app.services.import_service import ImportService
        
        # Read file content
        file_content = await file.read()
        filename = file.filename or ""
        file_ext = os.path.splitext(filename.lower())[1]
        
        excel_content = None
        csv_content = None
        
        # Check if it's a ZIP file
        if file_ext == '.zip':
            try:
                with zipfile.ZipFile(BytesIO(file_content), 'r') as zip_ref:
                    for file_info in zip_ref.namelist():
                        file_name_lower = file_info.lower()
                        
                        if file_name_lower.endswith(('.xlsx', '.xls')):
                            if excel_content is None:
                                excel_content = zip_ref.read(file_info)
                        elif file_name_lower.endswith('.csv'):
                            if csv_content is None:
                                csv_content = zip_ref.read(file_info)
                    
                    if excel_content is None and csv_content is None:
                        raise HTTPException(
                            status_code=http_status.HTTP_400_BAD_REQUEST,
                            detail="No Excel or CSV file found in ZIP"
                        )
                    
                    file_content = excel_content if excel_content else csv_content
            except zipfile.BadZipFile:
                raise HTTPException(
                    status_code=http_status.HTTP_400_BAD_REQUEST,
                    detail="Invalid ZIP file format"
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
                status_code=http_status.HTTP_400_BAD_REQUEST,
                detail="Unsupported file format. Supported: CSV, Excel (.xlsx, .xls), or ZIP"
            )
        
        # Helper function to get field value (case-insensitive)
        def get_field_value(row_data: Dict[str, Any], possible_keys: List[str]) -> Any:
            for key in possible_keys:
                for row_key, value in row_data.items():
                    if row_key.lower().strip() == key.lower().strip():
                        return value
            return None
        
        # Validate transaction row
        def validate_transaction(row_data: Dict[str, Any]) -> tuple[bool, Optional[str]]:
            """Validate transaction row"""
            # Check type
            transaction_type = get_field_value(row_data, [
                'type', 'type_transaction', 'revenue_expense'
            ])
            if not transaction_type:
                return False, "Missing required field: type"
            
            type_str = str(transaction_type).lower().strip()
            if type_str in ['revenue', 'revenu', 'revenus', 'income', 'recette']:
                transaction_type = TransactionType.REVENUE
            elif type_str in ['expense', 'depense', 'dépense', 'depenses', 'dépenses', 'sortie']:
                transaction_type = TransactionType.EXPENSE
            else:
                return False, f"Invalid type: {transaction_type}. Must be 'revenue' or 'expense'"
            
            # Check description
            description = get_field_value(row_data, [
                'description', 'libelle', 'libellé', 'description_transaction'
            ])
            if not description:
                return False, "Missing required field: description"
            
            # Check amount
            amount = get_field_value(row_data, ['amount', 'montant', 'montant_ht'])
            if not amount:
                return False, "Missing required field: amount"
            
            try:
                amount_decimal = Decimal(str(amount))
                if amount_decimal <= 0:
                    return False, "Amount must be greater than 0"
            except (ValueError, TypeError):
                return False, f"Invalid amount: {amount}"
            
            # Check transaction date
            date_str = get_field_value(row_data, [
                'transaction_date', 'date_transaction', 'date_emission', 
                'date_émission', 'date', 'date_operation'
            ])
            if not date_str:
                return False, "Missing required field: transaction_date"
            
            try:
                if isinstance(date_str, datetime):
                    pass
                elif isinstance(date_str, str):
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
        
        # Process valid rows and create transactions
        created_transactions = []
        errors = []
        
        for idx, row_data in enumerate(result['data'], start=2):  # Start at 2 (header + 1-based)
            try:
                # Get and normalize type
                transaction_type = get_field_value(row_data, ['type', 'type_transaction', 'revenue_expense'])
                type_str = str(transaction_type).lower().strip()
                if type_str in ['revenue', 'revenu', 'revenus', 'income', 'recette']:
                    final_type = TransactionType.REVENUE
                else:
                    final_type = TransactionType.EXPENSE
                
                # Get required fields
                description = str(get_field_value(row_data, ['description', 'libelle', 'libellé']))
                amount = Decimal(str(get_field_value(row_data, ['amount', 'montant', 'montant_ht'])))
                
                # Parse transaction date
                date_str = get_field_value(row_data, [
                    'transaction_date', 'date_transaction', 'date_emission', 'date'
                ])
                if isinstance(date_str, datetime):
                    transaction_date = date_str
                else:
                    for fmt in ['%Y-%m-%d', '%d/%m/%Y', '%m/%d/%Y', '%Y-%m-%d %H:%M:%S']:
                        try:
                            transaction_date = datetime.strptime(str(date_str), fmt)
                            break
                        except ValueError:
                            continue
                    else:
                        transaction_date = datetime.now()
                
                # Get optional fields
                tax_amount = get_field_value(row_data, ['tax_amount', 'montant_taxes', 'taxes'])
                tax_amount_decimal = Decimal(str(tax_amount)) if tax_amount else Decimal(0)
                
                currency = get_field_value(row_data, ['currency', 'devise']) or 'CAD'
                category_name = get_field_value(row_data, ['category', 'categorie'])
                
                # Find category by name if provided
                category_id = None
                if category_name:
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
                        logger.warning(f"Category '{category_name}' not found for user {current_user.id}, transaction will be created without category")
                
                # Parse dates
                expected_payment_date = None
                expected_date_str = get_field_value(row_data, [
                    'expected_payment_date', 'date_reception_prevue', 'date_prevue'
                ])
                if expected_date_str:
                    if isinstance(expected_date_str, datetime):
                        expected_payment_date = expected_date_str
                    else:
                        for fmt in ['%Y-%m-%d', '%d/%m/%Y', '%m/%d/%Y']:
                            try:
                                expected_payment_date = datetime.strptime(str(expected_date_str), fmt)
                                break
                            except ValueError:
                                continue
                
                payment_date = None
                payment_date_str = get_field_value(row_data, [
                    'payment_date', 'date_reception_reelle', 'date_reelle', 'date_paiement'
                ])
                if payment_date_str:
                    if isinstance(payment_date_str, datetime):
                        payment_date = payment_date_str
                    else:
                        for fmt in ['%Y-%m-%d', '%d/%m/%Y', '%m/%d/%Y']:
                            try:
                                payment_date = datetime.strptime(str(payment_date_str), fmt)
                                break
                            except ValueError:
                                continue
                
                # Get status
                status_str = get_field_value(row_data, ['status', 'statut', 'etat'])
                if status_str:
                    status_lower = str(status_str).lower()
                    if status_lower in ['paid', 'paye', 'payé', 'recu', 'reçu']:
                        transaction_status = TransactionStatus.PAID
                    elif status_lower in ['cancelled', 'annule', 'annulé']:
                        transaction_status = TransactionStatus.CANCELLED
                    else:
                        transaction_status = TransactionStatus.PENDING
                else:
                    transaction_status = TransactionStatus.PENDING
                
                # Get client/supplier
                client_name = None
                supplier_name = None
                if final_type == TransactionType.REVENUE:
                    client_name = get_field_value(row_data, ['client_name', 'client', 'nom_client'])
                else:
                    supplier_name = get_field_value(row_data, ['supplier_name', 'supplier', 'fournisseur', 'nom_fournisseur'])
                
                invoice_number = get_field_value(row_data, ['invoice_number', 'numero_facture', 'facture'])
                notes = get_field_value(row_data, ['notes', 'remarques', 'commentaires'])
                
                # Detect if recurring expense
                is_recurring_value = get_field_value(row_data, [
                    'is_recurring', 'recurring', 'recurrent', 'recurrente', 
                    'is_recurrent', 'recurrent_expense', 'depense_recurrente'
                ])
                is_recurring = "false"
                if is_recurring_value:
                    recurring_str = str(is_recurring_value).lower().strip()
                    if recurring_str in ['true', '1', 'yes', 'oui', 'vrai', 'recurrent', 'recurrente']:
                        is_recurring = "true"
                
                # Detect if invoice received (has invoice_number and is expense)
                # Factures reçues sont automatiquement identifiées par la présence d'invoice_number
                # pour une dépense
                
                # Get revenue type for revenues (stored in transaction_metadata)
                transaction_metadata = None
                if final_type == TransactionType.REVENUE:
                    revenue_type = get_field_value(row_data, [
                        'revenue_type', 'type_revenu', 'type_revenue', 
                        'revenu_type', 'categorie_revenu', 'type_revenus'
                    ])
                    if revenue_type:
                        import json
                        metadata = {'revenue_type': str(revenue_type).lower().strip()}
                        transaction_metadata = json.dumps(metadata)
                
                # Ensure transaction_date has timezone info
                if transaction_date and transaction_date.tzinfo is None:
                    transaction_date = transaction_date.replace(tzinfo=timezone.utc)
                if expected_payment_date and expected_payment_date.tzinfo is None:
                    expected_payment_date = expected_payment_date.replace(tzinfo=timezone.utc)
                if payment_date and payment_date.tzinfo is None:
                    payment_date = payment_date.replace(tzinfo=timezone.utc)
                
                # Create transaction
                transaction = Transaction(
                    user_id=current_user.id,
                    type=final_type,
                    description=description,
                    amount=amount,
                    tax_amount=tax_amount_decimal,
                    currency=str(currency).upper()[:3],
                    category_id=category_id,
                    transaction_date=transaction_date,
                    expected_payment_date=expected_payment_date,
                    payment_date=payment_date,
                    status=transaction_status,
                    client_name=str(client_name) if client_name else None,
                    supplier_name=str(supplier_name) if supplier_name else None,
                    invoice_number=str(invoice_number) if invoice_number else None,
                    notes=str(notes) if notes else None,
                    is_recurring=is_recurring,
                    transaction_metadata=transaction_metadata,
                )
                
                db.add(transaction)
                created_transactions.append(transaction)
                
            except Exception as e:
                errors.append({
                    "row": idx,
                    "data": row_data,
                    "error": str(e)
                })
                logger.error(f"Error processing row {idx}: {e}", exc_info=True)
        
        # Commit all transactions
        await db.commit()
        
        # Refresh transactions to get IDs
        for transaction in created_transactions:
            await db.refresh(transaction)
        
        logger.info(f"User {current_user.id} imported {len(created_transactions)} transactions")
        
        return {
            "success": True,
            "created_count": len(created_transactions),
            "error_count": len(errors),
            "errors": errors,
            "warnings": result.get('warnings', []),
            "transactions": [
                TransactionResponse.model_validate(t) for t in created_transactions[:10]
            ]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error importing transactions: {e}", exc_info=True)
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error importing transactions: {str(e)}"
        )


@router.get("/import/template")
async def download_import_template(
    format: str = Query("zip", description="Template format: zip, csv, or excel"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Download import template file for transactions
    
    Returns a template file (ZIP with CSV/Excel + instructions, or standalone CSV/Excel)
    """
    try:
        from app.services.export_service import ExportService
        
        # Create sample data for template
        sample_data = [
            {
                "Type": "revenue",
                "Description": "Vente de services de consultation",
                "Montant HT": 1000.00,
                "Montant Taxes": 150.00,
                "Devise": "CAD",
                "Date Emission": "2025-01-15",
                "Date Reception Prevue": "2025-01-30",
                "Date Reception Reelle": "2025-01-28",
                "Statut": "paid",
                "Client": "Client ABC",
                "Numero Facture": "FAC-2025-001",
                "Type Revenu": "facture_recu",
                "Categorie": "Ventes",
                "Recurrent": "false",
                "Notes": "Premier paiement"
            },
            {
                "Type": "revenue",
                "Description": "Facture envoyée - Services de développement",
                "Montant HT": 5000.00,
                "Montant Taxes": 750.00,
                "Devise": "CAD",
                "Date Emission": "2025-01-20",
                "Date Reception Prevue": "2025-02-20",
                "Date Reception Reelle": "",
                "Statut": "pending",
                "Client": "Client XYZ",
                "Numero Facture": "FAC-2025-002",
                "Type Revenu": "facture_a_recevoir",
                "Categorie": "Services",
                "Recurrent": "false",
                "Notes": "Facture envoyée, en attente de paiement"
            },
            {
                "Type": "revenue",
                "Description": "Contrat signé - Projet Q1 2025",
                "Montant HT": 15000.00,
                "Montant Taxes": 2250.00,
                "Devise": "CAD",
                "Date Emission": "2025-02-01",
                "Date Reception Prevue": "2025-02-15",
                "Date Reception Reelle": "",
                "Statut": "pending",
                "Client": "Client DEF",
                "Numero Facture": "",
                "Type Revenu": "signed_contract",
                "Categorie": "Ventes",
                "Recurrent": "false",
                "Notes": "Contrat signé, paiement à venir"
            },
            {
                "Type": "revenue",
                "Description": "Mensualité client - Abonnement annuel",
                "Montant HT": 500.00,
                "Montant Taxes": 75.00,
                "Devise": "CAD",
                "Date Emission": "2025-02-01",
                "Date Reception Prevue": "2025-02-01",
                "Date Reception Reelle": "",
                "Statut": "pending",
                "Client": "Client GHI",
                "Numero Facture": "",
                "Type Revenu": "monthly",
                "Categorie": "Abonnements",
                "Recurrent": "true",
                "Notes": "Mensualité récurrente"
            },
            {
                "Type": "revenue",
                "Description": "Banque d'heures - Client JKL",
                "Montant HT": 2000.00,
                "Montant Taxes": 300.00,
                "Devise": "CAD",
                "Date Emission": "2025-02-10",
                "Date Reception Prevue": "2025-02-28",
                "Date Reception Reelle": "",
                "Statut": "pending",
                "Client": "Client JKL",
                "Numero Facture": "",
                "Type Revenu": "hour_bank",
                "Categorie": "Services",
                "Recurrent": "false",
                "Notes": "Banque d'heures à recevoir"
            },
            {
                "Type": "expense",
                "Description": "Achat de fournitures de bureau",
                "Montant HT": 500.00,
                "Montant Taxes": 75.00,
                "Devise": "CAD",
                "Date Emission": "2025-01-16",
                "Date Reception Prevue": "2025-01-20",
                "Date Reception Reelle": "",
                "Statut": "pending",
                "Fournisseur": "Fournisseur XYZ",
                "Numero Facture": "INV-2025-001",
                "Categorie": "Fournitures",
                "Recurrent": "false",
                "Notes": "Commande urgente"
            },
            {
                "Type": "expense",
                "Description": "Abonnement mensuel SaaS",
                "Montant HT": 99.00,
                "Montant Taxes": 14.85,
                "Devise": "CAD",
                "Date Emission": "2025-01-01",
                "Date Reception Prevue": "2025-01-01",
                "Date Reception Reelle": "",
                "Statut": "pending",
                "Fournisseur": "Fournisseur SaaS",
                "Numero Facture": "",
                "Categorie": "Services",
                "Recurrent": "true",
                "Notes": "Dépense récurrente mensuelle"
            },
            {
                "Type": "expense",
                "Description": "Facture de services professionnels",
                "Montant HT": 2000.00,
                "Montant Taxes": 300.00,
                "Devise": "CAD",
                "Date Emission": "2025-01-10",
                "Date Reception Prevue": "2025-02-10",
                "Date Reception Reelle": "",
                "Statut": "pending",
                "Fournisseur": "Cabinet comptable",
                "Numero Facture": "FAC-2025-050",
                "Categorie": "Services",
                "Recurrent": "false",
                "Notes": "Facture reçue"
            }
        ]
        
        if format == "zip":
            # Create ZIP with CSV and instructions
            zip_buffer = BytesIO()
            
            with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
                # Add CSV template
                csv_buffer, csv_filename = ExportService.export_to_csv(
                    data=sample_data,
                    headers=["Type", "Description", "Montant HT", "Montant Taxes", "Devise", 
                            "Date Emission", "Date Reception Prevue", "Date Reception Reelle",
                            "Statut", "Client", "Fournisseur", "Numero Facture", "Type Revenu", "Categorie", "Recurrent", "Notes"],
                    filename="transactions.csv"
                )
                zip_file.writestr("transactions.csv", csv_buffer.getvalue())
                
                # Add instructions
                instructions = """INSTRUCTIONS D'IMPORT - REVENUS ET DÉPENSES
===============================================

FORMAT DU FICHIER
-----------------
Le fichier transactions.csv contient les transactions à importer.

COLONNES REQUISES
-----------------
- Type: 'revenue' (revenu) ou 'expense' (dépense)
- Description: Description de la transaction
- Montant HT: Montant hors taxes (ex: 1000.00)
- Date Emission: Date d'émission au format YYYY-MM-DD (ex: 2025-01-15)

COLONNES OPTIONNELLES
---------------------
- Montant Taxes: Montant des taxes (GST, QST, etc.) - défaut: 0
- Devise: CAD, USD, EUR - défaut: CAD
- Date Reception Prevue: Date de réception prévue (YYYY-MM-DD)
- Date Reception Reelle: Date de réception réelle (YYYY-MM-DD)
- Statut: 'pending', 'paid', 'cancelled' - défaut: pending
- Client: Nom du client (pour les revenus)
- Fournisseur: Nom du fournisseur (pour les dépenses)
- Numero Facture: Numéro de facture (si présent, la dépense sera identifiée comme facture reçue)
- Type Revenu: Type de revenu (uniquement pour les revenus):
  * 'facture_recu' - Facturé reçu (paiement reçu)
  * 'facture_a_recevoir' - Facturé à recevoir (facture envoyée mais non reçue)
  * 'signed_contract' - $ signé à venir (contrats signés)
  * 'monthly' - $ mensuels à venir (mensualité client)
  * 'hour_bank' - Banque d'heures (banques d'heures à recevoir)
- Categorie: Catégorie de la transaction
- Recurrent: 'true', 'false', 'oui', 'non' - défaut: false (si 'true', la dépense sera identifiée comme récurrente)
- Notes: Notes supplémentaires

DÉTECTION AUTOMATIQUE
----------------------
- Dépense récurrente: Si la colonne "Recurrent" = 'true' (ou 'oui', '1', 'yes'), la dépense sera marquée comme récurrente
- Facture reçue: Si "Numero Facture" est rempli pour une dépense, elle sera identifiée comme facture reçue
- Type de revenu: Si "Type Revenu" est rempli pour un revenu, il sera catégorisé selon le type spécifié

FORMATS DE DATE ACCEPTÉS
------------------------
- YYYY-MM-DD (ex: 2025-01-15)
- DD/MM/YYYY (ex: 15/01/2025)
- MM/DD/YYYY (ex: 01/15/2025)

EXEMPLES
--------
revenue,"Vente services",1000.00,150.00,CAD,2025-01-15,2025-01-30,2025-01-28,paid,"Client ABC",,FAC-001,facture_recu,Ventes,false,"Premier paiement"
revenue,"Facture envoyée",5000.00,750.00,CAD,2025-01-20,2025-02-20,,pending,"Client XYZ",,FAC-002,facture_a_recevoir,Services,false,"En attente"
revenue,"Contrat signé",15000.00,2250.00,CAD,2025-02-01,2025-02-15,,pending,"Client DEF",,,signed_contract,Ventes,false,"Contrat signé"
revenue,"Mensualité",500.00,75.00,CAD,2025-02-01,2025-02-01,,pending,"Client GHI",,,monthly,Abonnements,true,"Mensualité"
revenue,"Banque d'heures",2000.00,300.00,CAD,2025-02-10,2025-02-28,,pending,"Client JKL",,,hour_bank,Services,false,"Banque d'heures"
expense,"Fournitures",500.00,75.00,CAD,2025-01-16,2025-01-20,,pending,,"Fournisseur XYZ",INV-001,,Fournitures,false,"Commande urgente"

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
                    "Content-Disposition": "attachment; filename=template_import_transactions.zip"
                }
            )
        
        elif format == "csv":
            csv_buffer, csv_filename = ExportService.export_to_csv(
                data=sample_data,
                headers=["Type", "Description", "Montant HT", "Montant Taxes", "Devise", 
                        "Date Emission", "Date Reception Prevue", "Date Reception Reelle",
                        "Statut", "Client", "Fournisseur", "Numero Facture", "Type Revenu", "Categorie", "Recurrent", "Notes"],
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
                headers=["Type", "Description", "Montant HT", "Montant Taxes", "Devise", 
                        "Date Emission", "Date Reception Prevue", "Date Reception Reelle",
                        "Statut", "Client", "Fournisseur", "Numero Facture", "Type Revenu", "Categorie", "Recurrent", "Notes"],
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
                status_code=http_status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported format: {format}. Supported: zip, csv, excel"
            )
            
    except Exception as e:
        logger.error(f"Error generating import template: {e}", exc_info=True)
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error generating import template"
        )
