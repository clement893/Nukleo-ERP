"""merge all migration heads

Revision ID: 078_merge_all_migration_heads
Revises: ('038_add_leo_conversations', '054_add_project_extended_fields', '077_create_project_budget_items')
Create Date: 2026-01-03 10:41:54.880087

This migration merges the three detected heads to resolve the multiple heads error.
The actual chain is linear, but the database may have an inconsistent state.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '078_merge_all_migration_heads'
down_revision: Union[str, tuple] = ('038_add_leo_conversations', '054_add_project_extended_fields', '077_create_project_budget_items')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Merge migration heads - no schema changes needed."""
    # This is a merge migration to resolve the multiple heads error
    # No actual schema changes are needed as all branches are already applied
    pass


def downgrade() -> None:
    """Merge migration heads - no schema changes needed."""
    pass

