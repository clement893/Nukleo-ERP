"""fix pipeline user foreign keys

Revision ID: 031_fix_pipeline_user_fkeys
Revises: 030_add_leo_documentation
Create Date: 2025-12-30 16:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '031_fix_pipeline_user_fkeys'
down_revision = '030_add_leo_documentation'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Fix foreign key types in pipelines and opportunites tables"""
    from sqlalchemy import inspect
    
    bind = op.get_bind()
    inspector = inspect(bind)
    existing_tables = inspector.get_table_names()
    
    # Fix pipelines table if it exists
    if 'pipelines' in existing_tables:
        # Check current column type
        columns = inspector.get_columns('pipelines')
        created_by_col = next((c for c in columns if c['name'] == 'created_by_id'), None)
        
        if created_by_col and isinstance(created_by_col['type'], postgresql.UUID):
            # Drop the foreign key constraint first
            op.drop_constraint('pipelines_created_by_id_fkey', 'pipelines', type_='foreignkey')
            # Alter column type from UUID to Integer
            op.execute('ALTER TABLE pipelines ALTER COLUMN created_by_id TYPE integer USING NULL')
            # Recreate the foreign key constraint
            op.create_foreign_key(
                'pipelines_created_by_id_fkey',
                'pipelines', 'users',
                ['created_by_id'], ['id'],
                ondelete='SET NULL'
            )
    
    # Fix opportunites table if it exists
    if 'opportunites' in existing_tables:
        columns = inspector.get_columns('opportunites')
        assigned_to_col = next((c for c in columns if c['name'] == 'assigned_to_id'), None)
        created_by_col = next((c for c in columns if c['name'] == 'created_by_id'), None)
        
        if assigned_to_col and isinstance(assigned_to_col['type'], postgresql.UUID):
            # Drop foreign key constraint
            op.drop_constraint('opportunites_assigned_to_id_fkey', 'opportunites', type_='foreignkey')
            # Alter column type
            op.execute('ALTER TABLE opportunites ALTER COLUMN assigned_to_id TYPE integer USING NULL')
            # Recreate foreign key
            op.create_foreign_key(
                'opportunites_assigned_to_id_fkey',
                'opportunites', 'users',
                ['assigned_to_id'], ['id'],
                ondelete='SET NULL'
            )
        
        if created_by_col and isinstance(created_by_col['type'], postgresql.UUID):
            # Drop foreign key constraint
            op.drop_constraint('opportunites_created_by_id_fkey', 'opportunites', type_='foreignkey')
            # Alter column type
            op.execute('ALTER TABLE opportunites ALTER COLUMN created_by_id TYPE integer USING NULL')
            # Recreate foreign key
            op.create_foreign_key(
                'opportunites_created_by_id_fkey',
                'opportunites', 'users',
                ['created_by_id'], ['id'],
                ondelete='SET NULL'
            )


def downgrade() -> None:
    """Downgrade database schema - convert back to UUID (not recommended)"""
    # Note: This downgrade is not recommended as it may cause data loss
    # Only included for completeness
    from sqlalchemy import inspect
    
    bind = op.get_bind()
    inspector = inspect(bind)
    existing_tables = inspector.get_table_names()
    
    if 'pipelines' in existing_tables:
        op.drop_constraint('pipelines_created_by_id_fkey', 'pipelines', type_='foreignkey')
        op.execute('ALTER TABLE pipelines ALTER COLUMN created_by_id TYPE uuid USING NULL')
        op.create_foreign_key(
            'pipelines_created_by_id_fkey',
            'pipelines', 'users',
            ['created_by_id'], ['id'],
            ondelete='SET NULL'
        )
    
    if 'opportunites' in existing_tables:
        op.drop_constraint('opportunites_assigned_to_id_fkey', 'opportunites', type_='foreignkey')
        op.drop_constraint('opportunites_created_by_id_fkey', 'opportunites', type_='foreignkey')
        op.execute('ALTER TABLE opportunites ALTER COLUMN assigned_to_id TYPE uuid USING NULL')
        op.execute('ALTER TABLE opportunites ALTER COLUMN created_by_id TYPE uuid USING NULL')
        op.create_foreign_key(
            'opportunites_assigned_to_id_fkey',
            'opportunites', 'users',
            ['assigned_to_id'], ['id'],
            ondelete='SET NULL'
        )
        op.create_foreign_key(
            'opportunites_created_by_id_fkey',
            'opportunites', 'users',
            ['created_by_id'], ['id'],
            ondelete='SET NULL'
        )
