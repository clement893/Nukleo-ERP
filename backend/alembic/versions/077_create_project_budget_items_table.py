"""create project_budget_items table

Revision ID: 077_create_project_budget_items
Revises: 076_bank_account_nullable
Create Date: 2025-01-20 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

# revision identifiers, used by Alembic.
revision: str = '077_create_project_budget_items'
down_revision: Union[str, None] = '076_bank_account_nullable'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create project_budget_items table"""
    bind = op.get_bind()
    inspector = inspect(bind)
    
    # Check if table already exists
    if 'project_budget_items' in inspector.get_table_names():
        return
    
    # Create project_budget_items table
    op.create_table(
        'project_budget_items',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('project_id', sa.Integer(), nullable=False),
        sa.Column('category', sa.String(50), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('amount', sa.Numeric(15, 2), nullable=False),
        sa.Column('quantity', sa.Numeric(10, 2), nullable=True),
        sa.Column('unit_price', sa.Numeric(10, 2), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ondelete='CASCADE'),
    )
    
    # Create indexes
    op.create_index('idx_project_budget_items_project_id', 'project_budget_items', ['project_id'])
    op.create_index('idx_project_budget_items_category', 'project_budget_items', ['category'])
    op.create_index('idx_project_budget_items_created_at', 'project_budget_items', ['created_at'])


def downgrade() -> None:
    """Drop project_budget_items table"""
    # Drop indexes first
    op.drop_index('idx_project_budget_items_created_at', table_name='project_budget_items')
    op.drop_index('idx_project_budget_items_category', table_name='project_budget_items')
    op.drop_index('idx_project_budget_items_project_id', table_name='project_budget_items')
    
    # Drop table
    op.drop_table('project_budget_items')
