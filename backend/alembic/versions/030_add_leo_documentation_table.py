"""add leo documentation table

Revision ID: 030_add_leo_documentation
Revises: 029_add_project_tasks
Create Date: 2025-12-30 15:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '030_add_leo_documentation'
down_revision = '029_add_project_tasks'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Upgrade database schema - create leo_documentation table if it doesn't exist"""
    from sqlalchemy import inspect
    
    bind = op.get_bind()
    inspector = inspect(bind)
    existing_tables = inspector.get_table_names()
    
    # Create leo_documentation table if it doesn't exist
    if 'leo_documentation' not in existing_tables:
        op.create_table(
            'leo_documentation',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('title', sa.String(length=255), nullable=False),
            sa.Column('content', sa.Text(), nullable=False),
            sa.Column('category', sa.Enum('general', 'erp_features', 'projects', 'commercial', 'teams', 'clients', 'procedures', 'policies', 'custom', name='documentationcategory'), nullable=False, server_default='general'),
            sa.Column('priority', sa.Enum('low', 'medium', 'high', 'critical', name='documentationpriority'), nullable=False, server_default='medium'),
            sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
            sa.Column('order', sa.Integer(), nullable=False, server_default='0'),
            sa.Column('created_by_id', sa.Integer(), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.ForeignKeyConstraint(['created_by_id'], ['users.id'], ondelete='SET NULL'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index('idx_leo_doc_category', 'leo_documentation', ['category'])
        op.create_index('idx_leo_doc_priority', 'leo_documentation', ['priority'])
        op.create_index('idx_leo_doc_is_active', 'leo_documentation', ['is_active'])
        op.create_index('idx_leo_doc_created_at', 'leo_documentation', ['created_at'])


def downgrade() -> None:
    """Downgrade database schema"""
    op.drop_index('idx_leo_doc_created_at', table_name='leo_documentation')
    op.drop_index('idx_leo_doc_is_active', table_name='leo_documentation')
    op.drop_index('idx_leo_doc_priority', table_name='leo_documentation')
    op.drop_index('idx_leo_doc_category', table_name='leo_documentation')
    op.drop_table('leo_documentation')
    
    # Drop enums
    op.execute("DROP TYPE IF EXISTS documentationpriority")
    op.execute("DROP TYPE IF EXISTS documentationcategory")
