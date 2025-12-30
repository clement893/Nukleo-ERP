"""
Script to create the 3 default teams: Lab, Bureau, Studio
"""
import asyncio
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import async_session_maker
from app.models.team import Team
from app.models.user import User
from sqlalchemy import select
from app.core.logging import logger


async def create_teams():
    """Create the 3 default teams"""
    async with async_session_maker() as db:
        try:
            # Get the first user as owner (or create a default owner)
            result = await db.execute(select(User).limit(1))
            owner = result.scalar_one_or_none()
            
            if not owner:
                logger.error("No user found. Please create a user first.")
                return
            
            teams_to_create = [
                {"name": "Lab", "slug": "lab", "description": "Équipe Lab"},
                {"name": "Bureau", "slug": "bureau", "description": "Équipe Bureau"},
                {"name": "Studio", "slug": "studio", "description": "Équipe Studio"},
            ]
            
            created_teams = []
            for team_data in teams_to_create:
                # Check if team already exists
                existing = await db.execute(
                    select(Team).where(Team.slug == team_data["slug"])
                )
                if existing.scalar_one_or_none():
                    logger.info(f"Team '{team_data['name']}' already exists, skipping...")
                    continue
                
                team = Team(
                    name=team_data["name"],
                    slug=team_data["slug"],
                    description=team_data["description"],
                    owner_id=owner.id,
                    is_active=True,
                )
                db.add(team)
                created_teams.append(team_data["name"])
            
            if created_teams:
                await db.commit()
                logger.info(f"✅ Successfully created {len(created_teams)} teams: {', '.join(created_teams)}")
            else:
                logger.info("All teams already exist.")
            
            # List all teams
            result = await db.execute(select(Team))
            all_teams = result.scalars().all()
            logger.info(f"\n📋 All teams in database:")
            for team in all_teams:
                logger.info(f"  - {team.name} (ID: {team.id}, slug: {team.slug})")
                
        except Exception as e:
            logger.error(f"Error creating teams: {e}", exc_info=True)
            await db.rollback()
            raise


if __name__ == "__main__":
    asyncio.run(create_teams())
