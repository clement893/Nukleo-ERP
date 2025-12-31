"""fix expense_accounts employee_id foreign key constraint (force)

Revision ID: 057_fix_exp_emp_fk_force
Revises: 056_incr_expense_total_amt
Create Date: 2025-01-27 20:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect, text

# revision identifiers, used by Alembic.
revision = '057_fix_exp_emp_fk_force'
down_revision = '056_incr_expense_total_amt'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Force fix expense_accounts.employee_id foreign key to point to employees.id instead of users.id"""
    bind = op.get_bind()
    inspector = inspect(bind)
    
    # Check if expense_accounts table exists
    if 'expense_accounts' not in inspector.get_table_names():
        print("Warning: expense_accounts table does not exist. Skipping migration.")
        return
    
    # Check if employees table exists
    if 'employees' not in inspector.get_table_names():
        print("Warning: employees table does not exist. Cannot fix foreign key constraint.")
        return
    
    # Get all foreign key constraints on expense_accounts table
    fk_constraints = inspector.get_foreign_keys('expense_accounts')
    
    # Find all employee_id foreign key constraints (there might be multiple with different names)
    employee_id_fks = []
    for fk in fk_constraints:
        if 'employee_id' in fk['constrained_columns']:
            employee_id_fks.append(fk)
    
    # Drop all employee_id foreign key constraints that point to the wrong table
    for fk in employee_id_fks:
        if fk['referred_table'] != 'employees':
            print(f"Found incorrect foreign key constraint: {fk['name']} pointing to {fk['referred_table']}")
            print(f"Dropping constraint {fk['name']}...")
            
            # Use raw SQL to drop the constraint (more reliable)
            op.execute(text(f"""
                ALTER TABLE expense_accounts 
                DROP CONSTRAINT IF EXISTS {fk['name']}
            """))
            
            print(f"Dropped constraint {fk['name']}")
    
    # Check if the correct constraint already exists
    correct_fk_exists = False
    for fk in fk_constraints:
        if 'employee_id' in fk['constrained_columns'] and fk['referred_table'] == 'employees':
            correct_fk_exists = True
            print(f"Correct foreign key constraint {fk['name']} already exists pointing to employees.id")
            break
    
    # Create the correct constraint if it doesn't exist
    if not correct_fk_exists:
        print("Creating correct foreign key constraint pointing to employees.id...")
        
        # Use raw SQL to create the constraint (more reliable)
        op.execute(text("""
            ALTER TABLE expense_accounts 
            ADD CONSTRAINT expense_accounts_employee_id_fkey 
            FOREIGN KEY (employee_id) 
            REFERENCES employees(id) 
            ON DELETE CASCADE
        """))
        
        print("Created expense_accounts.employee_id foreign key constraint pointing to employees.id")
    else:
        print("Foreign key constraint already correct. No changes needed.")


def downgrade() -> None:
    """Revert the foreign key constraint fix"""
    bind = op.get_bind()
    inspector = inspect(bind)
    
    if 'expense_accounts' not in inspector.get_table_names():
        return
    
    # Get foreign key constraints
    fk_constraints = inspector.get_foreign_keys('expense_accounts')
    
    # Find the employee_id foreign key constraint pointing to employees
    employee_id_fk = None
    for fk in fk_constraints:
        if 'employee_id' in fk['constrained_columns'] and fk['referred_table'] == 'employees':
            employee_id_fk = fk
            break
    
    if employee_id_fk:
        # Drop the correct constraint
        op.execute(text(f"""
            ALTER TABLE expense_accounts 
            DROP CONSTRAINT IF EXISTS {employee_id_fk['name']}
        """))
        print(f"Removed expense_accounts.employee_id foreign key constraint {employee_id_fk['name']}")
