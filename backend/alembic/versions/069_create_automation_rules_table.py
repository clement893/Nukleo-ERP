"""create automation rules table

Revision ID: 069_automation_rules
Revises: 068_custom_widgets
Create Date: 2026-01-02 14:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '069_automation_rules'
down_revision = '068_custom_widgets'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Upgrade database schema - create automation_rules tables if they don't exist"""
    from sqlalchemy import inspect
    
    bind = op.get_bind()
    inspector = inspect(bind)
    existing_tables = inspector.get_table_names()
    
    # Create automation_rules table if it doesn't exist
    if 'automation_rules' not in existing_tables:
        op.create_table(
            'automation_rules',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('name', sa.String(length=200), nullable=False),
            sa.Column('description', sa.Text(), nullable=True),
            sa.Column('enabled', sa.Boolean(), nullable=False, server_default='true'),
            sa.Column('trigger_event', sa.String(length=100), nullable=False),
            sa.Column('trigger_conditions', postgresql.JSON, nullable=True),
            sa.Column('actions', postgresql.JSON, nullable=False),
            sa.Column('trigger_count', sa.Integer(), nullable=False, server_default='0'),
            sa.Column('last_triggered_at', sa.DateTime(timezone=True), nullable=True),
            sa.Column('user_id', sa.Integer(), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index('idx_automation_rules_enabled', 'automation_rules', ['enabled'])
        op.create_index('idx_automation_rules_trigger_event', 'automation_rules', ['trigger_event'])
        op.create_index('idx_automation_rules_user', 'automation_rules', ['user_id'])
        op.create_index('idx_automation_rules_created_at', 'automation_rules', ['created_at'])
    
    # Create automation_rule_execution_logs table if it doesn't exist
    if 'automation_rule_execution_logs' not in existing_tables:
        op.create_table(
            'automation_rule_execution_logs',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('rule_id', sa.Integer(), nullable=False),
            sa.Column('executed_at', sa.DateTime(timezone=True), nullable=False),
            sa.Column('success', sa.Boolean(), nullable=False),
            sa.Column('error_message', sa.Text(), nullable=True),
            sa.Column('execution_data', postgresql.JSON, nullable=True),
            sa.ForeignKeyConstraint(['rule_id'], ['automation_rules.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index('idx_automation_rule_logs_rule', 'automation_rule_execution_logs', ['rule_id'])
        op.create_index('idx_automation_rule_logs_executed_at', 'automation_rule_execution_logs', ['executed_at'])


def downgrade() -> None:
    """Downgrade database schema - drop automation_rules tables"""
    op.drop_index('idx_automation_rule_logs_executed_at', table_name='automation_rule_execution_logs')
    op.drop_index('idx_automation_rule_logs_rule', table_name='automation_rule_execution_logs')
    op.drop_table('automation_rule_execution_logs')
    op.drop_index('idx_automation_rules_created_at', table_name='automation_rules')
    op.drop_index('idx_automation_rules_user', table_name='automation_rules')
    op.drop_index('idx_automation_rules_trigger_event', table_name='automation_rules')
    op.drop_index('idx_automation_rules_enabled', table_name='automation_rules')
    op.drop_table('automation_rules')
