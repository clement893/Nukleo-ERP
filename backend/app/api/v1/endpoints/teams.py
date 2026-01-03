"""
Teams Endpoints
API endpoints for team management
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy import select, and_, or_

from app.core.database import get_db
from app.core.cache import cached, invalidate_cache_pattern, invalidate_cache_pattern_async
from app.dependencies import get_current_user
from app.dependencies.rbac import require_team_permission, require_team_owner, require_team_member
from app.models import User
from app.models.team import Team, TeamMember
from app.schemas.team import (
    TeamCreate,
    TeamUpdate,
    TeamResponse,
    TeamMemberAdd,
    TeamMemberUpdate,
    TeamMemberResponse,
    TeamListResponse,
)
from app.services.team_service import TeamService
from app.utils.notifications import create_notification_async
from app.utils.notification_templates import NotificationTemplates
from app.core.logging import logger

router = APIRouter(prefix="/teams", tags=["teams"])


def parse_team_settings(settings_value):
    """
    Parse team settings from database (JSON string) to dict.
    Handles None, dict, and JSON string formats.
    """
    if not settings_value:
        return None
    if isinstance(settings_value, dict):
        return settings_value
    if isinstance(settings_value, str):
        try:
            import json
            parsed = json.loads(settings_value)
            # Ensure parsed value is a dict
            return parsed if isinstance(parsed, dict) else None
        except (json.JSONDecodeError, TypeError, ValueError):
            return None
    return None


def team_member_to_dict(member: TeamMember) -> dict:
    """
    Convert TeamMember SQLAlchemy model to dict for TeamMemberResponse.
    Safely accesses loaded relationships. Relationships should be loaded via selectinload.
    """
    from sqlalchemy.orm import attributes as sqlalchemy_attributes
    from sqlalchemy import inspect as sqlalchemy_inspect
    
    member_dict = {
        "id": member.id,
        "team_id": member.team_id,
        "user_id": member.user_id,
        "role_id": member.role_id,
        "is_active": member.is_active,
        "joined_at": member.joined_at.isoformat() if hasattr(member.joined_at, 'isoformat') else str(member.joined_at),
        "updated_at": member.updated_at.isoformat() if hasattr(member.updated_at, 'isoformat') else str(member.updated_at),
        "user": None,
        "role": None,
    }
    
    # Access user relationship (should be loaded via selectinload)
    try:
        member_inspect = sqlalchemy_inspect(member)
        user_attr = member_inspect.attrs.user
        # Check if relationship is loaded (not NO_VALUE)
        if user_attr.loaded_value is not sqlalchemy_attributes.NO_VALUE:
            user = member.user
            if user:
                member_dict["user"] = {
                    "id": user.id,
                    "email": user.email,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                }
    except (AttributeError, KeyError, Exception):
        # Relationship not loaded or access failed, skip
        pass
    
    # Access role relationship (should be loaded via selectinload)
    try:
        member_inspect = sqlalchemy_inspect(member)
        role_attr = member_inspect.attrs.role
        # Check if relationship is loaded (not NO_VALUE)
        if role_attr.loaded_value is not sqlalchemy_attributes.NO_VALUE:
            role = member.role
            if role:
                member_dict["role"] = {
                    "id": role.id,
                    "name": role.name,
                    "slug": role.slug,
                }
    except (AttributeError, KeyError, Exception):
        # Relationship not loaded or access failed, skip
        pass
    
    return member_dict


@router.post("", response_model=TeamResponse, status_code=status.HTTP_201_CREATED)
async def create_team(
    team_data: TeamCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new team"""
    team_service = TeamService(db)
    
    # Check if slug already exists
    existing = await team_service.get_team_by_slug(team_data.slug)
    if existing:
        # If the existing team belongs to the same user, return it instead of erroring
        # This handles cases where the team was created but UI didn't refresh
        if existing.owner_id == current_user.id:
            # Invalidate cache to ensure fresh data
            await invalidate_cache_pattern_async("teams:*")
            
            # Reload team with relationships properly loaded
            team = await team_service.get_team(existing.id)
            if not team:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Team exists but could not be retrieved",
                )
            
            # Parse settings if it's a JSON string
            settings_dict = parse_team_settings(team.settings)
            
            # Convert to response format
            team_dict = {
                "id": team.id,
                "name": team.name,
                "slug": team.slug,
                "description": team.description,
                "owner_id": team.owner_id,
                "is_active": team.is_active,
                "settings": settings_dict,
                "created_at": team.created_at.isoformat() if hasattr(team.created_at, 'isoformat') else str(team.created_at),
                "updated_at": team.updated_at.isoformat() if hasattr(team.updated_at, 'isoformat') else str(team.updated_at),
                "owner": None,
                "members": [],
            }
            
            if team.owner:
                team_dict["owner"] = {
                    "id": team.owner.id,
                    "email": team.owner.email,
                    "first_name": team.owner.first_name,
                    "last_name": team.owner.last_name,
                }
            
            if team.members:
                team_dict["members"] = [TeamMemberResponse.model_validate(team_member_to_dict(m)) for m in team.members]
            
            return TeamResponse.model_validate(team_dict)
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Team slug already exists",
            )
    
    created_team = await team_service.create_team(
        name=team_data.name,
        slug=team_data.slug,
        owner_id=current_user.id,
        description=team_data.description,
        settings=team_data.settings if team_data.settings else None,
    )
    
    # Invalidate cache after creation
    await invalidate_cache_pattern_async("teams:*")
    
    # Reload team with relationships properly loaded
    team = await team_service.get_team(created_team.id)
    if not team:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Team was created but could not be retrieved",
        )
    
    # Parse settings if it's a JSON string
    settings_dict = parse_team_settings(team.settings)
    
    # Convert to response format - ensure we access loaded relationships safely
    team_dict = {
        "id": team.id,
        "name": team.name,
        "slug": team.slug,
        "description": team.description,
        "owner_id": team.owner_id,
        "is_active": team.is_active,
        "settings": settings_dict,
        "created_at": team.created_at.isoformat() if hasattr(team.created_at, 'isoformat') else str(team.created_at),
        "updated_at": team.updated_at.isoformat() if hasattr(team.updated_at, 'isoformat') else str(team.updated_at),
        "owner": None,
        "members": [],
    }
    
    # Safely access owner relationship (should be loaded via selectinload)
    if team.owner:
        team_dict["owner"] = {
            "id": team.owner.id,
            "email": team.owner.email,
            "first_name": team.owner.first_name,
            "last_name": team.owner.last_name,
        }
    
    # Safely access members relationship (should be loaded via selectinload)
    if team.members:
        team_dict["members"] = [TeamMemberResponse.model_validate(team_member_to_dict(m)) for m in team.members]
    
    return TeamResponse.model_validate(team_dict)


@router.get("", response_model=TeamListResponse)
async def list_teams(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=1000),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List teams the user belongs to with pagination. Superadmins see all teams."""
    from app.dependencies import is_superadmin
    
    team_service = TeamService(db)
    
    # Check if user is superadmin - if so, return all teams
    user_is_superadmin = await is_superadmin(current_user, db)
    
    if user_is_superadmin:
        # Superadmin sees all teams
        result = await db.execute(
            select(Team)
            .where(Team.is_active == True)
            .order_by(Team.created_at.desc())
            .offset(skip)
            .limit(limit)
            .options(
                selectinload(Team.owner),
                selectinload(Team.members).selectinload(TeamMember.user),
                selectinload(Team.members).selectinload(TeamMember.role)
            )
        )
        teams = list(result.scalars().all())
        
        # Get total count for pagination
        count_result = await db.execute(
            select(Team).where(Team.is_active == True)
        )
        total = len(count_result.scalars().all())
    else:
        # Regular users see teams they belong to OR teams they own
        # Get teams where user is a member (active) OR owner
        # Query 1: Teams where user is an active member
        member_teams_result = await db.execute(
            select(Team)
            .join(TeamMember, Team.id == TeamMember.team_id)
            .where(TeamMember.user_id == current_user.id)
            .where(TeamMember.is_active == True)
            .where(Team.is_active == True)
            .options(
                selectinload(Team.owner),
                selectinload(Team.members).selectinload(TeamMember.user),
                selectinload(Team.members).selectinload(TeamMember.role)
            )
        )
        member_teams = list(member_teams_result.scalars().all())
        
        # Query 2: Teams where user is owner
        owner_teams_result = await db.execute(
            select(Team)
            .where(Team.owner_id == current_user.id)
            .where(Team.is_active == True)
            .options(
                selectinload(Team.owner),
                selectinload(Team.members).selectinload(TeamMember.user),
                selectinload(Team.members).selectinload(TeamMember.role)
            )
        )
        owner_teams = list(owner_teams_result.scalars().all())
        
        # Combine and deduplicate by team ID
        all_teams_dict = {team.id: team for team in member_teams}
        all_teams_dict.update({team.id: team for team in owner_teams})
        
        # Sort by created_at desc and apply pagination
        all_teams = sorted(all_teams_dict.values(), key=lambda t: t.created_at, reverse=True)
        total = len(all_teams)
        teams = all_teams[skip:skip + limit]
    
    # Convert teams to response format
    teams_response = []
    for team in teams:
        team_dict = {
            "id": team.id,
            "name": team.name,
            "slug": team.slug,
            "description": team.description,
            "owner_id": team.owner_id,
            "is_active": team.is_active,
            "settings": parse_team_settings(team.settings),
            "created_at": team.created_at,
            "updated_at": team.updated_at,
            "owner": {
                "id": team.owner.id,
                "email": team.owner.email,
                "first_name": team.owner.first_name,
                "last_name": team.owner.last_name,
            } if team.owner else None,
            "members": [TeamMemberResponse.model_validate(team_member_to_dict(m)) for m in team.members] if team.members else [],
        }
        teams_response.append(TeamResponse.model_validate(team_dict))
    
    return TeamListResponse(teams=teams_response, total=total)


@router.get("/slug/{slug}", response_model=TeamResponse)
async def get_team_by_slug(
    slug: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a team by slug"""
    team_service = TeamService(db)
    team = await team_service.get_team_by_slug(slug)
    
    if not team:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found")
    
    # Check if user has access (is member or owner or superadmin)
    from app.dependencies import is_superadmin
    user_is_superadmin = await is_superadmin(current_user, db)
    is_owner = team.owner_id == current_user.id
    is_member = any(m.user_id == current_user.id and m.is_active for m in team.members) if team.members else False
    
    if not (user_is_superadmin or is_owner or is_member):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this team"
        )
    
    # Convert to dict with owner and members
    team_dict = {
        "id": team.id,
        "name": team.name,
        "slug": team.slug,
        "description": team.description,
        "owner_id": team.owner_id,
        "is_active": team.is_active,
        "settings": parse_team_settings(team.settings),
        "created_at": team.created_at,
        "updated_at": team.updated_at,
        "owner": {
            "id": team.owner.id,
            "email": team.owner.email,
            "first_name": team.owner.first_name,
            "last_name": team.owner.last_name,
        } if team.owner else None,
        "members": [TeamMemberResponse.model_validate(team_member_to_dict(m)) for m in team.members],
    }
    
    return TeamResponse.model_validate(team_dict)


@router.get("/{team_id}", response_model=TeamResponse)
async def get_team(
    team_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a team by ID"""
    await require_team_member(team_id, current_user, db)
    
    team_service = TeamService(db)
    team = await team_service.get_team(team_id)
    
    if not team:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found")
    
    # Convert to dict with owner and members
    team_dict = {
        "id": team.id,
        "name": team.name,
        "slug": team.slug,
        "description": team.description,
        "owner_id": team.owner_id,
        "is_active": team.is_active,
        "settings": parse_team_settings(team.settings),
        "created_at": team.created_at,
        "updated_at": team.updated_at,
        "owner": {
            "id": team.owner.id,
            "email": team.owner.email,
            "first_name": team.owner.first_name,
            "last_name": team.owner.last_name,
        } if team.owner else None,
        "members": [TeamMemberResponse.model_validate(team_member_to_dict(m)) for m in team.members],
    }
    
    return TeamResponse.model_validate(team_dict)


@router.put("/{team_id}", response_model=TeamResponse)
async def update_team(
    team_id: int,
    team_data: TeamUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a team"""
    await require_team_permission(team_id, "teams:update", current_user, db)
    
    team_service = TeamService(db)
    team = await team_service.update_team(
        team_id=team_id,
        name=team_data.name,
        description=team_data.description,
        settings=team_data.settings,
    )
    
    if not team:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found")
    
    # Invalidate cache
    await invalidate_cache_pattern_async("teams:*")
    await invalidate_cache_pattern_async(f"team:{team_id}:*")
    
    # Reload with relationships
    team = await team_service.get_team(team_id)
    team_dict = {
        "id": team.id,
        "name": team.name,
        "slug": team.slug,
        "description": team.description,
        "owner_id": team.owner_id,
        "is_active": team.is_active,
        "settings": parse_team_settings(team.settings),
        "created_at": team.created_at,
        "updated_at": team.updated_at,
        "owner": {
            "id": team.owner.id,
            "email": team.owner.email,
            "first_name": team.owner.first_name,
            "last_name": team.owner.last_name,
        } if team.owner else None,
        "members": [TeamMemberResponse.model_validate(team_member_to_dict(m)) for m in team.members],
    }
    
    return TeamResponse.model_validate(team_dict)


@router.delete("/{team_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_team(
    team_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a team (soft delete)"""
    await require_team_owner(team_id, current_user, db)
    
    team_service = TeamService(db)
    success = await team_service.delete_team(team_id)
    
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found")
    
    # Invalidate cache
    await invalidate_cache_pattern_async("teams:*")
    await invalidate_cache_pattern_async(f"team:{team_id}:*")
    
    return None


@router.get("/{team_id}/members", response_model=List[TeamMemberResponse])
async def list_team_members(
    team_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all members of a team"""
    await require_team_member(team_id, current_user, db)
    
    team_service = TeamService(db)
    members = await team_service.get_team_members(team_id)
    
    return [TeamMemberResponse.model_validate(team_member_to_dict(m)) for m in members]


@router.post("/{team_id}/members", response_model=TeamMemberResponse, status_code=status.HTTP_201_CREATED)
async def add_team_member(
    team_id: int,
    member_data: TeamMemberAdd,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Add a member to a team"""
    await require_team_permission(team_id, "teams:members:add", current_user, db)
    
    team_service = TeamService(db)
    team_member = await team_service.add_member(
        team_id=team_id,
        user_id=member_data.user_id,
        role_id=member_data.role_id,
    )
    
    # Create notification for new team member
    try:
        # Get team name
        team = await team_service.get_team(team_id)
        if team and member_data.user_id != current_user.id:
            template = NotificationTemplates.team_member_added(
                team_name=team.name,
                team_id=team.id
            )
            await create_notification_async(
                db=db,
                user_id=member_data.user_id,
                **template
            )
            logger.info(f"Created team member notification for user {member_data.user_id}")
    except Exception as notif_error:
        # Don't fail member addition if notification fails
        logger.error(f"Failed to create notification for team member: {notif_error}", exc_info=True)
    
    # Invalidate cache after adding member
    await invalidate_cache_pattern_async(f"team:{team_id}:*")
    await invalidate_cache_pattern_async("teams:*")
    
    # Reload member with relationships
    result = await db.execute(
        select(TeamMember)
        .where(TeamMember.id == team_member.id)
        .options(selectinload(TeamMember.user), selectinload(TeamMember.role))
    )
    reloaded_member = result.scalar_one_or_none()
    if reloaded_member:
        return TeamMemberResponse.model_validate(team_member_to_dict(reloaded_member))
    return TeamMemberResponse.model_validate(team_member_to_dict(team_member))


@router.put("/{team_id}/members/{user_id}", response_model=TeamMemberResponse)
async def update_team_member(
    team_id: int,
    user_id: int,
    member_data: TeamMemberUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a team member's role"""
    await require_team_permission(team_id, "teams:members:update", current_user, db)
    
    team_service = TeamService(db)
    team_member = await team_service.update_member_role(
        team_id=team_id,
        user_id=user_id,
        role_id=member_data.role_id,
    )
    
    if not team_member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team member not found")
    
    # Invalidate cache after updating member
    await invalidate_cache_pattern_async(f"team:{team_id}:*")
    await invalidate_cache_pattern_async("teams:*")
    
    # Reload member with relationships
    result = await db.execute(
        select(TeamMember)
        .where(TeamMember.id == team_member.id)
        .options(selectinload(TeamMember.user), selectinload(TeamMember.role))
    )
    reloaded_member = result.scalar_one_or_none()
    if reloaded_member:
        return TeamMemberResponse.model_validate(team_member_to_dict(reloaded_member))
    return TeamMemberResponse.model_validate(team_member_to_dict(team_member))


@router.delete("/{team_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_team_member(
    team_id: int,
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Remove a member from a team"""
    await require_team_permission(team_id, "teams:members:remove", current_user, db)
    
    # Cannot remove yourself
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot remove yourself from team",
        )
    
    team_service = TeamService(db)
    success = await team_service.remove_member(team_id, user_id)
    
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team member not found")
    
    # Invalidate cache after removing member
    await invalidate_cache_pattern_async(f"team:{team_id}:*")
    await invalidate_cache_pattern_async("teams:*")
    
    return None

