"""
Media API Endpoints
Media library management
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.models.file import File as FileModel
from app.models.user import User
from app.dependencies import get_current_user, get_db
from app.core.security_audit import SecurityAuditLogger, SecurityEventType
from app.core.tenancy_helpers import apply_tenant_scope
from app.services.s3_service import S3Service
from app.core.logging import logger
from fastapi import Request
import os
import re

router = APIRouter()


class MediaResponse(BaseModel):
    id: str  # UUID as string
    filename: str
    file_path: str  # Alias for file_key/url for backward compatibility
    file_size: int  # Alias for size
    mime_type: Optional[str] = None  # Alias for content_type
    storage_type: str = "s3"  # Default, not in model but used in response
    is_public: bool = False  # Default, not in model but used in response
    user_id: int
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True

    @classmethod
    def from_file_model(cls, file: FileModel):
        """Create MediaResponse from File model"""
        return cls(
            id=str(file.id),
            filename=file.filename,
            file_path=file.url or file.file_key,  # Use url as file_path for compatibility
            file_size=file.size,
            mime_type=file.content_type,
            storage_type="s3",  # Default since we use S3
            is_public=False,  # Default
            user_id=file.user_id,
            created_at=file.created_at.isoformat() if hasattr(file.created_at, 'isoformat') else str(file.created_at),
            updated_at=file.updated_at.isoformat() if hasattr(file.updated_at, 'isoformat') else str(file.updated_at),
        )


def sanitize_filename(filename: str) -> str:
    """Sanitize filename to prevent path traversal and injection."""
    filename = os.path.basename(filename)
    filename = re.sub(r'[^a-zA-Z0-9._-]', '', filename)
    filename = filename[:255]
    return filename


@router.get("/media", response_model=List[MediaResponse], tags=["media"])
async def list_media(
    request: Request,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    folder: Optional[str] = Query(None, description="Filter by folder"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all media files for the current user"""
    query = select(FileModel).where(FileModel.user_id == current_user.id)
    
    # Filter by folder if provided
    if folder:
        query = query.where(FileModel.file_key.like(f"{folder}/%"))
    
    # Apply tenant scoping if tenancy is enabled
    query = apply_tenant_scope(query, FileModel)
    query = query.order_by(FileModel.created_at.desc()).offset(skip).limit(limit)
    
    result = await db.execute(query)
    files = result.scalars().all()
    
    # Log data access
    try:
        await SecurityAuditLogger.log_event(
            db=db,
            event_type=SecurityEventType.DATA_ACCESSED,
            description=f"Listed {len(files)} media files",
            user_id=current_user.id,
            ip_address=request.client.host if request.client else None,
        )
    except Exception:
        pass
    
    return [MediaResponse.from_file_model(file) for file in files]


@router.get("/media/{media_id}", response_model=MediaResponse, tags=["media"])
async def get_media(
    media_id: str,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a media file by ID"""
    try:
        media_uuid = uuid.UUID(media_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid media ID format"
        )
    
    query = select(FileModel).where(
        FileModel.id == media_uuid,
        FileModel.user_id == current_user.id
    )
    query = apply_tenant_scope(query, FileModel)
    
    result = await db.execute(query)
    file = result.scalar_one_or_none()
    
    if not file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Media file not found"
        )
    
    # Log data access
    try:
        await SecurityAuditLogger.log_event(
            db=db,
            event_type=SecurityEventType.DATA_ACCESSED,
            description=f"Accessed media file {media_id}",
            user_id=current_user.id,
            ip_address=request.client.host if request.client else None,
        )
    except Exception:
        pass
    
    return MediaResponse.from_file_model(file)


@router.post("/media", response_model=MediaResponse, status_code=status.HTTP_201_CREATED, tags=["media"])
async def upload_media(
    file: UploadFile = File(...),
    folder: str = Query("media", description="Folder path in storage"),
    is_public: bool = Query(False, description="Make file publicly accessible"),
    request: Request = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Upload a media file"""
    MAX_FILE_SIZE = 100 * 1024 * 1024  # 100MB
    ALLOWED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.pdf', '.mp4', '.mov', '.webm'}
    
    # Validate file
    filename = sanitize_filename(file.filename or "unknown")
    file_ext = os.path.splitext(filename)[1].lower()
    
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type not allowed. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # Read file content to check size
    file_content = await file.read()
    file_size = len(file_content)
    
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large. Maximum size is {MAX_FILE_SIZE / (1024 * 1024):.0f}MB"
        )
    
    if file_size == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File is empty"
        )
    
    # Reset file pointer for upload
    await file.seek(0)
    
    # Check if S3 is configured
    if not S3Service.is_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="File upload service is not configured. Please contact the administrator."
        )
    
    try:
        # Upload to S3
        s3_service = S3Service()
        upload_result = s3_service.upload_file(
            file=file,
            folder=folder,
            user_id=str(current_user.id),
        )
        
        # Save file metadata to database
        file_record = FileModel(
            user_id=current_user.id,
            file_key=upload_result.get("file_key") or upload_result.get("url", ""),
            filename=upload_result.get("filename") or filename,
            original_filename=file.filename or filename,
            content_type=file.content_type or "application/octet-stream",
            size=file_size,
            url=upload_result.get("url", ""),
            folder=folder,
        )
        
        db.add(file_record)
        await db.commit()
        await db.refresh(file_record)
        
        # Log creation
        try:
            await SecurityAuditLogger.log_event(
                db=db,
                event_type=SecurityEventType.DATA_CREATED,
                description=f"Uploaded media file: {filename}",
                user_id=current_user.id,
                ip_address=request.client.host if request else None,
            )
        except Exception:
            pass
        
        return MediaResponse.from_file_model(file_record)
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload file: {str(e)}"
        )


@router.delete("/media/{media_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["media"])
async def delete_media(
    media_id: str,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a media file"""
    try:
        media_uuid = uuid.UUID(media_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid media ID format"
        )
    
    query = select(FileModel).where(
        FileModel.id == media_uuid,
        FileModel.user_id == current_user.id
    )
    query = apply_tenant_scope(query, FileModel)
    
    result = await db.execute(query)
    file = result.scalar_one_or_none()
    
    if not file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Media file not found"
        )
    
    # Delete from S3 if configured
    if S3Service.is_configured():
        try:
            s3_service = S3Service()
            s3_service.delete_file(file.file_key)
        except Exception:
            pass  # Continue even if S3 deletion fails
    
    await db.delete(file)
    await db.commit()
    
    # Log deletion
    try:
        await SecurityAuditLogger.log_event(
            db=db,
            event_type=SecurityEventType.DATA_DELETED,
            description=f"Deleted media file {media_id}",
            user_id=current_user.id,
            ip_address=request.client.host if request.client else None,
        )
    except Exception:
        pass
    
    return None


class MediaValidationRequest(BaseModel):
    """Request model for media validation"""
    name: str
    size: int
    type: str


class MediaValidationResponse(BaseModel):
    """Response model for media validation"""
    valid: bool
    sanitizedName: Optional[str] = None
    error: Optional[str] = None


@router.post("/media/validate", response_model=MediaValidationResponse, tags=["media"])
async def validate_media(
    validation_data: MediaValidationRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Validate a media file before upload.
    Checks file name, size, and MIME type.
    """
    try:
        # Sanitize filename
        sanitized_name = sanitize_filename(validation_data.name)
        
        # Check file size (max 100MB by default, can be configured)
        max_size = int(os.getenv("MAX_FILE_SIZE", 100 * 1024 * 1024))  # 100MB default
        if validation_data.size > max_size:
            return MediaValidationResponse(
                valid=False,
                sanitizedName=sanitized_name,
                error=f"File size exceeds maximum allowed size of {max_size / (1024 * 1024):.1f}MB"
            )
        
        # Check MIME type (basic validation)
        allowed_types = [
            "image/jpeg", "image/png", "image/gif", "image/webp",
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ]
        
        if validation_data.type and validation_data.type not in allowed_types:
            return MediaValidationResponse(
                valid=False,
                sanitizedName=sanitized_name,
                error=f"File type '{validation_data.type}' is not allowed"
            )
        
        # Check filename extension matches MIME type (basic check)
        if sanitized_name and "." in sanitized_name:
            ext = sanitized_name.split(".")[-1].lower()
            # Basic extension validation
            allowed_extensions = ["jpg", "jpeg", "png", "gif", "webp", "pdf", "doc", "docx", "xls", "xlsx"]
            if ext not in allowed_extensions:
                return MediaValidationResponse(
                    valid=False,
                    sanitizedName=sanitized_name,
                    error=f"File extension '.{ext}' is not allowed"
                )
        
        return MediaValidationResponse(
            valid=True,
            sanitizedName=sanitized_name
        )
    except Exception as e:
        logger.error(f"Error validating media: {e}", exc_info=True)
        return MediaValidationResponse(
            valid=False,
            error=f"Validation error: {str(e)}"
        )