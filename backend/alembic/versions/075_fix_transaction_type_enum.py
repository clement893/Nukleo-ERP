"""fix transaction type enum to use varchar instead

Revision ID: 075_fix_transaction_type_enum
Revises: 074_create_project_employees_table
Create Date: 2025-01-15 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect, text
import logging

logger = logging.getLogger(__name__)

# revision identifiers, used by Alembic.
revision: str = '075_fix_transaction_type_enum'
down_revision: Union[str, None] = '074'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Fix transaction type column to use VARCHAR instead of enum"""
    bind = op.get_bind()
    inspector = inspect(bind)
    
    # Check if transactions table exists
    if 'transactions' not in inspector.get_table_names():
        return
    
    # Get column info
    columns = {col['name']: col for col in inspector.get_columns('transactions')}
    
    if 'type' not in columns:
        return
    
    type_column = columns['type']
    
    # Check if column is using an enum type
    # PostgreSQL stores enum types differently, we need to check the actual database type
    conn = bind.connection
    cursor = conn.cursor()
    
    try:
        # Check if there's an enum type for transactiontype
        cursor.execute("""
            SELECT EXISTS (
                SELECT 1 FROM pg_type WHERE typname = 'transactiontype'
            )
        """)
        enum_exists = cursor.fetchone()[0]
        
        if enum_exists:
            # Check current column type
            cursor.execute("""
                SELECT data_type, udt_name
                FROM information_schema.columns
                WHERE table_name = 'transactions' AND column_name = 'type'
            """)
            result = cursor.fetchone()
            
            if result and result[1] == 'transactiontype':
                # Column is using enum, convert to VARCHAR
                logger.info("Converting transaction.type column from enum to VARCHAR")
                
                # First, convert all existing values to lowercase strings
                cursor.execute("""
                    UPDATE transactions 
                    SET type = LOWER(type::text)
                    WHERE type IS NOT NULL
                """)
                conn.commit()
                
                # Alter column to VARCHAR
                op.execute(text("""
                    ALTER TABLE transactions 
                    ALTER COLUMN type TYPE VARCHAR(20) 
                    USING type::text
                """))
                
                logger.info("Successfully converted transaction.type to VARCHAR")
        else:
            # Check if column is already VARCHAR
            cursor.execute("""
                SELECT data_type, udt_name
                FROM information_schema.columns
                WHERE table_name = 'transactions' AND column_name = 'type'
            """)
            result = cursor.fetchone()
            
            if result and result[0] != 'character varying' and result[1] != 'varchar':
                # Convert to VARCHAR if not already
                op.execute(text("""
                    ALTER TABLE transactions 
                    ALTER COLUMN type TYPE VARCHAR(20) 
                    USING type::text
                """))
    finally:
        cursor.close()


def downgrade() -> None:
    """Downgrade - cannot easily recreate enum, so leave as VARCHAR"""
    # No downgrade needed - VARCHAR is more flexible than enum
    pass
