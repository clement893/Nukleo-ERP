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
    Ensure all required columns exist in transactions table.
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
                logger.debug("transactions table does not exist, skipping column checks")
                return
            
            # Get all existing columns
            result = await conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'transactions'
            """))
            
            existing_columns = {row[0] for row in result.fetchall()}
            
            # Check and add currency column
            if 'currency' not in existing_columns:
                logger.info("Adding missing currency column to transactions table...")
                await conn.execute(text("""
                    ALTER TABLE transactions 
                    ADD COLUMN currency VARCHAR(3) NOT NULL DEFAULT 'CAD'
                """))
                logger.info("Successfully added currency column to transactions table")
            else:
                logger.debug("currency column already exists in transactions table")
            
            # Check and rename 'date' to 'transaction_date' if needed
            if 'date' in existing_columns and 'transaction_date' not in existing_columns:
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
                
                logger.info("Successfully renamed 'date' to 'transaction_date' in transactions table")
            elif 'transaction_date' in existing_columns:
                logger.debug("transaction_date column already exists")
            
            # Check and add expected_payment_date column
            if 'expected_payment_date' not in existing_columns:
                logger.info("Adding missing expected_payment_date column to transactions table...")
                await conn.execute(text("""
                    ALTER TABLE transactions 
                    ADD COLUMN expected_payment_date TIMESTAMP WITH TIME ZONE NULL
                """))
                logger.info("Successfully added expected_payment_date column to transactions table")
            else:
                logger.debug("expected_payment_date column already exists")
            
            # Check and add payment_date column
            if 'payment_date' not in existing_columns:
                logger.info("Adding missing payment_date column to transactions table...")
                await conn.execute(text("""
                    ALTER TABLE transactions 
                    ADD COLUMN payment_date TIMESTAMP WITH TIME ZONE NULL
                """))
                logger.info("Successfully added payment_date column to transactions table")
            else:
                logger.debug("payment_date column already exists")
            
            # Check and add tax_amount column
            if 'tax_amount' not in existing_columns:
                logger.info("Adding missing tax_amount column to transactions table...")
                await conn.execute(text("""
                    ALTER TABLE transactions 
                    ADD COLUMN tax_amount NUMERIC(10, 2) NULL DEFAULT 0
                """))
                logger.info("Successfully added tax_amount column to transactions table")
            else:
                logger.debug("tax_amount column already exists")
            
            # Check and add client_id column
            if 'client_id' not in existing_columns:
                logger.info("Adding missing client_id column to transactions table...")
                await conn.execute(text("""
                    ALTER TABLE transactions 
                    ADD COLUMN client_id INTEGER NULL
                """))
                logger.info("Successfully added client_id column to transactions table")
            else:
                logger.debug("client_id column already exists")
            
            # Check and add client_name column
            if 'client_name' not in existing_columns:
                logger.info("Adding missing client_name column to transactions table...")
                await conn.execute(text("""
                    ALTER TABLE transactions 
                    ADD COLUMN client_name VARCHAR(200) NULL
                """))
                logger.info("Successfully added client_name column to transactions table")
            else:
                logger.debug("client_name column already exists")
            
            # Check and add supplier_id column
            if 'supplier_id' not in existing_columns:
                logger.info("Adding missing supplier_id column to transactions table...")
                await conn.execute(text("""
                    ALTER TABLE transactions 
                    ADD COLUMN supplier_id INTEGER NULL
                """))
                logger.info("Successfully added supplier_id column to transactions table")
            else:
                logger.debug("supplier_id column already exists")
            
            # Check and add supplier_name column
            if 'supplier_name' not in existing_columns:
                logger.info("Adding missing supplier_name column to transactions table...")
                await conn.execute(text("""
                    ALTER TABLE transactions 
                    ADD COLUMN supplier_name VARCHAR(200) NULL
                """))
                logger.info("Successfully added supplier_name column to transactions table")
            else:
                logger.debug("supplier_name column already exists")
            
            await conn.commit()
                
    except Exception as e:
        logger.error(f"Error ensuring transaction columns: {e}", exc_info=True)
        # Don't raise - allow app to start even if migration fails
        # The error will be caught when trying to use the column
