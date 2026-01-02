"""create finance invoices tables

Revision ID: 067_finance_invoices
Revises: 066_treasury_tables
Create Date: 2025-01-15 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '067_finance_invoices'
down_revision = '066_treasury_tables'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Upgrade database schema - create finance invoices tables if they don't exist"""
    from sqlalchemy import inspect
    
    bind = op.get_bind()
    inspector = inspect(bind)
    existing_tables = inspector.get_table_names()
    
    # Create finance_invoices table if it doesn't exist
    if 'finance_invoices' not in existing_tables:
        op.create_table(
            'finance_invoices',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('user_id', sa.Integer(), nullable=False),
            sa.Column('project_id', sa.Integer(), nullable=True),
            sa.Column('invoice_number', sa.String(length=100), nullable=False),
            sa.Column('client_data', postgresql.JSON, nullable=False),
            sa.Column('line_items', postgresql.JSON, nullable=False),
            sa.Column('subtotal', sa.Numeric(10, 2), nullable=False, server_default='0'),
            sa.Column('tax_rate', sa.Numeric(5, 2), nullable=False, server_default='0'),
            sa.Column('tax_amount', sa.Numeric(10, 2), nullable=False, server_default='0'),
            sa.Column('total', sa.Numeric(10, 2), nullable=False, server_default='0'),
            sa.Column('amount_paid', sa.Numeric(10, 2), nullable=False, server_default='0'),
            sa.Column('amount_due', sa.Numeric(10, 2), nullable=False, server_default='0'),
            sa.Column('status', sa.Enum('DRAFT', 'SENT', 'PAID', 'PARTIAL', 'OVERDUE', 'CANCELLED', name='financeinvoicestatus'), nullable=False, server_default='DRAFT'),
            sa.Column('issue_date', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
            sa.Column('due_date', sa.DateTime(timezone=True), nullable=False),
            sa.Column('paid_date', sa.DateTime(timezone=True), nullable=True),
            sa.Column('last_reminder_date', sa.DateTime(timezone=True), nullable=True),
            sa.Column('notes', sa.Text(), nullable=True),
            sa.Column('terms', sa.Text(), nullable=True),
            sa.Column('pdf_url', sa.String(length=500), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ondelete='SET NULL'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index('idx_finance_invoices_user_id', 'finance_invoices', ['user_id'])
        op.create_index('idx_finance_invoices_project_id', 'finance_invoices', ['project_id'])
        op.create_index('idx_finance_invoices_status', 'finance_invoices', ['status'])
        op.create_index('idx_finance_invoices_invoice_number', 'finance_invoices', ['invoice_number'])
        op.create_index('idx_finance_invoices_due_date', 'finance_invoices', ['due_date'])
        op.create_index('idx_finance_invoices_issue_date', 'finance_invoices', ['issue_date'])
        op.create_unique_constraint('uq_finance_invoices_invoice_number', 'finance_invoices', ['invoice_number'])
    
    # Create finance_invoice_payments table if it doesn't exist
    if 'finance_invoice_payments' not in existing_tables:
        op.create_table(
            'finance_invoice_payments',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('invoice_id', sa.Integer(), nullable=False),
            sa.Column('amount', sa.Numeric(10, 2), nullable=False),
            sa.Column('payment_date', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
            sa.Column('payment_method', sa.String(length=50), nullable=False),
            sa.Column('reference', sa.String(length=255), nullable=True),
            sa.Column('notes', sa.Text(), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.ForeignKeyConstraint(['invoice_id'], ['finance_invoices.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index('idx_finance_invoice_payments_invoice_id', 'finance_invoice_payments', ['invoice_id'])
        op.create_index('idx_finance_invoice_payments_date', 'finance_invoice_payments', ['payment_date'])


def downgrade() -> None:
    """Downgrade database schema - drop finance invoices tables"""
    from sqlalchemy import inspect
    
    bind = op.get_bind()
    inspector = inspect(bind)
    existing_tables = inspector.get_table_names()
    
    # Drop finance_invoice_payments table if it exists
    if 'finance_invoice_payments' in existing_tables:
        op.drop_index('idx_finance_invoice_payments_date', table_name='finance_invoice_payments')
        op.drop_index('idx_finance_invoice_payments_invoice_id', table_name='finance_invoice_payments')
        op.drop_table('finance_invoice_payments')
    
    # Drop finance_invoices table if it exists
    if 'finance_invoices' in existing_tables:
        op.drop_index('idx_finance_invoices_issue_date', table_name='finance_invoices')
        op.drop_index('idx_finance_invoices_due_date', table_name='finance_invoices')
        op.drop_index('idx_finance_invoices_invoice_number', table_name='finance_invoices')
        op.drop_index('idx_finance_invoices_status', table_name='finance_invoices')
        op.drop_index('idx_finance_invoices_project_id', table_name='finance_invoices')
        op.drop_index('idx_finance_invoices_user_id', table_name='finance_invoices')
        op.drop_constraint('uq_finance_invoices_invoice_number', 'finance_invoices', type_='unique')
        op.drop_table('finance_invoices')
    
    # Drop enum type
    op.execute("DROP TYPE IF EXISTS financeinvoicestatus")
