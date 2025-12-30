"""
Commercial Submissions Endpoints
API endpoints for managing commercial submissions (soumissions complexes)
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from datetime import datetime

from app.core.database import get_db
from app.dependencies import get_current_user
from app.models.submission import Submission
from app.models.company import Company
from app.models.user import User
from app.schemas.submission import SubmissionCreate, SubmissionUpdate, Submission as SubmissionSchema
from app.services.submission_pdf_service import SubmissionPDFService
from app.core.logging import logger

router = APIRouter(prefix="/commercial/submissions", tags=["commercial-submissions"])


async def generate_submission_number(db: AsyncSession) -> str:
    """Generate a unique submission number"""
    # Get current year
    year = datetime.now().year
    
    # Find the highest submission number for this year
    result = await db.execute(
        select(func.max(Submission.submission_number))
        .where(Submission.submission_number.like(f"SOU-{year}-%"))
    )
    max_number = result.scalar_one_or_none()
    
    if max_number:
        # Extract the number part and increment
        try:
            number_part = int(max_number.split("-")[-1])
            new_number = number_part + 1
        except (ValueError, IndexError):
            new_number = 1
    else:
        new_number = 1
    
    return f"SOU-{year}-{new_number:03d}"


@router.get("/", response_model=List[SubmissionSchema])
async def list_submissions(
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    company_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    type: Optional[str] = Query(None),
) -> List[Submission]:
    """
    Get list of submissions
    
    Args:
        skip: Number of records to skip
        limit: Maximum number of records to return
        company_id: Optional company filter
        status: Optional status filter
        type: Optional type filter
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        List of submissions
    """
    query = select(Submission)
    
    if company_id:
        query = query.where(Submission.company_id == company_id)
    if status:
        query = query.where(Submission.status == status)
    if type:
        query = query.where(Submission.type == type)
    
    query = query.options(
        selectinload(Submission.company),
        selectinload(Submission.user)
    ).order_by(Submission.created_at.desc()).offset(skip).limit(limit)
    
    result = await db.execute(query)
    submissions = result.scalars().all()
    
    # Convert to response format
    submission_list = []
    for submission in submissions:
        submission_dict = {
            "id": submission.id,
            "submission_number": submission.submission_number,
            "company_id": submission.company_id,
            "company_name": submission.company.name if submission.company else None,
            "title": submission.title,
            "type": submission.type,
            "description": submission.description,
            "content": submission.content,
            "status": submission.status,
            "deadline": submission.deadline.isoformat() if submission.deadline else None,
            "submitted_at": submission.submitted_at.isoformat() if submission.submitted_at else None,
            "notes": submission.notes,
            "attachments": submission.attachments,
            "user_name": f"{submission.user.first_name} {submission.user.last_name}" if submission.user else None,
            "created_at": submission.created_at,
            "updated_at": submission.updated_at,
        }
        submission_list.append(SubmissionSchema(**submission_dict))
    
    return submission_list


@router.get("/{submission_id}", response_model=SubmissionSchema)
async def get_submission(
    submission_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Submission:
    """
    Get a specific submission by ID
    
    Args:
        submission_id: Submission ID
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        Submission details
        
    Raises:
        HTTPException: If submission not found
    """
    result = await db.execute(
        select(Submission)
        .options(
            selectinload(Submission.company),
            selectinload(Submission.user)
        )
        .where(Submission.id == submission_id)
    )
    submission = result.scalar_one_or_none()
    
    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Submission not found"
        )
    
    submission_dict = {
        "id": submission.id,
        "submission_number": submission.submission_number,
        "company_id": submission.company_id,
        "company_name": submission.company.name if submission.company else None,
        "title": submission.title,
        "type": submission.type,
        "description": submission.description,
        "content": submission.content,
        "status": submission.status,
        "deadline": submission.deadline.isoformat() if submission.deadline else None,
        "submitted_at": submission.submitted_at.isoformat() if submission.submitted_at else None,
        "notes": submission.notes,
        "attachments": submission.attachments,
        "user_name": f"{submission.user.first_name} {submission.user.last_name}" if submission.user else None,
        "created_at": submission.created_at,
        "updated_at": submission.updated_at,
    }
    
    return SubmissionSchema(**submission_dict)


@router.post("/", response_model=SubmissionSchema, status_code=status.HTTP_201_CREATED)
async def create_submission(
    request: Request,
    submission_data: SubmissionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Submission:
    """
    Create a new submission
    
    Args:
        submission_data: Submission creation data
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        Created submission
    """
    # Validate company exists if provided
    if submission_data.company_id:
        company_result = await db.execute(
            select(Company).where(Company.id == submission_data.company_id)
        )
        if not company_result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Company not found"
            )
    
    # Generate submission number if not provided
    submission_number = submission_data.submission_number
    if not submission_number:
        submission_number = await generate_submission_number(db)
    
    submission = Submission(
        submission_number=submission_number,
        company_id=submission_data.company_id,
        title=submission_data.title,
        type=submission_data.type,
        description=submission_data.description,
        content=submission_data.content,
        status=submission_data.status,
        deadline=submission_data.deadline,
        submitted_at=submission_data.submitted_at,
        notes=submission_data.notes,
        attachments=submission_data.attachments,
        user_id=current_user.id,
    )
    
    db.add(submission)
    await db.commit()
    await db.refresh(submission)
    await db.refresh(submission, ["company", "user"])
    
    submission_dict = {
        "id": submission.id,
        "submission_number": submission.submission_number,
        "company_id": submission.company_id,
        "company_name": submission.company.name if submission.company else None,
        "title": submission.title,
        "type": submission.type,
        "description": submission.description,
        "content": submission.content,
        "status": submission.status,
        "deadline": submission.deadline.isoformat() if submission.deadline else None,
        "submitted_at": submission.submitted_at.isoformat() if submission.submitted_at else None,
        "notes": submission.notes,
        "attachments": submission.attachments,
        "user_name": f"{submission.user.first_name} {submission.user.last_name}" if submission.user else None,
        "created_at": submission.created_at,
        "updated_at": submission.updated_at,
    }
    
    return SubmissionSchema(**submission_dict)


@router.put("/{submission_id}", response_model=SubmissionSchema)
async def update_submission(
    request: Request,
    submission_id: int,
    submission_data: SubmissionUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Submission:
    """
    Update a submission
    
    Args:
        submission_id: Submission ID
        submission_data: Submission update data
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        Updated submission
        
    Raises:
        HTTPException: If submission not found
    """
    result = await db.execute(
        select(Submission).where(Submission.id == submission_id)
    )
    submission = result.scalar_one_or_none()
    
    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Submission not found"
        )
    
    # Validate company exists if provided
    if submission_data.company_id is not None:
        company_result = await db.execute(
            select(Company).where(Company.id == submission_data.company_id)
        )
        if not company_result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Company not found"
            )
    
    # Update fields
    update_data = submission_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(submission, field, value)
    
    await db.commit()
    await db.refresh(submission)
    await db.refresh(submission, ["company", "user"])
    
    submission_dict = {
        "id": submission.id,
        "submission_number": submission.submission_number,
        "company_id": submission.company_id,
        "company_name": submission.company.name if submission.company else None,
        "title": submission.title,
        "type": submission.type,
        "description": submission.description,
        "content": submission.content,
        "status": submission.status,
        "deadline": submission.deadline.isoformat() if submission.deadline else None,
        "submitted_at": submission.submitted_at.isoformat() if submission.submitted_at else None,
        "notes": submission.notes,
        "attachments": submission.attachments,
        "user_name": f"{submission.user.first_name} {submission.user.last_name}" if submission.user else None,
        "created_at": submission.created_at,
        "updated_at": submission.updated_at,
    }
    
    return SubmissionSchema(**submission_dict)


@router.delete("/{submission_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_submission(
    request: Request,
    submission_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    """
    Delete a submission
    
    Args:
        submission_id: Submission ID
        current_user: Current authenticated user
        db: Database session
        
    Raises:
        HTTPException: If submission not found
    """
    result = await db.execute(
        select(Submission).where(Submission.id == submission_id)
    )
    submission = result.scalar_one_or_none()
    
    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Submission not found"
        )
    
    db.delete(submission)
    await db.commit()


@router.get("/{submission_id}/pdf")
async def generate_submission_pdf(
    submission_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> StreamingResponse:
    """
    Generate PDF document for a submission
    
    Args:
        submission_id: Submission ID
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        PDF file as streaming response
        
    Raises:
        HTTPException: If submission not found or PDF generation fails
    """
    result = await db.execute(
        select(Submission)
        .options(
            selectinload(Submission.company),
            selectinload(Submission.user)
        )
        .where(Submission.id == submission_id)
    )
    submission = result.scalar_one_or_none()
    
    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Submission not found"
        )
    
    try:
        # Prepare submission data for PDF generation
        submission_dict = {
            "id": submission.id,
            "submission_number": submission.submission_number,
            "title": submission.title,
            "company_name": submission.company.name if submission.company else None,
            "content": submission.content or {},
        }
        
        # Generate PDF
        pdf_service = SubmissionPDFService()
        pdf_buffer = pdf_service.generate_pdf(submission_dict)
        
        # Generate filename
        filename = f"soumission_{submission.submission_number}_{datetime.now().strftime('%Y%m%d')}.pdf"
        
        return StreamingResponse(
            pdf_buffer,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"'
            }
        )
    except Exception as e:
        logger.error(f"Error generating PDF for submission {submission_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating PDF: {str(e)}"
        )
