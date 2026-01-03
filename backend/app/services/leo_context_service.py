"""
Leo Context Service
Service for building ERP context for Leo AI assistant
"""

from typing import Dict, Any, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, func, and_
from sqlalchemy.orm import selectinload

from app.models.contact import Contact
from app.models.company import Company
from app.models.project import Project, ProjectStatus
from app.core.logging import logger

try:
    from app.modules.commercial.models.pipeline import Opportunite
    OPPORTUNITIES_AVAILABLE = True
except ImportError:
    OPPORTUNITIES_AVAILABLE = False
    logger.warning("Opportunite model not available")


class LeoContextService:
    """Service for building ERP context for Leo"""

    MAX_ITEMS_PER_TYPE = 20  # Maximum items per data type

    def __init__(self, db: AsyncSession):
        self.db = db

    def analyze_query(self, query: str) -> Dict[str, bool]:
        """Analyze the query to determine which data types are relevant"""
        query_lower = query.lower()
        
        # Keywords for each data type
        contact_keywords = ["contact", "personne", "client", "prospect", "personnel"]
        company_keywords = ["entreprise", "company", "société", "client", "clients", "organisation"]
        opportunity_keywords = ["opportunité", "opportunite", "deal", "affaire", "vente", "pipeline"]
        project_keywords = ["projet", "project", "mission"]
        invoice_keywords = ["facture", "invoice", "facturation", "facturé"]
        event_keywords = ["événement", "event", "rdv", "réunion", "meeting", "rendez-vous"]
        employee_keywords = ["employé", "employee", "collègue", "équipe", "team"]
        
        return {
            "contacts": any(word in query_lower for word in contact_keywords),
            "companies": any(word in query_lower for word in company_keywords),
            "opportunities": any(word in query_lower for word in opportunity_keywords) if OPPORTUNITIES_AVAILABLE else False,
            "projects": any(word in query_lower for word in project_keywords),
            "invoices": any(word in query_lower for word in invoice_keywords),
            "events": any(word in query_lower for word in event_keywords),
            "employees": any(word in query_lower for word in employee_keywords),
        }

    def _extract_keywords(self, query: str) -> List[str]:
        """Extract keywords from query (simple implementation)"""
        # Remove common words
        stop_words = {
            "le", "la", "les", "un", "une", "des", "de", "du", "et", "ou", "à", "dans", "sur",
            "pour", "avec", "sans", "par", "mon", "ma", "mes", "nos", "notre", "vos", "votre",
            "qui", "que", "quoi", "comment", "combien", "où", "quand", "pourquoi", "est", "sont",
            "a", "ont", "avoir", "être", "faire", "fait", "peux", "peut", "pouvez", "pouvons"
        }
        
        # Split and filter
        words = query.lower().split()
        keywords = [w.strip(".,!?;:()[]{}") for w in words if w not in stop_words and len(w) > 2]
        
        return keywords[:5]  # Limit to 5 keywords

    async def get_relevant_contacts(
        self,
        user_id: int,
        query: str,
        limit: int = None
    ) -> List[Dict[str, Any]]:
        """Get relevant contacts based on query"""
        if limit is None:
            limit = self.MAX_ITEMS_PER_TYPE
        
        try:
            keywords = self._extract_keywords(query)
            
            # Build query
            stmt = select(Contact).options(
                selectinload(Contact.company),
                selectinload(Contact.employee)
            )
            
            # Filter by keywords if any
            if keywords:
                conditions = []
                for keyword in keywords:
                    conditions.extend([
                        Contact.first_name.ilike(f"%{keyword}%"),
                        Contact.last_name.ilike(f"%{keyword}%"),
                        Contact.email.ilike(f"%{keyword}%"),
                        Contact.position.ilike(f"%{keyword}%"),
                        Contact.city.ilike(f"%{keyword}%"),
                        Contact.country.ilike(f"%{keyword}%"),
                    ])
                stmt = stmt.where(or_(*conditions))
            
            # Limit results
            stmt = stmt.limit(limit)
            
            # Execute
            result = await self.db.execute(stmt)
            contacts = result.scalars().all()
            
            # Format results
            formatted = []
            for contact in contacts:
                formatted.append({
                    "id": contact.id,
                    "nom_complet": f"{contact.first_name} {contact.last_name}",
                    "email": contact.email,
                    "telephone": contact.phone,
                    "position": contact.position,
                    "entreprise": contact.company.name if contact.company else None,
                    "ville": contact.city,
                    "pays": contact.country,
                    "cercle": contact.circle,
                })
            
            return formatted
        except Exception as e:
            logger.error(f"Error getting relevant contacts: {e}", exc_info=True)
            return []

    async def get_relevant_companies(
        self,
        user_id: int,
        query: str,
        limit: int = None
    ) -> List[Dict[str, Any]]:
        """Get relevant companies based on query"""
        if limit is None:
            limit = self.MAX_ITEMS_PER_TYPE
        
        try:
            keywords = self._extract_keywords(query)
            
            # Build query
            stmt = select(Company)
            
            # Filter by keywords if any
            if keywords:
                conditions = []
                for keyword in keywords:
                    conditions.extend([
                        Company.name.ilike(f"%{keyword}%"),
                        Company.description.ilike(f"%{keyword}%"),
                        Company.city.ilike(f"%{keyword}%"),
                        Company.country.ilike(f"%{keyword}%"),
                    ])
                stmt = stmt.where(or_(*conditions))
            
            # Check if query mentions "client" or "clients"
            query_lower = query.lower()
            if "client" in query_lower or "clients" in query_lower:
                stmt = stmt.where(Company.is_client == True)
            
            # Limit results
            stmt = stmt.limit(limit)
            
            # Execute
            result = await self.db.execute(stmt)
            companies = result.scalars().all()
            
            # Format results
            formatted = []
            for company in companies:
                formatted.append({
                    "id": company.id,
                    "name": company.name,
                    "description": company.description,
                    "ville": company.city,
                    "pays": company.country,
                    "is_client": company.is_client,
                    "email": company.email,
                    "telephone": company.phone,
                    "website": company.website,
                })
            
            return formatted
        except Exception as e:
            logger.error(f"Error getting relevant companies: {e}", exc_info=True)
            return []

    async def get_relevant_opportunities(
        self,
        user_id: int,
        query: str,
        limit: int = None
    ) -> List[Dict[str, Any]]:
        """Get relevant opportunities based on query"""
        if not OPPORTUNITIES_AVAILABLE:
            return []
        
        if limit is None:
            limit = self.MAX_ITEMS_PER_TYPE
        
        try:
            from app.modules.commercial.models.pipeline import Opportunite
            
            keywords = self._extract_keywords(query)
            
            # Build query
            stmt = select(Opportunite)
            
            # Filter by keywords if any
            if keywords:
                conditions = []
                for keyword in keywords:
                    conditions.extend([
                        Opportunite.name.ilike(f"%{keyword}%"),
                        Opportunite.description.ilike(f"%{keyword}%"),
                    ])
                stmt = stmt.where(or_(*conditions))
            
            # Limit results
            stmt = stmt.limit(limit)
            
            # Execute
            result = await self.db.execute(stmt)
            opportunities = result.scalars().all()
            
            # Format results
            formatted = []
            for opp in opportunities:
                formatted.append({
                    "id": str(opp.id),
                    "nom": opp.name,
                    "description": opp.description,
                    "montant": float(opp.amount) if opp.amount else None,
                    "probabilite": opp.probability,
                    "statut": opp.status,
                })
            
            return formatted
        except Exception as e:
            logger.error(f"Error getting relevant opportunities: {e}", exc_info=True)
            return []

    async def get_relevant_projects(
        self,
        user_id: int,
        query: str,
        limit: int = None
    ) -> List[Dict[str, Any]]:
        """Get relevant projects based on query"""
        if limit is None:
            limit = self.MAX_ITEMS_PER_TYPE
        
        try:
            keywords = self._extract_keywords(query)
            query_lower = query.lower()
            
            # Build query
            stmt = select(Project)
            
            # Filter by status if mentioned
            if "en cours" in query_lower or "actif" in query_lower or "active" in query_lower:
                stmt = stmt.where(Project.status == ProjectStatus.ACTIVE)
            elif "terminé" in query_lower or "complété" in query_lower or "completed" in query_lower:
                stmt = stmt.where(Project.status == ProjectStatus.COMPLETED)
            elif "archivé" in query_lower or "archived" in query_lower:
                stmt = stmt.where(Project.status == ProjectStatus.ARCHIVED)
            
            # Filter by keywords if any
            if keywords:
                conditions = []
                for keyword in keywords:
                    conditions.extend([
                        Project.name.ilike(f"%{keyword}%"),
                        Project.description.ilike(f"%{keyword}%"),
                        Project.etape.ilike(f"%{keyword}%"),
                    ])
                if conditions:
                    stmt = stmt.where(or_(*conditions))
            
            # Limit results
            stmt = stmt.limit(limit)
            
            # Execute
            result = await self.db.execute(stmt)
            projects = result.scalars().all()
            
            # Format results
            formatted = []
            for project in projects:
                formatted.append({
                    "id": project.id,
                    "name": project.name,
                    "description": project.description[:200] if project.description else None,  # Truncate
                    "status": project.status.value if project.status else None,
                    "budget": float(project.budget) if project.budget else None,
                    "etape": project.etape,
                    "start_date": project.start_date.isoformat() if project.start_date else None,
                    "end_date": project.end_date.isoformat() if project.end_date else None,
                })
            
            return formatted
        except Exception as e:
            logger.error(f"Error getting relevant projects: {e}", exc_info=True)
            return []

    async def get_relevant_data(
        self,
        user_id: int,
        data_types: Dict[str, bool],
        query: str
    ) -> Dict[str, List[Dict[str, Any]]]:
        """Get relevant data based on data types"""
        result = {}
        
        if data_types.get("contacts"):
            result["contacts"] = await self.get_relevant_contacts(user_id, query)
        
        if data_types.get("companies"):
            result["companies"] = await self.get_relevant_companies(user_id, query)
        
        if data_types.get("opportunities"):
            result["opportunities"] = await self.get_relevant_opportunities(user_id, query)
        
        if data_types.get("projects"):
            result["projects"] = await self.get_relevant_projects(user_id, query)
        
        return result

    async def build_context_string(
        self,
        data: Dict[str, List[Dict[str, Any]]],
        query: str
    ) -> str:
        """Format data into readable context string"""
        context_parts = []
        
        if data.get("contacts"):
            context_parts.append("=== CONTACTS ===")
            for contact in data["contacts"][:10]:  # Limit to 10 for context
                parts = [f"- {contact['nom_complet']}"]
                if contact.get("email"):
                    parts.append(f"({contact['email']})")
                if contact.get("position"):
                    parts.append(f"- {contact['position']}")
                if contact.get("entreprise"):
                    parts.append(f"chez {contact['entreprise']}")
                if contact.get("ville"):
                    parts.append(f"- {contact['ville']}")
                context_parts.append(" ".join(parts))
            context_parts.append("")
        
        if data.get("companies"):
            context_parts.append("=== ENTREPRISES ===")
            for company in data["companies"][:10]:
                parts = [f"- {company['name']}"]
                if company.get("ville") or company.get("pays"):
                    location = ", ".join(filter(None, [company.get("ville"), company.get("pays")]))
                    parts.append(f"- {location}")
                if company.get("is_client"):
                    parts.append("- Client")
                else:
                    parts.append("- Prospect")
                context_parts.append(" ".join(parts))
            context_parts.append("")
        
        if data.get("opportunities"):
            context_parts.append("=== OPPORTUNITÉS ===")
            for opp in data["opportunities"][:10]:
                parts = [f"- {opp['nom']}"]
                if opp.get("montant"):
                    parts.append(f"- Montant: {opp['montant']}€")
                if opp.get("statut"):
                    parts.append(f"- Statut: {opp['statut']}")
                context_parts.append(" ".join(parts))
            context_parts.append("")
        
        if data.get("projects"):
            context_parts.append("=== PROJETS ===")
            for project in data["projects"][:10]:
                parts = [f"- {project['name']}"]
                if project.get("status"):
                    parts.append(f"- Statut: {project['status']}")
                if project.get("budget"):
                    parts.append(f"- Budget: {project['budget']}€")
                if project.get("etape"):
                    parts.append(f"- Étape: {project['etape']}")
                context_parts.append(" ".join(parts))
            context_parts.append("")
        
        return "\n".join(context_parts)
