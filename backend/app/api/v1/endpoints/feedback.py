"""
Feedback API Endpoints
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from pydantic import BaseModel, Field

from app.services.feedback_service import FeedbackService
from app.models.user import User
from app.models.feedback import FeedbackType, FeedbackStatus
from app.dependencies import get_current_user
from app.core.database import get_db
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()


class FeedbackCreate(BaseModel):
    type: FeedbackType
    subject: str = Field(..., min_length=1, max_length=200)
    message: str = Field(..., min_length=1)
    priority: int = Field(1, ge=1, le=4)
    url: Optional[str] = None
    metadata: Optional[dict] = None


class FeedbackUpdate(BaseModel):
    status: Optional[FeedbackStatus] = None
    priority: Optional[int] = Field(None, ge=1, le=4)
    response: Optional[str] = None


class FeedbackResponse(BaseModel):
    id: int
    user_id: Optional[int]
    type: str
    subject: str
    message: str
    status: str
    priority: int
    url: Optional[str]
    response: Optional[str]
    responded_by_id: Optional[int]
    responded_at: Optional[str]
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True


@router.post("/feedback", response_model=FeedbackResponse, status_code=status.HTTP_201_CREATED, tags=["feedback"])
async def create_feedback(
    feedback_data: FeedbackCreate,
    current_user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new feedback entry"""
    from fastapi import Request
    
    service = FeedbackService(db)
    user_agent = None  # TODO: Get from request
    
    feedback = await service.create_feedback(
        type=feedback_data.type,
        subject=feedback_data.subject,
        message=feedback_data.message,
        user_id=current_user.id if current_user else None,
        priority=feedback_data.priority,
        url=feedback_data.url,
        user_agent=user_agent,
        metadata=feedback_data.metadata
    )
    return FeedbackResponse.model_validate(feedback)


@router.post("/feedback/{feedback_id}/attachments", tags=["feedback"])
async def upload_attachment(
    feedback_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Upload an attachment to feedback"""
    # TODO: Implement file upload to storage
    # For now, just return success
    return {"success": True, "message": "File upload not yet implemented"}


@router.get("/feedback", response_model=List[FeedbackResponse], tags=["feedback"])
async def get_feedback(
    status: Optional[FeedbackStatus] = Query(None),
    type: Optional[FeedbackType] = Query(None),
    limit: int = Query(50, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get feedback (user's own or all if admin)"""
    service = FeedbackService(db)
    
    # TODO: Check if user is admin
    # For now, return user's own feedback
    feedback = await service.get_user_feedback(current_user.id, status=status)
    return [FeedbackResponse.model_validate(f) for f in feedback]


@router.get("/feedback/{feedback_id}", response_model=FeedbackResponse, tags=["feedback"])
async def get_feedback_item(
    feedback_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific feedback item"""
    service = FeedbackService(db)
    feedback = await service.get_feedback(feedback_id)
    if not feedback:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Feedback not found"
        )
    
    # TODO: Check if user owns this feedback or is admin
    if feedback.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this feedback"
        )
    
    return FeedbackResponse.model_validate(feedback)


@router.put("/feedback/{feedback_id}", response_model=FeedbackResponse, tags=["feedback"])
async def update_feedback(
    feedback_id: int,
    feedback_data: FeedbackUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update feedback"""
    service = FeedbackService(db)
    updates = feedback_data.model_dump(exclude_unset=True)
    
    # If responding, set responded_by
    if updates.get('response'):
        updates['responded_by_id'] = current_user.id
    
    feedback = await service.update_feedback(feedback_id, updates)
    if not feedback:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Feedback not found"
        )
    return FeedbackResponse.model_validate(feedback)


@router.delete("/feedback/{feedback_id}", tags=["feedback"])
async def delete_feedback(
    feedback_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete feedback"""
    service = FeedbackService(db)
    success = await service.delete_feedback(feedback_id)
    if success:
        return {"success": True, "message": "Feedback deleted successfully"}
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Feedback not found"
    )



