"""
Invitation Service
Service for managing team/user invitations
"""

from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload
from datetime import datetime, timedelta, timezone
import os

from app.models import Invitation, Team, Role, User
from app.services.email_service import EmailService
from app.services.email_templates import EmailTemplates


class InvitationService:
    """Service for managing invitations"""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.email_service = EmailService()

    async def create_invitation(
        self,
        email: str,
        invited_by_id: int,
        team_id: Optional[int] = None,
        role_id: Optional[int] = None,
        message: Optional[str] = None,
        expires_in_days: int = 7,
    ) -> Invitation:
        """Create a new invitation"""
        token = Invitation.generate_token()
        expires_at = datetime.now(timezone.utc) + timedelta(days=expires_in_days)

        invitation = Invitation(
            email=email,
            token=token,
            team_id=team_id,
            role_id=role_id,
            invited_by_id=invited_by_id,
            message=message,
            expires_at=expires_at,
            status="pending",
        )
        self.db.add(invitation)
        await self.db.commit()
        await self.db.refresh(invitation)
        
        # Load relationships for response
        from sqlalchemy.orm import selectinload
        result = await self.db.execute(
            select(Invitation)
            .options(
                selectinload(Invitation.invited_by),
                selectinload(Invitation.team),
                selectinload(Invitation.role)
            )
            .where(Invitation.id == invitation.id)
        )
        invitation = result.scalar_one()

        # Send invitation email
        await self._send_invitation_email(invitation)

        return invitation

    async def _send_invitation_email(self, invitation: Invitation) -> None:
        """Send invitation email via SendGrid"""
        # Get team and role info
        team = None
        role = None
        invited_by = None

        if invitation.team_id:
            result = await self.db.execute(
                select(Team).where(Team.id == invitation.team_id)
            )
            team = result.scalar_one_or_none()

        if invitation.role_id:
            result = await self.db.execute(
                select(Role).where(Role.id == invitation.role_id)
            )
            role = result.scalar_one_or_none()

        result = await self.db.execute(
            select(User).where(User.id == invitation.invited_by_id)
        )
        invited_by = result.scalar_one_or_none()

        invited_by_name = f"{invited_by.first_name} {invited_by.last_name}".strip() if invited_by else "Quelqu'un"
        if not invited_by_name or invited_by_name == " ":
            invited_by_name = invited_by.email if invited_by else "Quelqu'un"

        # Generate invitation URL
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
        
        # If it's a user invitation (no team), use register endpoint with token
        if not invitation.team_id:
            invitation_url = f"{frontend_url}/auth/register?token={invitation.token}"
            expires_at_str = invitation.expires_at.strftime('%d/%m/%Y') if invitation.expires_at else None
            
            # Use the new user invitation template
            template = EmailTemplates.user_invitation(
                email=invitation.email,
                invited_by_name=invited_by_name,
                invitation_token=invitation.token,
                invitation_url=invitation_url,
                message=invitation.message,
                expires_at=expires_at_str,
            )
            
            try:
                self.email_service.send_email(
                    to_email=invitation.email,
                    subject=template["subject"],
                    html_content=template["html"],
                    text_content=template["text"],
                )
            except Exception as e:
                # Log error but don't fail invitation creation
                print(f"Failed to send invitation email: {e}")
            return

        # Team invitation (existing logic)
        invitation_url = f"{frontend_url}/invitations/accept?token={invitation.token}"

        subject = f"Invitation to join {team.name}" if team else "You've been invited!"
        html_content = f"""
        <h2>You've been invited!</h2>
        <p>Hello,</p>
        <p>{invited_by_name} has invited you to join <strong>{team.name if team else 'our platform'}</strong>.</p>
        {f'<p>Role: <strong>{role.name if role else "Member"}</strong></p>' if role else ''}
        {f'<p>{invitation.message}</p>' if invitation.message else ''}
        <p><a href="{invitation_url}" style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Accept Invitation</a></p>
        <p>Or copy this link: {invitation_url}</p>
        <p>This invitation expires on {invitation.expires_at.strftime('%Y-%m-%d')}.</p>
        """

        text_content = f"""
        You've been invited!
        
        Hello,
        
        {invited_by_name} has invited you to join {team.name if team else 'our platform'}.
        
        {f'Role: {role.name if role else "Member"}' if role else ''}
        
        {invitation.message if invitation.message else ''}
        
        Accept invitation: {invitation_url}
        
        This invitation expires on {invitation.expires_at.strftime('%Y-%m-%d')}.
        """

        # Send email
        try:
            self.email_service.send_email(
                to_email=invitation.email,
                subject=subject,
                html_content=EmailTemplates.get_base_template(html_content),
                text_content=text_content,
            )
        except Exception as e:
            # Log error but don't fail invitation creation
            print(f"Failed to send invitation email: {e}")

    async def get_invitation(self, token: str) -> Optional[Invitation]:
        """Get an invitation by token"""
        from sqlalchemy.orm import selectinload
        
        result = await self.db.execute(
            select(Invitation)
            .where(Invitation.token == token)
            .options(
                selectinload(Invitation.team),
                selectinload(Invitation.role),
                selectinload(Invitation.invited_by),
            )
        )
        return result.scalar_one_or_none()

    async def get_team_invitations(self, team_id: int) -> List[Invitation]:
        """Get all invitations for a team"""
        result = await self.db.execute(
            select(Invitation)
            .where(Invitation.team_id == team_id)
            .where(Invitation.status == "pending")
            .options(
                selectinload(Invitation.role),
                selectinload(Invitation.invited_by),
            )
            .order_by(Invitation.created_at.desc())
        )
        return list(result.scalars().all())

    async def accept_invitation(self, token: str, user_id: int) -> Optional[Invitation]:
        """Accept an invitation"""
        invitation = await self.get_invitation(token)
        if not invitation:
            return None

        if not invitation.is_valid():
            return None

        # Check if user email matches invitation email
        user_result = await self.db.execute(
            select(User).where(User.id == user_id)
        )
        user = user_result.scalar_one_or_none()
        if not user or user.email != invitation.email:
            raise ValueError("User email does not match invitation email")

        # Add user to team if team invitation
        if invitation.team_id:
            from app.services.team_service import TeamService
            from sqlalchemy import select
            team_service = TeamService(self.db)
            
            # Check if already a member
            if not await team_service.is_team_member(user_id, invitation.team_id):
                # Get default member role if no role specified
                if invitation.role_id:
                    role_id = invitation.role_id
                else:
                    # Look up "member" role by slug
                    member_role_result = await self.db.execute(
                        select(Role).where(Role.slug == "member")
                    )
                    member_role = member_role_result.scalar_one_or_none()
                    if not member_role:
                        raise ValueError("Default 'member' role not found")
                    role_id = member_role.id
                
                await team_service.add_member(
                    team_id=invitation.team_id,
                    user_id=user_id,
                    role_id=role_id,
                )

        # Assign role if specified
        if invitation.role_id:
            from app.services.rbac_service import RBACService
            rbac_service = RBACService(self.db)
            try:
                await rbac_service.assign_role(user_id, invitation.role_id)
            except ValueError:
                pass  # Role already assigned

        # Update invitation status
        invitation.status = "accepted"
        invitation.accepted_at = datetime.now(timezone.utc)
        await self.db.commit()
        await self.db.refresh(invitation)

        return invitation

    async def cancel_invitation(self, invitation_id: int) -> bool:
        """Cancel an invitation"""
        result = await self.db.execute(
            select(Invitation).where(Invitation.id == invitation_id)
        )
        invitation = result.scalar_one_or_none()
        if not invitation:
            return False

        if invitation.status != "pending":
            return False

        invitation.status = "cancelled"
        await self.db.commit()
        return True

    async def resend_invitation(self, invitation_id: int) -> Optional[Invitation]:
        """Resend an invitation email"""
        result = await self.db.execute(
            select(Invitation).where(Invitation.id == invitation_id)
        )
        invitation = result.scalar_one_or_none()
        if not invitation or invitation.status != "pending":
            return None

        await self._send_invitation_email(invitation)
        return invitation

    async def expire_old_invitations(self) -> int:
        """Expire old pending invitations"""
        result = await self.db.execute(
            select(Invitation)
            .where(Invitation.status == "pending")
            .where(Invitation.expires_at < datetime.now(timezone.utc))
        )
        invitations = result.scalars().all()
        
        count = 0
        for invitation in invitations:
            invitation.status = "expired"
            count += 1
        
        await self.db.commit()
        return count

