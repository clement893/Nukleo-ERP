"""rename people table to clients

Revision ID: 055_rename_people_to_clients
Revises: 054_fix_expense_emp_fk
Create Date: 2025-12-31 16:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

# revision identifiers, used by Alembic.
revision = '055_rename_people_to_clients'
down_revision = '054_fix_expense_emp_fk'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Rename people table to clients and update foreign keys"""
    bind = op.get_bind()
    inspector = inspect(bind)
    
    table_names = inspector.get_table_names()
    
    # Check if clients table already exists
    if 'clients' in table_names:
        print("Clients table already exists, skipping rename")
        # Still need to update foreign keys if they point to 'people'
        if 'projects' in table_names:
            fk_constraints = inspector.get_foreign_keys('projects')
            for fk in fk_constraints:
                if fk['constrained_columns'] == ['client_id'] and fk['referred_table'] == 'people':
                    # Drop old constraint
                    op.drop_constraint(fk['name'], 'projects', type_='foreignkey', if_exists=True)
                    # Create new constraint pointing to clients
                    op.create_foreign_key(
                        'fk_projects_client_id',
                        'projects', 'clients',
                        ['client_id'], ['id'],
                        ondelete='SET NULL'
                    )
                    print("Updated projects.client_id foreign key to point to clients table")
                    break
        return
    
    # Check if people table exists
    if 'people' not in table_names:
        print("People table does not exist, skipping rename")
        return
    
    # Rename the table
    op.rename_table('people', 'clients')
    print("Renamed table 'people' to 'clients'")
    
    # Rename indexes
    try:
        op.execute("ALTER INDEX idx_people_first_name RENAME TO idx_clients_first_name")
    except Exception:
        pass
    
    try:
        op.execute("ALTER INDEX idx_people_last_name RENAME TO idx_clients_last_name")
    except Exception:
        pass
    
    try:
        op.execute("ALTER INDEX idx_people_email RENAME TO idx_clients_email")
    except Exception:
        pass
    
    try:
        op.execute("ALTER INDEX idx_people_status RENAME TO idx_clients_status")
    except Exception:
        pass
    
    try:
        op.execute("ALTER INDEX idx_people_created_at RENAME TO idx_clients_created_at")
    except Exception:
        pass
    
    try:
        op.execute("ALTER INDEX idx_people_updated_at RENAME TO idx_clients_updated_at")
    except Exception:
        pass
    
    # Update foreign key constraints that reference people table (now clients)
    # Check projects table
    if 'projects' in table_names:
        fk_constraints = inspector.get_foreign_keys('projects')
        for fk in fk_constraints:
            if fk['constrained_columns'] == ['client_id'] and fk['referred_table'] == 'people':
                # Drop old constraint
                op.drop_constraint(fk['name'], 'projects', type_='foreignkey', if_exists=True)
                # Create new constraint pointing to clients
                op.create_foreign_key(
                    'fk_projects_client_id',
                    'projects', 'clients',
                    ['client_id'], ['id'],
                    ondelete='SET NULL'
                )
                print("Updated projects.client_id foreign key to point to clients table")
                break


def downgrade() -> None:
    """Rename clients table back to people and update foreign keys"""
    bind = op.get_bind()
    inspector = inspect(bind)
    
    # Check if clients table exists
    if 'clients' not in inspector.get_table_names():
        print("Clients table does not exist, skipping rename")
        return
    
    # Update foreign key constraints that reference clients table
    # Check projects table
    if 'projects' in inspector.get_table_names():
        fk_constraints = inspector.get_foreign_keys('projects')
        for fk in fk_constraints:
            if fk['referred_table'] == 'clients':
                # Drop old constraint
                op.drop_constraint(fk['name'], 'projects', type_='foreignkey', if_exists=True)
                # Create new constraint pointing to people
                op.create_foreign_key(
                    'fk_projects_client_id',
                    'projects', 'people',
                    ['client_id'], ['id'],
                    ondelete='SET NULL'
                )
                print("Updated projects.client_id foreign key to point to people table")
                break
    
    # Rename indexes back
    try:
        op.execute("ALTER INDEX idx_clients_first_name RENAME TO idx_people_first_name")
    except Exception:
        pass
    
    try:
        op.execute("ALTER INDEX idx_clients_last_name RENAME TO idx_people_last_name")
    except Exception:
        pass
    
    try:
        op.execute("ALTER INDEX idx_clients_email RENAME TO idx_people_email")
    except Exception:
        pass
    
    try:
        op.execute("ALTER INDEX idx_clients_status RENAME TO idx_people_status")
    except Exception:
        pass
    
    try:
        op.execute("ALTER INDEX idx_clients_created_at RENAME TO idx_people_created_at")
    except Exception:
        pass
    
    try:
        op.execute("ALTER INDEX idx_clients_updated_at RENAME TO idx_people_updated_at")
    except Exception:
        pass
    
    # Rename the table back
    op.rename_table('clients', 'people')
    print("Renamed table 'clients' back to 'people'")
