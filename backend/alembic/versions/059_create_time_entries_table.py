"""create time_entries table

Revision ID: 059_create_time_entries
Revises: 058_add_project_id_to_tasks
Create Date: 2025-01-27 22:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

# revision identifiers, used by Alembic.
revision = '059_create_time_entries'
down_revision = '058_add_project_id_to_tasks'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Create time_entries table"""
    bind = op.get_bind()
    inspector = inspect(bind)
    
    # Check if time_entries table exists
    if 'time_entries' in inspector.get_table_names():
        print("time_entries table already exists. Skipping migration.")
        return
    
    # Create time_entries table
    op.create_table(
        'time_entries',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('duration', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('date', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('task_id', sa.Integer(), nullable=True),
        sa.Column('project_id', sa.Integer(), nullable=True),
        sa.Column('client_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['task_id'], ['project_tasks.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['client_id'], ['clients.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes
    op.create_index('idx_time_entries_user', 'time_entries', ['user_id'])
    op.create_index('idx_time_entries_task', 'time_entries', ['task_id'])
    op.create_index('idx_time_entries_project', 'time_entries', ['project_id'])
    op.create_index('idx_time_entries_client', 'time_entries', ['client_id'])
    op.create_index('idx_time_entries_date', 'time_entries', ['date'])
    op.create_index('idx_time_entries_created_at', 'time_entries', ['created_at'])


def downgrade() -> None:
    """Remove time_entries table"""
    bind = op.get_bind()
    inspector = inspect(bind)
    
    if 'time_entries' not in inspector.get_table_names():
        return
    
    # Drop indexes
    op.drop_index('idx_time_entries_created_at', table_name='time_entries')
    op.drop_index('idx_time_entries_date', table_name='time_entries')
    op.drop_index('idx_time_entries_client', table_name='time_entries')
    op.drop_index('idx_time_entries_project', table_name='time_entries')
    op.drop_index('idx_time_entries_task', table_name='time_entries')
    op.drop_index('idx_time_entries_user', table_name='time_entries')
    
    # Drop table
    op.drop_table('time_entries')
