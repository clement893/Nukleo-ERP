"""
Leo Context Service
Service for building ERP context for Leo AI assistant
"""

from typing import Dict, Any, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, func, and_
from sqlalchemy.orm import selectinload

from app.core.logging import logger

# Lazy imports to avoid MetaData conflicts - import from app.models which already has them registered
OPPORTUNITIES_AVAILABLE = None
EMPLOYEES_AVAILABLE = None

def _get_contact_model():
    """Get Contact model from app.models to avoid MetaData conflicts"""
    from app.models import Contact
    return Contact

def _get_company_model():
    """Get Company model from app.models to avoid MetaData conflicts"""
    from app.models import Company
    return Company

def _get_project_model():
    """Get Project model from app.models to avoid MetaData conflicts"""
    from app.models import Project, ProjectStatus
    return Project, ProjectStatus

def _get_opportunite_model():
    """Get Opportunite model with availability check"""
    global OPPORTUNITIES_AVAILABLE
    if OPPORTUNITIES_AVAILABLE is False:
        return None
    try:
        from app.models import Opportunite
        OPPORTUNITIES_AVAILABLE = True
        return Opportunite
    except (ImportError, AttributeError) as e:
        OPPORTUNITIES_AVAILABLE = False
        logger.debug(f"Opportunite model not available: {e}")
        return None

def _get_employee_model():
    """Get Employee model from app.models to avoid MetaData conflicts"""
    global EMPLOYEES_AVAILABLE
    if EMPLOYEES_AVAILABLE is False:
        return None
    try:
        from app.models import Employee
        EMPLOYEES_AVAILABLE = True
        return Employee
    except (ImportError, AttributeError) as e:
        EMPLOYEES_AVAILABLE = False
        logger.debug(f"Employee model not available: {e}")
        return None


class LeoContextService:
    """Service for building ERP context for Leo"""

    MAX_ITEMS_PER_TYPE = 20  # Maximum items per data type

    def __init__(self, db: AsyncSession):
        self.db = db

    def analyze_query(self, query: str) -> Dict[str, bool]:
        """Analyze the query to determine which data types are relevant"""
        query_lower = query.lower()
        
        # Keywords for each data type
        contact_keywords = ["contact", "personne", "client", "prospect", "personnel", "qui est", "qui", "nommé", "appelé", "connais", "connais-tu", "connaissez"]
        company_keywords = ["entreprise", "company", "société", "client", "clients", "organisation", "combien de client", "combien de clients", "avons nous", "avons-nous"]
        opportunity_keywords = ["opportunité", "opportunite", "deal", "affaire", "vente", "pipeline"]
        project_keywords = ["projet", "project", "mission"]
        invoice_keywords = ["facture", "invoice", "facturation", "facturé"]
        event_keywords = ["événement", "event", "rdv", "réunion", "meeting", "rendez-vous"]
        employee_keywords = ["employé", "employés", "employee", "employees", "collègue", "collègues", "équipe", "team", "mes employés", "nos employés", "qui sont nos", "qui sont mes"]
        
        # Check if query contains what looks like a person name
        # This includes capitalized words AND single lowercase words that could be names
        has_potential_name = False
        words = query.split()
        if len(words) > 0:
            # Check for capitalized words that might be names
            capitalized_words = [w for w in words if w and w[0].isupper() and len(w) > 2]
            # If we have 2+ capitalized words or a capitalized word that's not a common word, likely a name
            if len(capitalized_words) >= 2:
                has_potential_name = True
            elif len(capitalized_words) == 1 and capitalized_words[0].lower() not in ["le", "la", "les", "un", "une", "des", "de", "du", "et", "ou", "à", "dans", "sur", "pour", "avec", "sans", "par"]:
                has_potential_name = True
            
            # Also check for single lowercase words that could be names (e.g., "fabien")
            # If query is just one or two words and they're not common words, might be a name
            if len(words) <= 2:
                non_stop_words = [w.lower().strip(".,!?;:()[]{}") for w in words 
                                 if w.lower().strip(".,!?;:()[]{}") not in ["le", "la", "les", "un", "une", "des", "de", "du", "et", "ou", "à", "dans", "sur", "pour", "avec", "sans", "par", "qui", "est", "sont", "nos", "mes", "nos", "vos", "votre", "notre", "contact", "contacts", "client", "clients", "employé", "employés"]]
                if len(non_stop_words) > 0 and all(len(w) > 2 for w in non_stop_words):
                    has_potential_name = True
        
        # Check for "qui est" pattern (who is) - this strongly suggests a person query
        has_qui_est = "qui est" in query_lower or "c'est qui" in query_lower or "c est qui" in query_lower
        
        # Check for employee queries (more specific)
        is_employee_query = any(word in query_lower for word in employee_keywords)
        
        # Check for general queries about contacts/companies/employees
        is_general_contact_query = any(phrase in query_lower for phrase in ["connais-tu", "connais tu", "connaissez-vous", "connaissez vous", "nos contacts", "mes contacts", "qui sont nos", "qui sont mes"])
        is_general_company_query = any(phrase in query_lower for phrase in ["combien de client", "combien de clients", "nos clients", "mes clients", "avons nous", "avons-nous"])
        
        # Check availability lazily
        opp_available = _get_opportunite_model() is not None if OPPORTUNITIES_AVAILABLE is None else OPPORTUNITIES_AVAILABLE
        emp_available = _get_employee_model() is not None if EMPLOYEES_AVAILABLE is None else EMPLOYEES_AVAILABLE
        
        return {
            "contacts": any(word in query_lower for word in contact_keywords) or has_potential_name or has_qui_est or is_general_contact_query,
            "companies": any(word in query_lower for word in company_keywords) or is_general_company_query,
            "opportunities": any(word in query_lower for word in opportunity_keywords) if opp_available else False,
            "projects": any(word in query_lower for word in project_keywords),
            "invoices": any(word in query_lower for word in invoice_keywords),
            "events": any(word in query_lower for word in event_keywords),
            "employees": is_employee_query if emp_available else False,
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
            
            # Also extract potential names (capitalized words) - keep original case
            words = query.split()
            potential_names = [w.strip(".,!?;:()[]{}") for w in words if w and w[0].isupper() and len(w.strip(".,!?;:()[]{}")) > 2]
            
            # Also check for names in lowercase (after stop word removal, names might be lowercase)
            # If query has "qui est daly ann", after stop words we might have "daly ann" in lowercase
            # So we also check for words that look like names (2+ consecutive words that aren't stop words)
            query_lower = query.lower()
            stop_words_set = {"le", "la", "les", "un", "une", "des", "de", "du", "et", "ou", "à", "dans", "sur", "pour", "avec", "sans", "par", "mon", "ma", "mes", "nos", "notre", "vos", "votre", "qui", "que", "quoi", "comment", "combien", "où", "quand", "pourquoi", "est", "sont", "a", "ont", "avoir", "être", "faire", "fait", "peux", "peut", "pouvez", "pouvons"}
            remaining_words = [w.strip(".,!?;:()[]{}") for w in query_lower.split() 
                             if w.strip(".,!?;:()[]{}") not in stop_words_set 
                             and len(w.strip(".,!?;:()[]{}")) > 2]
            
            # If we have 2+ remaining words that aren't stop words, they might be a name
            if len(remaining_words) >= 2:
                # Try combining them as a full name (e.g., "daly ann" -> "Daly Ann")
                combined_lower = " ".join(remaining_words[:2])
                # Capitalize first letter of each word for search
                combined_capitalized = " ".join([w.capitalize() for w in remaining_words[:2]])
                keywords.append(combined_lower)
                potential_names.append(combined_capitalized)
            
            # Add potential names to keywords (keep original case for name matching)
            all_keywords = list(set(keywords + potential_names))
            
            # Also try combining consecutive capitalized words as full names
            if len(potential_names) >= 2:
                for i in range(len(potential_names) - 1):
                    combined_name = f"{potential_names[i]} {potential_names[i+1]}"
                    if combined_name not in all_keywords:
                        all_keywords.append(combined_name)
            
            # Lazy import to avoid MetaData conflicts
            Contact = _get_contact_model()
            
            # Build query
            stmt = select(Contact).options(
                selectinload(Contact.company),
                selectinload(Contact.employee)
            )
            
            # Check if this is a general query about contacts
            query_lower = query.lower()
            is_general_query = any(phrase in query_lower for phrase in [
                "connais-tu", "connais tu", "connaissez-vous", "connaissez vous", 
                "nos contacts", "mes contacts", "qui sont nos", "qui sont mes"
            ])
            
            # Also check for single word queries that might be names (e.g., "fabien")
            is_single_word_name = len(words) == 1 and len(words[0].strip(".,!?;:()[]{}")) > 2 and words[0].strip(".,!?;:()[]{}").lower() not in ["le", "la", "les", "un", "une", "des", "de", "du", "et", "ou", "à", "dans", "sur", "pour", "avec", "sans", "par", "qui", "est", "sont", "nos", "mes", "contact", "contacts", "client", "clients"]
            
            # Filter by keywords if any
            if all_keywords:
                conditions = []
                for keyword in all_keywords:
                    keyword_lower = keyword.lower()
                    # Search in various fields (case-insensitive)
                    conditions.extend([
                        Contact.first_name.ilike(f"%{keyword_lower}%"),
                        Contact.last_name.ilike(f"%{keyword_lower}%"),
                        Contact.email.ilike(f"%{keyword_lower}%"),
                        Contact.position.ilike(f"%{keyword_lower}%"),
                        Contact.city.ilike(f"%{keyword_lower}%"),
                        Contact.country.ilike(f"%{keyword_lower}%"),
                    ])
                    # Also try with original case for names (e.g., "Daly", "Ann")
                    if keyword[0].isupper():
                        conditions.extend([
                            Contact.first_name.ilike(f"%{keyword}%"),
                            Contact.last_name.ilike(f"%{keyword}%"),
                            # Try combining first and last name (e.g., "Daly Ann" -> search for both)
                            func.concat(Contact.first_name, ' ', Contact.last_name).ilike(f"%{keyword}%"),
                            # Also try reversed (last name first)
                            func.concat(Contact.last_name, ' ', Contact.first_name).ilike(f"%{keyword}%"),
                        ])
                stmt = stmt.where(or_(*conditions))
            elif is_single_word_name:
                # Single word that might be a name (e.g., "fabien")
                word = words[0].strip(".,!?;:()[]{}")
                word_lower = word.lower()
                conditions = [
                    Contact.first_name.ilike(f"%{word_lower}%"),
                    Contact.last_name.ilike(f"%{word_lower}%"),
                    Contact.first_name.ilike(f"%{word.capitalize()}%"),
                    Contact.last_name.ilike(f"%{word.capitalize()}%"),
                    func.concat(Contact.first_name, ' ', Contact.last_name).ilike(f"%{word_lower}%"),
                    func.concat(Contact.first_name, ' ', Contact.last_name).ilike(f"%{word.capitalize()}%"),
                ]
                stmt = stmt.where(or_(*conditions))
            elif is_general_query:
                # For general queries, return all contacts (no filter, just limit)
                limit = min(limit * 3, 100)  # Increase limit for general queries
            else:
                # If no keywords but query contains capitalized words, still search
                # This handles cases like "Daly Ann" where stop words might filter everything
                capitalized_words = [w.strip(".,!?;:()[]{}") for w in words if w and w[0].isupper() and len(w) > 2]
                if capitalized_words:
                    conditions = []
                    for word in capitalized_words:
                        word_lower = word.lower()
                        conditions.extend([
                            Contact.first_name.ilike(f"%{word_lower}%"),
                            Contact.last_name.ilike(f"%{word_lower}%"),
                            Contact.first_name.ilike(f"%{word}%"),
                            Contact.last_name.ilike(f"%{word}%"),
                            func.concat(Contact.first_name, ' ', Contact.last_name).ilike(f"%{word}%"),
                            func.concat(Contact.first_name, ' ', Contact.last_name).ilike(f"%{word_lower}%"),
                        ])
                    if conditions:
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
            
            logger.debug(f"Found {len(formatted)} contacts for query: {query}")
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
            
            # Lazy import to avoid MetaData conflicts
            Company = _get_company_model()
            
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
            is_client_query = any(phrase in query_lower for phrase in [
                "client", "clients", "nos clients", "mes clients", "combien de client", 
                "combien de clients", "avons nous", "avons-nous", "combien avons nous"
            ])
            if is_client_query:
                stmt = stmt.where(Company.is_client == True)
                # For client queries, increase limit significantly
                limit = min(limit * 5, 200)  # Much higher limit for client queries
                # Remove keyword filter if it's a general client query
                if not keywords or all(kw.lower() in ["client", "clients", "combien", "avons", "nous"] for kw in keywords):
                    # This is a general "how many clients" query, don't filter by keywords
                    stmt = select(Company).where(Company.is_client == True)
            
            # For general company queries (e.g., "notre entreprise"), return more results
            is_our_company_query = any(phrase in query_lower for phrase in [
                "notre entreprise", "notre société", "s'appelle", "nom de l'entreprise", 
                "comment s'appelle", "quel est le nom"
            ])
            if is_our_company_query:
                # Prioritize clients
                stmt = stmt.order_by(Company.is_client.desc())
                limit = min(limit * 3, 50)
            
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
        Opportunite = _get_opportunite_model()
        if Opportunite is None:
            return []
        
        if limit is None:
            limit = self.MAX_ITEMS_PER_TYPE
        
        try:
            from app.modules.commercial.models.pipeline import Opportunite
            
            Opportunite = _get_opportunite_model()
            if Opportunite is None:
                return []
            
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
            # Lazy import to avoid MetaData conflicts
            Project, ProjectStatus = _get_project_model()
            
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

    async def get_relevant_employees(
        self,
        user_id: int,
        query: str,
        limit: int = None
    ) -> List[Dict[str, Any]]:
        """Get relevant employees based on query"""
        Employee = _get_employee_model()
        if Employee is None:
            return []
        
        if limit is None:
            limit = self.MAX_ITEMS_PER_TYPE
        
        try:
            keywords = self._extract_keywords(query)
            
            # Also extract potential names (capitalized words)
            words = query.split()
            potential_names = [w.strip(".,!?;:()[]{}") for w in words if w and w[0].isupper() and len(w) > 2]
            all_keywords = list(set(keywords + potential_names))
            
            # Lazy import to avoid MetaData conflicts
            Employee = _get_employee_model()
            if Employee is None:
                return []
            
            # Build query
            stmt = select(Employee).options(
                selectinload(Employee.team),
                selectinload(Employee.user)
            )
            
            query_lower = query.lower()
            is_general_employee_query = any(phrase in query_lower for phrase in [
                "employé", "employee", "employés", "employees", "nos employés", "mes employés",
                "qui sont nos", "qui sont mes", "qui sont nos employés", "qui sont mes employés",
                "combien j'ai d'employés", "combien j'ai d'employé", "combien d'employés", "combien d'employé",
                "combien avons nous d'employés", "combien avons-nous d'employés"
            ])
            
            logger.info(f"Employee query analysis: query='{query}', is_general={is_general_employee_query}, all_keywords={all_keywords}")
            
            # Filter by keywords if any
            if all_keywords and not is_general_employee_query:
                conditions = []
                for keyword in all_keywords:
                    keyword_lower = keyword.lower()
                    # Search in various fields (case-insensitive)
                    conditions.extend([
                        Employee.first_name.ilike(f"%{keyword_lower}%"),
                        Employee.last_name.ilike(f"%{keyword_lower}%"),
                        Employee.email.ilike(f"%{keyword_lower}%"),
                    ])
                    # Also try with original case for names
                    if keyword[0].isupper():
                        conditions.extend([
                            Employee.first_name.ilike(f"%{keyword}%"),
                            Employee.last_name.ilike(f"%{keyword}%"),
                            func.concat(Employee.first_name, ' ', Employee.last_name).ilike(f"%{keyword}%"),
                            func.concat(Employee.last_name, ' ', Employee.first_name).ilike(f"%{keyword}%"),
                        ])
                stmt = stmt.where(or_(*conditions))
            # If it's a general query about employees, return all employees (no filter needed)
            elif is_general_employee_query:
                # Increase limit significantly for general queries
                limit = min(limit * 5, 200)
                logger.info(f"General employee query detected - returning all employees (limit: {limit})")
                # No filter - return all employees
            
            # Limit results
            stmt = stmt.limit(limit)
            
            # Execute
            logger.info(f"Executing employee query with limit={limit}")
            result = await self.db.execute(stmt)
            employees = result.scalars().all()
            logger.info(f"Found {len(employees)} employees in database")
            
            # Format results
            formatted = []
            for employee in employees:
                formatted.append({
                    "id": employee.id,
                    "nom_complet": f"{employee.first_name} {employee.last_name}",
                    "email": employee.email,
                    "telephone": employee.phone,
                    "poste": None,  # Employee model doesn't have job_title in this version
                    "equipe": employee.team.name if employee.team else None,
                    "date_embauche": employee.hire_date.isoformat() if employee.hire_date else None,
                    "numero_employe": employee.employee_number,
                })
            
            logger.debug(f"Found {len(formatted)} employees for query: {query}")
            return formatted
        except Exception as e:
            logger.error(f"Error getting relevant employees: {e}", exc_info=True)
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
        
        if data_types.get("employees"):
            result["employees"] = await self.get_relevant_employees(user_id, query)
        
        return result

    async def build_context_string(
        self,
        data: Dict[str, List[Dict[str, Any]]],
        query: str
    ) -> str:
        """Format data into readable context string"""
        context_parts = []
        query_lower = query.lower()
        
        # Detect counting queries
        is_counting_query = any(phrase in query_lower for phrase in [
            "combien", "how many", "nombre", "total", "count"
        ])
        
        if data.get("contacts"):
            total_contacts = len(data["contacts"])
            if is_counting_query:
                context_parts.append(f"=== CONTACTS (TOTAL: {total_contacts}) ===")
            else:
                context_parts.append("=== CONTACTS ===")
            
            # For counting queries, show more items or just the count
            max_contacts = 50 if is_counting_query else 10
            for contact in data["contacts"][:max_contacts]:
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
            
            if is_counting_query and total_contacts > max_contacts:
                context_parts.append(f"... et {total_contacts - max_contacts} autres contacts")
            context_parts.append("")
        
        if data.get("companies"):
            total_companies = len(data["companies"])
            clients_count = sum(1 for c in data["companies"] if c.get("is_client"))
            
            if is_counting_query:
                context_parts.append(f"=== ENTREPRISES (TOTAL: {total_companies}, CLIENTS: {clients_count}) ===")
            else:
                context_parts.append("=== ENTREPRISES ===")
            
            # For counting queries, show more items or prioritize clients
            max_companies = 100 if is_counting_query else 10
            
            # If counting query and asking about clients, prioritize showing clients
            if is_counting_query and any(word in query_lower for word in ["client", "clients"]):
                # Show all clients first, then prospects
                clients = [c for c in data["companies"] if c.get("is_client")]
                prospects = [c for c in data["companies"] if not c.get("is_client")]
                
                for company in clients[:max_companies]:
                    parts = [f"- {company['name']}"]
                    if company.get("ville") or company.get("pays"):
                        location = ", ".join(filter(None, [company.get("ville"), company.get("pays")]))
                        parts.append(f"- {location}")
                    parts.append("- Client")
                    context_parts.append(" ".join(parts))
                
                if len(clients) > max_companies:
                    context_parts.append(f"... et {len(clients) - max_companies} autres clients")
            else:
                # Regular display
                for company in data["companies"][:max_companies]:
                    parts = [f"- {company['name']}"]
                    if company.get("ville") or company.get("pays"):
                        location = ", ".join(filter(None, [company.get("ville"), company.get("pays")]))
                        parts.append(f"- {location}")
                    if company.get("is_client"):
                        parts.append("- Client")
                    else:
                        parts.append("- Prospect")
                    context_parts.append(" ".join(parts))
            
            if is_counting_query and total_companies > max_companies and not any(word in query_lower for word in ["client", "clients"]):
                context_parts.append(f"... et {total_companies - max_companies} autres entreprises")
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
        
        if data.get("employees"):
            context_parts.append("=== EMPLOYÉS ===")
            for employee in data["employees"][:10]:
                parts = [f"- {employee['nom_complet']}"]
                if employee.get("email"):
                    parts.append(f"({employee['email']})")
                if employee.get("poste"):
                    parts.append(f"- {employee['poste']}")
                if employee.get("equipe"):
                    parts.append(f"dans l'équipe {employee['equipe']}")
                if employee.get("numero_employe"):
                    parts.append(f"- N°: {employee['numero_employe']}")
                context_parts.append(" ".join(parts))
            context_parts.append("")
        
        return "\n".join(context_parts)
