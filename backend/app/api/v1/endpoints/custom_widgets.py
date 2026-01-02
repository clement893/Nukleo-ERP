"""
Custom Widgets API Endpoints
API endpoints for managing user-created custom dashboard widgets
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from app.core.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.custom_widget import CustomWidget
from app.schemas.custom_widget import (
    CustomWidgetCreate,
    CustomWidgetUpdate,
    CustomWidgetResponse,
)
from app.core.logging import logger

router = APIRouter(prefix="/custom-widgets", tags=["custom-widgets"])


@router.get("/", response_model=List[CustomWidgetResponse])
async def list_custom_widgets(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    include_public: bool = Query(False, description="Inclure les widgets publics d'autres utilisateurs"),
    type: Optional[str] = Query(None, description="Filtrer par type de widget"),
):
    """
    Liste tous les widgets personnalisés de l'utilisateur + widgets publics si demandé
    """
    try:
        query = select(CustomWidget).where(
            or_(
                CustomWidget.user_id == current_user.id,
                (CustomWidget.is_public == True) if include_public else False
            )
        )
        
        if type:
            query = query.where(CustomWidget.type == type)
        
        query = query.order_by(CustomWidget.created_at.desc())
        
        result = await db.execute(query)
        widgets = result.scalars().all()
        
        return [CustomWidgetResponse.model_validate(widget) for widget in widgets]
    except Exception as e:
        logger.error(f"Error listing custom widgets: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve custom widgets"
        )


@router.get("/{widget_id}", response_model=CustomWidgetResponse)
async def get_custom_widget(
    widget_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Récupère un widget personnalisé par ID
    L'utilisateur peut seulement accéder à ses propres widgets ou aux widgets publics
    """
    try:
        query = select(CustomWidget).where(
            and_(
                CustomWidget.id == widget_id,
                or_(
                    CustomWidget.user_id == current_user.id,
                    CustomWidget.is_public == True
                )
            )
        )
        
        result = await db.execute(query)
        widget = result.scalar_one_or_none()
        
        if not widget:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Custom widget not found"
            )
        
        return CustomWidgetResponse.model_validate(widget)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting custom widget {widget_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve custom widget"
        )


@router.post("/", response_model=CustomWidgetResponse, status_code=status.HTTP_201_CREATED)
async def create_custom_widget(
    widget_data: CustomWidgetCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Crée un nouveau widget personnalisé
    """
    try:
        # Valider le type de widget
        valid_types = ['html', 'api', 'chart', 'text', 'iframe']
        if widget_data.type not in valid_types:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Invalid widget type. Must be one of: {', '.join(valid_types)}"
            )
        
        # Créer le widget
        widget = CustomWidget(
            user_id=current_user.id,
            name=widget_data.name,
            description=widget_data.description,
            type=widget_data.type,
            config=widget_data.config.model_dump(),
            data_source=widget_data.data_source.model_dump() if widget_data.data_source else None,
            style=widget_data.style.model_dump() if widget_data.style else None,
            is_public=widget_data.is_public,
        )
        
        db.add(widget)
        await db.commit()
        await db.refresh(widget)
        
        logger.info(f"Created custom widget {widget.id} for user {current_user.id}")
        
        return CustomWidgetResponse.model_validate(widget)
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error creating custom widget: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create custom widget"
        )


@router.put("/{widget_id}", response_model=CustomWidgetResponse)
async def update_custom_widget(
    widget_id: int,
    widget_data: CustomWidgetUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Met à jour un widget personnalisé
    L'utilisateur peut seulement modifier ses propres widgets
    """
    try:
        query = select(CustomWidget).where(
            and_(
                CustomWidget.id == widget_id,
                CustomWidget.user_id == current_user.id
            )
        )
        
        result = await db.execute(query)
        widget = result.scalar_one_or_none()
        
        if not widget:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Custom widget not found or you don't have permission to edit it"
            )
        
        # Mettre à jour les champs fournis
        update_data = widget_data.model_dump(exclude_unset=True)
        
        if 'name' in update_data:
            widget.name = update_data['name']
        if 'description' in update_data:
            widget.description = update_data['description']
        if 'type' in update_data:
            # Valider le type
            valid_types = ['html', 'api', 'chart', 'text', 'iframe']
            if update_data['type'] not in valid_types:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=f"Invalid widget type. Must be one of: {', '.join(valid_types)}"
                )
            widget.type = update_data['type']
        if 'config' in update_data:
            widget.config = update_data['config'].model_dump()
        if 'data_source' in update_data:
            widget.data_source = update_data['data_source'].model_dump() if update_data['data_source'] else None
        if 'style' in update_data:
            widget.style = update_data['style'].model_dump() if update_data['style'] else None
        if 'is_public' in update_data:
            widget.is_public = update_data['is_public']
        
        await db.commit()
        await db.refresh(widget)
        
        logger.info(f"Updated custom widget {widget_id} for user {current_user.id}")
        
        return CustomWidgetResponse.model_validate(widget)
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error updating custom widget {widget_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update custom widget"
        )


@router.delete("/{widget_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_custom_widget(
    widget_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Supprime un widget personnalisé
    L'utilisateur peut seulement supprimer ses propres widgets
    """
    try:
        query = select(CustomWidget).where(
            and_(
                CustomWidget.id == widget_id,
                CustomWidget.user_id == current_user.id
            )
        )
        
        result = await db.execute(query)
        widget = result.scalar_one_or_none()
        
        if not widget:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Custom widget not found or you don't have permission to delete it"
            )
        
        await db.delete(widget)
        await db.commit()
        
        logger.info(f"Deleted custom widget {widget_id} for user {current_user.id}")
        
        return None
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error deleting custom widget {widget_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete custom widget"
        )


@router.post("/{widget_id}/duplicate", response_model=CustomWidgetResponse)
async def duplicate_custom_widget(
    widget_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Duplique un widget personnalisé
    L'utilisateur peut dupliquer ses propres widgets ou les widgets publics
    """
    try:
        query = select(CustomWidget).where(
            and_(
                CustomWidget.id == widget_id,
                or_(
                    CustomWidget.user_id == current_user.id,
                    CustomWidget.is_public == True
                )
            )
        )
        
        result = await db.execute(query)
        original_widget = result.scalar_one_or_none()
        
        if not original_widget:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Custom widget not found"
            )
        
        # Créer une copie
        new_widget = CustomWidget(
            user_id=current_user.id,
            name=f"{original_widget.name} (Copie)",
            description=original_widget.description,
            type=original_widget.type,
            config=original_widget.config.copy() if original_widget.config else {},
            data_source=original_widget.data_source.copy() if original_widget.data_source else None,
            style=original_widget.style.copy() if original_widget.style else None,
            is_public=False,  # Les copies ne sont pas publiques par défaut
        )
        
        db.add(new_widget)
        await db.commit()
        await db.refresh(new_widget)
        
        logger.info(f"Duplicated custom widget {widget_id} to {new_widget.id} for user {current_user.id}")
        
        return CustomWidgetResponse.model_validate(new_widget)
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error duplicating custom widget {widget_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to duplicate custom widget"
        )
