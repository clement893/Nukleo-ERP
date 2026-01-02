"""
Automation Rules API Endpoints
API endpoints for managing automation rules
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime

from app.core.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.automation_rule import AutomationRule, AutomationRuleExecutionLog
from app.schemas.automation_rule import (
    AutomationRuleCreate,
    AutomationRuleUpdate,
    AutomationRuleResponse,
    AutomationRuleExecutionLogResponse
)
from app.core.logging import logger

router = APIRouter()


@router.post("", response_model=AutomationRuleResponse, status_code=status.HTTP_201_CREATED, tags=["automation-rules"])
async def create_automation_rule(
    rule_data: AutomationRuleCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new automation rule"""
    rule = AutomationRule(
        name=rule_data.name,
        description=rule_data.description,
        enabled=rule_data.enabled,
        trigger_event=rule_data.trigger_event,
        trigger_conditions=rule_data.trigger_conditions,
        actions=rule_data.actions,
        user_id=current_user.id,
    )
    
    db.add(rule)
    await db.commit()
    await db.refresh(rule)
    
    return AutomationRuleResponse.model_validate(rule)


@router.get("", response_model=List[AutomationRuleResponse], tags=["automation-rules"])
async def get_automation_rules(
    enabled: Optional[bool] = Query(None, description="Filter by enabled status"),
    trigger_event: Optional[str] = Query(None, description="Filter by trigger event"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get automation rules for the current user"""
    query = select(AutomationRule).where(AutomationRule.user_id == current_user.id)
    
    if enabled is not None:
        query = query.where(AutomationRule.enabled == enabled)
    if trigger_event:
        query = query.where(AutomationRule.trigger_event == trigger_event)
    
    query = query.order_by(AutomationRule.created_at.desc())
    
    result = await db.execute(query)
    rules = result.scalars().all()
    
    return [AutomationRuleResponse.model_validate(rule) for rule in rules]


@router.get("/{rule_id}", response_model=AutomationRuleResponse, tags=["automation-rules"])
async def get_automation_rule(
    rule_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific automation rule"""
    result = await db.execute(
        select(AutomationRule).where(
            AutomationRule.id == rule_id,
            AutomationRule.user_id == current_user.id
        )
    )
    rule = result.scalar_one_or_none()
    
    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Automation rule not found"
        )
    
    return AutomationRuleResponse.model_validate(rule)


@router.put("/{rule_id}", response_model=AutomationRuleResponse, tags=["automation-rules"])
async def update_automation_rule(
    rule_id: int,
    rule_data: AutomationRuleUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update an automation rule"""
    result = await db.execute(
        select(AutomationRule).where(
            AutomationRule.id == rule_id,
            AutomationRule.user_id == current_user.id
        )
    )
    rule = result.scalar_one_or_none()
    
    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Automation rule not found"
        )
    
    # Update fields
    update_data = rule_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(rule, field, value)
    
    await db.commit()
    await db.refresh(rule)
    
    return AutomationRuleResponse.model_validate(rule)


@router.delete("/{rule_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["automation-rules"])
async def delete_automation_rule(
    rule_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete an automation rule"""
    result = await db.execute(
        select(AutomationRule).where(
            AutomationRule.id == rule_id,
            AutomationRule.user_id == current_user.id
        )
    )
    rule = result.scalar_one_or_none()
    
    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Automation rule not found"
        )
    
    await db.delete(rule)
    await db.commit()


@router.post("/{rule_id}/toggle", response_model=AutomationRuleResponse, tags=["automation-rules"])
async def toggle_automation_rule(
    rule_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Toggle automation rule enabled/disabled"""
    result = await db.execute(
        select(AutomationRule).where(
            AutomationRule.id == rule_id,
            AutomationRule.user_id == current_user.id
        )
    )
    rule = result.scalar_one_or_none()
    
    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Automation rule not found"
        )
    
    rule.enabled = not rule.enabled
    await db.commit()
    await db.refresh(rule)
    
    return AutomationRuleResponse.model_validate(rule)


@router.get("/{rule_id}/logs", response_model=List[AutomationRuleExecutionLogResponse], tags=["automation-rules"])
async def get_automation_rule_logs(
    rule_id: int,
    limit: int = Query(50, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get execution logs for an automation rule"""
    # Verify rule belongs to user
    result = await db.execute(
        select(AutomationRule).where(
            AutomationRule.id == rule_id,
            AutomationRule.user_id == current_user.id
        )
    )
    rule = result.scalar_one_or_none()
    
    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Automation rule not found"
        )
    
    # Get logs
    logs_result = await db.execute(
        select(AutomationRuleExecutionLog)
        .where(AutomationRuleExecutionLog.rule_id == rule_id)
        .order_by(AutomationRuleExecutionLog.executed_at.desc())
        .limit(limit)
    )
    logs = logs_result.scalars().all()
    
    return [AutomationRuleExecutionLogResponse.model_validate(log) for log in logs]


@router.post("/initialize-default", response_model=AutomationRuleResponse, tags=["automation-rules"])
async def initialize_default_automation_rule(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Initialize the default automation rule for opportunity stage changes"""
    # Check if rule already exists
    result = await db.execute(
        select(AutomationRule).where(
            AutomationRule.trigger_event == 'opportunity.stage_changed',
            AutomationRule.name == "Créer tâche pour Proposition à faire"
        )
    )
    existing_rule = result.scalar_one_or_none()
    
    if existing_rule:
        return AutomationRuleResponse.model_validate(existing_rule)
    
    # Create the default rule
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
        user_id=current_user.id
    )
    
    db.add(rule)
    await db.commit()
    await db.refresh(rule)
    
    logger.info(f"Created default automation rule with ID {rule.id} for user {current_user.id}")
    
    return AutomationRuleResponse.model_validate(rule)
