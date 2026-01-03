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
from app.modules.leo.models import LeoConversation, LeoMessage
from app.models.project import Project
from app.models.team import Team, TeamMember
from app.models.invoice import Invoice
from app.models.contact import Contact
from app.models.company import Company
from app.models.project_task import ProjectTask
from app.services.rbac_service import RBACService


class LeoAgentService:
    """Service for managing Leo AI assistant interactions"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
        self.rbac_service = RBACService(db)
    
    async def get_user_context(self, user: User) -> Dict:
        """
        Get complete user context (roles, permissions, teams, statistics)
        
        Args:
            user: User object
            
        Returns:
            Dict with user context information
        """
        # Get roles - convert to simple values to avoid greenlet_spawn errors
        roles = await self.rbac_service.get_user_roles(user.id)
        # Convert roles to list of slugs immediately to avoid async context issues
        # Access all attributes in a loop to ensure they're loaded before async context ends
        role_names = []
        for role in roles:
            # Access slug attribute immediately while still in async context
            slug_value = role.slug
            role_names.append(str(slug_value))
        
        # Get permissions
        permissions = await self.rbac_service.get_user_permissions(user.id)
        
        # Get teams (using join to avoid lazy loading issues in async context)
        teams_query = select(Team.name).join(TeamMember, Team.id == TeamMember.team_id).where(
            TeamMember.user_id == user.id
        ).where(Team.is_active == True).where(TeamMember.is_active == True)
        teams_result = await self.db.execute(teams_query)
        # Convert team names to strings immediately to avoid greenlet_spawn errors
        team_names = [str(name) for name in teams_result.scalars().all()]
        
        # Get statistics
        # Count projects
        projects_count_query = select(func.count()).select_from(Project).where(
            Project.user_id == user.id
        )
        projects_count_result = await self.db.execute(projects_count_query)
        projects_count = projects_count_result.scalar() or 0
        
        # Count invoices
        invoices_count_query = select(func.count()).select_from(Invoice).where(
            Invoice.user_id == user.id
        )
        invoices_count_result = await self.db.execute(invoices_count_query)
        invoices_count = invoices_count_result.scalar() or 0
        
        # Count assigned tasks
        tasks_count_query = select(func.count()).select_from(ProjectTask).where(
            ProjectTask.assignee_id == user.id
        )
        tasks_count_result = await self.db.execute(tasks_count_query)
        tasks_count = tasks_count_result.scalar() or 0
        
        # Count assigned contacts
        contacts_count_query = select(func.count()).select_from(Contact).where(
            Contact.employee_id == user.id
        )
        contacts_count_result = await self.db.execute(contacts_count_query)
        contacts_count = contacts_count_result.scalar() or 0
        
        # Access all user attributes immediately to avoid greenlet_spawn errors
        user_id = user.id
        user_email = str(user.email) if user.email else ""
        user_first_name = str(user.first_name) if user.first_name else ""
        user_last_name = str(user.last_name) if user.last_name else ""
        user_name = f"{user_first_name} {user_last_name}".strip() or user_email
        user_is_superadmin = bool(user.is_superadmin) if user.is_superadmin is not None else False
        
        return {
            "user_id": user_id,
            "email": user_email,
            "name": user_name,
            "roles": role_names,
            "permissions": sorted(list(permissions)),
            "teams": team_names,
            "is_superadmin": user_is_superadmin,
            "statistics": {
                "projects_count": projects_count,
                "invoices_count": invoices_count,
                "tasks_count": tasks_count,
                "contacts_count": contacts_count,
            },
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
        project_keywords = ['projet', 'project', 'mes projets', 'my projects', 'tâche', 'task']
        if any(word in query_lower for word in project_keywords):
            projects_query = select(Project).where(Project.user_id == user.id).order_by(
                desc(Project.created_at)
            )
            projects_result = await self.db.execute(projects_query)
            projects = projects_result.scalars().all()
            # Convert projects to dict format immediately to avoid greenlet_spawn errors
            projects_list = []
            for p in projects[:10]:  # Limit to 10
                status_value = p.status.value if hasattr(p.status, 'value') else str(p.status)
                projects_list.append({
                    "id": p.id,
                    "name": str(p.name) if p.name else "",
                    "description": str(p.description) if p.description else "",
                    "status": status_value,
                    "created_at": p.created_at.isoformat() if p.created_at else None,
                })
            data['projects'] = projects_list
        
        # Tasks
        task_keywords = ['tâche', 'task', 'todo', 'à faire', 'en cours', 'bloqué']
        if any(word in query_lower for word in task_keywords):
            tasks_query = select(ProjectTask).where(
                ProjectTask.assignee_id == user.id
            ).order_by(desc(ProjectTask.created_at))
            tasks_result = await self.db.execute(tasks_query)
            tasks = tasks_result.scalars().all()
            # Convert tasks to dict format immediately to avoid greenlet_spawn errors
            tasks_list = []
            for t in tasks[:10]:  # Limit to 10
                status_value = t.status.value if hasattr(t.status, 'value') else str(t.status)
                priority_value = t.priority.value if hasattr(t.priority, 'value') else str(t.priority)
                tasks_list.append({
                    "id": t.id,
                    "title": str(t.title) if t.title else "",
                    "description": str(t.description) if t.description else "",
                    "status": status_value,
                    "priority": priority_value,
                    "created_at": t.created_at.isoformat() if t.created_at else None,
                })
            data['tasks'] = tasks_list
        
        # Invoices
        invoice_keywords = ['facture', 'invoice', 'paiement', 'payment', 'facturation', 'billing']
        if any(word in query_lower for word in invoice_keywords):
            invoices_query = select(Invoice).where(Invoice.user_id == user.id).order_by(
                desc(Invoice.created_at)
            )
            invoices_result = await self.db.execute(invoices_query)
            invoices = invoices_result.scalars().all()
            # Convert invoices to dict format immediately to avoid greenlet_spawn errors
            invoices_list = []
            for i in invoices[:10]:  # Limit to 10
                status_value = i.status.value if hasattr(i.status, 'value') else str(i.status)
                invoices_list.append({
                    "id": i.id,
                    "invoice_number": str(i.invoice_number) if i.invoice_number else "",
                    "amount_due": str(i.amount_due) if i.amount_due else "0",
                    "amount_paid": str(i.amount_paid) if i.amount_paid else "0",
                    "status": status_value,
                    "due_date": i.due_date.isoformat() if i.due_date else None,
                    "created_at": i.created_at.isoformat() if i.created_at else None,
                })
            data['invoices'] = invoices_list
        
        # Companies
        company_keywords = ['entreprise', 'company', 'société', 'client', 'customer', 'organisation']
        if any(word in query_lower for word in company_keywords):
            companies_query = select(Company).order_by(desc(Company.created_at))
            companies_result = await self.db.execute(companies_query)
            companies = companies_result.scalars().all()
            # Convert companies to dict format immediately to avoid greenlet_spawn errors
            companies_list = []
            for c in companies[:10]:  # Limit to 10
                companies_list.append({
                    "id": c.id,
                    "name": str(c.name) if c.name else "",
                    "description": str(c.description) if c.description else "",
                    "is_client": bool(c.is_client) if c.is_client is not None else False,
                    "city": str(c.city) if c.city else "",
                    "country": str(c.country) if c.country else "",
                    "created_at": c.created_at.isoformat() if c.created_at else None,
                })
            data['companies'] = companies_list
        
        # Contacts
        contact_keywords = ['contact', 'personne', 'person', 'client', 'prospect']
        if any(word in query_lower for word in contact_keywords):
            contacts_query = select(Contact).where(
                Contact.employee_id == user.id
            ).order_by(desc(Contact.created_at))
            contacts_result = await self.db.execute(contacts_query)
            contacts = contacts_result.scalars().all()
            # Convert contacts to dict format immediately to avoid greenlet_spawn errors
            contacts_list = []
            for c in contacts[:10]:  # Limit to 10
                contacts_list.append({
                    "id": c.id,
                    "first_name": str(c.first_name) if c.first_name else "",
                    "last_name": str(c.last_name) if c.last_name else "",
                    "email": str(c.email) if c.email else "",
                    "position": str(c.position) if c.position else "",
                    "circle": str(c.circle) if c.circle else "",
                    "company_id": c.company_id if c.company_id else None,
                    "created_at": c.created_at.isoformat() if c.created_at else None,
                })
            data['contacts'] = contacts_list
        
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
        
        if 'projects' in data and data['projects']:
            projects = data['projects']
            context_parts.append("=== PROJETS DE L'UTILISATEUR ===\n")
            for project in projects:
                context_parts.append(
                    f"- {project['name']} (ID: {project['id']}, Statut: {project['status']})\n"
                    f"  Description: {project.get('description', 'N/A')[:100]}...\n"
                )
            context_parts.append("")
        
        if 'tasks' in data and data['tasks']:
            tasks = data['tasks']
            context_parts.append("=== TÂCHES ASSIGNÉES ===\n")
            for task in tasks:
                context_parts.append(
                    f"- {task['title']} (ID: {task['id']}, Statut: {task['status']}, Priorité: {task['priority']})\n"
                    f"  Description: {task.get('description', 'N/A')[:100]}...\n"
                )
            context_parts.append("")
        
        if 'invoices' in data and data['invoices']:
            invoices = data['invoices']
            context_parts.append("=== FACTURES ===\n")
            for invoice in invoices:
                context_parts.append(
                    f"- Facture #{invoice.get('invoice_number', invoice['id'])} "
                    f"(ID: {invoice['id']}, Statut: {invoice['status']})\n"
                    f"  Montant dû: {invoice['amount_due']}, Montant payé: {invoice['amount_paid']}\n"
                    f"  Date d'échéance: {invoice.get('due_date', 'N/A')}\n"
                )
            context_parts.append("")
        
        if 'companies' in data and data['companies']:
            companies = data['companies']
            context_parts.append("=== ENTREPRISES ===\n")
            for company in companies:
                client_status = "Client" if company.get('is_client') else "Prospect"
                context_parts.append(
                    f"- {company['name']} (ID: {company['id']}, {client_status})\n"
                    f"  Localisation: {company.get('city', 'N/A')}, {company.get('country', 'N/A')}\n"
                    f"  Description: {company.get('description', 'N/A')[:100]}...\n"
                )
            context_parts.append("")
        
        if 'contacts' in data and data['contacts']:
            contacts = data['contacts']
            context_parts.append("=== CONTACTS ASSIGNÉS ===\n")
            for contact in contacts:
                context_parts.append(
                    f"- {contact['first_name']} {contact['last_name']} "
                    f"(ID: {contact['id']}, Cercle: {contact.get('circle', 'N/A')})\n"
                    f"  Email: {contact.get('email', 'N/A')}, Poste: {contact.get('position', 'N/A')}\n"
                )
            context_parts.append("")
        
        if not context_parts:
            return "Aucune donnée ERP pertinente trouvée pour cette requête."
        
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
            message_metadata=metadata or {},
        )
        self.db.add(message)
        
        # Update conversation updated_at
        # Use async query instead of db.get() which is synchronous
        conversation_query = select(LeoConversation).where(LeoConversation.id == conversation_id)
        conversation_result = await self.db.execute(conversation_query)
        conversation = conversation_result.scalar_one_or_none()
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
    
    async def delete_conversation(self, conversation_id: int, user_id: int) -> bool:
        """
        Delete a conversation and all its messages (only if it belongs to the user)
        
        Args:
            conversation_id: Conversation ID
            user_id: User ID (for security check)
            
        Returns:
            True if deleted, False if not found
        """
        query = select(LeoConversation).where(
            LeoConversation.id == conversation_id,
            LeoConversation.user_id == user_id
        )
        result = await self.db.execute(query)
        conversation = result.scalar_one_or_none()
        
        if not conversation:
            return False
        
        # Delete conversation (messages will be deleted automatically due to cascade)
        await self.db.delete(conversation)
        await self.db.commit()
        return True
