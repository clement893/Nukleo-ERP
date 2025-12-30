#!/usr/bin/env python3
"""
Script pour vérifier et créer le pipeline MAIN si nécessaire
"""

import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import select, text
from app.core.config import settings


async def verify_and_create_main_pipeline():
    """Vérifier si le pipeline MAIN existe, sinon le créer"""
    # Ensure DATABASE_URL uses asyncpg driver
    db_url = str(settings.DATABASE_URL).strip()
    if db_url.startswith("postgresql://") and "+" not in db_url:
        db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
    elif not db_url.startswith("postgresql+asyncpg://"):
        if db_url.startswith("postgresql+"):
            parts = db_url.split("://", 1)
            if len(parts) == 2:
                db_url = f"postgresql+asyncpg://{parts[1]}"
    
    engine = create_async_engine(db_url)
    async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        # Vérifier si le pipeline MAIN existe
        result = await session.execute(
            text("SELECT id, name FROM pipelines WHERE name = 'MAIN'")
        )
        existing = result.fetchone()
        
        if existing:
            pipeline_id = existing[0]
            print(f"✅ Pipeline MAIN existe déjà (ID: {pipeline_id})")
            
            # Compter les étapes
            result = await session.execute(
                text("SELECT COUNT(*) FROM pipeline_stages WHERE pipeline_id = :pipeline_id"),
                {"pipeline_id": pipeline_id}
            )
            stage_count = result.scalar()
            print(f"   Étapes: {stage_count}")
            
            if stage_count < 15:
                print(f"⚠️  Attention: Le pipeline n'a que {stage_count} étapes au lieu de 15")
            else:
                print("✅ Pipeline MAIN est complet avec toutes les étapes")
            return True
        else:
            print("❌ Pipeline MAIN n'existe pas")
            print("💡 La migration 044_create_main_pipeline n'a probablement pas été appliquée")
            print("   Exécutez: alembic upgrade head")
            return False

    await engine.dispose()


if __name__ == "__main__":
    try:
        result = asyncio.run(verify_and_create_main_pipeline())
        sys.exit(0 if result else 1)
    except Exception as e:
        print(f"❌ Erreur: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
