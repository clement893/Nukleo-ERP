"""
Leo Settings API Endpoints
"""

from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Body, UploadFile, File
from fastapi.responses import JSONResponse, Response
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.leo_settings_service import LeoSettingsService
from app.models.user import User
from app.dependencies import get_current_user
from app.core.database import get_db
from app.core.logging import logger

router = APIRouter()


class LeoSettingsUpdate(BaseModel):
    """Leo settings update schema"""
    tone: Optional[str] = None
    approach: Optional[str] = None
    language: Optional[str] = None
    custom_instructions: Optional[str] = None
    temperature: Optional[float] = None
    max_tokens: Optional[int] = None
    provider_preference: Optional[str] = None
    model_preference: Optional[str] = None
    enable_context_memory: Optional[bool] = None


class LeoSettingsResponse(BaseModel):
    """Leo settings response schema"""
    tone: str
    approach: str
    language: str
    custom_instructions: str
    markdown_file_id: Optional[int]
    markdown_file_name: Optional[str]
    temperature: float
    max_tokens: Optional[int]
    provider_preference: str
    model_preference: Optional[str]
    enable_context_memory: bool


class SystemPromptResponse(BaseModel):
    """System prompt response schema"""
    system_prompt: str


@router.get("/settings", tags=["leo"])
async def get_leo_settings(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Response:
    """Get Leo settings for the current user"""
    try:
        service = LeoSettingsService(db)
        settings = await service.get_leo_settings(current_user.id)
        
        return JSONResponse(
            content=settings,
            status_code=200
        )
    except Exception as e:
        logger.error(f"Error getting Leo settings: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get Leo settings"
        )


@router.put("/settings", tags=["leo"])
async def update_leo_settings(
    settings_update: LeoSettingsUpdate = Body(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Response:
    """Update Leo settings for the current user"""
    try:
        service = LeoSettingsService(db)
        
        # Convert Pydantic model to dict, excluding None values
        update_dict = settings_update.model_dump(exclude_none=True)
        
        updated_settings = await service.update_leo_settings(
            current_user.id, update_dict
        )
        
        return JSONResponse(
            content=updated_settings,
            status_code=200
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error updating Leo settings: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update Leo settings"
        )


@router.post("/settings/markdown/upload", tags=["leo"])
async def upload_markdown_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Response:
    """Upload a markdown file with Leo instructions"""
    try:
        # Validate file extension
        if not file.filename or not file.filename.endswith('.md'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Le fichier doit être au format Markdown (.md)"
            )
        
        # Read file content
        content = await file.read()
        file_content = content.decode('utf-8')
        
        # Validate file size (max 500KB)
        if len(content) > 500 * 1024:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Le fichier est trop volumineux (maximum 500KB)"
            )
        
        service = LeoSettingsService(db)
        result = await service.upload_markdown_file(
            current_user.id, file_content, file.filename
        )
        
        return JSONResponse(
            content=result,
            status_code=200
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading markdown file: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to upload markdown file"
        )


@router.get("/settings/markdown/download", tags=["leo"])
async def download_markdown_file(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Response:
    """Download the current markdown file"""
    try:
        service = LeoSettingsService(db)
        settings = await service.get_leo_settings(current_user.id)
        
        markdown_content = settings.get("markdown_content")
        filename = settings.get("markdown_file_name", "leo-instructions.md")
        
        if not markdown_content:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Aucun fichier Markdown trouvé"
            )
        
        from fastapi.responses import Response as FastAPIResponse
        return FastAPIResponse(
            content=markdown_content.encode('utf-8'),
            media_type="text/markdown",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"'
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error downloading markdown file: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to download markdown file"
        )


@router.delete("/settings/markdown", tags=["leo"])
async def delete_markdown_file(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Response:
    """Delete the current markdown file"""
    try:
        service = LeoSettingsService(db)
        success = await service.delete_markdown_file(current_user.id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Aucun fichier Markdown trouvé"
            )
        
        return JSONResponse(
            content={"success": True, "message": "Fichier Markdown supprimé avec succès"},
            status_code=200
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting markdown file: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete markdown file"
        )


@router.get("/settings/system-prompt", tags=["leo"])
async def get_system_prompt(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Response:
    """Get the generated system prompt from Leo settings"""
    try:
        service = LeoSettingsService(db)
        system_prompt = await service.build_system_prompt(current_user.id)
        
        return JSONResponse(
            content={"system_prompt": system_prompt},
            status_code=200
        )
    except Exception as e:
        logger.error(f"Error getting system prompt: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get system prompt"
        )
