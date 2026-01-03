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

from app.core.database import get_db, engine
from app.dependencies import get_current_user
from app.models.user import User
from app.models.transaction import Transaction, TransactionType, TransactionStatus
from app.models.transaction_category import TransactionCategory
from app.models.bank_account import BankAccount, BankAccountType
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
        
        # Add category name from transaction_categories table if category_id exists
        category_name_select = ""
        category_join = ""
        # Check if transaction_categories table exists
        try:
            table_check = await db.execute(text("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_name = 'transaction_categories'
                )
            """))
            categories_table_exists = table_check.scalar()
            
            if categories_table_exists and 'category_id' in existing_columns:
                category_name_select = ", transaction_categories.name AS category_name"
                category_join = "LEFT JOIN transaction_categories ON transactions.category_id = transaction_categories.id"
        except Exception as e:
            logger.warning(f"Could not check for transaction_categories table: {e}")
            # Continue without category name if table doesn't exist
        
        # Construct full SQL query with parameterized values
        sql_query = f"""
            SELECT {', '.join(select_parts)}{category_name_select}
            FROM transactions
            {category_join}
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
                    'category': row_dict.get('category_name'),  # Add category name from JOIN
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
        query = select(Transaction, TransactionCategory.name.label('category_name')).outerjoin(
            TransactionCategory, Transaction.category_id == TransactionCategory.id
        ).where(
            and_(
                Transaction.id == transaction_id,
                Transaction.user_id == current_user.id
            )
        )
        result = await db.execute(query)
        row = result.first()
        
        if not row:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND,
                detail="Transaction not found"
            )
        
        transaction, category_name = row
        transaction_dict = TransactionResponse.model_validate(transaction).model_dump()
        transaction_dict['category'] = category_name  # Add category name
        return TransactionResponse(**transaction_dict)
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
        # Ensure transaction_date has timezone info
        transaction_date = transaction_data.transaction_date
        if transaction_date and transaction_date.tzinfo is None:
            transaction_date = transaction_date.replace(tzinfo=timezone.utc)
        
        expected_payment_date = transaction_data.expected_payment_date
        if expected_payment_date and expected_payment_date.tzinfo is None:
            expected_payment_date = expected_payment_date.replace(tzinfo=timezone.utc)
        
        payment_date = transaction_data.payment_date
        if payment_date and payment_date.tzinfo is None:
            payment_date = payment_date.replace(tzinfo=timezone.utc)
        
        # Validate category_id if provided
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
                    status_code=http_status.HTTP_400_BAD_REQUEST,
                    detail=f"Category {transaction_data.category_id} not found or does not belong to user"
                )
        
        # Use .value to get the string value ("expense" or "revenue") instead of enum name
        # Force lowercase conversion to avoid PostgreSQL enum issues
        if isinstance(transaction_data.type, TransactionType):
            type_value = transaction_data.type.value  # Get "expense" or "revenue"
        else:
            type_value = str(transaction_data.type).lower()
        
        # Ensure we're using the lowercase string value
        type_value = str(type_value).lower().strip()
        if type_value not in ['expense', 'revenue']:
            # Fallback: map common variations
            if type_value in ['depense', 'dépense', 'depenses', 'dépenses', 'sortie']:
                type_value = 'expense'
            elif type_value in ['revenu', 'revenus', 'income', 'recette']:
                type_value = 'revenue'
            else:
                # Default to expense if unclear
                type_value = 'expense'
        
        transaction = Transaction(
            user_id=current_user.id,
            type=type_value,
            description=transaction_data.description,
            amount=transaction_data.amount,
            tax_amount=transaction_data.tax_amount or 0,
            currency=transaction_data.currency or "CAD",
            category_id=transaction_data.category_id,  # Use category_id instead of category
            transaction_date=transaction_date,
            expected_payment_date=expected_payment_date,
            payment_date=payment_date,
            status=transaction_data.status,
            client_id=transaction_data.client_id,
            client_name=transaction_data.client_name,
            supplier_id=transaction_data.supplier_id,
            supplier_name=transaction_data.supplier_name,
            invoice_number=transaction_data.invoice_number,
            notes=transaction_data.notes,
            is_recurring=transaction_data.is_recurring if transaction_data.is_recurring is not None else False,
            recurring_id=transaction_data.recurring_id,
            transaction_metadata=transaction_data.transaction_metadata,
        )
        
        db.add(transaction)
        await db.commit()
        await db.refresh(transaction)
        
        logger.info(f"Transaction created: {transaction.id} by user {current_user.id}")
        
        return TransactionResponse.model_validate(transaction)
    except HTTPException:
        await db.rollback()
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error creating transaction: {e}", exc_info=True)
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating transaction: {str(e)}"
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
        
        # Ensure invoice_number column exists before importing
        async def ensure_invoice_number_column():
            """Ensure invoice_number column exists in transactions table"""
            try:
                # Use a separate connection for DDL operations to avoid transaction conflicts
                async with engine.begin() as conn:
                    # Check if column exists
                    result = await conn.execute(text("""
                        SELECT column_name 
                        FROM information_schema.columns 
                        WHERE table_name = 'transactions' AND column_name = 'invoice_number'
                    """))
                    column_exists = result.fetchone() is not None
                    
                    if not column_exists:
                        logger.info("Adding missing invoice_number column to transactions table...")
                        await conn.execute(text("""
                            ALTER TABLE transactions 
                            ADD COLUMN invoice_number VARCHAR(100) NULL
                        """))
                        logger.info("Successfully added invoice_number column to transactions table")
                    else:
                        logger.debug("invoice_number column already exists")
            except Exception as e:
                logger.warning(f"Error ensuring invoice_number column: {e}", exc_info=True)
                # Don't fail the import if column check fails - try to continue
        
        # Ensure column exists before processing
        await ensure_invoice_number_column()
        
        # Helper function to get field value (case-insensitive, handles accents)
        def normalize_key(key: str) -> str:
            """Normalize key by removing accents and converting to lowercase"""
            import unicodedata
            # Remove accents
            nfd = unicodedata.normalize('NFD', key.lower().strip())
            return ''.join(c for c in nfd if unicodedata.category(c) != 'Mn')
        
        def get_field_value(row_data: Dict[str, Any], possible_keys: List[str]) -> Any:
            # Normalize all keys for comparison
            normalized_row_keys = {normalize_key(k): (k, v) for k, v in row_data.items()}
            
            for key in possible_keys:
                normalized_key = normalize_key(key)
                if normalized_key in normalized_row_keys:
                    return normalized_row_keys[normalized_key][1]
            return None
        
        # Validate transaction row
        def validate_transaction(row_data: Dict[str, Any]) -> tuple[bool, Optional[str]]:
            """Validate transaction row"""
            # Check type - support both English and French column names
            transaction_type = get_field_value(row_data, [
                'type', 'type_transaction', 'revenue_expense', 'type revenu'
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
            
            # Check description - support French column names
            description = get_field_value(row_data, [
                'description', 'libelle', 'libellé', 'description_transaction'
            ])
            if not description:
                return False, "Missing required field: description"
            
            # Check amount - support French column names (Montant HT)
            amount = get_field_value(row_data, [
                'amount', 'montant', 'montant_ht', 'montant ht'
            ])
            if not amount:
                return False, "Missing required field: amount"
            
            try:
                amount_decimal = Decimal(str(amount))
                if amount_decimal <= 0:
                    return False, "Amount must be greater than 0"
            except (ValueError, TypeError):
                return False, f"Invalid amount: {amount}"
            
            # Check transaction date - support French column names (Date Emission)
            date_str = get_field_value(row_data, [
                'transaction_date', 'date_transaction', 'date_emission', 
                'date_émission', 'date emission', 'date', 'date_operation'
            ])
            if not date_str:
                return False, "Missing required field: transaction_date"
            
            # Skip validation for default/placeholder dates like 1970-01-01
            if isinstance(date_str, str) and date_str.strip() in ['1970-01-01', '1900-01-01', '']:
                return False, f"Invalid date: {date_str} (default/placeholder date)"
            
            try:
                if isinstance(date_str, datetime):
                    pass
                elif isinstance(date_str, str):
                    for fmt in ['%Y-%m-%d', '%d/%m/%Y', '%m/%d/%Y', '%Y-%m-%d %H:%M:%S', '%d-%m-%Y']:
                        try:
                            parsed_date = datetime.strptime(date_str.strip(), fmt)
                            # Check if date is reasonable (not before 1900)
                            if parsed_date.year < 1900:
                                return False, f"Date too old: {date_str}"
                            break
                        except ValueError:
                            continue
                    else:
                        return False, f"Invalid date format: {date_str}"
            except Exception as e:
                return False, f"Invalid date: {date_str} - {str(e)}"
            
            return True, None
        
        # Import data
        logger.info(f"Importing {format_type} file, size: {len(file_content)} bytes")
        
        if format_type == 'excel':
            result = ImportService.import_from_excel(
                file_content=file_content,
                has_headers=True,
                validator=validate_transaction
            )
        else:  # CSV
            # Try different encodings and delimiters
            result = None
            encodings = ['utf-8', 'utf-8-sig', 'latin-1', 'cp1252']
            delimiters = [',', ';', '\t']
            
            for encoding in encodings:
                for delimiter in delimiters:
                    try:
                        logger.info(f"Trying CSV import with encoding={encoding}, delimiter={repr(delimiter)}")
                        test_result = ImportService.import_from_csv(
                            file_content=file_content,
                            encoding=encoding,
                            delimiter=delimiter,
                            has_headers=True,
                            validator=validate_transaction
                        )
                        if test_result['total_rows'] > 0 or len(test_result['data']) > 0:
                            result = test_result
                            logger.info(f"CSV import successful with encoding={encoding}, delimiter={repr(delimiter)}, rows={test_result['total_rows']}")
                            break
                    except Exception as e:
                        logger.warning(f"CSV import failed with encoding={encoding}, delimiter={repr(delimiter)}: {e}")
                        continue
                if result:
                    break
            
            if not result:
                # Last attempt without validator to see raw data
                logger.info("Trying CSV import without validator to check raw data")
                raw_result = ImportService.import_from_csv(
                    file_content=file_content,
                    encoding='utf-8',
                    delimiter=',',
                    has_headers=True,
                    validator=None
                )
                logger.info(f"Raw CSV data: total_rows={raw_result['total_rows']}, data_rows={len(raw_result['data'])}, first_row={raw_result['data'][0] if raw_result['data'] else None}")
                result = raw_result
        
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
        warnings = result.get('warnings', []).copy() if result.get('warnings') else []
        
        logger.info(f"Processing {len(result['data'])} valid rows from {result.get('total_rows', 0)} total rows")
        logger.info(f"Import result: {result.get('valid_rows', 0)} valid, {result.get('invalid_rows', 0)} invalid, {len(warnings)} warnings")
        
        # Log first few rows for debugging
        if result.get('data'):
            logger.info(f"First data row sample: {result['data'][0]}")
        if result.get('errors'):
            logger.warning(f"First error sample: {result['errors'][0]}")
        
        # Get or create default bank account for user (if bank_account_id is required)
        default_bank_account_id = None
        try:
            # Check if bank_account_id column exists and is required
            columns_result = await db.execute(text("""
                SELECT column_name, is_nullable
                FROM information_schema.columns
                WHERE table_name = 'transactions' AND column_name = 'bank_account_id'
            """))
            bank_account_col = columns_result.fetchone()
            
            if bank_account_col and bank_account_col[1] == 'NO':  # Column exists and is NOT NULL
                # Try to get first active bank account for user
                bank_account_result = await db.execute(
                    select(BankAccount).where(
                        and_(
                            BankAccount.user_id == current_user.id,
                            BankAccount.is_active == True
                        )
                    ).limit(1)
                )
                default_bank_account = bank_account_result.scalar_one_or_none()
                
                if default_bank_account:
                    default_bank_account_id = default_bank_account.id
                    logger.info(f"Using default bank account {default_bank_account_id} for user {current_user.id}")
                else:
                    # Create a default bank account if none exists
                    logger.info(f"No bank account found for user {current_user.id}, creating default one")
                    default_bank_account = BankAccount(
                        user_id=current_user.id,
                        name="Compte Principal",
                        account_type=BankAccountType.CHECKING,
                        currency="CAD",
                        initial_balance=0,
                        is_active=True
                    )
                    db.add(default_bank_account)
                    await db.flush()  # Flush to get the ID
                    default_bank_account_id = default_bank_account.id
                    logger.info(f"Created default bank account {default_bank_account_id} for user {current_user.id}")
        except Exception as e:
            logger.warning(f"Could not get/create bank account: {e}. Transactions will be created without bank_account_id if column is nullable.")
        
        for idx, row_data in enumerate(result['data'], start=2):  # Start at 2 (header + 1-based)
            try:
                # Get and normalize type
                transaction_type = get_field_value(row_data, ['type', 'type_transaction', 'revenue_expense'])
                type_str = str(transaction_type).lower().strip()
                if type_str in ['revenue', 'revenu', 'revenus', 'income', 'recette']:
                    final_type = TransactionType.REVENUE
                else:
                    final_type = TransactionType.EXPENSE
                
                # Get required fields - support French column names
                description = str(get_field_value(row_data, ['description', 'libelle', 'libellé']))
                amount = Decimal(str(get_field_value(row_data, ['amount', 'montant', 'montant_ht', 'montant ht'])))
                
                # Parse transaction date - support French column names
                date_str = get_field_value(row_data, [
                    'transaction_date', 'date_transaction', 'date_emission', 'date emission', 
                    'date_émission', 'date', 'date_operation'
                ])
                transaction_date = None
                if isinstance(date_str, datetime):
                    transaction_date = date_str
                elif date_str:
                    date_str_clean = str(date_str).strip()
                    # Skip placeholder dates
                    if date_str_clean not in ['1970-01-01', '1900-01-01', '']:
                        for fmt in ['%Y-%m-%d', '%d/%m/%Y', '%m/%d/%Y', '%Y-%m-%d %H:%M:%S', '%d-%m-%Y']:
                            try:
                                parsed = datetime.strptime(date_str_clean, fmt)
                                if parsed.year >= 1900:  # Skip placeholder dates
                                    transaction_date = parsed
                                    break
                            except ValueError:
                                continue
                
                # Use current date if no valid date found
                if not transaction_date:
                    transaction_date = datetime.now()
                
                # Get optional fields - support French column names
                tax_amount = get_field_value(row_data, [
                    'tax_amount', 'montant_taxes', 'montant taxes', 'taxes', 'montant taxes'
                ])
                tax_amount_decimal = Decimal(str(tax_amount)) if tax_amount else Decimal(0)
                
                currency = get_field_value(row_data, ['currency', 'devise']) or 'CAD'
                category_name = get_field_value(row_data, ['category', 'categorie', 'catégorie'])
                
                # Find or create category by name if provided
                category_id = None
                if category_name:
                    category_name_clean = str(category_name).strip()
                    # Try exact match first (case-insensitive)
                    category_result = await db.execute(
                        select(TransactionCategory).where(
                            and_(
                                TransactionCategory.user_id == current_user.id,
                                func.lower(TransactionCategory.name) == func.lower(category_name_clean)
                            )
                        ).limit(1)
                    )
                    category = category_result.scalar_one_or_none()
                    
                    # If not found, try partial match
                    if not category:
                        category_result = await db.execute(
                            select(TransactionCategory).where(
                                and_(
                                    TransactionCategory.user_id == current_user.id,
                                    TransactionCategory.name.ilike(f"%{category_name_clean}%")
                                )
                            ).limit(1)
                        )
                        category = category_result.scalar_one_or_none()
                    
                    # If still not found, create it automatically
                    if not category:
                        from app.models.transaction_category import TransactionType as CategoryTransactionType
                        # Map TransactionType (REVENUE/EXPENSE) to CategoryTransactionType (ENTRY/EXIT)
                        category_type = CategoryTransactionType.EXIT if final_type == TransactionType.EXPENSE else CategoryTransactionType.ENTRY
                        
                        new_category = TransactionCategory(
                            user_id=current_user.id,
                            name=category_name_clean,
                            type=category_type,
                            is_active=True
                        )
                        db.add(new_category)
                        await db.flush()
                        await db.refresh(new_category)
                        category = new_category
                        logger.info(f"Auto-created category '{category_name_clean}' (type: {category_type.value}) for user {current_user.id}")
                    
                    if category:
                        category_id = category.id
                
                # Parse dates - support French column names
                expected_payment_date = None
                expected_date_str = get_field_value(row_data, [
                    'expected_payment_date', 'date_reception_prevue', 'date reception prevue',
                    'date_prevue', 'date prevue', 'date_reception_prévue'
                ])
                if expected_date_str and str(expected_date_str).strip() not in ['1970-01-01', '1900-01-01', '']:
                    if isinstance(expected_date_str, datetime):
                        expected_payment_date = expected_date_str
                    else:
                        for fmt in ['%Y-%m-%d', '%d/%m/%Y', '%m/%d/%Y', '%d-%m-%Y']:
                            try:
                                parsed = datetime.strptime(str(expected_date_str).strip(), fmt)
                                if parsed.year >= 1900:  # Skip placeholder dates
                                    expected_payment_date = parsed
                                    break
                            except ValueError:
                                continue
                
                payment_date = None
                payment_date_str = get_field_value(row_data, [
                    'payment_date', 'date_reception_reelle', 'date reception reelle',
                    'date_reelle', 'date reelle', 'date_paiement', 'date paiement'
                ])
                if payment_date_str and str(payment_date_str).strip() not in ['1970-01-01', '1900-01-01', '']:
                    if isinstance(payment_date_str, datetime):
                        payment_date = payment_date_str
                    else:
                        for fmt in ['%Y-%m-%d', '%d/%m/%Y', '%m/%d/%Y', '%d-%m-%Y']:
                            try:
                                parsed = datetime.strptime(str(payment_date_str).strip(), fmt)
                                if parsed.year >= 1900:  # Skip placeholder dates
                                    payment_date = parsed
                                    break
                            except ValueError:
                                continue
                
                # Get status - support French column names
                status_str = get_field_value(row_data, ['status', 'statut', 'etat'])
                if status_str:
                    status_lower = str(status_str).lower().strip()
                    if status_lower in ['paid', 'paye', 'payé', 'recu', 'reçu', 'payée']:
                        transaction_status = TransactionStatus.PAID
                    elif status_lower in ['cancelled', 'annule', 'annulé', 'annulée']:
                        transaction_status = TransactionStatus.CANCELLED
                    else:
                        transaction_status = TransactionStatus.PENDING
                else:
                    transaction_status = TransactionStatus.PENDING
                
                # Get client/supplier - support French column names
                client_name = None
                supplier_name = None
                if final_type == TransactionType.REVENUE:
                    client_name = get_field_value(row_data, ['client_name', 'client', 'nom_client', 'client name'])
                else:
                    supplier_name = get_field_value(row_data, [
                        'supplier_name', 'supplier', 'fournisseur', 'nom_fournisseur',
                        'supplier name', 'nom fournisseur'
                    ])
                
                invoice_number = get_field_value(row_data, [
                    'invoice_number', 'numero_facture', 'numero facture', 
                    'facture', 'numéro_facture', 'numero de facture'
                ])
                notes = get_field_value(row_data, ['notes', 'remarques', 'commentaires'])
                
                # Detect if recurring expense - support French column names
                is_recurring_value = get_field_value(row_data, [
                    'is_recurring', 'recurring', 'recurrent', 'recurrente', 'récurrent',
                    'is_recurrent', 'recurrent_expense', 'depense_recurrente',
                    'recurrent expense', 'depense récurrente'
                ])
                # Convert to boolean (database expects boolean type)
                is_recurring = False
                if is_recurring_value:
                    recurring_str = str(is_recurring_value).lower().strip()
                    if recurring_str in ['true', '1', 'yes', 'oui', 'vrai', 'recurrent', 'recurrente', 'récurrent']:
                        is_recurring = True
                
                # Detect if invoice received (has invoice_number and is expense)
                # Factures reçues sont automatiquement identifiées par la présence d'invoice_number
                # pour une dépense
                
                # Get revenue type for revenues (stored in transaction_metadata) - support French
                transaction_metadata = None
                if final_type == TransactionType.REVENUE:
                    revenue_type = get_field_value(row_data, [
                        'revenue_type', 'type_revenu', 'type_revenue', 'type revenu',
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
                # Use .value to get the string value ("expense" or "revenue") instead of enum name
                # This ensures we send the enum value string, not the enum name
                # Convert enum to its string value to avoid PostgreSQL enum type mismatch
                if isinstance(final_type, TransactionType):
                    type_value = final_type.value  # Get "expense" or "revenue"
                else:
                    type_value = str(final_type).lower()
                
                # Ensure we're using the lowercase string value - force lowercase conversion
                type_value = str(type_value).lower().strip()
                if type_value not in ['expense', 'revenue']:
                    # Fallback: map common variations
                    if type_value in ['depense', 'dépense', 'depenses', 'dépenses', 'sortie']:
                        type_value = 'expense'
                    elif type_value in ['revenu', 'revenus', 'income', 'recette']:
                        type_value = 'revenue'
                    else:
                        # Default to expense if unclear
                        type_value = 'expense'
                
                # Double-check: ensure type_value is a plain string, not an enum
                # This is critical to avoid PostgreSQL enum type errors
                # Force conversion to lowercase string to ensure compatibility
                type_value_final = str(type_value).lower().strip()
                if type_value_final not in ['expense', 'revenue']:
                    # Last resort fallback
                    if 'expense' in type_value_final or 'depense' in type_value_final:
                        type_value_final = 'expense'
                    else:
                        type_value_final = 'revenue'
                
                # CRITICAL FIX: Force type_value_final to be a plain Python string, not an enum
                # SQLAlchemy may use enum name (EXPENSE) instead of value ("expense") if enum PostgreSQL exists
                type_value_final = str(type_value_final).lower().strip()
                if type_value_final not in ['expense', 'revenue']:
                    type_value_final = 'expense'  # Default fallback
                
                # Also convert status to string value to avoid enum issues
                status_value = transaction_status
                if isinstance(transaction_status, TransactionStatus):
                    status_value = transaction_status.value  # Get "pending", "paid", or "cancelled"
                status_value = str(status_value).lower()
                
                # Log the final values being used
                logger.debug(f"Creating transaction - type_value: '{type_value_final}' (type: {type(type_value_final)}), status: '{status_value}'")
                
                # Prepare transaction data
                transaction_data = {
                    'user_id': current_user.id,
                    'type': type_value_final,  # Plain string "expense" or "revenue" - CRITICAL to avoid enum issues
                    'description': description,
                    'amount': amount,
                    'tax_amount': tax_amount_decimal,
                    'currency': str(currency).upper()[:3],
                    'category_id': category_id,
                    'transaction_date': transaction_date,
                    'expected_payment_date': expected_payment_date,
                    'payment_date': payment_date,
                    'status': status_value,  # Plain string "pending", "paid", or "cancelled"
                    'client_name': str(client_name) if client_name else None,
                    'supplier_name': str(supplier_name) if supplier_name else None,
                    'invoice_number': str(invoice_number) if invoice_number else None,
                    'notes': str(notes) if notes else None,
                    'is_recurring': is_recurring,
                    'transaction_metadata': transaction_metadata,
                }
                
                # Add bank_account_id if available and column exists
                if default_bank_account_id is not None:
                    transaction_data['bank_account_id'] = default_bank_account_id
                
                transaction = Transaction(**transaction_data)
                
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
        
        # Log warning if no transactions were created
        if len(created_transactions) == 0:
            logger.warning(
                f"Import completed but no transactions were created. "
                f"Total rows: {result.get('total_rows', 0)}, "
                f"Valid rows: {result.get('valid_rows', 0)}, "
                f"Invalid rows: {result.get('invalid_rows', 0)}, "
                f"Errors: {len(errors)}, "
                f"Warnings: {len(result.get('warnings', []))}"
            )
        
        return {
            "success": True,
            "created_count": len(created_transactions),
            "error_count": len(errors),
            "total_rows": result.get('total_rows', 0),
            "valid_rows": result.get('valid_rows', len(created_transactions)),
            "invalid_rows": result.get('invalid_rows', len(errors)),
            "errors": errors,
            "warnings": warnings,
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
