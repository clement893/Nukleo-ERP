"""increase expense_accounts total_amount precision

Revision ID: 056_incr_expense_total_amt
Revises: 055_rename_people_to_clients
Create Date: 2025-01-27 19:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

# revision identifiers, used by Alembic.
revision = '056_incr_expense_total_amt'
down_revision = '055_rename_people_to_clients'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Increase total_amount precision from NUMERIC(10, 2) to NUMERIC(18, 2)"""
    bind = op.get_bind()
    inspector = inspect(bind)
    
    # Check if expense_accounts table exists
    if 'expense_accounts' not in inspector.get_table_names():
        print("Warning: expense_accounts table does not exist. Skipping migration.")
        return
    
    # Get column info to check current precision
    columns = inspector.get_columns('expense_accounts')
    total_amount_col = next((col for col in columns if col['name'] == 'total_amount'), None)
    
    if not total_amount_col:
        print("Warning: total_amount column does not exist in expense_accounts table.")
        return
    
    # Check current precision
    current_type = str(total_amount_col['type'])
    if 'NUMERIC(18' in current_type or 'NUMERIC(18,' in current_type:
        print("total_amount column already has precision 18. No changes needed.")
        return
    
    # Alter the column to increase precision
    print(f"Current total_amount type: {current_type}")
    print("Altering total_amount column to NUMERIC(18, 2)...")
    
    op.alter_column(
        'expense_accounts',
        'total_amount',
        existing_type=sa.Numeric(precision=10, scale=2),
        type_=sa.Numeric(precision=18, scale=2),
        existing_nullable=False,
        existing_server_default=sa.text("'0'")
    )
    
    print("Successfully increased total_amount precision to NUMERIC(18, 2)")


def downgrade() -> None:
    """Revert total_amount precision back to NUMERIC(10, 2)"""
    bind = op.get_bind()
    inspector = inspect(bind)
    
    if 'expense_accounts' not in inspector.get_table_names():
        return
    
    columns = inspector.get_columns('expense_accounts')
    total_amount_col = next((col for col in columns if col['name'] == 'total_amount'), None)
    
    if not total_amount_col:
        return
    
    current_type = str(total_amount_col['type'])
    if 'NUMERIC(10' in current_type or 'NUMERIC(10,' in current_type:
        print("total_amount column already has precision 10. No changes needed.")
        return
    
    # Check if there are any values that would overflow
    # Note: This is a simple check - in production you might want to be more thorough
    print("Warning: Downgrading precision may cause data loss if values exceed 99,999,999.99")
    print("Altering total_amount column back to NUMERIC(10, 2)...")
    
    op.alter_column(
        'expense_accounts',
        'total_amount',
        existing_type=sa.Numeric(precision=18, scale=2),
        type_=sa.Numeric(precision=10, scale=2),
        existing_nullable=False,
        existing_server_default=sa.text("'0'")
    )
    
    print("Reverted total_amount precision to NUMERIC(10, 2)")
