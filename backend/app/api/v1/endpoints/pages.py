"""
Pages API Endpoints
CMS pages management
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.models.page import Page
from app.models.user import User
from app.dependencies import get_current_user, get_db
from app.core.security_audit import SecurityAuditLogger

router = APIRouter()


class PageSection(BaseModel):
    id: str
    type: str
    title: Optional[str] = None
    content: Optional[str] = None
    config: Optional[dict] = None


class PageCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    slug: str = Field(..., min_length=1, max_length=200)
    content: Optional[str] = None
    content_html: Optional[str] = None
    sections: Optional[List[PageSection]] = None
    status: str = Field(default='draft', pattern='^(draft|published|archived)$')
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    meta_keywords: Optional[str] = None


class PageUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    slug: Optional[str] = Field(None, min_length=1, max_length=200)
    content: Optional[str] = None
    content_html: Optional[str] = None
    sections: Optional[List[PageSection]] = None
    status: Optional[str] = Field(None, pattern='^(draft|published|archived)$')
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    meta_keywords: Optional[str] = None


class PageResponse(BaseModel):
    id: int
    title: str
    slug: str
    content: Optional[str] = None
    content_html: Optional[str] = None
    sections: Optional[List[dict]] = None
    status: str
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    meta_keywords: Optional[str] = None
    user_id: Optional[int] = None
    created_at: str
    updated_at: str
    published_at: Optional[str] = None

    class Config:
        from_attributes = True


@router.get("/pages", response_model=List[PageResponse], tags=["pages"])
async def list_pages(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all pages"""
    query = select(Page)
    if status:
        query = query.where(Page.status == status)
    query = query.order_by(Page.created_at.desc()).offset(skip).limit(limit)
    
    result = await db.execute(query)
    pages = result.scalars().all()
    return [PageResponse.model_validate(page) for page in pages]


@router.get("/pages/{slug}", response_model=PageResponse, tags=["pages"])
async def get_page(
    slug: str,
    current_user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a page by slug"""
    result = await db.execute(select(Page).where(Page.slug == slug))
    page = result.scalar_one_or_none()
    
    if not page:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Page not found")
    
    return PageResponse.model_validate(page)


@router.post("/pages", response_model=PageResponse, status_code=status.HTTP_201_CREATED, tags=["pages"])
async def create_page(
    page_data: PageCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new page"""
    # Check if slug already exists
    result = await db.execute(select(Page).where(Page.slug == page_data.slug))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Page with this slug already exists"
        )
    
    sections_json = [section.model_dump() for section in page_data.sections] if page_data.sections else None
    
    page = Page(
        title=page_data.title,
        slug=page_data.slug,
        content=page_data.content,
        content_html=page_data.content_html,
        sections=sections_json,
        status=page_data.status,
        meta_title=page_data.meta_title,
        meta_description=page_data.meta_description,
        meta_keywords=page_data.meta_keywords,
        user_id=current_user.id,
    )
    
    if page_data.status == 'published':
        from datetime import datetime
        page.published_at = datetime.utcnow()
    
    db.add(page)
    await db.commit()
    await db.refresh(page)
    
    SecurityAuditLogger.log_event(
        user_id=current_user.id,
        event_type="page_created",
        severity="info",
        message=f"Page '{page.title}' created",
    )
    
    return PageResponse.model_validate(page)


@router.put("/pages/{slug}", response_model=PageResponse, tags=["pages"])
async def update_page(
    slug: str,
    page_data: PageUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a page"""
    result = await db.execute(select(Page).where(Page.slug == slug))
    page = result.scalar_one_or_none()
    
    if not page:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Page not found")
    
    # Check ownership or admin
    if page.user_id != current_user.id and not current_user.is_superadmin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this page"
        )
    
    # Update fields
    if page_data.title is not None:
        page.title = page_data.title
    if page_data.slug is not None and page_data.slug != slug:
        # Check if new slug exists
        result = await db.execute(select(Page).where(Page.slug == page_data.slug))
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Page with this slug already exists"
            )
        page.slug = page_data.slug
    if page_data.content is not None:
        page.content = page_data.content
    if page_data.content_html is not None:
        page.content_html = page_data.content_html
    if page_data.sections is not None:
        page.sections = [section.model_dump() for section in page_data.sections]
    if page_data.status is not None:
        page.status = page_data.status
        if page_data.status == 'published' and not page.published_at:
            from datetime import datetime
            page.published_at = datetime.utcnow()
    if page_data.meta_title is not None:
        page.meta_title = page_data.meta_title
    if page_data.meta_description is not None:
        page.meta_description = page_data.meta_description
    if page_data.meta_keywords is not None:
        page.meta_keywords = page_data.meta_keywords
    
    await db.commit()
    await db.refresh(page)
    
    SecurityAuditLogger.log_event(
        user_id=current_user.id,
        event_type="page_updated",
        severity="info",
        message=f"Page '{page.title}' updated",
    )
    
    return PageResponse.model_validate(page)


@router.delete("/pages/{slug}", status_code=status.HTTP_204_NO_CONTENT, tags=["pages"])
async def delete_page(
    slug: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a page"""
    result = await db.execute(select(Page).where(Page.slug == slug))
    page = result.scalar_one_or_none()
    
    if not page:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Page not found")
    
    # Check ownership or admin
    if page.user_id != current_user.id and not current_user.is_superadmin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this page"
        )
    
    await db.delete(page)
    await db.commit()
    
    SecurityAuditLogger.log_event(
        user_id=current_user.id,
        event_type="page_deleted",
        severity="info",
        message=f"Page '{page.title}' deleted",
    )

