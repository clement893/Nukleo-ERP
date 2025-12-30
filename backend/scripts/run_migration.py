"""
Script to run Alembic migrations
Can be executed via Railway CLI: railway run python scripts/run_migration.py
"""
import sys
import os

# Find the backend directory (could be . or .. depending on execution context)
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = current_dir
if os.path.basename(current_dir) == 'scripts':
    backend_dir = os.path.dirname(current_dir)
elif os.path.basename(os.path.dirname(current_dir)) == 'backend':
    backend_dir = os.path.dirname(os.path.dirname(current_dir))

# Add backend directory to path
sys.path.insert(0, backend_dir)

# Change to backend directory for alembic.ini
os.chdir(backend_dir)

from alembic.config import Config
from alembic import command
from app.core.config import settings
from app.core.logging import logger


def run_migration():
    """Run Alembic migrations"""
    try:
        # Get Alembic config
        alembic_cfg = Config("alembic.ini")
        
        # Convert asyncpg URL to psycopg2 for Alembic
        database_url = str(settings.DATABASE_URL)
        if "postgresql+asyncpg://" in database_url:
            database_url = database_url.replace("postgresql+asyncpg://", "postgresql+psycopg2://")
        elif "postgresql://" in database_url and "+" not in database_url:
            database_url = database_url.replace("postgresql://", "postgresql+psycopg2://")
        
        alembic_cfg.set_main_option("sqlalchemy.url", database_url)
        
        logger.info(f"Running migrations on database: {database_url.split('@')[1] if '@' in database_url else 'configured'}")
        print(f"Running migrations on database: {database_url.split('@')[1] if '@' in database_url else 'configured'}")
        
        # Run upgrade
        command.upgrade(alembic_cfg, "head")
        
        logger.info("✅ Migrations completed successfully")
        print("✅ Migrations completed successfully")
        return 0
    except Exception as e:
        logger.error(f"❌ Migration failed: {e}", exc_info=True)
        print(f"❌ Migration failed: {e}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    exit_code = run_migration()
    sys.exit(exit_code)
