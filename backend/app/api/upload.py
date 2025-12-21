"""File upload endpoints."""

from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models import User

router = APIRouter(prefix="/api/upload", tags=["upload"])


@router.post("/file")
async def upload_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Upload a file."""
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No file provided",
        )

    # TODO: Implement file upload to S3 or local storage
    return {
        "filename": file.filename,
        "size": file.size,
        "url": f"/uploads/{file.filename}",
        "uploaded_by": str(current_user.id),
    }


@router.get("/{file_id}")
async def get_file(
    file_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get file metadata."""
    return {
        "id": file_id,
        "url": f"/uploads/{file_id}",
        "owner": str(current_user.id),
    }


@router.delete("/{file_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_file(
    file_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete file."""
    pass
