"""ensure client_id exists in projects table

Revision ID: 053_ensure_client_id_in_projects
Revises: 052_create_expense_accounts_table
Create Date: 2025-12-31 15:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

# revision identifiers, used by Alembic.
revision = '053_ensure_client_id_in_projects'
down_revision = '052_create_expense_accounts_table'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Ensure client_id column exists in projects table"""
    bind = op.get_bind()
    inspector = inspect(bind)
    
    # Check if projects table exists
    if 'projects' not in inspector.get_table_names():
        return
    
    # Check if client_id column exists
    columns = [col['name'] for col in inspector.get_columns('projects')]
    
    if 'client_id' not in columns:
        # Add client_id column
        op.add_column('projects', sa.Column('client_id', sa.Integer(), nullable=True))
        
        # Create foreign key constraint to people table (People connected to the project)
        op.create_foreign_key(
            'fk_projects_client_id',
            'projects', 'people',
            ['client_id'], ['id'],
            ondelete='SET NULL'
        )
        
        # Create index
        op.create_index('idx_projects_client_id', 'projects', ['client_id'])
        
        print("Added client_id column to projects table")
    else:
        # Verify foreign key constraint points to people (not companies or clients)
        fk_constraints = inspector.get_foreign_keys('projects')
        for fk in fk_constraints:
            if fk['constrained_columns'] == ['client_id']:
                if fk['referred_table'] != 'people':
                    # Drop old constraint
                    op.drop_constraint(fk['name'], 'projects', type_='foreignkey', if_exists=True)
                    # Create new constraint pointing to people
                    op.create_foreign_key(
                        'fk_projects_client_id',
                        'projects', 'people',
                        ['client_id'], ['id'],
                        ondelete='SET NULL'
                    )
                    print(f"Updated client_id foreign key to point to people table")
                break


def downgrade() -> None:
    """Remove client_id column from projects table"""
    bind = op.get_bind()
    inspector = inspect(bind)
    
    if 'projects' not in inspector.get_table_names():
        return
    
    columns = [col['name'] for col in inspector.get_columns('projects')]
    
    if 'client_id' in columns:
        op.drop_index('idx_projects_client_id', table_name='projects', if_exists=True)
        op.drop_constraint('fk_projects_client_id', 'projects', type_='foreignkey', if_exists=True)
        op.drop_column('projects', 'client_id')
