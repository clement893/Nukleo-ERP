"""Add employee fields (photo_url, birth_date, linkedin_url)

Revision ID: 036_add_employee_fields
Revises: 035_add_quotes_and_submissions
Create Date: 2025-01-30 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

# revision identifiers, used by Alembic.
revision: str = '036_add_employee_fields'
down_revision: Union[str, None] = '035_add_quotes_and_submissions'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Check if employees table exists
    conn = op.get_bind()
    inspector = inspect(conn)
    tables = inspector.get_table_names()
    
    if 'employees' not in tables:
        print("employees table does not exist, skipping migration")
        return
    
    # Check which columns already exist
    columns = inspector.get_columns('employees')
    existing_column_names = [col['name'] for col in columns]
    
    # Add photo_url column if it doesn't exist
    if 'photo_url' not in existing_column_names:
        op.add_column('employees', sa.Column('photo_url', sa.String(500), nullable=True))
    
    # Add birth_date column if it doesn't exist
    if 'birth_date' not in existing_column_names:
        op.add_column('employees', sa.Column('birth_date', sa.Date(), nullable=True))
    
    # Add linkedin_url column if it doesn't exist
    if 'linkedin_url' not in existing_column_names:
        op.add_column('employees', sa.Column('linkedin_url', sa.String(500), nullable=True))


def downgrade() -> None:
    # Check if employees table exists
    conn = op.get_bind()
    inspector = inspect(conn)
    tables = inspector.get_table_names()
    
    if 'employees' not in tables:
        return
    
    # Check which columns exist
    columns = inspector.get_columns('employees')
    existing_column_names = [col['name'] for col in columns]
    
    # Remove columns if they exist
    if 'linkedin_url' in existing_column_names:
        op.drop_column('employees', 'linkedin_url')
    
    if 'birth_date' in existing_column_names:
        op.drop_column('employees', 'birth_date')
    
    if 'photo_url' in existing_column_names:
        op.drop_column('employees', 'photo_url')
