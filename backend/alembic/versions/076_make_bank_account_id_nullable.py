"""make bank_account_id nullable in transactions

Revision ID: 076_make_bank_account_id_nullable
Revises: 075_fix_transaction_type_enum
Create Date: 2025-01-15 13:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect, text

# revision identifiers, used by Alembic.
revision: str = '076_make_bank_account_id_nullable'
down_revision: Union[str, None] = '075'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Make bank_account_id nullable in transactions table"""
    bind = op.get_bind()
    inspector = inspect(bind)
    
    # Check if transactions table exists
    if 'transactions' not in inspector.get_table_names():
        return
    
    # Get column info
    columns = {col['name']: col for col in inspector.get_columns('transactions')}
    
    if 'bank_account_id' not in columns:
        return
    
    bank_account_column = columns['bank_account_id']
    
    # Check if column is already nullable
    if bank_account_column['nullable']:
        return  # Already nullable, nothing to do
    
    # Make bank_account_id nullable
    # First, we need to drop the foreign key constraint if it exists
    foreign_keys = inspector.get_foreign_keys('transactions')
    fk_name = None
    for fk in foreign_keys:
        if 'bank_account_id' in fk['constrained_columns']:
            fk_name = fk['name']
            break
    
    if fk_name:
        # Drop foreign key constraint temporarily
        op.drop_constraint(fk_name, 'transactions', type_='foreignkey')
    
    # Alter column to be nullable
    op.alter_column('transactions', 'bank_account_id',
                    existing_type=sa.Integer(),
                    nullable=True)
    
    # Recreate foreign key constraint if it existed
    if fk_name:
        op.create_foreign_key(
            fk_name, 'transactions', 'bank_accounts',
            ['bank_account_id'], ['id'],
            ondelete='CASCADE'
        )


def downgrade() -> None:
    """Make bank_account_id NOT NULL again (but this may fail if NULL values exist)"""
    # Note: This downgrade may fail if there are NULL values
    # We'll make it nullable=False, but this requires all rows to have a bank_account_id
    op.alter_column('transactions', 'bank_account_id',
                    existing_type=sa.Integer(),
                    nullable=False)
