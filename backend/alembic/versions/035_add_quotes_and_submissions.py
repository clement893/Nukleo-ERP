"""Add quotes and submissions tables

Revision ID: 035_add_quotes_and_submissions
Revises: 034_extend_companies_table
Create Date: 2025-12-30 12:30:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '035_add_quotes_and_submissions'
down_revision = '034_extend_companies_table'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Check if tables already exist
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    existing_tables = inspector.get_table_names()
    
    # Create quotes table if it doesn't exist
    if 'quotes' not in existing_tables:
        op.create_table(
            'quotes',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('quote_number', sa.String(length=50), nullable=False),
            sa.Column('company_id', sa.Integer(), nullable=True),
            sa.Column('title', sa.String(length=255), nullable=False),
            sa.Column('description', sa.Text(), nullable=True),
            sa.Column('amount', sa.Numeric(precision=10, scale=2), nullable=True),
            sa.Column('currency', sa.String(length=3), nullable=False, server_default='EUR'),
            sa.Column('status', sa.String(length=50), nullable=False, server_default='draft'),
            sa.Column('valid_until', sa.DateTime(timezone=True), nullable=True),
            sa.Column('notes', sa.Text(), nullable=True),
            sa.Column('user_id', sa.Integer(), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ondelete='SET NULL'),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index('idx_quotes_company_id', 'quotes', ['company_id'])
        op.create_index('idx_quotes_user_id', 'quotes', ['user_id'])
        op.create_index('idx_quotes_status', 'quotes', ['status'])
        op.create_index('idx_quotes_created_at', 'quotes', ['created_at'])
        op.create_index('idx_quotes_updated_at', 'quotes', ['updated_at'])
        op.create_index('idx_quotes_quote_number', 'quotes', ['quote_number'], unique=True)
    
    # Create submissions table if it doesn't exist
    if 'submissions' not in existing_tables:
        op.create_table(
            'submissions',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('submission_number', sa.String(length=50), nullable=False),
            sa.Column('company_id', sa.Integer(), nullable=True),
            sa.Column('title', sa.String(length=255), nullable=False),
            sa.Column('type', sa.String(length=50), nullable=True),
            sa.Column('description', sa.Text(), nullable=True),
            sa.Column('content', postgresql.JSON(astext_type=sa.Text()), nullable=True),
            sa.Column('status', sa.String(length=50), nullable=False, server_default='draft'),
            sa.Column('deadline', sa.DateTime(timezone=True), nullable=True),
            sa.Column('submitted_at', sa.DateTime(timezone=True), nullable=True),
            sa.Column('notes', sa.Text(), nullable=True),
            sa.Column('attachments', postgresql.JSON(astext_type=sa.Text()), nullable=True),
            sa.Column('user_id', sa.Integer(), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ondelete='SET NULL'),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index('idx_submissions_company_id', 'submissions', ['company_id'])
        op.create_index('idx_submissions_user_id', 'submissions', ['user_id'])
        op.create_index('idx_submissions_status', 'submissions', ['status'])
        op.create_index('idx_submissions_type', 'submissions', ['type'])
        op.create_index('idx_submissions_created_at', 'submissions', ['created_at'])
        op.create_index('idx_submissions_updated_at', 'submissions', ['updated_at'])
        op.create_index('idx_submissions_submission_number', 'submissions', ['submission_number'], unique=True)


def downgrade() -> None:
    # Drop indexes first
    op.drop_index('idx_submissions_submission_number', table_name='submissions')
    op.drop_index('idx_submissions_updated_at', table_name='submissions')
    op.drop_index('idx_submissions_created_at', table_name='submissions')
    op.drop_index('idx_submissions_type', table_name='submissions')
    op.drop_index('idx_submissions_status', table_name='submissions')
    op.drop_index('idx_submissions_user_id', table_name='submissions')
    op.drop_index('idx_submissions_company_id', table_name='submissions')
    
    op.drop_index('idx_quotes_quote_number', table_name='quotes')
    op.drop_index('idx_quotes_updated_at', table_name='quotes')
    op.drop_index('idx_quotes_created_at', table_name='quotes')
    op.drop_index('idx_quotes_status', table_name='quotes')
    op.drop_index('idx_quotes_user_id', table_name='quotes')
    op.drop_index('idx_quotes_company_id', table_name='quotes')
    
    # Drop tables
    op.drop_table('submissions')
    op.drop_table('quotes')
