"""
Database migration utilities
Handles automatic schema migrations for missing columns
"""

from sqlalchemy import text
from app.core.database import engine
from app.core.logging import logger


async def ensure_theme_preference_column() -> None:
    """
    Ensure theme_preference column exists in users table.
    This is a temporary fix until proper migrations are run.
    """
    try:
        async with engine.begin() as conn:
            # Check if column exists
            result = await conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'users' AND column_name = 'theme_preference'
            """))
            
            column_exists = result.fetchone() is not None
            
            if not column_exists:
                logger.info("Adding missing theme_preference column to users table...")
                await conn.execute(text("""
                    ALTER TABLE users 
                    ADD COLUMN theme_preference VARCHAR(20) NOT NULL DEFAULT 'system'
                """))
                await conn.commit()
                logger.info("Successfully added theme_preference column")
            else:
                logger.debug("theme_preference column already exists")
    except Exception as e:
        logger.error(f"Error ensuring theme_preference column: {e}")
        # Don't raise - allow app to start even if migration fails
        # The error will be caught when trying to use the column


async def ensure_avatar_column() -> None:
    """
    Ensure avatar column exists in users table.
    This is a temporary fix until proper migrations are run.
    """
    try:
        async with engine.begin() as conn:
            # Check if column exists
            result = await conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'users' AND column_name = 'avatar'
            """))
            
            column_exists = result.fetchone() is not None
            
            if not column_exists:
                logger.info("Adding missing avatar column to users table...")
                await conn.execute(text("""
                    ALTER TABLE users 
                    ADD COLUMN avatar VARCHAR(500) NULL
                """))
                await conn.commit()
                logger.info("Successfully added avatar column")
            else:
                logger.debug("avatar column already exists")
    except Exception as e:
        logger.error(f"Error ensuring avatar column: {e}", exc_info=True)
        # Don't raise - allow app to start even if migration fails
        # The error will be caught when trying to use the column


async def ensure_transaction_currency_column() -> None:
    """
    Ensure currency column exists in transactions table.
    This is a temporary fix until proper migrations are run.
    Also handles renaming 'date' to 'transaction_date' if needed.
    """
    try:
        async with engine.begin() as conn:
            # Check if transactions table exists
            result = await conn.execute(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_name = 'transactions'
            """))
            
            table_exists = result.fetchone() is not None
            
            if not table_exists:
                logger.debug("transactions table does not exist, skipping currency column check")
                return
            
            # Check if currency column exists
            result = await conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'transactions' AND column_name = 'currency'
            """))
            
            currency_exists = result.fetchone() is not None
            
            if not currency_exists:
                logger.info("Adding missing currency column to transactions table...")
                await conn.execute(text("""
                    ALTER TABLE transactions 
                    ADD COLUMN currency VARCHAR(3) NOT NULL DEFAULT 'CAD'
                """))
                await conn.commit()
                logger.info("Successfully added currency column to transactions table")
            else:
                logger.debug("currency column already exists in transactions table")
            
            # Check if 'date' column exists and 'transaction_date' doesn't (need to rename)
            result = await conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'transactions' AND column_name IN ('date', 'transaction_date')
            """))
            
            columns = {row[0] for row in result.fetchall()}
            
            if 'date' in columns and 'transaction_date' not in columns:
                logger.info("Renaming 'date' column to 'transaction_date' in transactions table...")
                # Drop index if it exists
                try:
                    await conn.execute(text("DROP INDEX IF EXISTS idx_transactions_date"))
                except Exception:
                    pass  # Index might not exist
                
                # Rename column
                await conn.execute(text("""
                    ALTER TABLE transactions 
                    RENAME COLUMN date TO transaction_date
                """))
                
                # Recreate index with new name
                await conn.execute(text("""
                    CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date)
                """))
                
                await conn.commit()
                logger.info("Successfully renamed 'date' to 'transaction_date' in transactions table")
            elif 'transaction_date' in columns:
                logger.debug("transaction_date column already exists")
                
    except Exception as e:
        logger.error(f"Error ensuring transaction currency column: {e}", exc_info=True)
        # Don't raise - allow app to start even if migration fails
        # The error will be caught when trying to use the column
