"""fix expense_accounts employee_id foreign key constraint

Revision ID: 054_fix_expense_accounts_employee_id_fkey
Revises: 053_ensure_client_id_in_projects
Create Date: 2025-01-27 18:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

# revision identifiers, used by Alembic.
revision = '054_fix_expense_accounts_employee_id_fkey'
down_revision = '053_ensure_client_id_in_projects'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Fix expense_accounts.employee_id foreign key to point to employees.id instead of users.id"""
    bind = op.get_bind()
    inspector = inspect(bind)
    
    # Check if expense_accounts table exists
    if 'expense_accounts' not in inspector.get_table_names():
        return
    
    # Check if employees table exists
    if 'employees' not in inspector.get_table_names():
        print("Warning: employees table does not exist. Cannot fix foreign key constraint.")
        return
    
    # Get all foreign key constraints on expense_accounts table
    fk_constraints = inspector.get_foreign_keys('expense_accounts')
    
    # Find the employee_id foreign key constraint
    employee_id_fk = None
    for fk in fk_constraints:
        if 'employee_id' in fk['constrained_columns']:
            employee_id_fk = fk
            break
    
    if employee_id_fk:
        # Check if it points to the wrong table
        if employee_id_fk['referred_table'] != 'employees':
            print(f"Found incorrect foreign key constraint: {employee_id_fk['name']} pointing to {employee_id_fk['referred_table']}")
            print(f"Fixing to point to employees table...")
            
            # Drop the incorrect constraint
            op.drop_constraint(
                employee_id_fk['name'],
                'expense_accounts',
                type_='foreignkey',
                if_exists=True
            )
            
            # Create the correct constraint pointing to employees.id
            op.create_foreign_key(
                'expense_accounts_employee_id_fkey',
                'expense_accounts', 'employees',
                ['employee_id'], ['id'],
                ondelete='CASCADE'
            )
            
            print("Fixed expense_accounts.employee_id foreign key constraint to point to employees.id")
        else:
            print("Foreign key constraint already points to employees table. No changes needed.")
    else:
        # No constraint found, create it
        print("No employee_id foreign key constraint found. Creating new constraint...")
        op.create_foreign_key(
            'expense_accounts_employee_id_fkey',
            'expense_accounts', 'employees',
            ['employee_id'], ['id'],
            ondelete='CASCADE'
        )
        print("Created expense_accounts.employee_id foreign key constraint pointing to employees.id")


def downgrade() -> None:
    """Revert the foreign key constraint fix"""
    bind = op.get_bind()
    inspector = inspect(bind)
    
    if 'expense_accounts' not in inspector.get_table_names():
        return
    
    # Get foreign key constraints
    fk_constraints = inspector.get_foreign_keys('expense_accounts')
    
    # Find the employee_id foreign key constraint
    employee_id_fk = None
    for fk in fk_constraints:
        if 'employee_id' in fk['constrained_columns']:
            employee_id_fk = fk
            break
    
    if employee_id_fk and employee_id_fk['referred_table'] == 'employees':
        # Drop the correct constraint
        op.drop_constraint(
            employee_id_fk['name'],
            'expense_accounts',
            type_='foreignkey',
            if_exists=True
        )
        
        # Note: We don't recreate the incorrect constraint pointing to users
        # as that would be wrong. The downgrade just removes the fix.
        print("Removed expense_accounts.employee_id foreign key constraint")
