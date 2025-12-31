"""create expense_accounts table

Revision ID: 052_create_expense_accounts_table
Revises: 051_create_vacation_requests_table
Create Date: 2025-01-27 17:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '052_create_expense_accounts_table'
down_revision = '051_create_vacation_requests_table'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Upgrade database schema - create expense_accounts table if it doesn't exist"""
    from sqlalchemy import inspect
    
    bind = op.get_bind()
    inspector = inspect(bind)
    existing_tables = inspector.get_table_names()
    
    # Create expense_accounts table if it doesn't exist
    if 'expense_accounts' not in existing_tables:
        op.create_table(
            'expense_accounts',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('employee_id', sa.Integer(), nullable=False),
            sa.Column('account_number', sa.String(length=50), nullable=False),
            sa.Column('title', sa.String(length=255), nullable=False),
            sa.Column('description', sa.Text(), nullable=True),
            sa.Column('status', sa.String(length=50), nullable=False, server_default='draft'),
            sa.Column('expense_period_start', sa.DateTime(timezone=True), nullable=True),
            sa.Column('expense_period_end', sa.DateTime(timezone=True), nullable=True),
            sa.Column('submitted_at', sa.DateTime(timezone=True), nullable=True),
            sa.Column('reviewed_at', sa.DateTime(timezone=True), nullable=True),
            sa.Column('reviewed_by_id', sa.Integer(), nullable=True),
            sa.Column('total_amount', sa.Numeric(precision=10, scale=2), nullable=False, server_default='0'),
            sa.Column('currency', sa.String(length=3), nullable=False, server_default='EUR'),
            sa.Column('review_notes', sa.Text(), nullable=True),
            sa.Column('clarification_request', sa.Text(), nullable=True),
            sa.Column('rejection_reason', sa.Text(), nullable=True),
            sa.Column('metadata', postgresql.JSON(astext_type=sa.Text()), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.PrimaryKeyConstraint('id'),
            sa.ForeignKeyConstraint(['employee_id'], ['employees.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['reviewed_by_id'], ['users.id'], ondelete='SET NULL'),
            sa.UniqueConstraint('account_number')
        )
        
        # Create indexes
        op.create_index('idx_expense_accounts_employee_id', 'expense_accounts', ['employee_id'])
        op.create_index('idx_expense_accounts_status', 'expense_accounts', ['status'])
        op.create_index('idx_expense_accounts_created_at', 'expense_accounts', ['created_at'])
        op.create_index('idx_expense_accounts_submitted_at', 'expense_accounts', ['submitted_at'])
        op.create_index('idx_expense_accounts_account_number', 'expense_accounts', ['account_number'])


def downgrade() -> None:
    """Downgrade database schema"""
    op.drop_index('idx_expense_accounts_account_number', table_name='expense_accounts', if_exists=True)
    op.drop_index('idx_expense_accounts_submitted_at', table_name='expense_accounts', if_exists=True)
    op.drop_index('idx_expense_accounts_created_at', table_name='expense_accounts', if_exists=True)
    op.drop_index('idx_expense_accounts_status', table_name='expense_accounts', if_exists=True)
    op.drop_index('idx_expense_accounts_employee_id', table_name='expense_accounts', if_exists=True)
    op.drop_table('expense_accounts')
