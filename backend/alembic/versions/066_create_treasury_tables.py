"""create treasury tables

Revision ID: 066_treasury_tables
Revises: 065_convert_task_enums
Create Date: 2025-01-15 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '066_treasury_tables'
down_revision = '065_convert_task_enums'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Upgrade database schema - create treasury tables if they don't exist"""
    from sqlalchemy import inspect
    
    bind = op.get_bind()
    inspector = inspect(bind)
    existing_tables = inspector.get_table_names()
    
    # Create transaction_categories table if it doesn't exist
    if 'transaction_categories' not in existing_tables:
        op.create_table(
            'transaction_categories',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('user_id', sa.Integer(), nullable=False),
            sa.Column('name', sa.String(length=255), nullable=False),
            sa.Column('type', sa.String(length=20), nullable=False),
            sa.Column('parent_id', sa.Integer(), nullable=True),
            sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
            sa.Column('description', sa.String(length=1000), nullable=True),
            sa.Column('color', sa.String(length=7), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['parent_id'], ['transaction_categories.id'], ondelete='SET NULL'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index('idx_transaction_categories_user_id', 'transaction_categories', ['user_id'])
        op.create_index('idx_transaction_categories_type', 'transaction_categories', ['type'])
        op.create_index('idx_transaction_categories_parent_id', 'transaction_categories', ['parent_id'])
        op.create_index('idx_transaction_categories_is_active', 'transaction_categories', ['is_active'])
    
    # Create bank_accounts table if it doesn't exist
    if 'bank_accounts' not in existing_tables:
        op.create_table(
            'bank_accounts',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('user_id', sa.Integer(), nullable=False),
            sa.Column('name', sa.String(length=255), nullable=False),
            sa.Column('account_type', sa.String(length=20), nullable=False, server_default='checking'),
            sa.Column('bank_name', sa.String(length=255), nullable=True),
            sa.Column('account_number', sa.String(length=100), nullable=True),
            sa.Column('initial_balance', sa.Numeric(18, 2), nullable=False, server_default='0'),
            sa.Column('currency', sa.String(length=3), nullable=False, server_default='CAD'),
            sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
            sa.Column('notes', sa.String(length=1000), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index('idx_bank_accounts_user_id', 'bank_accounts', ['user_id'])
        op.create_index('idx_bank_accounts_is_active', 'bank_accounts', ['is_active'])
        op.create_index('idx_bank_accounts_created_at', 'bank_accounts', ['created_at'])
    
    # Create transactions table if it doesn't exist
    if 'transactions' not in existing_tables:
        op.create_table(
            'transactions',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('user_id', sa.Integer(), nullable=False),
            sa.Column('bank_account_id', sa.Integer(), nullable=False),
            sa.Column('type', sa.String(length=20), nullable=False),
            sa.Column('amount', sa.Numeric(18, 2), nullable=False),
            sa.Column('date', sa.DateTime(timezone=True), nullable=False),
            sa.Column('description', sa.String(length=500), nullable=False),
            sa.Column('notes', sa.Text(), nullable=True),
            sa.Column('category_id', sa.Integer(), nullable=True),
            sa.Column('status', sa.String(length=20), nullable=False, server_default='confirmed'),
            sa.Column('invoice_id', sa.Integer(), nullable=True),
            sa.Column('expense_account_id', sa.Integer(), nullable=True),
            sa.Column('project_id', sa.Integer(), nullable=True),
            sa.Column('payment_method', sa.String(length=50), nullable=True),
            sa.Column('reference_number', sa.String(length=100), nullable=True),
            sa.Column('is_recurring', sa.Boolean(), nullable=False, server_default='false'),
            sa.Column('recurring_parent_id', sa.Integer(), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['bank_account_id'], ['bank_accounts.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['category_id'], ['transaction_categories.id'], ondelete='SET NULL'),
            sa.ForeignKeyConstraint(['invoice_id'], ['invoices.id'], ondelete='SET NULL'),
            sa.ForeignKeyConstraint(['expense_account_id'], ['expense_accounts.id'], ondelete='SET NULL'),
            sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ondelete='SET NULL'),
            sa.ForeignKeyConstraint(['recurring_parent_id'], ['transactions.id'], ondelete='SET NULL'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index('idx_transactions_bank_account_id', 'transactions', ['bank_account_id'])
        op.create_index('idx_transactions_category_id', 'transactions', ['category_id'])
        op.create_index('idx_transactions_date', 'transactions', ['date'])
        op.create_index('idx_transactions_status', 'transactions', ['status'])
        op.create_index('idx_transactions_user_id', 'transactions', ['user_id'])
        op.create_index('idx_transactions_invoice_id', 'transactions', ['invoice_id'])
        op.create_index('idx_transactions_expense_account_id', 'transactions', ['expense_account_id'])
        op.create_index('idx_transactions_project_id', 'transactions', ['project_id'])
        op.create_index('idx_transactions_created_at', 'transactions', ['created_at'])


def downgrade() -> None:
    """Downgrade database schema"""
    # Drop indexes first
    op.drop_index('idx_transactions_created_at', table_name='transactions')
    op.drop_index('idx_transactions_project_id', table_name='transactions')
    op.drop_index('idx_transactions_expense_account_id', table_name='transactions')
    op.drop_index('idx_transactions_invoice_id', table_name='transactions')
    op.drop_index('idx_transactions_user_id', table_name='transactions')
    op.drop_index('idx_transactions_status', table_name='transactions')
    op.drop_index('idx_transactions_date', table_name='transactions')
    op.drop_index('idx_transactions_category_id', table_name='transactions')
    op.drop_index('idx_transactions_bank_account_id', table_name='transactions')
    op.drop_table('transactions')
    
    op.drop_index('idx_bank_accounts_created_at', table_name='bank_accounts')
    op.drop_index('idx_bank_accounts_is_active', table_name='bank_accounts')
    op.drop_index('idx_bank_accounts_user_id', table_name='bank_accounts')
    op.drop_table('bank_accounts')
    
    op.drop_index('idx_transaction_categories_is_active', table_name='transaction_categories')
    op.drop_index('idx_transaction_categories_parent_id', table_name='transaction_categories')
    op.drop_index('idx_transaction_categories_type', table_name='transaction_categories')
    op.drop_index('idx_transaction_categories_user_id', table_name='transaction_categories')
    op.drop_table('transaction_categories')
