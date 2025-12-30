"""
Leo Agent Service
Service for managing Leo AI assistant conversations and context
"""

from typing import Dict, List, Optional
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from sqlalchemy.orm import selectinload

from app.models.user import User
from app.models.leo_conversation import LeoConversation, LeoMessage
from app.models.project import Project
from app.models.team import TeamMember
from app.services.rbac_service import RBACService


class LeoAgentService:
    """Service for managing Leo AI assistant interactions"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
        self.rbac_service = RBACService(db)
    
    async def get_user_context(self, user: User) -> Dict:
        """
        Get complete user context (roles, permissions, teams)
        
        Args:
            user: User object
            
        Returns:
            Dict with user context information
        """
        # Get roles
        roles = await self.rbac_service.get_user_roles(user.id)
        role_names = [role.slug for role in roles]
        
        # Get permissions
        permissions = await self.rbac_service.get_user_permissions(user.id)
        
        # Get teams
        teams_query = select(TeamMember).where(TeamMember.user_id == user.id)
        teams_result = await self.db.execute(teams_query)
        teams = teams_result.scalars().all()
        team_names = [team.team.name for team in teams if team.team]
        
        return {
            "user_id": user.id,
            "email": user.email,
            "name": f"{user.first_name or ''} {user.last_name or ''}".strip() or user.email,
            "roles": role_names,
            "permissions": sorted(list(permissions)),
            "teams": team_names,
            "is_superadmin": user.is_superadmin,
        }
    
    async def get_relevant_data(self, query: str, user: User) -> Dict:
        """
        Get relevant data based on the query
        
        Args:
            query: User query string
            user: User object
            
        Returns:
            Dict with relevant data
        """
        data = {}
        query_lower = query.lower()
        
        # Projects
        if any(word in query_lower for word in ['projet', 'project', 'mes projets', 'my projects']):
            projects_query = select(Project).where(Project.user_id == user.id)
            projects_result = await self.db.execute(projects_query)
            projects = projects_result.scalars().all()
            data['projects'] = [
                {
                    "id": p.id,
                    "name": p.name,
                    "description": p.description,
                    "status": p.status.value if hasattr(p.status, 'value') else str(p.status),
                    "created_at": p.created_at.isoformat() if p.created_at else None,
                }
                for p in projects[:10]  # Limit to 10
            ]
        
        # Add other data types as needed:
        # - Clients
        # - Invoices
        # - Orders
        # - Tasks
        # etc.
        
        return data
    
    async def format_data_for_ai(self, data: Dict) -> str:
        """
        Format data for AI context
        
        Args:
            data: Dict with relevant data
            
        Returns:
            Formatted string for AI context
        """
        context_parts = []
        
        if 'projects' in data:
            projects = data['projects']
            context_parts.append("=== PROJETS DE L'UTILISATEUR ===\n")
            for project in projects:
                context_parts.append(
                    f"- {project['name']} (ID: {project['id']}, Statut: {project['status']})\n"
                    f"  Description: {project.get('description', 'N/A')}\n"
                )
        
        return "\n".join(context_parts)
    
    async def create_conversation(self, user_id: int, title: Optional[str] = None) -> LeoConversation:
        """
        Create a new conversation
        
        Args:
            user_id: User ID
            title: Optional conversation title (auto-generated if not provided)
            
        Returns:
            Created conversation
        """
        if not title:
            title = f"Conversation {datetime.now().strftime('%d/%m/%Y %H:%M')}"
        
        conversation = LeoConversation(
            user_id=user_id,
            title=title,
        )
        self.db.add(conversation)
        await self.db.commit()
        await self.db.refresh(conversation)
        return conversation
    
    async def add_message(
        self,
        conversation_id: int,
        role: str,
        content: str,
        metadata: Optional[Dict] = None,
    ) -> LeoMessage:
        """
        Add a message to a conversation
        
        Args:
            conversation_id: Conversation ID
            role: Message role ('user' or 'assistant')
            content: Message content
            metadata: Optional metadata dict
            
        Returns:
            Created message
        """
        message = LeoMessage(
            conversation_id=conversation_id,
            role=role,
            content=content,
            metadata=metadata or {},
        )
        self.db.add(message)
        
        # Update conversation updated_at
        conversation = await self.db.get(LeoConversation, conversation_id)
        if conversation:
            conversation.updated_at = datetime.utcnow()
        
        await self.db.commit()
        await self.db.refresh(message)
        return message
    
    async def get_conversation_messages(self, conversation_id: int) -> List[LeoMessage]:
        """
        Get all messages for a conversation
        
        Args:
            conversation_id: Conversation ID
            
        Returns:
            List of messages ordered by created_at
        """
        query = select(LeoMessage).where(
            LeoMessage.conversation_id == conversation_id
        ).order_by(LeoMessage.created_at.asc())
        result = await self.db.execute(query)
        return list(result.scalars().all())
    
    async def get_user_conversations(
        self,
        user_id: int,
        limit: int = 20,
        skip: int = 0
    ) -> tuple[List[LeoConversation], int]:
        """
        Get conversations for a user
        
        Args:
            user_id: User ID
            limit: Maximum number of conversations
            skip: Number of conversations to skip
            
        Returns:
            Tuple of (conversations list, total count)
        """
        # Get total count
        count_query = select(func.count()).select_from(LeoConversation).where(
            LeoConversation.user_id == user_id
        )
        total_result = await self.db.execute(count_query)
        total = total_result.scalar() or 0
        
        # Get conversations
        query = select(LeoConversation).where(
            LeoConversation.user_id == user_id
        ).order_by(desc(LeoConversation.updated_at)).offset(skip).limit(limit)
        result = await self.db.execute(query)
        conversations = list(result.scalars().all())
        
        return conversations, total
    
    async def get_conversation(self, conversation_id: int, user_id: int) -> Optional[LeoConversation]:
        """
        Get a specific conversation (only if it belongs to the user)
        
        Args:
            conversation_id: Conversation ID
            user_id: User ID (for security check)
            
        Returns:
            Conversation or None
        """
        query = select(LeoConversation).where(
            LeoConversation.id == conversation_id,
            LeoConversation.user_id == user_id
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()
