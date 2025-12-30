"""add testimonials table

Revision ID: 048_add_testimonials
Revises: 047_add_user_id_to_employees
Create Date: 2025-12-30 20:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

# revision identifiers, used by Alembic.
revision = '048_add_testimonials'
down_revision = '047_add_user_id_to_employees'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Upgrade database schema - create testimonials table if it doesn't exist"""
    bind = op.get_bind()
    inspector = inspect(bind)
    existing_tables = inspector.get_table_names()
    
    # Create testimonials table if it doesn't exist
    if 'testimonials' not in existing_tables:
        op.create_table(
            'testimonials',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('contact_id', sa.Integer(), nullable=True),
            sa.Column('company_id', sa.Integer(), nullable=True),
            sa.Column('title', sa.String(length=255), nullable=True),
            sa.Column('testimonial_fr', sa.Text(), nullable=True),
            sa.Column('testimonial_en', sa.Text(), nullable=True),
            sa.Column('logo_url', sa.String(length=1000), nullable=True),
            sa.Column('logo_filename', sa.String(length=500), nullable=True),
            sa.Column('language', sa.String(length=10), nullable=False, server_default='fr'),
            sa.Column('is_published', sa.String(length=10), nullable=False, server_default='false'),
            sa.Column('rating', sa.Integer(), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.ForeignKeyConstraint(['contact_id'], ['contacts.id'], ondelete='SET NULL'),
            sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ondelete='SET NULL'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index('idx_testimonials_company_id', 'testimonials', ['company_id'])
        op.create_index('idx_testimonials_contact_id', 'testimonials', ['contact_id'])
        op.create_index('idx_testimonials_created_at', 'testimonials', ['created_at'])
        op.create_index('idx_testimonials_updated_at', 'testimonials', ['updated_at'])
        op.create_index('idx_testimonials_language', 'testimonials', ['language'])


def downgrade() -> None:
    """Downgrade database schema"""
    bind = op.get_bind()
    inspector = inspect(bind)
    
    if 'testimonials' not in inspector.get_table_names():
        return
    
    op.drop_index('idx_testimonials_language', table_name='testimonials')
    op.drop_index('idx_testimonials_updated_at', table_name='testimonials')
    op.drop_index('idx_testimonials_created_at', table_name='testimonials')
    op.drop_index('idx_testimonials_contact_id', table_name='testimonials')
    op.drop_index('idx_testimonials_company_id', table_name='testimonials')
    op.drop_table('testimonials')
