"""
Finances - Transactions Endpoints
API endpoints for managing financial transactions (revenues and expenses)
"""

from fastapi import APIRouter, Depends, Query, HTTPException, status as http_status, File, UploadFile
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func, cast, String, text
from sqlalchemy.exc import ProgrammingError
from typing import List, Optional, Dict, Any
from datetime import datetime
from decimal import Decimal
import zipfile
import os
from io import BytesIO

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
            # Support both category_id (integer) and category name (string) for backward compatibility
            try:
                category_id = int(category)
                query = query.where(Transaction.category_id == category_id)
            except ValueError:
                # If category is a string, we can't filter by category_id directly
                # This would require a join with transaction_categories table
                # For now, skip category filter if it's not a valid integer
                pass
        if start_date:
            query = query.where(Transaction.transaction_date >= start_date)
        if end_date:
            query = query.where(Transaction.transaction_date <= end_date)
        
        query = query.order_by(Transaction.transaction_date.desc())
        query = query.offset(skip).limit(limit)
        
        result = await db.execute(query)
        transactions = result.scalars().all()
        
        return [TransactionResponse.model_validate(t) for t in transactions]
    except ProgrammingError as e:
        # Check if error is about missing columns
        error_str = str(e).lower()
        if ('currency' in error_str or 'transaction_date' in error_str or 'date' in error_str) and 'does not exist' in error_str:
            logger.error(f"Transaction table schema error. Migration 073 needs to be executed: {e}", exc_info=True)
            raise HTTPException(
                status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Database schema is out of date. Please run migration 073 to update the transactions table schema (add currency column and rename date to transaction_date)."
            )
        # Re-raise other programming errors
        logger.error(f"Database programming error: {e}", exc_info=True)
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error occurred"
        )
    except Exception as e:
        logger.error(f"Error fetching transactions: {e}", exc_info=True)
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
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
                category = get_field_value(row_data, ['category', 'categorie'])
                
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
                
                # Create transaction
                transaction = Transaction(
                    user_id=current_user.id,
                    type=final_type,
                    description=description,
                    amount=amount,
                    tax_amount=tax_amount_decimal,
                    currency=str(currency).upper()[:3],
                    category=str(category) if category else None,
                    transaction_date=transaction_date,
                    expected_payment_date=expected_payment_date,
                    payment_date=payment_date,
                    status=transaction_status,
                    client_name=str(client_name) if client_name else None,
                    supplier_name=str(supplier_name) if supplier_name else None,
                    invoice_number=str(invoice_number) if invoice_number else None,
                    notes=str(notes) if notes else None,
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
                "Date Reception Reelle": "",
                "Statut": "pending",
                "Client": "Client ABC",
                "Numero Facture": "FAC-2025-001",
                "Categorie": "Ventes",
                "Notes": "Premier paiement"
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
                "Notes": "Commande urgente"
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
                            "Statut", "Client", "Fournisseur", "Numero Facture", "Categorie", "Notes"],
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
- Numero Facture: Numéro de facture
- Categorie: Catégorie de la transaction
- Notes: Notes supplémentaires

FORMATS DE DATE ACCEPTÉS
------------------------
- YYYY-MM-DD (ex: 2025-01-15)
- DD/MM/YYYY (ex: 15/01/2025)
- MM/DD/YYYY (ex: 01/15/2025)

EXEMPLES
--------
revenue,"Vente services",1000.00,150.00,CAD,2025-01-15,2025-01-30,,pending,"Client ABC",,FAC-001,Ventes,"Premier paiement"
expense,"Fournitures",500.00,75.00,CAD,2025-01-16,2025-01-20,,pending,,"Fournisseur XYZ",INV-001,Fournitures,"Commande urgente"

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
                        "Statut", "Client", "Fournisseur", "Numero Facture", "Categorie", "Notes"],
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
                        "Statut", "Client", "Fournisseur", "Numero Facture", "Categorie", "Notes"],
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
