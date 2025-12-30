"""
Seed Main Pipeline Script
Create the MAIN pipeline with all default stages
"""

import asyncio
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import select
from app.core.config import settings
from app.models.pipeline import Pipeline, PipelineStage
from app.models.user import User


async def seed_main_pipeline():
    """Seed MAIN pipeline with all stages"""
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
        # Check if MAIN pipeline already exists
        from sqlalchemy.orm import selectinload
        result = await session.execute(
            select(Pipeline)
            .where(Pipeline.name == "MAIN")
            .options(selectinload(Pipeline.stages))
        )
        existing_pipeline = result.scalar_one_or_none()
        
        if existing_pipeline:
            # Count stages explicitly to avoid lazy loading issues
            stages_result = await session.execute(
                select(PipelineStage).where(PipelineStage.pipeline_id == existing_pipeline.id)
            )
            stages = stages_result.scalars().all()
            print(f"✅ MAIN pipeline already exists (ID: {existing_pipeline.id})")
            print(f"   Stages: {len(stages)}")
            return existing_pipeline

        # Get first user as creator (or create a default one)
        result = await session.execute(select(User).limit(1))
        first_user = result.scalar_one_or_none()
        
        if not first_user:
            print("❌ No users found. Please create a user first.")
            return None

        # Define stages with their order and colors
        stages_data = [
            {"name": "00 - Idées de projet", "order": 0, "color": "#94A3B8"},
            {"name": "00 - Idées de contact", "order": 1, "color": "#94A3B8"},
            {"name": "01 - Suivi /Emails", "order": 2, "color": "#3B82F6"},
            {"name": "02 - Leads", "order": 3, "color": "#3B82F6"},
            {"name": "03 - Rencontre booké", "order": 4, "color": "#8B5CF6"},
            {"name": "04 - En discussion", "order": 5, "color": "#8B5CF6"},
            {"name": "05 - Proposal to do", "order": 6, "color": "#F59E0B"},
            {"name": "06 - Proposal sent", "order": 7, "color": "#F59E0B"},
            {"name": "07 - Contract to do", "order": 8, "color": "#EF4444"},
            {"name": "08 - Contract sent", "order": 9, "color": "#EF4444"},
            {"name": "09 - Closed Won", "order": 10, "color": "#10B981"},
            {"name": "Closed Lost", "order": 11, "color": "#6B7280"},
            {"name": "En attente ou Silence radio", "order": 12, "color": "#FBBF24"},
            {"name": "Renouvellement à venir", "order": 13, "color": "#10B981"},
            {"name": "Renouvellements potentiels", "order": 14, "color": "#10B981"},
        ]

        # Create MAIN pipeline
        pipeline = Pipeline(
            name="MAIN",
            description="Pipeline principal pour la gestion des opportunités commerciales",
            is_default=True,
            is_active=True,
            created_by_id=first_user.id,
        )
        
        session.add(pipeline)
        await session.flush()  # Get pipeline ID
        
        # Create stages
        for stage_data in stages_data:
            stage = PipelineStage(
                pipeline_id=pipeline.id,
                name=stage_data["name"],
                description=f"Étape: {stage_data['name']}",
                color=stage_data["color"],
                order=stage_data["order"],
            )
            session.add(stage)
        
        await session.commit()
        
        # Reload pipeline with stages
        await session.refresh(pipeline)
        result = await session.execute(
            select(PipelineStage).where(PipelineStage.pipeline_id == pipeline.id)
        )
        stages = result.scalars().all()
        
        print(f"✅ Created MAIN pipeline (ID: {pipeline.id})")
        print(f"   Created by: {first_user.email}")
        print(f"   Stages: {len(stages)}")
        print()
        print("📋 Stages created:")
        for stage in sorted(stages, key=lambda s: s.order):
            print(f"   {stage.order:2d}. {stage.name} ({stage.color})")
        
        return pipeline

    await engine.dispose()


if __name__ == "__main__":
    try:
        asyncio.run(seed_main_pipeline())
    except Exception as e:
        print(f"❌ Error creating MAIN pipeline: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
