"""Add Leo conversations and messages tables

Revision ID: 038_add_leo_conversations
Revises: 037_add_quote_line_items
Create Date: 2025-01-27 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '038_add_leo_conversations'
down_revision = '037_add_quote_line_items'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Upgrade database schema - create leo_conversations and leo_messages tables"""
    from sqlalchemy import inspect
    
    bind = op.get_bind()
    inspector = inspect(bind)
    existing_tables = inspector.get_table_names()
    
    # Create leo_conversations table if it doesn't exist
    if 'leo_conversations' not in existing_tables:
        op.create_table(
            'leo_conversations',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('user_id', sa.Integer(), nullable=False),
            sa.Column('title', sa.String(length=255), nullable=False),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index('idx_leo_conv_user_id', 'leo_conversations', ['user_id'])
        op.create_index('idx_leo_conv_created_at', 'leo_conversations', ['created_at'])
        op.create_index('idx_leo_conv_updated_at', 'leo_conversations', ['updated_at'])
    
    # Create leo_messages table if it doesn't exist
    if 'leo_messages' not in existing_tables:
        op.create_table(
            'leo_messages',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('conversation_id', sa.Integer(), nullable=False),
            sa.Column('role', sa.String(length=20), nullable=False),
            sa.Column('content', sa.Text(), nullable=False),
            sa.Column('metadata', postgresql.JSON(astext_type=sa.Text()), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.ForeignKeyConstraint(['conversation_id'], ['leo_conversations.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index('idx_leo_msg_conv_id', 'leo_messages', ['conversation_id'])
        op.create_index('idx_leo_msg_created_at', 'leo_messages', ['created_at'])
        op.create_index('idx_leo_msg_role', 'leo_messages', ['role'])


def downgrade() -> None:
    """Downgrade database schema"""
    # Drop leo_messages table
    op.drop_index('idx_leo_msg_role', table_name='leo_messages')
    op.drop_index('idx_leo_msg_created_at', table_name='leo_messages')
    op.drop_index('idx_leo_msg_conv_id', table_name='leo_messages')
    op.drop_table('leo_messages')
    
    # Drop leo_conversations table
    op.drop_index('idx_leo_conv_updated_at', table_name='leo_conversations')
    op.drop_index('idx_leo_conv_created_at', table_name='leo_conversations')
    op.drop_index('idx_leo_conv_user_id', table_name='leo_conversations')
    op.drop_table('leo_conversations')
