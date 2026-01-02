"""create transactions table

Revision ID: 070
Revises: 069
Create Date: 2025-01-02 17:50:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy import inspect

# revision identifiers, used by Alembic.
revision: str = '070'
down_revision: Union[str, None] = '069_automation_rules'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade database schema - create transactions table and add missing columns if needed"""
    bind = op.get_bind()
    inspector = inspect(bind)
    
    # Check if transactions table already exists
    table_exists = 'transactions' in inspector.get_table_names()
    
    if not table_exists:
        # Create transactions table
        op.create_table(
            'transactions',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('user_id', sa.Integer(), nullable=False),
            sa.Column('type', sa.String(length=20), nullable=False),  # 'revenue' or 'expense'
            sa.Column('description', sa.String(length=500), nullable=False),
            sa.Column('amount', sa.Numeric(precision=10, scale=2), nullable=False),
            sa.Column('currency', sa.String(length=3), nullable=False, server_default='CAD'),
            sa.Column('category', sa.String(length=100), nullable=True),
            sa.Column('transaction_date', sa.DateTime(timezone=True), nullable=False),
            sa.Column('payment_date', sa.DateTime(timezone=True), nullable=True),
            sa.Column('status', sa.String(length=20), nullable=False, server_default='pending'),  # 'pending', 'paid', 'cancelled'
            sa.Column('supplier_id', sa.Integer(), nullable=True),
            sa.Column('supplier_name', sa.String(length=200), nullable=True),
            sa.Column('invoice_number', sa.String(length=100), nullable=True),
            sa.Column('notes', sa.Text(), nullable=True),
            sa.Column('is_recurring', sa.String(length=10), nullable=False, server_default='false'),
            sa.Column('recurring_id', sa.Integer(), nullable=True),
            sa.Column('transaction_metadata', sa.Text(), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id')
        )
    else:
        # Table exists - check and add missing columns
        columns = [col['name'] for col in inspector.get_columns('transactions')]
        
        # Required columns for migration 070
        required_columns = {
            'currency': sa.Column('currency', sa.String(length=3), nullable=False, server_default='CAD'),
            'category': sa.Column('category', sa.String(length=100), nullable=True),
            'payment_date': sa.Column('payment_date', sa.DateTime(timezone=True), nullable=True),
            'status': sa.Column('status', sa.String(length=20), nullable=False, server_default='pending'),
            'supplier_id': sa.Column('supplier_id', sa.Integer(), nullable=True),
            'supplier_name': sa.Column('supplier_name', sa.String(length=200), nullable=True),
            'invoice_number': sa.Column('invoice_number', sa.String(length=100), nullable=True),
            'notes': sa.Column('notes', sa.Text(), nullable=True),
            'is_recurring': sa.Column('is_recurring', sa.String(length=10), nullable=False, server_default='false'),
            'recurring_id': sa.Column('recurring_id', sa.Integer(), nullable=True),
            'transaction_metadata': sa.Column('transaction_metadata', sa.Text(), nullable=True),
            'created_at': sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            'updated_at': sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        }
        
        # Add missing columns
        for col_name, col_def in required_columns.items():
            if col_name not in columns:
                op.add_column('transactions', col_def)
    
    # Create indexes (check if they exist first) - do this even if table already existed
    existing_indexes = [idx['name'] for idx in inspector.get_indexes('transactions')]
    
    if 'idx_transactions_user_id' not in existing_indexes:
        op.create_index('idx_transactions_user_id', 'transactions', ['user_id'])
    if 'idx_transactions_type' not in existing_indexes:
        op.create_index('idx_transactions_type', 'transactions', ['type'])
    if 'idx_transactions_status' not in existing_indexes:
        op.create_index('idx_transactions_status', 'transactions', ['status'])
    if 'idx_transactions_date' not in existing_indexes:
        op.create_index('idx_transactions_date', 'transactions', ['transaction_date'])
    if 'idx_transactions_category' not in existing_indexes:
        op.create_index('idx_transactions_category', 'transactions', ['category'])


def downgrade() -> None:
    op.drop_index('idx_transactions_category', table_name='transactions')
    op.drop_index('idx_transactions_date', table_name='transactions')
    op.drop_index('idx_transactions_status', table_name='transactions')
    op.drop_index('idx_transactions_type', table_name='transactions')
    op.drop_index('idx_transactions_user_id', table_name='transactions')
    op.drop_table('transactions')
