"""add commercial contacts and companies

Revision ID: 028_commercial_contacts
Revises: 027_add_hype_modern_theme
Create Date: 2025-12-29 14:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '028_commercial_contacts'
down_revision = '027_add_hype_modern_theme'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Upgrade database schema - create tables if they don't exist"""
    from sqlalchemy import inspect
    
    bind = op.get_bind()
    inspector = inspect(bind)
    existing_tables = inspector.get_table_names()
    
    # Create companies table if it doesn't exist
    if 'companies' not in existing_tables:
        op.create_table(
            'companies',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('name', sa.String(length=255), nullable=False),
            sa.Column('description', sa.String(length=1000), nullable=True),
            sa.Column('website', sa.String(length=500), nullable=True),
            sa.Column('email', sa.String(length=255), nullable=True),
            sa.Column('phone', sa.String(length=50), nullable=True),
            sa.Column('address', sa.String(length=500), nullable=True),
            sa.Column('city', sa.String(length=100), nullable=True),
            sa.Column('country', sa.String(length=100), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index('idx_companies_name', 'companies', ['name'])
        op.create_index('idx_companies_created_at', 'companies', ['created_at'])

    # Create contacts table if it doesn't exist
    if 'contacts' not in existing_tables:
        op.create_table(
            'contacts',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('first_name', sa.String(length=100), nullable=False),
            sa.Column('last_name', sa.String(length=100), nullable=False),
            sa.Column('company_id', sa.Integer(), nullable=True),
            sa.Column('position', sa.String(length=200), nullable=True),
            sa.Column('circle', sa.String(length=50), nullable=True),
            sa.Column('linkedin', sa.String(length=500), nullable=True),
            sa.Column('photo_url', sa.String(length=1000), nullable=True),
            sa.Column('email', sa.String(length=255), nullable=True),
            sa.Column('phone', sa.String(length=50), nullable=True),
            sa.Column('city', sa.String(length=100), nullable=True),
            sa.Column('country', sa.String(length=100), nullable=True),
            sa.Column('birthday', sa.Date(), nullable=True),
            sa.Column('language', sa.String(length=10), nullable=True),
            sa.Column('employee_id', sa.Integer(), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ondelete='SET NULL'),
            sa.ForeignKeyConstraint(['employee_id'], ['users.id'], ondelete='SET NULL'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index('idx_contacts_company_id', 'contacts', ['company_id'])
        op.create_index('idx_contacts_employee_id', 'contacts', ['employee_id'])
        op.create_index('idx_contacts_circle', 'contacts', ['circle'])
        op.create_index('idx_contacts_email', 'contacts', ['email'])
        op.create_index('idx_contacts_first_name', 'contacts', ['first_name'])
        op.create_index('idx_contacts_last_name', 'contacts', ['last_name'])
        op.create_index('idx_contacts_created_at', 'contacts', ['created_at'])
        op.create_index('idx_contacts_updated_at', 'contacts', ['updated_at'])


def downgrade() -> None:
    """Downgrade database schema"""
    op.drop_index('idx_contacts_updated_at', table_name='contacts')
    op.drop_index('idx_contacts_created_at', table_name='contacts')
    op.drop_index('idx_contacts_last_name', table_name='contacts')
    op.drop_index('idx_contacts_first_name', table_name='contacts')
    op.drop_index('idx_contacts_email', table_name='contacts')
    op.drop_index('idx_contacts_circle', table_name='contacts')
    op.drop_index('idx_contacts_employee_id', table_name='contacts')
    op.drop_index('idx_contacts_company_id', table_name='contacts')
    op.drop_table('contacts')
    
    op.drop_index('idx_companies_created_at', table_name='companies')
    op.drop_index('idx_companies_name', table_name='companies')
    op.drop_table('companies')
