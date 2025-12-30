"""add client and responsable to projects

Revision ID: 046_add_client_responsable_projects
Revises: 045_create_employees_table
Create Date: 2025-01-27 14:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

# revision identifiers, used by Alembic.
revision = '046_add_client_responsable_projects'
down_revision = '045_create_employees_table'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Upgrade database schema - add client_id and responsable_id to projects table"""
    bind = op.get_bind()
    inspector = inspect(bind)
    
    # Check if projects table exists
    if 'projects' not in inspector.get_table_names():
        return
    
    # Check if columns already exist
    columns = [col['name'] for col in inspector.get_columns('projects')]
    
    # Add client_id column if it doesn't exist
    if 'client_id' not in columns:
        op.add_column('projects', sa.Column('client_id', sa.Integer(), nullable=True))
        op.create_foreign_key(
            'fk_projects_client_id',
            'projects', 'companies',
            ['client_id'], ['id'],
            ondelete='SET NULL'
        )
        op.create_index('idx_projects_client_id', 'projects', ['client_id'])
    
    # Add responsable_id column if it doesn't exist
    if 'responsable_id' not in columns:
        op.add_column('projects', sa.Column('responsable_id', sa.Integer(), nullable=True))
        op.create_foreign_key(
            'fk_projects_responsable_id',
            'projects', 'employees',
            ['responsable_id'], ['id'],
            ondelete='SET NULL'
        )
        op.create_index('idx_projects_responsable_id', 'projects', ['responsable_id'])


def downgrade() -> None:
    """Downgrade database schema"""
    bind = op.get_bind()
    inspector = inspect(bind)
    
    if 'projects' not in inspector.get_table_names():
        return
    
    columns = [col['name'] for col in inspector.get_columns('projects')]
    
    # Remove responsable_id
    if 'responsable_id' in columns:
        op.drop_index('idx_projects_responsable_id', table_name='projects')
        op.drop_constraint('fk_projects_responsable_id', 'projects', type_='foreignkey')
        op.drop_column('projects', 'responsable_id')
    
    # Remove client_id
    if 'client_id' in columns:
        op.drop_index('idx_projects_client_id', table_name='projects')
        op.drop_constraint('fk_projects_client_id', 'projects', type_='foreignkey')
        op.drop_column('projects', 'client_id')
