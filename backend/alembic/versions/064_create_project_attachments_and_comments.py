"""create project attachments and comments tables

Revision ID: 064_proj_attachments_comments
Revises: 063_add_project_dates
Create Date: 2025-01-30 15:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect
from sqlalchemy.dialects.postgresql import UUID

# revision identifiers, used by Alembic.
revision = '064_proj_attachments_comments'  # Shortened to fit 32 char limit
down_revision = '063_add_project_dates'
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    existing_tables = inspector.get_table_names()
    
    # Create project_attachments table
    if 'project_attachments' not in existing_tables:
        op.create_table(
            'project_attachments',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('project_id', sa.Integer(), nullable=True),
            sa.Column('task_id', sa.Integer(), nullable=True),
            sa.Column('file_id', UUID(as_uuid=True), nullable=True),
            sa.Column('file_url', sa.String(1000), nullable=False),
            sa.Column('filename', sa.String(255), nullable=False),
            sa.Column('original_filename', sa.String(255), nullable=False),
            sa.Column('content_type', sa.String(100), nullable=False),
            sa.Column('file_size', sa.Integer(), nullable=False),
            sa.Column('description', sa.Text(), nullable=True),
            sa.Column('uploaded_by_id', sa.Integer(), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.PrimaryKeyConstraint('id'),
            sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['task_id'], ['project_tasks.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['file_id'], ['files.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['uploaded_by_id'], ['users.id'], ondelete='SET NULL'),
        )
        op.create_index('idx_project_attachments_project', 'project_attachments', ['project_id'])
        op.create_index('idx_project_attachments_task', 'project_attachments', ['task_id'])
        op.create_index('idx_project_attachments_user', 'project_attachments', ['uploaded_by_id'])
        op.create_index('idx_project_attachments_created_at', 'project_attachments', ['created_at'])
    
    # Create project_comments table
    if 'project_comments' not in existing_tables:
        op.create_table(
            'project_comments',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('project_id', sa.Integer(), nullable=True),
            sa.Column('task_id', sa.Integer(), nullable=True),
            sa.Column('content', sa.Text(), nullable=False),
            sa.Column('parent_id', sa.Integer(), nullable=True),
            sa.Column('user_id', sa.Integer(), nullable=False),
            sa.Column('is_edited', sa.Boolean(), nullable=False, server_default='false'),
            sa.Column('is_pinned', sa.Boolean(), nullable=False, server_default='false'),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.PrimaryKeyConstraint('id'),
            sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['task_id'], ['project_tasks.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['parent_id'], ['project_comments.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
        )
        op.create_index('idx_project_comments_project', 'project_comments', ['project_id'])
        op.create_index('idx_project_comments_task', 'project_comments', ['task_id'])
        op.create_index('idx_project_comments_user', 'project_comments', ['user_id'])
        op.create_index('idx_project_comments_created_at', 'project_comments', ['created_at'])
        op.create_index('idx_project_comments_parent', 'project_comments', ['parent_id'])


def downgrade() -> None:
    op.drop_index('idx_project_comments_parent', table_name='project_comments')
    op.drop_index('idx_project_comments_created_at', table_name='project_comments')
    op.drop_index('idx_project_comments_user', table_name='project_comments')
    op.drop_index('idx_project_comments_task', table_name='project_comments')
    op.drop_index('idx_project_comments_project', table_name='project_comments')
    op.drop_table('project_comments')
    
    op.drop_index('idx_project_attachments_created_at', table_name='project_attachments')
    op.drop_index('idx_project_attachments_user', table_name='project_attachments')
    op.drop_index('idx_project_attachments_task', table_name='project_attachments')
    op.drop_index('idx_project_attachments_project', table_name='project_attachments')
    op.drop_table('project_attachments')
