#!/usr/bin/env python3
"""
Script to run migration 073
Adds currency column and renames date to transaction_date in transactions table
"""

import sys
import os
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from alembic.config import Config
from alembic import command
from app.core.database import engine
from sqlalchemy import inspect, text
import asyncio

async def check_schema():
    """Check current schema state"""
    async with engine.connect() as conn:
        inspector = inspect(engine.sync_engine)
        
        if 'transactions' not in inspector.get_table_names():
            print("❌ Transactions table does not exist")
            return False
        
        columns = [col['name'] for col in inspector.get_columns('transactions')]
        
        has_transaction_date = 'transaction_date' in columns
        has_date = 'date' in columns
        has_currency = 'currency' in columns
        
        print(f"\n📊 Current schema state:")
        print(f"  - transaction_date column: {'✅' if has_transaction_date else '❌'}")
        print(f"  - date column: {'⚠️  (should be renamed)' if has_date else '✅'}")
        print(f"  - currency column: {'✅' if has_currency else '❌'}")
        
        return {
            'has_transaction_date': has_transaction_date,
            'has_date': has_date,
            'has_currency': has_currency,
            'needs_migration': has_date or not has_currency
        }

async def run_migration():
    """Run migration 073"""
    print("🚀 Running migration 073...")
    
    # Check current state
    state = await check_schema()
    
    if not state['needs_migration']:
        print("✅ Schema is already up to date!")
        return
    
    # Run migration
    alembic_cfg = Config("alembic.ini")
    try:
        command.upgrade(alembic_cfg, "073")
        print("✅ Migration 073 completed successfully!")
        
        # Verify
        await check_schema()
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        raise

if __name__ == "__main__":
    asyncio.run(run_migration())
