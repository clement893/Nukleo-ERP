"""add project tasks table

Revision ID: 029_add_project_tasks
Revises: 028_commercial_contacts
Create Date: 2025-12-30 14:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '029_add_project_tasks'
down_revision = '028_commercial_contacts'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Upgrade database schema - create project_tasks table if it doesn't exist"""
    from sqlalchemy import inspect
    
    bind = op.get_bind()
    inspector = inspect(bind)
    existing_tables = inspector.get_table_names()
    
    # Create project_tasks table if it doesn't exist
    if 'project_tasks' not in existing_tables:
        op.create_table(
            'project_tasks',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('title', sa.String(length=255), nullable=False),
            sa.Column('description', sa.Text(), nullable=True),
            sa.Column('status', sa.Enum('todo', 'in_progress', 'blocked', 'to_transfer', 'completed', name='taskstatus'), nullable=False, server_default='todo'),
            sa.Column('priority', sa.Enum('low', 'medium', 'high', 'urgent', name='taskpriority'), nullable=False, server_default='medium'),
            sa.Column('team_id', sa.Integer(), nullable=False),
            sa.Column('assignee_id', sa.Integer(), nullable=True),
            sa.Column('created_by_id', sa.Integer(), nullable=True),
            sa.Column('due_date', sa.DateTime(timezone=True), nullable=True),
            sa.Column('started_at', sa.DateTime(timezone=True), nullable=True),
            sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
            sa.Column('order', sa.Integer(), nullable=False, server_default='0'),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.ForeignKeyConstraint(['team_id'], ['teams.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['assignee_id'], ['users.id'], ondelete='SET NULL'),
            sa.ForeignKeyConstraint(['created_by_id'], ['users.id'], ondelete='SET NULL'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index('idx_project_tasks_team', 'project_tasks', ['team_id'])
        op.create_index('idx_project_tasks_assignee', 'project_tasks', ['assignee_id'])
        op.create_index('idx_project_tasks_status', 'project_tasks', ['status'])
        op.create_index('idx_project_tasks_priority', 'project_tasks', ['priority'])
        op.create_index('idx_project_tasks_created_at', 'project_tasks', ['created_at'])


def downgrade() -> None:
    """Downgrade database schema"""
    op.drop_index('idx_project_tasks_created_at', table_name='project_tasks')
    op.drop_index('idx_project_tasks_priority', table_name='project_tasks')
    op.drop_index('idx_project_tasks_status', table_name='project_tasks')
    op.drop_index('idx_project_tasks_assignee', table_name='project_tasks')
    op.drop_index('idx_project_tasks_team', table_name='project_tasks')
    op.drop_table('project_tasks')
    
    # Drop enums
    op.execute("DROP TYPE IF EXISTS taskpriority")
    op.execute("DROP TYPE IF EXISTS taskstatus")
