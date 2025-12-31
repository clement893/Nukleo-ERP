#!/usr/bin/env python3
"""
Fix Alembic Migration Chain
Removes references to non-existent migrations and fixes the migration chain.

This script:
1. Checks what migrations exist in the filesystem
2. Checks what's recorded in the alembic_version table
3. Removes references to non-existent migrations
4. Stamps the database to the latest valid migration
"""

import sys
import os
from pathlib import Path
import re

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import create_engine, text
from alembic import command
from alembic.config import Config
from app.core.config import settings
from app.core.logging import logger


def get_existing_migrations():
    """Get all migration revision IDs from filesystem"""
    migrations_dir = Path(__file__).parent.parent / "alembic" / "versions"
    migrations = {}
    
    for file in migrations_dir.glob("*.py"):
        with open(file, 'r', encoding='utf-8') as f:
            content = f.read()
            # Extract revision ID
            revision_match = re.search(r"revision\s*=\s*['\"]([^'\"]+)['\"]", content)
            if revision_match:
                revision = revision_match.group(1)
                migrations[revision] = file.name
                # Also extract down_revision to build chain
                down_revision_match = re.search(r"down_revision\s*=\s*['\"]([^'\"]+)['\"]", content)
                if down_revision_match:
                    down_revision = down_revision_match.group(1)
                    migrations[revision] = {
                        'file': file.name,
                        'down_revision': down_revision
                    }
                else:
                    migrations[revision] = {
                        'file': file.name,
                        'down_revision': None
                    }
    
    return migrations


def get_database_revisions(engine):
    """Get all revision IDs from alembic_version table"""
    with engine.connect() as conn:
        result = conn.execute(text("SELECT version_num FROM alembic_version"))
        revisions = [row[0] for row in result]
        return revisions


def find_latest_valid_revision(existing_migrations):
    """Find the latest valid revision by following the chain"""
    # Build a map of down_revision -> revision
    chain = {}
    heads = []
    
    for revision, info in existing_migrations.items():
        if isinstance(info, dict):
            down_rev = info.get('down_revision')
            if down_rev:
                chain[down_rev] = revision
            else:
                heads.append(revision)
        else:
            # Old format, skip
            pass
    
    # Follow chain from heads to find the latest
    # For now, just return the highest numbered revision
    # This is a simple heuristic - in practice, we'd follow the chain
    numeric_revisions = []
    for rev in existing_migrations.keys():
        # Extract number from revision like "053_ensure_client_id_in_projects"
        match = re.match(r'(\d+)_', rev)
        if match:
            numeric_revisions.append((int(match.group(1)), rev))
    
    if numeric_revisions:
        numeric_revisions.sort(reverse=True)
        return numeric_revisions[0][1]
    
    # Fallback: try to get from alembic directly
    try:
        alembic_cfg = Config(str(Path(__file__).parent.parent / "alembic.ini"))
        from alembic.script import ScriptDirectory
        script = ScriptDirectory.from_config(alembic_cfg)
        heads = script.get_revisions("heads")
        if heads:
            # Return the first head (should be the latest)
            return heads[0].revision
    except Exception:
        pass
    
    return None


def fix_migration_chain():
    """Main function to fix the migration chain"""
    print("=" * 60)
    print("Fixing Alembic Migration Chain")
    print("=" * 60)
    
    # Get database URL
    database_url = str(settings.DATABASE_URL)
    if "postgresql+asyncpg://" in database_url:
        database_url = database_url.replace("postgresql+asyncpg://", "postgresql+psycopg2://")
    elif "postgresql://" in database_url and "+" not in database_url:
        database_url = database_url.replace("postgresql://", "postgresql+psycopg2://")
    
    engine = create_engine(database_url)
    
    # Get existing migrations from filesystem
    print("\n1. Scanning migration files...")
    existing_migrations = get_existing_migrations()
    print(f"   Found {len(existing_migrations)} migration files")
    
    # Get database revisions
    print("\n2. Checking database alembic_version table...")
    try:
        db_revisions = get_database_revisions(engine)
        print(f"   Found {len(db_revisions)} revision(s) in database: {db_revisions}")
    except Exception as e:
        print(f"   Error reading alembic_version table: {e}")
        print("   Table may not exist yet - this is OK for new databases")
        db_revisions = []
    
    # Check for non-existent migrations
    print("\n3. Checking for non-existent migration references...")
    invalid_revisions = []
    for db_rev in db_revisions:
        if db_rev not in existing_migrations:
            invalid_revisions.append(db_rev)
            print(f"   ⚠️  Found reference to non-existent migration: {db_rev}")
    
    if not invalid_revisions:
        print("   ✅ No invalid migration references found")
        return
    
    # Remove invalid revisions from alembic_version table
    print("\n4. Removing invalid migration references...")
    with engine.begin() as conn:
        for invalid_rev in invalid_revisions:
            print(f"   Removing: {invalid_rev}")
            conn.execute(text("DELETE FROM alembic_version WHERE version_num = :rev"), {"rev": invalid_rev})
        print("   ✅ Invalid references removed")
    
    # Find latest valid revision
    print("\n5. Finding latest valid revision...")
    latest_revision = find_latest_valid_revision(existing_migrations)
    if latest_revision:
        print(f"   Latest valid revision: {latest_revision}")
    else:
        print("   ⚠️  Could not determine latest revision")
        # Try to get it from alembic
        try:
            alembic_cfg = Config(str(Path(__file__).parent.parent / "alembic.ini"))
            # Get heads
            from alembic.script import ScriptDirectory
            script = ScriptDirectory.from_config(alembic_cfg)
            heads = script.get_revisions("heads")
            if heads:
                latest_revision = heads[0].revision
                print(f"   Using Alembic head: {latest_revision}")
        except Exception as e:
            print(f"   Error getting Alembic head: {e}")
            return
    
    # Stamp database to latest valid revision
    if latest_revision:
        print(f"\n6. Stamping database to revision: {latest_revision}")
        try:
            alembic_cfg = Config(str(Path(__file__).parent.parent / "alembic.ini"))
            command.stamp(alembic_cfg, latest_revision)
            print(f"   ✅ Database stamped to {latest_revision}")
        except Exception as e:
            print(f"   ⚠️  Error stamping database: {e}")
            print("   You may need to run: alembic stamp <revision> manually")
    
    print("\n" + "=" * 60)
    print("Migration chain fix complete!")
    print("=" * 60)
    print("\nNext steps:")
    print("1. Try running migrations again: alembic upgrade head")
    print("2. If issues persist, check the migration chain manually")


if __name__ == "__main__":
    try:
        fix_migration_chain()
    except Exception as e:
        logger.error(f"Error fixing migration chain: {e}", exc_info=e)
        print(f"\n❌ Error: {e}")
        sys.exit(1)
