"""
Project Comments Endpoints
API endpoints for project/task comments/discussions
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.dependencies import get_current_user
from app.models import User, Project, ProjectTask, ProjectComment
from app.schemas.project_comment import (
    ProjectCommentCreate,
    ProjectCommentUpdate,
    ProjectCommentResponse,
)

router = APIRouter(prefix="/project-comments", tags=["project-comments"])


def build_comment_tree(comments: List[ProjectComment]) -> List[ProjectCommentResponse]:
    """Build a tree structure from flat comment list"""
    # Separate root comments and replies
    root_comments = [c for c in comments if c.parent_id is None]
    replies_map = {}
    for comment in comments:
        if comment.parent_id:
            if comment.parent_id not in replies_map:
                replies_map[comment.parent_id] = []
            replies_map[comment.parent_id].append(comment)
    
    def build_response(comment: ProjectComment) -> ProjectCommentResponse:
        comment_dict = ProjectCommentResponse.model_validate(comment).model_dump()
        if comment.user:
            comment_dict['user_name'] = comment.user.email
            comment_dict['user_email'] = comment.user.email
            # Add avatar if available
            if hasattr(comment.user, 'avatar') and comment.user.avatar:
                comment_dict['user_avatar'] = comment.user.avatar
        
        # Recursively build replies
        if comment.id in replies_map:
            comment_dict['replies'] = [
                build_response(reply) for reply in sorted(
                    replies_map[comment.id],
                    key=lambda x: x.created_at
                )
            ]
        else:
            comment_dict['replies'] = []
        
        return ProjectCommentResponse(**comment_dict)
    
    return [
        build_response(comment) for comment in sorted(
            root_comments,
            key=lambda x: (x.is_pinned, x.created_at),
            reverse=True
        )
    ]


@router.get("", response_model=List[ProjectCommentResponse])
async def list_comments(
    project_id: Optional[int] = Query(None, description="Filter by project ID"),
    task_id: Optional[int] = Query(None, description="Filter by task ID"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List project/task comments"""
    query = select(ProjectComment)
    
    if project_id:
        query = query.where(ProjectComment.project_id == project_id)
    if task_id:
        query = query.where(ProjectComment.task_id == task_id)
    
    query = query.options(
        selectinload(ProjectComment.user),
    )
    
    result = await db.execute(query)
    all_comments = result.scalars().all()
    
    # Build tree structure
    return build_comment_tree(list(all_comments))


@router.post("", response_model=ProjectCommentResponse, status_code=status.HTTP_201_CREATED)
async def create_comment(
    comment_data: ProjectCommentCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a comment on a project or task"""
    if not comment_data.project_id and not comment_data.task_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either project_id or task_id must be provided"
        )
    
    # Verify project or task exists
    if comment_data.project_id:
        project_result = await db.execute(select(Project).where(Project.id == comment_data.project_id))
        project = project_result.scalar_one_or_none()
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found"
            )
    
    if comment_data.task_id:
        task_result = await db.execute(select(ProjectTask).where(ProjectTask.id == comment_data.task_id))
        task = task_result.scalar_one_or_none()
        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found"
            )
    
    # Verify parent comment exists if parent_id is provided
    if comment_data.parent_id:
        parent_result = await db.execute(
            select(ProjectComment).where(ProjectComment.id == comment_data.parent_id)
        )
        parent = parent_result.scalar_one_or_none()
        if not parent:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Parent comment not found"
            )
    
    # Create comment
    comment = ProjectComment(
        project_id=comment_data.project_id,
        task_id=comment_data.task_id,
        content=comment_data.content,
        parent_id=comment_data.parent_id,
        user_id=current_user.id,
    )
    
    db.add(comment)
    await db.commit()
    await db.refresh(comment)
    
    # Load relationships
    await db.refresh(comment, ["user"])
    
    comment_dict = ProjectCommentResponse.model_validate(comment).model_dump()
    if comment.user:
        comment_dict['user_name'] = comment.user.email
        comment_dict['user_email'] = comment.user.email
        if hasattr(comment.user, 'avatar') and comment.user.avatar:
            comment_dict['user_avatar'] = comment.user.avatar
    
    return ProjectCommentResponse(**comment_dict)


@router.get("/{comment_id}", response_model=ProjectCommentResponse)
async def get_comment(
    comment_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific comment"""
    result = await db.execute(
        select(ProjectComment).where(ProjectComment.id == comment_id).options(
            selectinload(ProjectComment.user),
            selectinload(ProjectComment.replies),
        )
    )
    comment = result.scalar_one_or_none()
    
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found"
        )
    
    # Load all replies recursively
    all_comments = [comment]
    if comment.replies:
        all_comments.extend(comment.replies)
    
    tree = build_comment_tree(all_comments)
    return tree[0] if tree else ProjectCommentResponse.model_validate(comment)


@router.put("/{comment_id}", response_model=ProjectCommentResponse)
async def update_comment(
    comment_id: int,
    comment_data: ProjectCommentUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a comment"""
    result = await db.execute(
        select(ProjectComment).where(ProjectComment.id == comment_id)
    )
    comment = result.scalar_one_or_none()
    
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found"
        )
    
    # Check ownership
    if comment.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this comment"
        )
    
    # Update comment
    comment.content = comment_data.content
    comment.is_edited = True
    if comment_data.is_pinned is not None:
        comment.is_pinned = comment_data.is_pinned
    
    await db.commit()
    await db.refresh(comment)
    
    await db.refresh(comment, ["user"])
    
    comment_dict = ProjectCommentResponse.model_validate(comment).model_dump()
    if comment.user:
        comment_dict['user_name'] = comment.user.email
        comment_dict['user_email'] = comment.user.email
        if hasattr(comment.user, 'avatar') and comment.user.avatar:
            comment_dict['user_avatar'] = comment.user.avatar
    
    return ProjectCommentResponse(**comment_dict)


@router.delete("/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_comment(
    comment_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a comment"""
    result = await db.execute(
        select(ProjectComment).where(ProjectComment.id == comment_id)
    )
    comment = result.scalar_one_or_none()
    
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found"
        )
    
    # Check ownership
    if comment.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this comment"
        )
    
    await db.delete(comment)
    await db.commit()
    
    return {"message": "Comment deleted successfully"}
