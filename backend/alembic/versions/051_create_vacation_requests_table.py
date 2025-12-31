"""create vacation_requests table

Revision ID: 051_create_vacation_requests_table
Revises: 050_drop_clients_table
Create Date: 2025-01-27 16:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '051_create_vacation_requests_table'
down_revision = '050_drop_clients_table'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Upgrade database schema - create vacation_requests table if it doesn't exist"""
    from sqlalchemy import inspect
    
    bind = op.get_bind()
    inspector = inspect(bind)
    existing_tables = inspector.get_table_names()
    
    # Create vacation_requests table if it doesn't exist
    if 'vacation_requests' not in existing_tables:
        op.create_table(
            'vacation_requests',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('employee_id', sa.Integer(), nullable=False),
            sa.Column('start_date', sa.Date(), nullable=False),
            sa.Column('end_date', sa.Date(), nullable=False),
            sa.Column('reason', sa.Text(), nullable=True),
            sa.Column('status', sa.String(length=50), nullable=False, server_default='pending'),
            sa.Column('approved_by_id', sa.Integer(), nullable=True),
            sa.Column('approved_at', sa.DateTime(timezone=True), nullable=True),
            sa.Column('rejection_reason', sa.Text(), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.PrimaryKeyConstraint('id'),
            sa.ForeignKeyConstraint(['employee_id'], ['employees.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['approved_by_id'], ['users.id'], ondelete='SET NULL')
        )
        
        # Create indexes
        op.create_index('idx_vacation_requests_employee_id', 'vacation_requests', ['employee_id'])
        op.create_index('idx_vacation_requests_status', 'vacation_requests', ['status'])
        op.create_index('idx_vacation_requests_start_date', 'vacation_requests', ['start_date'])
        op.create_index('idx_vacation_requests_end_date', 'vacation_requests', ['end_date'])
        op.create_index('idx_vacation_requests_created_at', 'vacation_requests', ['created_at'])
        op.create_index('idx_vacation_requests_updated_at', 'vacation_requests', ['updated_at'])


def downgrade() -> None:
    """Downgrade database schema"""
    op.drop_index('idx_vacation_requests_updated_at', table_name='vacation_requests', if_exists=True)
    op.drop_index('idx_vacation_requests_created_at', table_name='vacation_requests', if_exists=True)
    op.drop_index('idx_vacation_requests_end_date', table_name='vacation_requests', if_exists=True)
    op.drop_index('idx_vacation_requests_start_date', table_name='vacation_requests', if_exists=True)
    op.drop_index('idx_vacation_requests_status', table_name='vacation_requests', if_exists=True)
    op.drop_index('idx_vacation_requests_employee_id', table_name='vacation_requests', if_exists=True)
    op.drop_table('vacation_requests')
