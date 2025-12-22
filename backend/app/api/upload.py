"""File upload endpoints."""

from uuid import UUID

from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models import User, File as FileModel
from app.schemas.file import FileResponse, FileUploadResponse
from app.services.s3_service import S3Service

router = APIRouter(prefix="/api/upload", tags=["upload"])


@router.post("/file", response_model=FileUploadResponse)
async def upload_file(
    file: UploadFile = File(...),
    folder: str = Query("uploads", description="Folder path in S3"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Upload a file to S3."""
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No file provided",
        )

    # Check if S3 is configured
    if not S3Service.is_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="File upload service is not configured. Please contact the administrator.",
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
            file_key=upload_result["file_key"],
            filename=upload_result["filename"] or "unknown",
            original_filename=upload_result["filename"] or "unknown",
            content_type=upload_result["content_type"],
            size=upload_result["size"],
            url=upload_result["url"],
            folder=folder,
        )

        db.add(file_record)
        await db.commit()
        await db.refresh(file_record)

        return FileUploadResponse(
            id=file_record.id,
            filename=file_record.filename,
            original_filename=file_record.original_filename,
            size=file_record.size,
            url=file_record.url,
            content_type=file_record.content_type,
            uploaded_at=file_record.created_at,
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload file: {str(e)}",
        )


@router.get("/{file_id}", response_model=FileResponse)
async def get_file(
    file_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get file metadata."""
    result = await db.execute(
        select(FileModel).where(FileModel.id == file_id)
    )
    file_record = result.scalar_one_or_none()

    if not file_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found",
        )

    # Check if user owns the file or is admin (you can add admin check)
    if file_record.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to access this file",
        )

    # Regenerate presigned URL if needed
    if S3Service.is_configured():
        try:
            s3_service = S3Service()
            file_record.url = s3_service.generate_presigned_url(
                file_record.file_key,
                expiration=3600,  # 1 hour
            )
            await db.commit()
            await db.refresh(file_record)
        except Exception:
            # If URL generation fails, use existing URL
            pass

    return file_record


@router.get("/", response_model=list[FileResponse])
async def list_files(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List user's files."""
    result = await db.execute(
        select(FileModel)
        .where(FileModel.user_id == current_user.id)
        .order_by(FileModel.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    files = result.scalars().all()

    # Regenerate presigned URLs if needed
    if S3Service.is_configured():
        s3_service = S3Service()
        for file_record in files:
            try:
                file_record.url = s3_service.generate_presigned_url(
                    file_record.file_key,
                    expiration=3600,  # 1 hour
                )
            except Exception:
                # If URL generation fails, use existing URL
                pass

    return files


@router.delete("/{file_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_file(
    file_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete file from S3 and database."""
    result = await db.execute(
        select(FileModel).where(FileModel.id == file_id)
    )
    file_record = result.scalar_one_or_none()

    if not file_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found",
        )

    # Check if user owns the file
    if file_record.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to delete this file",
        )

    # Delete from S3
    if S3Service.is_configured():
        try:
            s3_service = S3Service()
            s3_service.delete_file(file_record.file_key)
        except ValueError as e:
            # Log error but continue with database deletion
            pass

    # Delete from database
    db.delete(file_record)
    await db.commit()

    return None
