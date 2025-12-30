"""Add quote line items and pricing type

Revision ID: 037_add_quote_line_items
Revises: 036_add_employee_fields
Create Date: 2025-01-01 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '037_add_quote_line_items'
down_revision = '036_add_employee_fields'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add pricing_type column to quotes table
    op.add_column('quotes', sa.Column('pricing_type', sa.String(length=20), nullable=False, server_default='fixed'))
    
    # Create quote_line_items table
    op.create_table(
        'quote_line_items',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('quote_id', sa.Integer(), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('quantity', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('unit_price', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('total_price', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('line_order', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['quote_id'], ['quotes.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_quote_line_items_quote_id', 'quote_line_items', ['quote_id'])
    op.create_index('idx_quote_line_items_created_at', 'quote_line_items', ['created_at'])


def downgrade() -> None:
    # Drop quote_line_items table
    op.drop_index('idx_quote_line_items_created_at', table_name='quote_line_items')
    op.drop_index('idx_quote_line_items_quote_id', table_name='quote_line_items')
    op.drop_table('quote_line_items')
    
    # Remove pricing_type column from quotes table
    op.drop_column('quotes', 'pricing_type')
