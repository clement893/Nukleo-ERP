"""Add subscriptions, plans, and invoices tables

Revision ID: 008_add_subscriptions
Revises: 007_add_indexes
Create Date: 2025-12-21
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '008_add_subscriptions'
down_revision = '007_add_indexes'
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()

    # Check if enum types exist, create them if they don't
    # PostgreSQL enum types are created automatically by SQLAlchemy when creating tables,
    # but we need to check if they exist first to avoid errors
    with conn.connection.cursor() as cursor:
        # Check if planinterval enum exists
        cursor.execute("""
            SELECT EXISTS (
                SELECT 1 FROM pg_type WHERE typname = 'planinterval'
            )
        """)
        planinterval_exists = cursor.fetchone()[0]
        
        if not planinterval_exists:
            op.execute("CREATE TYPE planinterval AS ENUM ('MONTH', 'YEAR', 'WEEK', 'DAY')")
        
        # Check if planstatus enum exists
        cursor.execute("""
            SELECT EXISTS (
                SELECT 1 FROM pg_type WHERE typname = 'planstatus'
            )
        """)
        planstatus_exists = cursor.fetchone()[0]
        
        if not planstatus_exists:
            op.execute("CREATE TYPE planstatus AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED')")
        
        # Check if subscriptionstatus enum exists
        cursor.execute("""
            SELECT EXISTS (
                SELECT 1 FROM pg_type WHERE typname = 'subscriptionstatus'
            )
        """)
        subscriptionstatus_exists = cursor.fetchone()[0]
        
        if not subscriptionstatus_exists:
            op.execute("CREATE TYPE subscriptionstatus AS ENUM ('ACTIVE', 'CANCELED', 'PAST_DUE', 'UNPAID', 'TRIALING', 'INCOMPLETE', 'INCOMPLETE_EXPIRED')")
        
        # Check if invoicestatus enum exists
        cursor.execute("""
            SELECT EXISTS (
                SELECT 1 FROM pg_type WHERE typname = 'invoicestatus'
            )
        """)
        invoicestatus_exists = cursor.fetchone()[0]
        
        if not invoicestatus_exists:
            op.execute("CREATE TYPE invoicestatus AS ENUM ('DRAFT', 'OPEN', 'PAID', 'VOID', 'UNCOLLECTIBLE')")

    # Create plans table
    if 'plans' not in tables:
        op.create_table(
        'plans',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('amount', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('currency', sa.String(length=3), nullable=False, server_default='usd'),
        sa.Column('interval', sa.Enum('MONTH', 'YEAR', 'WEEK', 'DAY', name='planinterval'), nullable=False, server_default='MONTH'),
        sa.Column('interval_count', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('stripe_price_id', sa.String(length=255), nullable=True),
        sa.Column('stripe_product_id', sa.String(length=255), nullable=True),
        sa.Column('features', sa.Text(), nullable=True),
        sa.Column('status', sa.Enum('ACTIVE', 'INACTIVE', 'ARCHIVED', name='planstatus'), nullable=False, server_default='ACTIVE'),
        sa.Column('is_popular', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id')
        )
        op.create_index('idx_plans_stripe_id', 'plans', ['stripe_price_id'], unique=False)
        op.create_index('idx_plans_status', 'plans', ['status'], unique=False)
        op.create_index('idx_plans_interval', 'plans', ['interval'], unique=False)
        op.create_unique_constraint('uq_plans_stripe_price_id', 'plans', ['stripe_price_id'])
    else:
        # Table already exists, ensure indexes and constraints are present
        indexes = {idx['name'] for idx in inspector.get_indexes('plans')}
        if 'idx_plans_stripe_id' not in indexes:
            op.create_index('idx_plans_stripe_id', 'plans', ['stripe_price_id'], unique=False)
        if 'idx_plans_status' not in indexes:
            op.create_index('idx_plans_status', 'plans', ['status'], unique=False)
        if 'idx_plans_interval' not in indexes:
            op.create_index('idx_plans_interval', 'plans', ['interval'], unique=False)
        constraints = {c['name'] for c in inspector.get_unique_constraints('plans')}
        if 'uq_plans_stripe_price_id' not in constraints:
            op.create_unique_constraint('uq_plans_stripe_price_id', 'plans', ['stripe_price_id'])

    # Create subscriptions table
    if 'subscriptions' not in tables:
        op.create_table(
        'subscriptions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('plan_id', sa.Integer(), nullable=False),
        sa.Column('stripe_subscription_id', sa.String(length=255), nullable=True),
        sa.Column('stripe_customer_id', sa.String(length=255), nullable=True),
        sa.Column('stripe_payment_method_id', sa.String(length=255), nullable=True),
        sa.Column('status', sa.Enum('ACTIVE', 'CANCELED', 'PAST_DUE', 'UNPAID', 'TRIALING', 'INCOMPLETE', 'INCOMPLETE_EXPIRED', name='subscriptionstatus'), nullable=False, server_default='INCOMPLETE'),
        sa.Column('current_period_start', sa.DateTime(timezone=True), nullable=True),
        sa.Column('current_period_end', sa.DateTime(timezone=True), nullable=True),
        sa.Column('cancel_at_period_end', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('canceled_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('trial_start', sa.DateTime(timezone=True), nullable=True),
        sa.Column('trial_end', sa.DateTime(timezone=True), nullable=True),
        sa.Column('metadata', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['plan_id'], ['plans.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
        )
        op.create_index('idx_subscriptions_user_id', 'subscriptions', ['user_id'], unique=False)
        op.create_index('idx_subscriptions_status', 'subscriptions', ['status'], unique=False)
        op.create_index('idx_subscriptions_stripe_id', 'subscriptions', ['stripe_subscription_id'], unique=False)
        op.create_index('idx_subscriptions_current_period_end', 'subscriptions', ['current_period_end'], unique=False)
        op.create_index('idx_subscriptions_stripe_customer_id', 'subscriptions', ['stripe_customer_id'], unique=False)
        op.create_unique_constraint('uq_subscriptions_stripe_subscription_id', 'subscriptions', ['stripe_subscription_id'])
    else:
        # Table already exists, ensure indexes and constraints are present
        indexes = {idx['name'] for idx in inspector.get_indexes('subscriptions')}
        if 'idx_subscriptions_user_id' not in indexes:
            op.create_index('idx_subscriptions_user_id', 'subscriptions', ['user_id'], unique=False)
        if 'idx_subscriptions_status' not in indexes:
            op.create_index('idx_subscriptions_status', 'subscriptions', ['status'], unique=False)
        if 'idx_subscriptions_stripe_id' not in indexes:
            op.create_index('idx_subscriptions_stripe_id', 'subscriptions', ['stripe_subscription_id'], unique=False)
        if 'idx_subscriptions_current_period_end' not in indexes:
            op.create_index('idx_subscriptions_current_period_end', 'subscriptions', ['current_period_end'], unique=False)
        if 'idx_subscriptions_stripe_customer_id' not in indexes:
            op.create_index('idx_subscriptions_stripe_customer_id', 'subscriptions', ['stripe_customer_id'], unique=False)
        constraints = {c['name'] for c in inspector.get_unique_constraints('subscriptions')}
        if 'uq_subscriptions_stripe_subscription_id' not in constraints:
            op.create_unique_constraint('uq_subscriptions_stripe_subscription_id', 'subscriptions', ['stripe_subscription_id'])

    # Create invoices table
    if 'invoices' not in tables:
        op.create_table(
        'invoices',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('subscription_id', sa.Integer(), nullable=True),
        sa.Column('stripe_invoice_id', sa.String(length=255), nullable=True),
        sa.Column('stripe_payment_intent_id', sa.String(length=255), nullable=True),
        sa.Column('invoice_number', sa.String(length=100), nullable=True),
        sa.Column('amount_due', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('amount_paid', sa.Numeric(precision=10, scale=2), nullable=False, server_default='0'),
        sa.Column('currency', sa.String(length=3), nullable=False, server_default='usd'),
        sa.Column('status', sa.Enum('DRAFT', 'OPEN', 'PAID', 'VOID', 'UNCOLLECTIBLE', name='invoicestatus'), nullable=False, server_default='DRAFT'),
        sa.Column('due_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('paid_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('invoice_pdf_url', sa.String(length=500), nullable=True),
        sa.Column('hosted_invoice_url', sa.String(length=500), nullable=True),
        sa.Column('metadata', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['subscription_id'], ['subscriptions.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
        )
        op.create_index('idx_invoices_user_id', 'invoices', ['user_id'], unique=False)
        op.create_index('idx_invoices_subscription_id', 'invoices', ['subscription_id'], unique=False)
        op.create_index('idx_invoices_status', 'invoices', ['status'], unique=False)
        op.create_index('idx_invoices_stripe_id', 'invoices', ['stripe_invoice_id'], unique=False)
        op.create_index('idx_invoices_due_date', 'invoices', ['due_date'], unique=False)
        op.create_unique_constraint('uq_invoices_stripe_invoice_id', 'invoices', ['stripe_invoice_id'])
        op.create_unique_constraint('uq_invoices_invoice_number', 'invoices', ['invoice_number'])
    else:
        # Table already exists, ensure indexes and constraints are present
        indexes = {idx['name'] for idx in inspector.get_indexes('invoices')}
        if 'idx_invoices_user_id' not in indexes:
            op.create_index('idx_invoices_user_id', 'invoices', ['user_id'], unique=False)
        if 'idx_invoices_subscription_id' not in indexes:
            op.create_index('idx_invoices_subscription_id', 'invoices', ['subscription_id'], unique=False)
        if 'idx_invoices_status' not in indexes:
            op.create_index('idx_invoices_status', 'invoices', ['status'], unique=False)
        if 'idx_invoices_stripe_id' not in indexes:
            op.create_index('idx_invoices_stripe_id', 'invoices', ['stripe_invoice_id'], unique=False)
        if 'idx_invoices_due_date' not in indexes:
            op.create_index('idx_invoices_due_date', 'invoices', ['due_date'], unique=False)
        constraints = {c['name'] for c in inspector.get_unique_constraints('invoices')}
        if 'uq_invoices_stripe_invoice_id' not in constraints:
            op.create_unique_constraint('uq_invoices_stripe_invoice_id', 'invoices', ['stripe_invoice_id'])
        if 'uq_invoices_invoice_number' not in constraints:
            op.create_unique_constraint('uq_invoices_invoice_number', 'invoices', ['invoice_number'])


def downgrade() -> None:
    op.drop_table('invoices')
    op.drop_table('subscriptions')
    op.drop_table('plans')
    # Drop enums
    sa.Enum(name='invoicestatus').drop(op.get_bind(), checkfirst=True)
    sa.Enum(name='subscriptionstatus').drop(op.get_bind(), checkfirst=True)
    sa.Enum(name='planstatus').drop(op.get_bind(), checkfirst=True)
    sa.Enum(name='planinterval').drop(op.get_bind(), checkfirst=True)

