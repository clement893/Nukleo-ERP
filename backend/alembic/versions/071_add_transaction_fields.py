"""add transaction fields (tax_amount, client, expected_payment_date)

Revision ID: 071
Revises: 070
Create Date: 2025-01-02 18:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

# revision identifiers, used by Alembic.
revision: str = '071'
down_revision: Union[str, None] = '070'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add transaction fields (tax_amount, client, expected_payment_date) if they don't exist"""
    bind = op.get_bind()
    inspector = inspect(bind)
    
    # Check if transactions table exists
    if 'transactions' not in inspector.get_table_names():
        return
    
    # Get existing columns
    columns = [col['name'] for col in inspector.get_columns('transactions')]
    
    # Add new columns to transactions table if they don't exist
    if 'tax_amount' not in columns:
        op.add_column('transactions', sa.Column('tax_amount', sa.Numeric(precision=10, scale=2), nullable=True, server_default='0'))
    if 'expected_payment_date' not in columns:
        op.add_column('transactions', sa.Column('expected_payment_date', sa.DateTime(timezone=True), nullable=True))
    if 'client_id' not in columns:
        op.add_column('transactions', sa.Column('client_id', sa.Integer(), nullable=True))
    if 'client_name' not in columns:
        op.add_column('transactions', sa.Column('client_name', sa.String(length=200), nullable=True))
    
    # Get existing foreign keys and indexes
    foreign_keys = [fk['name'] for fk in inspector.get_foreign_keys('transactions')]
    indexes = [idx['name'] for idx in inspector.get_indexes('transactions')]
    
    # Create foreign key constraint for client_id if it doesn't exist
    if 'fk_transactions_client_id' not in foreign_keys:
        op.create_foreign_key('fk_transactions_client_id', 'transactions', 'clients', ['client_id'], ['id'], ondelete='SET NULL')
    
    # Create index for client_id if it doesn't exist
    if 'idx_transactions_client_id' not in indexes:
        op.create_index('idx_transactions_client_id', 'transactions', ['client_id'])


def downgrade() -> None:
    # Drop index and foreign key first
    op.drop_index('idx_transactions_client_id', 'transactions')
    op.drop_constraint('fk_transactions_client_id', 'transactions', type_='foreignkey')
    
    # Drop columns
    op.drop_column('transactions', 'client_name')
    op.drop_column('transactions', 'client_id')
    op.drop_column('transactions', 'expected_payment_date')
    op.drop_column('transactions', 'tax_amount')
