"""
Script to create default automation rule
Creates the automation rule for "05-Proposal to do" stage
"""

import asyncio
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from app.core.config import settings
from app.models.automation_rule import AutomationRule
from app.core.logging import logger


async def create_default_automation_rule():
    """Create the default automation rule for opportunity stage changes"""
    engine = create_async_engine(str(settings.DATABASE_URL))
    async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        # Check if rule already exists
        from sqlalchemy import select
        result = await session.execute(
            select(AutomationRule).where(
                AutomationRule.trigger_event == 'opportunity.stage_changed',
                AutomationRule.name == "Créer tâche pour Proposition à faire"
            )
        )
        existing_rule = result.scalar_one_or_none()
        
        if existing_rule:
            logger.info("Default automation rule already exists")
            return
        
        # Create the rule
        rule = AutomationRule(
            name="Créer tâche pour Proposition à faire",
            description="Crée automatiquement une tâche assignée à Clément Roy quand une opportunité du pipeline MAIN passe dans le stage '05-Proposal to do'",
            enabled=True,
            trigger_event='opportunity.stage_changed',
            trigger_conditions={
                'pipeline_name': 'MAIN',
                'stage_name': '05-Proposal to do'
            },
            actions=[
                {
                    'type': 'task.create',
                    'config': {
                        'title': 'Proposition à faire - {opportunity_name}',
                        'description': 'Opportunité \'{opportunity_name}\' est passée dans le stage \'05-Proposal to do\'. Créer la proposition.',
                        'assignee_name': 'Clément Roy',
                        'due_date_today': True,
                        'priority': 'high'
                    }
                }
            ],
            user_id=None  # System rule
        )
        
        session.add(rule)
        await session.commit()
        await session.refresh(rule)
        
        logger.info(f"Created default automation rule with ID {rule.id}")
        
        await engine.dispose()


if __name__ == "__main__":
    asyncio.run(create_default_automation_rule())
