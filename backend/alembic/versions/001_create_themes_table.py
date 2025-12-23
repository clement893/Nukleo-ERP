"""Create themes table

Revision ID: 001
Revises: 
Create Date: 2025-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    """Create themes table."""
    op.create_table(
        'themes',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('display_name', sa.String(length=200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('config', postgresql.JSON(astext_type=sa.Text()), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_by', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_themes_id'), 'themes', ['id'], unique=False)
    op.create_index(op.f('ix_themes_name'), 'themes', ['name'], unique=True)
    op.create_index(op.f('ix_themes_is_active'), 'themes', ['is_active'], unique=False)


def downgrade():
    """Drop themes table."""
    op.drop_index(op.f('ix_themes_is_active'), table_name='themes')
    op.drop_index(op.f('ix_themes_name'), table_name='themes')
    op.drop_index(op.f('ix_themes_id'), table_name='themes')
    op.drop_table('themes')

