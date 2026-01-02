"""create custom widgets table

Revision ID: 068_custom_widgets
Revises: 067_finance_invoices
Create Date: 2026-01-02 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '068_custom_widgets'
down_revision = '067_finance_invoices'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Upgrade database schema - create custom_widgets table if it doesn't exist"""
    from sqlalchemy import inspect
    
    bind = op.get_bind()
    inspector = inspect(bind)
    existing_tables = inspector.get_table_names()
    
    # Create custom_widgets table if it doesn't exist
    if 'custom_widgets' not in existing_tables:
        op.create_table(
            'custom_widgets',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('user_id', sa.Integer(), nullable=False),
            sa.Column('name', sa.String(length=255), nullable=False),
            sa.Column('description', sa.Text(), nullable=True),
            sa.Column('type', sa.String(length=50), nullable=False),
            sa.Column('config', postgresql.JSON, nullable=False),
            sa.Column('data_source', postgresql.JSON, nullable=True),
            sa.Column('style', postgresql.JSON, nullable=True),
            sa.Column('is_public', sa.Boolean(), nullable=False, server_default='false'),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index('idx_custom_widgets_user_id', 'custom_widgets', ['user_id'])
        op.create_index('idx_custom_widgets_public', 'custom_widgets', ['is_public'])
        op.create_index('idx_custom_widgets_type', 'custom_widgets', ['type'])
        op.create_index('idx_custom_widgets_created_at', 'custom_widgets', ['created_at'])


def downgrade() -> None:
    """Downgrade database schema - drop custom_widgets table"""
    from sqlalchemy import inspect
    
    bind = op.get_bind()
    inspector = inspect(bind)
    existing_tables = inspector.get_table_names()
    
    # Drop custom_widgets table if it exists
    if 'custom_widgets' in existing_tables:
        op.drop_index('idx_custom_widgets_created_at', table_name='custom_widgets')
        op.drop_index('idx_custom_widgets_type', table_name='custom_widgets')
        op.drop_index('idx_custom_widgets_public', table_name='custom_widgets')
        op.drop_index('idx_custom_widgets_user_id', table_name='custom_widgets')
        op.drop_table('custom_widgets')
