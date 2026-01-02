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
from app.utils.notifications import create_notification_async
from app.utils.notification_templates import NotificationTemplates
from app.models.notification import NotificationType
from app.core.logging import logger

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
    
    # Create notifications for task comments
    if comment_data.task_id and task:
        try:
            commenter_name = f"{current_user.first_name or ''} {current_user.last_name or ''}".strip() or current_user.email
            task_title = task.title or "Untitled Task"
            comment_content = comment_data.content or ""
            
            # Check for mentions (@username or @email)
            import re
            mention_pattern = r'@(\w+(?:\.\w+)*@?\w*\.?\w*)'  # Matches @username or @email
            mentions = re.findall(mention_pattern, comment_content)
            
            # Notify task assignee if different from commenter
            assignee_id = getattr(task, 'assignee_id', None)
            if assignee_id and assignee_id != current_user.id:
                template = NotificationTemplates.task_comment(
                    task_title=task_title,
                    commenter_name=commenter_name,
                    task_id=task.id
                )
                await create_notification_async(
                    db=db,
                    user_id=assignee_id,
                    **template
                )
                logger.info(f"Created task comment notification for assignee {assignee_id}")
            
            # Notify task creator if different from commenter and assignee
            creator_id = getattr(task, 'created_by_id', None)
            if creator_id and creator_id != current_user.id and creator_id != assignee_id:
                template = NotificationTemplates.task_comment(
                    task_title=task_title,
                    commenter_name=commenter_name,
                    task_id=task.id
                )
                await create_notification_async(
                    db=db,
                    user_id=creator_id,
                    **template
                )
                logger.info(f"Created task comment notification for creator {creator_id}")
            
            # Notify parent comment author if replying
            if comment_data.parent_id and parent:
                parent_author_id = parent.user_id
                if parent_author_id and parent_author_id != current_user.id:
                    await create_notification_async(
                        db=db,
                        user_id=parent_author_id,
                        title="Réponse à votre commentaire",
                        message=f"{commenter_name} a répondu à votre commentaire sur la tâche '{task_title}'.",
                        notification_type=NotificationType.INFO,
                        action_url=f"/dashboard/projects/tasks?task={task.id}",
                        action_label="Voir le commentaire"
                    )
                    logger.info(f"Created reply notification for parent comment author {parent_author_id}")
            
            # Notify mentioned users
            if mentions:
                from app.models.user import User
                for mention in mentions:
                    # Try to find user by email or username
                    mention_clean = mention.strip().lower()
                    user_result = await db.execute(
                        select(User).where(
                            or_(
                                User.email.ilike(f"%{mention_clean}%"),
                                User.first_name.ilike(f"%{mention_clean}%"),
                                User.last_name.ilike(f"%{mention_clean}%")
                            )
                        )
                    )
                    mentioned_user = user_result.scalar_one_or_none()
                    
                    if mentioned_user and mentioned_user.id != current_user.id:
                        # Avoid duplicate notifications (don't notify if already notified above)
                        if mentioned_user.id not in [assignee_id, creator_id, parent.user_id if parent else None]:
                            template = NotificationTemplates.mention_in_comment(
                                author_name=commenter_name,
                                context=f"sur la tâche '{task_title}'",
                                comment_id=comment.id
                            )
                            await create_notification_async(
                                db=db,
                                user_id=mentioned_user.id,
                                **template
                            )
                            logger.info(f"Created mention notification for user {mentioned_user.id}")
        except Exception as notif_error:
            # Don't fail comment creation if notification fails
            logger.error(f"Failed to create notification for comment {comment.id}: {notif_error}", exc_info=True)
    
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
