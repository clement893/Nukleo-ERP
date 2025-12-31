"""
Project Attachments Endpoints
API endpoints for project/task attachments
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.dependencies import get_current_user
from app.models import User, Project, ProjectTask, ProjectAttachment, File as FileModel
from app.schemas.project_attachment import (
    ProjectAttachmentCreate,
    ProjectAttachmentUpdate,
    ProjectAttachmentResponse,
)
from app.services.s3_service import S3Service
from app.core.file_validation import validate_document_file

router = APIRouter(prefix="/project-attachments", tags=["project-attachments"])


@router.get("", response_model=List[ProjectAttachmentResponse])
async def list_attachments(
    project_id: Optional[int] = Query(None, description="Filter by project ID"),
    task_id: Optional[int] = Query(None, description="Filter by task ID"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List project/task attachments"""
    query = select(ProjectAttachment)
    
    if project_id:
        query = query.where(ProjectAttachment.project_id == project_id)
    if task_id:
        query = query.where(ProjectAttachment.task_id == task_id)
    
    query = query.offset(skip).limit(limit).order_by(ProjectAttachment.created_at.desc())
    
    result = await db.execute(query.options(
        selectinload(ProjectAttachment.uploaded_by),
    ))
    attachments = result.scalars().all()
    
    # Convert to response format
    attachment_responses = []
    for attachment in attachments:
        attachment_dict = ProjectAttachmentResponse.model_validate(attachment).model_dump()
        if attachment.uploaded_by:
            attachment_dict['uploaded_by_name'] = attachment.uploaded_by.email
        attachment_responses.append(ProjectAttachmentResponse(**attachment_dict))
    
    return attachment_responses


@router.post("", response_model=ProjectAttachmentResponse, status_code=status.HTTP_201_CREATED)
async def create_attachment(
    project_id: Optional[int] = Query(None),
    task_id: Optional[int] = Query(None),
    file: UploadFile = File(...),
    description: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Upload an attachment to a project or task"""
    if not project_id and not task_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either project_id or task_id must be provided"
        )
    
    # Verify project or task exists
    if project_id:
        project_result = await db.execute(select(Project).where(Project.id == project_id))
        project = project_result.scalar_one_or_none()
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found"
            )
    
    if task_id:
        task_result = await db.execute(select(ProjectTask).where(ProjectTask.id == task_id))
        task = task_result.scalar_one_or_none()
        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found"
            )
        # If task has project_id, also attach to project
        if task.project_id and not project_id:
            project_id = task.project_id
    
    # Validate file
    is_valid, error = validate_document_file(file)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error or "Invalid file format or size"
        )
    
    # Upload file to S3
    try:
        s3_service = S3Service()
        upload_result = s3_service.upload_file(
            file=file,
            folder="project-attachments",
            user_id=str(current_user.id),
        )
        
        # Optionally create File record
        file_record = None
        if S3Service.is_configured():
            file_record = FileModel(
                user_id=current_user.id,
                file_key=upload_result["file_key"],
                filename=upload_result["filename"] or "unknown",
                original_filename=upload_result["filename"] or "unknown",
                content_type=upload_result["content_type"],
                size=upload_result["size"],
                file_size=upload_result["size"],
                url=upload_result["url"],
                file_path=upload_result["file_key"],
                folder="project-attachments",
            )
            db.add(file_record)
            await db.flush()
        
        # Create attachment record
        attachment = ProjectAttachment(
            project_id=project_id,
            task_id=task_id,
            file_id=file_record.id if file_record else None,
            file_url=upload_result["url"],
            filename=upload_result["filename"] or file.filename or "unknown",
            original_filename=file.filename or "unknown",
            content_type=upload_result["content_type"],
            file_size=upload_result["size"],
            description=description,
            uploaded_by_id=current_user.id,
        )
        
        db.add(attachment)
        await db.commit()
        await db.refresh(attachment)
        
        # Load relationships
        await db.refresh(attachment, ["uploaded_by"])
        
        attachment_dict = ProjectAttachmentResponse.model_validate(attachment).model_dump()
        if attachment.uploaded_by:
            attachment_dict['uploaded_by_name'] = attachment.uploaded_by.email
        
        return ProjectAttachmentResponse(**attachment_dict)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload file: {str(e)}"
        )


@router.get("/{attachment_id}", response_model=ProjectAttachmentResponse)
async def get_attachment(
    attachment_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific attachment"""
    result = await db.execute(
        select(ProjectAttachment).where(ProjectAttachment.id == attachment_id)
    )
    attachment = result.scalar_one_or_none()
    
    if not attachment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attachment not found"
        )
    
    attachment_dict = ProjectAttachmentResponse.model_validate(attachment).model_dump()
    if attachment.uploaded_by:
        attachment_dict['uploaded_by_name'] = attachment.uploaded_by.email
    
    return ProjectAttachmentResponse(**attachment_dict)


@router.put("/{attachment_id}", response_model=ProjectAttachmentResponse)
async def update_attachment(
    attachment_id: int,
    attachment_data: ProjectAttachmentUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update an attachment (description only)"""
    result = await db.execute(
        select(ProjectAttachment).where(ProjectAttachment.id == attachment_id)
    )
    attachment = result.scalar_one_or_none()
    
    if not attachment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attachment not found"
        )
    
    # Update description
    if attachment_data.description is not None:
        attachment.description = attachment_data.description
    
    await db.commit()
    await db.refresh(attachment)
    
    attachment_dict = ProjectAttachmentResponse.model_validate(attachment).model_dump()
    if attachment.uploaded_by:
        attachment_dict['uploaded_by_name'] = attachment.uploaded_by.email
    
    return ProjectAttachmentResponse(**attachment_dict)


@router.delete("/{attachment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_attachment(
    attachment_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete an attachment"""
    result = await db.execute(
        select(ProjectAttachment).where(ProjectAttachment.id == attachment_id)
    )
    attachment = result.scalar_one_or_none()
    
    if not attachment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attachment not found"
        )
    
    await db.delete(attachment)
    await db.commit()
    
    return {"message": "Attachment deleted successfully"}
