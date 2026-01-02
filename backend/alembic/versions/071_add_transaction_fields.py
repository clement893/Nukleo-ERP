"""add transaction fields (tax_amount, client, expected_payment_date)

Revision ID: 071
Revises: 070
Create Date: 2025-01-02 18:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '071'
down_revision: Union[str, None] = '070'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add new columns to transactions table
    op.add_column('transactions', sa.Column('tax_amount', sa.Numeric(precision=10, scale=2), nullable=True, server_default='0'))
    op.add_column('transactions', sa.Column('expected_payment_date', sa.DateTime(timezone=True), nullable=True))
    op.add_column('transactions', sa.Column('client_id', sa.Integer(), nullable=True))
    op.add_column('transactions', sa.Column('client_name', sa.String(length=200), nullable=True))


def downgrade() -> None:
    op.drop_column('transactions', 'client_name')
    op.drop_column('transactions', 'client_id')
    op.drop_column('transactions', 'expected_payment_date')
    op.drop_column('transactions', 'tax_amount')
