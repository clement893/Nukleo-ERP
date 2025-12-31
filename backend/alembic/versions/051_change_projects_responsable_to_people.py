"""change projects responsable_id foreign key from employees to people

Revision ID: 051_change_responsable_to_people
Revises: 050_drop_clients_table
Create Date: 2025-12-31 14:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

# revision identifiers, used by Alembic.
revision = '051_change_responsable_to_people'
down_revision = '050_drop_clients_table'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """
    Change projects.responsable_id foreign key from employees to people
    """
    bind = op.get_bind()
    inspector = inspect(bind)
    
    # Check if projects table exists
    if 'projects' not in inspector.get_table_names():
        return
    
    # Check if people table exists (should exist if People model is used)
    if 'people' not in inspector.get_table_names():
        # If people table doesn't exist, we can't proceed
        # This migration assumes people table exists
        print("⚠️  Warning: people table does not exist. Skipping migration.")
        return
    
    # Check if responsable_id column exists
    columns = [col['name'] for col in inspector.get_columns('projects')]
    if 'responsable_id' not in columns:
        print("⚠️  Warning: responsable_id column does not exist. Skipping migration.")
        return
    
    # Get foreign key constraints
    fk_constraints = inspector.get_foreign_keys('projects')
    fk_responsable = None
    for fk in fk_constraints:
        if 'responsable_id' in fk['constrained_columns']:
            fk_responsable = fk
            break
    
    # If foreign key exists and points to employees, change it to people
    if fk_responsable:
        fk_name = fk_responsable['name']
        referenced_table = fk_responsable['referred_table']
        
        if referenced_table == 'employees':
            # Drop the old foreign key constraint
            op.drop_constraint(fk_name, 'projects', type_='foreignkey')
            
            # Create new foreign key constraint pointing to people
            op.create_foreign_key(
                'fk_projects_responsable_id',
                'projects', 'people',
                ['responsable_id'], ['id'],
                ondelete='SET NULL'
            )
            print("✅ Changed projects.responsable_id foreign key from employees to people")
        elif referenced_table == 'people':
            print("✅ Foreign key already points to people table. No change needed.")
        else:
            print(f"⚠️  Warning: Foreign key points to unexpected table: {referenced_table}")
    else:
        # No foreign key constraint exists, create one
        op.create_foreign_key(
            'fk_projects_responsable_id',
            'projects', 'people',
            ['responsable_id'], ['id'],
            ondelete='SET NULL'
        )
        print("✅ Created foreign key constraint from projects.responsable_id to people.id")


def downgrade() -> None:
    """
    Change projects.responsable_id foreign key back from people to employees
    """
    bind = op.get_bind()
    inspector = inspect(bind)
    
    # Check if projects table exists
    if 'projects' not in inspector.get_table_names():
        return
    
    # Check if employees table exists
    if 'employees' not in inspector.get_table_names():
        print("⚠️  Warning: employees table does not exist. Cannot downgrade.")
        return
    
    # Get foreign key constraints
    fk_constraints = inspector.get_foreign_keys('projects')
    fk_responsable = None
    for fk in fk_constraints:
        if 'responsable_id' in fk['constrained_columns']:
            fk_responsable = fk
            break
    
    # If foreign key exists and points to people, change it back to employees
    if fk_responsable:
        fk_name = fk_responsable['name']
        referenced_table = fk_responsable['referred_table']
        
        if referenced_table == 'people':
            # Drop the foreign key constraint
            op.drop_constraint(fk_name, 'projects', type_='foreignkey')
            
            # Create foreign key constraint pointing to employees
            op.create_foreign_key(
                'fk_projects_responsable_id',
                'projects', 'employees',
                ['responsable_id'], ['id'],
                ondelete='SET NULL'
            )
            print("✅ Changed projects.responsable_id foreign key back from people to employees")
        elif referenced_table == 'employees':
            print("✅ Foreign key already points to employees table. No change needed.")
        else:
            print(f"⚠️  Warning: Foreign key points to unexpected table: {referenced_table}")
