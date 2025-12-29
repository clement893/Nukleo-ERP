"""add calendar events table

Revision ID: 032_add_calendar_events
Revises: 031_fix_pipeline_user_foreign_keys
Create Date: 2025-12-30 22:30:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '032_add_calendar_events'
down_revision = '031_fix_pipeline_user_fkeys'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Upgrade database schema - create calendar_events table if it doesn't exist"""
    from sqlalchemy import inspect
    
    bind = op.get_bind()
    inspector = inspect(bind)
    existing_tables = inspector.get_table_names()
    
    # Create calendar_events table if it doesn't exist
    if 'calendar_events' not in existing_tables:
        op.create_table(
            'calendar_events',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('title', sa.String(length=200), nullable=False),
            sa.Column('description', sa.Text(), nullable=True),
            sa.Column('date', sa.Date(), nullable=False),
            sa.Column('end_date', sa.Date(), nullable=True),
            sa.Column('time', sa.Time(), nullable=True),
            sa.Column('type', sa.String(length=50), nullable=False, server_default='other'),
            sa.Column('location', sa.String(length=500), nullable=True),
            sa.Column('attendees', postgresql.JSON(astext_type=sa.Text()), nullable=True),
            sa.Column('color', sa.String(length=7), nullable=True, server_default='#3B82F6'),
            sa.Column('user_id', sa.Integer(), nullable=False),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index('idx_calendar_events_user_id', 'calendar_events', ['user_id'])
        op.create_index('idx_calendar_events_date', 'calendar_events', ['date'])
        op.create_index('idx_calendar_events_type', 'calendar_events', ['type'])
        op.create_index('idx_calendar_events_created_at', 'calendar_events', ['created_at'])
        op.create_index('idx_calendar_events_updated_at', 'calendar_events', ['updated_at'])


def downgrade() -> None:
    """Downgrade database schema - drop calendar_events table"""
    from sqlalchemy import inspect
    
    bind = op.get_bind()
    inspector = inspect(bind)
    existing_tables = inspector.get_table_names()
    
    if 'calendar_events' in existing_tables:
        op.drop_index('idx_calendar_events_updated_at', table_name='calendar_events')
        op.drop_index('idx_calendar_events_created_at', table_name='calendar_events')
        op.drop_index('idx_calendar_events_type', table_name='calendar_events')
        op.drop_index('idx_calendar_events_date', table_name='calendar_events')
        op.drop_index('idx_calendar_events_user_id', table_name='calendar_events')
        op.drop_table('calendar_events')
