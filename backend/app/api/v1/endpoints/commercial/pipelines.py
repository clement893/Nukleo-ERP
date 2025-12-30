"""
Commercial Pipelines Endpoints
API endpoints for managing commercial pipelines
"""

from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.dependencies import get_current_user
from app.models.pipeline import Pipeline, PipelineStage
from app.models.user import User
from app.schemas.pipeline import PipelineCreate, PipelineUpdate, PipelineResponse, PipelineStageCreate
from app.core.logging import logger

router = APIRouter(prefix="/commercial/pipelines", tags=["commercial-pipelines"])


@router.get("/", response_model=List[PipelineResponse])
async def list_pipelines(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of records to return"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
) -> List[PipelineResponse]:
    """
    Get list of pipelines
    
    Args:
        skip: Number of records to skip
        limit: Maximum number of records to return
        is_active: Optional active filter
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        List of pipelines
    """
    # Filter by user's pipelines (or pipelines without created_by_id for backward compatibility)
    from sqlalchemy import or_
    query = select(Pipeline).where(
        or_(
            Pipeline.created_by_id == current_user.id,
            Pipeline.created_by_id.is_(None)  # Include pipelines without creator for backward compatibility
        )
    )
    
    if is_active is not None:
        query = query.where(Pipeline.is_active == is_active)
    
    query = query.options(
        selectinload(Pipeline.stages)
    ).order_by(Pipeline.created_at.desc()).offset(skip).limit(limit)
    
    try:
        result = await db.execute(query)
        pipelines = result.scalars().all()
        
        # Convert to response format
        pipeline_list = []
        for pipeline in pipelines:
            # Count opportunities for each pipeline
            from app.models.pipeline import Opportunite
            opp_count_result = await db.execute(
                select(func.count(Opportunite.id)).where(Opportunite.pipeline_id == pipeline.id)
            )
            opportunity_count = opp_count_result.scalar() or 0
            
            pipeline_dict = {
                'id': pipeline.id,
                'name': pipeline.name,
                'description': pipeline.description,
                'is_default': pipeline.is_default,
                'is_active': pipeline.is_active,
                'created_by_id': pipeline.created_by_id,
                'created_at': pipeline.created_at,
                'updated_at': pipeline.updated_at,
                'stages': [
                    {
                        'id': stage.id,
                        'pipeline_id': stage.pipeline_id,
                        'name': stage.name,
                        'description': stage.description,
                        'color': stage.color,
                        'order': stage.order,
                        'created_at': stage.created_at,
                        'updated_at': stage.updated_at,
                    }
                    for stage in pipeline.stages
                ],
                'opportunity_count': opportunity_count,
            }
            pipeline_response = PipelineResponse(**pipeline_dict)
            pipeline_list.append(pipeline_response)
        
        return pipeline_list
    except Exception as e:
        logger.error(f"Error fetching pipelines: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An internal error occurred. Please contact support."
        )


@router.get("/{pipeline_id}", response_model=PipelineResponse)
async def get_pipeline(
    pipeline_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Pipeline:
    """
    Get a pipeline by ID
    
    Args:
        pipeline_id: Pipeline ID
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        Pipeline
    """
    query = select(Pipeline).where(Pipeline.id == pipeline_id)
    query = query.options(selectinload(Pipeline.stages))
    
    result = await db.execute(query)
    pipeline = result.scalar_one_or_none()
    
    if not pipeline:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pipeline not found"
        )
    
    pipeline_dict = {
        'id': pipeline.id,
        'name': pipeline.name,
        'description': pipeline.description,
        'is_default': pipeline.is_default,
        'is_active': pipeline.is_active,
        'created_by_id': pipeline.created_by_id,
        'created_at': pipeline.created_at,
        'updated_at': pipeline.updated_at,
        'stages': [
            {
                'id': stage.id,
                'pipeline_id': stage.pipeline_id,
                'name': stage.name,
                'description': stage.description,
                'color': stage.color,
                'order': stage.order,
                'created_at': stage.created_at,
                'updated_at': stage.updated_at,
            }
            for stage in pipeline.stages
        ],
    }
    
    return PipelineResponse(**pipeline_dict)


@router.post("/", response_model=PipelineResponse, status_code=status.HTTP_201_CREATED)
async def create_pipeline(
    request: Request,
    pipeline_data: PipelineCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Pipeline:
    """
    Create a new pipeline
    
    Args:
        pipeline_data: Pipeline creation data
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        Created pipeline
    """
    try:
        # If this is set as default, unset all other defaults
        if pipeline_data.is_default:
            result = await db.execute(
                select(Pipeline).where(Pipeline.is_default == True)
            )
            existing_defaults = result.scalars().all()
            for existing in existing_defaults:
                existing.is_default = False
        
        # Create pipeline
        pipeline = Pipeline(
            name=pipeline_data.name,
            description=pipeline_data.description,
            is_default=pipeline_data.is_default,
            is_active=pipeline_data.is_active,
            created_by_id=current_user.id,
        )
        
        db.add(pipeline)
        await db.flush()  # Get pipeline ID
        
        # Create stages if provided
        if pipeline_data.stages:
            for stage_data in pipeline_data.stages:
                stage = PipelineStage(
                    pipeline_id=pipeline.id,
                    name=stage_data.name,
                    description=stage_data.description,
                    color=stage_data.color or '#3B82F6',
                    order=stage_data.order,
                )
                db.add(stage)
        
        await db.commit()
        await db.refresh(pipeline, ["stages"])
        
        logger.info(f"User {current_user.id} created pipeline {pipeline.id}")
        
        # Count opportunities for the pipeline
        from app.models.pipeline import Opportunite
        opp_count_result = await db.execute(
            select(func.count(Opportunite.id)).where(Opportunite.pipeline_id == pipeline.id)
        )
        opportunity_count = opp_count_result.scalar() or 0
        
        pipeline_dict = {
            'id': pipeline.id,
            'name': pipeline.name,
            'description': pipeline.description,
            'is_default': pipeline.is_default,
            'is_active': pipeline.is_active,
            'created_by_id': pipeline.created_by_id,
            'created_at': pipeline.created_at,
            'updated_at': pipeline.updated_at,
            'stages': [
                {
                    'id': stage.id,
                    'pipeline_id': stage.pipeline_id,
                    'name': stage.name,
                    'description': stage.description,
                    'color': stage.color,
                    'order': stage.order,
                    'created_at': stage.created_at,
                    'updated_at': stage.updated_at,
                }
                for stage in pipeline.stages
            ],
            'opportunity_count': opportunity_count,
        }
        
        return PipelineResponse(**pipeline_dict)
    except Exception as e:
        await db.rollback()
        logger.error(f"Error creating pipeline: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create pipeline: {str(e)}"
        )


@router.put("/{pipeline_id}", response_model=PipelineResponse)
async def update_pipeline(
    pipeline_id: UUID,
    pipeline_data: PipelineUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Pipeline:
    """
    Update a pipeline
    
    Args:
        pipeline_id: Pipeline ID
        pipeline_data: Updated pipeline data
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        Updated pipeline
    """
    query = select(Pipeline).where(Pipeline.id == pipeline_id)
    query = query.options(selectinload(Pipeline.stages))
    
    result = await db.execute(query)
    pipeline = result.scalar_one_or_none()
    
    if not pipeline:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pipeline not found"
        )
    
    try:
        # If setting as default, unset all other defaults
        if pipeline_data.is_default is True:
            result = await db.execute(
                select(Pipeline).where(
                    Pipeline.is_default == True,
                    Pipeline.id != pipeline_id
                )
            )
            existing_defaults = result.scalars().all()
            for existing in existing_defaults:
                existing.is_default = False
        
        # Update fields
        update_data = pipeline_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(pipeline, field, value)
        
        await db.commit()
        await db.refresh(pipeline, ["stages"])
        
        logger.info(f"User {current_user.id} updated pipeline {pipeline_id}")
        
        # Count opportunities for the pipeline
        from app.models.pipeline import Opportunite
        opp_count_result = await db.execute(
            select(func.count(Opportunite.id)).where(Opportunite.pipeline_id == pipeline_id)
        )
        opportunity_count = opp_count_result.scalar() or 0
        
        pipeline_dict = {
            'id': pipeline.id,
            'name': pipeline.name,
            'description': pipeline.description,
            'is_default': pipeline.is_default,
            'is_active': pipeline.is_active,
            'created_by_id': pipeline.created_by_id,
            'created_at': pipeline.created_at,
            'updated_at': pipeline.updated_at,
            'stages': [
                {
                    'id': stage.id,
                    'pipeline_id': stage.pipeline_id,
                    'name': stage.name,
                    'description': stage.description,
                    'color': stage.color,
                    'order': stage.order,
                    'created_at': stage.created_at,
                    'updated_at': stage.updated_at,
                }
                for stage in pipeline.stages
            ],
            'opportunity_count': opportunity_count,
        }
        
        return PipelineResponse(**pipeline_dict)
    except Exception as e:
        await db.rollback()
        logger.error(f"Error updating pipeline: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update pipeline: {str(e)}"
        )


@router.delete("/{pipeline_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_pipeline(
    pipeline_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Delete a pipeline
    
    Args:
        pipeline_id: Pipeline ID
        current_user: Current authenticated user
        db: Database session
    """
    query = select(Pipeline).where(Pipeline.id == pipeline_id)
    result = await db.execute(query)
    pipeline = result.scalar_one_or_none()
    
    if not pipeline:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pipeline not found"
        )
    
    # Check if pipeline has opportunities
    from app.models.pipeline import Opportunite
    opp_count_result = await db.execute(
        select(func.count(Opportunite.id)).where(Opportunite.pipeline_id == pipeline_id)
    )
    opportunity_count = opp_count_result.scalar() or 0
    
    if opportunity_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete pipeline with {opportunity_count} opportunity(ies). Please reassign or delete opportunities first."
        )
    
    try:
        await db.delete(pipeline)
        await db.commit()
        
        logger.info(f"User {current_user.id} deleted pipeline {pipeline_id}")
    except Exception as e:
        await db.rollback()
        logger.error(f"Error deleting pipeline: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete pipeline: {str(e)}"
        )
