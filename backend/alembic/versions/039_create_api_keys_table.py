"""create api_keys table

Revision ID: 039_create_api_keys_table
Revises: 038_add_leo_conversations
Create Date: 2025-01-30 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '039_create_api_keys_table'
down_revision = '038_add_leo_conversations'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Upgrade database schema - create api_keys table if it doesn't exist"""
    from sqlalchemy import inspect
    
    bind = op.get_bind()
    inspector = inspect(bind)
    existing_tables = inspector.get_table_names()
    
    # Create api_keys table if it doesn't exist
    if 'api_keys' not in existing_tables:
        op.create_table(
            'api_keys',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('user_id', sa.Integer(), nullable=False),
            sa.Column('name', sa.String(length=200), nullable=False),
            sa.Column('description', sa.Text(), nullable=True),
            sa.Column('key_hash', sa.String(length=255), nullable=False, unique=True),
            sa.Column('key_prefix', sa.String(length=20), nullable=False),
            sa.Column('rotation_policy', sa.String(length=50), server_default='manual', nullable=False),
            sa.Column('last_rotated_at', sa.DateTime(timezone=True), nullable=True),
            sa.Column('next_rotation_at', sa.DateTime(timezone=True), nullable=True),
            sa.Column('rotation_count', sa.Integer(), server_default='0', nullable=False),
            sa.Column('last_used_at', sa.DateTime(timezone=True), nullable=True),
            sa.Column('usage_count', sa.Integer(), server_default='0', nullable=False),
            sa.Column('expires_at', sa.DateTime(timezone=True), nullable=True),
            sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
            sa.Column('revoked_at', sa.DateTime(timezone=True), nullable=True),
            sa.Column('revoked_reason', sa.Text(), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id'),
        )
        
        # Create indexes
        op.create_index('idx_api_keys_user_id', 'api_keys', ['user_id'])
        op.create_index('idx_api_keys_key_hash', 'api_keys', ['key_hash'])
        op.create_index('idx_api_keys_is_active', 'api_keys', ['is_active'])
        op.create_index('idx_api_keys_expires_at', 'api_keys', ['expires_at'])
        op.create_index('idx_api_keys_created_at', 'api_keys', ['created_at'])
    else:
        # Table exists, check and create indexes if they don't exist
        indexes = [idx['name'] for idx in inspector.get_indexes('api_keys')]
        
        if 'idx_api_keys_user_id' not in indexes:
            op.create_index('idx_api_keys_user_id', 'api_keys', ['user_id'])
        if 'idx_api_keys_key_hash' not in indexes:
            op.create_index('idx_api_keys_key_hash', 'api_keys', ['key_hash'])
        if 'idx_api_keys_is_active' not in indexes:
            op.create_index('idx_api_keys_is_active', 'api_keys', ['is_active'])
        if 'idx_api_keys_expires_at' not in indexes:
            op.create_index('idx_api_keys_expires_at', 'api_keys', ['expires_at'])
        if 'idx_api_keys_created_at' not in indexes:
            op.create_index('idx_api_keys_created_at', 'api_keys', ['created_at'])


def downgrade() -> None:
    """Downgrade database schema - drop api_keys table"""
    # Drop indexes first
    op.drop_index('idx_api_keys_created_at', table_name='api_keys')
    op.drop_index('idx_api_keys_expires_at', table_name='api_keys')
    op.drop_index('idx_api_keys_is_active', table_name='api_keys')
    op.drop_index('idx_api_keys_key_hash', table_name='api_keys')
    op.drop_index('idx_api_keys_user_id', table_name='api_keys')
    
    # Drop table
    op.drop_table('api_keys')
