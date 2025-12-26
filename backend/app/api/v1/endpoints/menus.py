"""
Menus API Endpoints
Navigation menus management
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.menu import Menu
from app.models.user import User
from app.dependencies import get_current_user, get_db
from app.core.security_audit import SecurityAuditLogger

router = APIRouter()


class MenuItem(BaseModel):
    id: str
    label: str
    url: str
    target: Optional[str] = '_self'
    children: Optional[List['MenuItem']] = None


class MenuCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    location: str = Field(..., pattern='^(header|footer|sidebar)$')
    items: List[MenuItem] = Field(default_factory=list)


class MenuUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    location: Optional[str] = Field(None, pattern='^(header|footer|sidebar)$')
    items: Optional[List[MenuItem]] = None


class MenuResponse(BaseModel):
    id: int
    name: str
    location: str
    items: List[dict]
    user_id: Optional[int] = None
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True


@router.get("/menus", response_model=List[MenuResponse], tags=["menus"])
async def list_menus(
    location: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all menus"""
    query = select(Menu)
    if location:
        query = query.where(Menu.location == location)
    result = await db.execute(query.order_by(Menu.created_at.desc()))
    menus = result.scalars().all()
    return [MenuResponse.model_validate(menu) for menu in menus]


@router.get("/menus/{menu_id}", response_model=MenuResponse, tags=["menus"])
async def get_menu(
    menu_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a menu by ID"""
    result = await db.execute(select(Menu).where(Menu.id == menu_id))
    menu = result.scalar_one_or_none()
    
    if not menu:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Menu not found")
    
    return MenuResponse.model_validate(menu)


@router.post("/menus", response_model=MenuResponse, status_code=status.HTTP_201_CREATED, tags=["menus"])
async def create_menu(
    menu_data: MenuCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new menu"""
    items_json = [item.model_dump() for item in menu_data.items]
    
    menu = Menu(
        name=menu_data.name,
        location=menu_data.location,
        items=items_json,
        user_id=current_user.id,
    )
    
    db.add(menu)
    await db.commit()
    await db.refresh(menu)
    
    SecurityAuditLogger.log_event(
        user_id=current_user.id,
        event_type="menu_created",
        severity="info",
        message=f"Menu '{menu.name}' created",
    )
    
    return MenuResponse.model_validate(menu)


@router.put("/menus/{menu_id}", response_model=MenuResponse, tags=["menus"])
async def update_menu(
    menu_id: int,
    menu_data: MenuUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a menu"""
    result = await db.execute(select(Menu).where(Menu.id == menu_id))
    menu = result.scalar_one_or_none()
    
    if not menu:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Menu not found")
    
    # Check ownership or admin
    if menu.user_id != current_user.id and not current_user.is_superadmin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this menu"
        )
    
    if menu_data.name is not None:
        menu.name = menu_data.name
    if menu_data.location is not None:
        menu.location = menu_data.location
    if menu_data.items is not None:
        menu.items = [item.model_dump() for item in menu_data.items]
    
    await db.commit()
    await db.refresh(menu)
    
    SecurityAuditLogger.log_event(
        user_id=current_user.id,
        event_type="menu_updated",
        severity="info",
        message=f"Menu '{menu.name}' updated",
    )
    
    return MenuResponse.model_validate(menu)


@router.delete("/menus/{menu_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["menus"])
async def delete_menu(
    menu_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a menu"""
    result = await db.execute(select(Menu).where(Menu.id == menu_id))
    menu = result.scalar_one_or_none()
    
    if not menu:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Menu not found")
    
    # Check ownership or admin
    if menu.user_id != current_user.id and not current_user.is_superadmin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this menu"
        )
    
    await db.delete(menu)
    await db.commit()
    
    SecurityAuditLogger.log_event(
        user_id=current_user.id,
        event_type="menu_deleted",
        severity="info",
        message=f"Menu '{menu.name}' deleted",
    )

