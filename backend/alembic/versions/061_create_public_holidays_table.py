"""create public_holidays table

Revision ID: 061_create_public_holidays
Revises: 060_add_estimated_hours_capacity
Create Date: 2025-01-27 23:30:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

# revision identifiers, used by Alembic.
revision = '061_create_public_holidays'
down_revision = '060_add_estimated_hours_capacity'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Create public_holidays table"""
    bind = op.get_bind()
    inspector = inspect(bind)
    
    if 'public_holidays' not in inspector.get_table_names():
        op.create_table(
            'public_holidays',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('name', sa.String(200), nullable=False),
            sa.Column('date', sa.Date(), nullable=False),
            sa.Column('year', sa.Integer(), nullable=True),
            sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index('idx_public_holidays_date', 'public_holidays', ['date'])
        op.create_index('idx_public_holidays_year', 'public_holidays', ['year'])
        print("Created public_holidays table")


def downgrade() -> None:
    """Drop public_holidays table"""
    op.drop_index('idx_public_holidays_year', table_name='public_holidays')
    op.drop_index('idx_public_holidays_date', table_name='public_holidays')
    op.drop_table('public_holidays')
