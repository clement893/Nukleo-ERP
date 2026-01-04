"""
Leo Context Service
Service for building ERP context for Leo AI assistant
"""

from typing import Dict, Any, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, func, and_
from sqlalchemy.orm import selectinload

from app.core.logging import logger
from app.core.tenancy import scope_query

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

def _get_pipeline_model():
    """Get Pipeline model from app.models to avoid MetaData conflicts"""
    try:
        from app.models import Pipeline
        return Pipeline
    except (ImportError, AttributeError) as e:
        logger.debug(f"Pipeline model not available: {e}")
        return None

def _get_project_task_model():
    """Get ProjectTask model from app.models to avoid MetaData conflicts"""
    try:
        from app.models import ProjectTask, TaskStatus
        return ProjectTask, TaskStatus
    except (ImportError, AttributeError) as e:
        logger.debug(f"ProjectTask model not available: {e}")
        return None, None

def _get_vacation_request_model():
    """Get VacationRequest model from app.models to avoid MetaData conflicts"""
    try:
        from app.models import VacationRequest
        return VacationRequest
    except (ImportError, AttributeError) as e:
        logger.debug(f"VacationRequest model not available: {e}")
        return None

def _get_expense_account_model():
    """Get ExpenseAccount model from app.models to avoid MetaData conflicts"""
    try:
        from app.models import ExpenseAccount, ExpenseAccountStatus
        return ExpenseAccount, ExpenseAccountStatus
    except (ImportError, AttributeError) as e:
        logger.debug(f"ExpenseAccount model not available: {e}")
        return None, None

def _get_transaction_model():
    """Get Transaction model from app.models to avoid MetaData conflicts"""
    try:
        from app.models import Transaction, TransactionStatus
        return Transaction, TransactionStatus
    except (ImportError, AttributeError) as e:
        logger.debug(f"Transaction model not available: {e}")
        return None, None

def _get_time_entry_model():
    """Get TimeEntry model from app.models to avoid MetaData conflicts"""
    try:
        from app.models import TimeEntry
        return TimeEntry
    except (ImportError, AttributeError) as e:
        logger.debug(f"TimeEntry model not available: {e}")
        return None

def _get_invoice_model():
    """Get Invoice model from app.models to avoid MetaData conflicts"""
    try:
        from app.models import Invoice, InvoiceStatus
        return Invoice, InvoiceStatus
    except (ImportError, AttributeError) as e:
        logger.debug(f"Invoice model not available: {e}")
        return None, None


class LeoContextService:
    """Service for building ERP context for Leo"""

    MAX_ITEMS_PER_TYPE = 20  # Maximum items per data type

    def __init__(self, db: AsyncSession):
        self.db = db

    def analyze_query(self, query: str) -> Dict[str, bool]:
        """Analyze the query to determine which data types are relevant"""
        query_lower = query.lower()
        
        # Keywords for each data type (more tolerant to typos)
        contact_keywords = ["contact", "personne", "client", "prospect", "personnel", "qui est", "qui", "nommé", "appelé", "connais", "connais-tu", "connaissez"]
        company_keywords = ["entreprise", "company", "société", "client", "clients", "cleint", "cleints", "organisation", "combien de client", "combien de clients", "avons nous", "avons-nous", "module commercial"]
        opportunity_keywords = ["opportunité", "opportunite", "deal", "affaire", "vente"]
        pipeline_keywords = ["pipeline", "pipeline de vente", "pipelines", "pipeline commercial"]
        project_keywords = ["projet", "project", "mission", "proejt", "projets", "projects"]  # Include typos
        task_keywords = ["tâche", "task", "tache", "taches", "tâches", "en cours", "à faire", "todo", "doing", "done", "assigné", "assignee", "assignation"]
        vacation_keywords = ["vacance", "vacances", "congé", "congés", "holiday", "holidays", "demande", "demandes", "request", "requests"]
        expense_keywords = ["dépense", "dépenses", "expense", "expenses", "compte de dépense", "expense account", "remboursement", "reimbursement"]
        transaction_keywords = ["transaction", "transactions", "finances", "trésorerie", "argent", "cash", "liquidité", "liquidités", "manquer d'argent"]
        time_entry_keywords = ["feuille de temps", "time entry", "time entries", "heures", "heures travaillées", "temps travaillé", "timesheet", "timesheets", "régie", "régies"]
        invoice_keywords = ["facture", "factures", "invoice", "invoices", "facturation", "facturé", "facturée", "impayé", "impayée", "unpaid", "en attente de paiement"]
        event_keywords = ["événement", "event", "rdv", "réunion", "meeting", "rendez-vous"]
        employee_keywords = ["employé", "employés", "employee", "employees", "collègue", "collègues", "équipe", "team", "mes employés", "nos employés", "qui sont nos", "qui sont mes", "anniversaire", "anniversaires", "birthday", "date d'embauche", "hire date"]
        
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
        is_general_contact_query = any(phrase in query_lower for phrase in [
            "connais-tu", "connais tu", "connaissez-vous", "connaissez vous", 
            "nos contacts", "mes contacts", "et nos contacts", "et mes contacts",
            "qui sont nos", "qui sont mes", "nos contact", "mes contact",
            "combien j'ai de contact", "combien j'ai de contacts", "combien de contact", "combien de contacts"
        ])
        is_general_company_query = any(phrase in query_lower for phrase in [
            "combien de client", "combien de clients", "combien j'ai de client", "combien j'ai de clients",
            "nos clients", "mes clients", "avons nous", "avons-nous", "combien avons nous"
        ])
        
        # Check availability lazily
        opp_available = _get_opportunite_model() is not None if OPPORTUNITIES_AVAILABLE is None else OPPORTUNITIES_AVAILABLE
        emp_available = _get_employee_model() is not None if EMPLOYEES_AVAILABLE is None else EMPLOYEES_AVAILABLE
        
        return {
            "contacts": any(word in query_lower for word in contact_keywords) or has_potential_name or has_qui_est or is_general_contact_query,
            "companies": any(word in query_lower for word in company_keywords) or is_general_company_query,
            "opportunities": any(word in query_lower for word in opportunity_keywords) if opp_available else False,
            "pipelines": any(word in query_lower for word in pipeline_keywords),
            "projects": any(word in query_lower for word in project_keywords),
            "tasks": any(word in query_lower for word in task_keywords),
            "vacation_requests": any(word in query_lower for word in vacation_keywords),
            "expense_accounts": any(word in query_lower for word in expense_keywords),
            "transactions": any(word in query_lower for word in transaction_keywords),
            "time_entries": any(word in query_lower for word in time_entry_keywords),
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
            
            # Build query with tenant scoping
            stmt = select(Contact).options(
                selectinload(Contact.company),
                selectinload(Contact.employee)
            )
            # Apply tenant scoping
            stmt = scope_query(stmt, Contact)
            
            # Check if this is a general query about contacts
            query_lower = query.lower()
            is_general_query = any(phrase in query_lower for phrase in [
                "connais-tu", "connais tu", "connaissez-vous", "connaissez vous", 
                "nos contacts", "mes contacts", "et nos contacts", "et mes contacts",
                "qui sont nos", "qui sont mes", "nos contact", "mes contact"
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
                limit = min(limit * 10, 500)  # Much higher limit for general queries
                logger.info(f"General contact query detected - returning all contacts (limit: {limit})")
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
            
            # Build query with tenant scoping
            stmt = select(Company)
            # Apply tenant scoping
            stmt = scope_query(stmt, Company)
            
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
            # Lazy import already done above, use it
            Opportunite = _get_opportunite_model()
            if Opportunite is None:
                return []
            
            keywords = self._extract_keywords(query)
            
            # Build query with tenant scoping
            stmt = select(Opportunite).options(
                selectinload(Opportunite.stage),
                selectinload(Opportunite.pipeline)
            )
            # Apply tenant scoping
            stmt = scope_query(stmt, Opportunite)
            
            # Detect pipeline stage filters (Closed Won, Closed Lost)
            query_lower = query.lower()
            stage_filter = None
            if any(phrase in query_lower for phrase in ["closed won", "won", "gagné", "gagnée", "réussi", "réussie"]):
                # Filter by stage name containing "Closed Won" or "09 - Closed Won"
                from app.models import PipelineStage
                stage_filter = PipelineStage.name.ilike("%Closed Won%")
            elif any(phrase in query_lower for phrase in ["closed lost", "lost", "perdu", "perdue"]):
                from app.models import PipelineStage
                stage_filter = PipelineStage.name.ilike("%Closed Lost%")
            
            # If stage filter, join with PipelineStage
            if stage_filter:
                stmt = stmt.join(Opportunite.stage).where(stage_filter)
            
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
                    "stage": opp.stage.name if opp.stage else None,
                    "pipeline": opp.pipeline.name if opp.pipeline else None,
                    "company": opp.company.name if opp.company else None,
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
            
            # Check if this is a counting query - if so, don't filter by keywords
            is_counting_query = any(phrase in query_lower for phrase in [
                "combien", "how many", "nombre", "total", "count", "quantité"
            ])
            
            # Build query with tenant scoping
            stmt = select(Project)
            # Apply tenant scoping
            stmt = scope_query(stmt, Project)
            
            # Filter by status if mentioned
            if "en cours" in query_lower or "actif" in query_lower or "active" in query_lower:
                stmt = stmt.where(Project.status == ProjectStatus.ACTIVE)
            elif "terminé" in query_lower or "complété" in query_lower or "completed" in query_lower:
                stmt = stmt.where(Project.status == ProjectStatus.COMPLETED)
            elif "archivé" in query_lower or "archived" in query_lower:
                stmt = stmt.where(Project.status == ProjectStatus.ARCHIVED)
            
            # For counting queries, increase limit significantly and don't filter by keywords
            if is_counting_query:
                limit = min(limit * 10, 500)  # Much higher limit for counting
                logger.info(f"Counting project query detected - returning all projects (limit: {limit})")
            # Filter by keywords if any (but not for counting queries)
            elif keywords:
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
            
            # Build query with tenant scoping
            stmt = select(Employee).options(
                selectinload(Employee.team),
                selectinload(Employee.user)
            )
            # Apply tenant scoping
            stmt = scope_query(stmt, Employee)
            
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
                    "anniversaire": employee.birthday.isoformat() if employee.birthday else None,
                    "numero_employe": employee.employee_number,
                })
            
            logger.debug(f"Found {len(formatted)} employees for query: {query}")
            return formatted
        except Exception as e:
            logger.error(f"Error getting relevant employees: {e}", exc_info=True)
            return []

    async def get_relevant_pipelines(
        self,
        user_id: int,
        query: str,
        limit: int = None
    ) -> List[Dict[str, Any]]:
        """Get relevant pipelines based on query"""
        Pipeline = _get_pipeline_model()
        if Pipeline is None:
            return []
        
        if limit is None:
            limit = self.MAX_ITEMS_PER_TYPE
        
        try:
            # Lazy import to avoid MetaData conflicts
            Pipeline = _get_pipeline_model()
            if Pipeline is None:
                return []
            
            # Build query - get all active pipelines with tenant scoping
            stmt = select(Pipeline).where(Pipeline.is_active == True)
            # Apply tenant scoping
            stmt = scope_query(stmt, Pipeline)
            
            # Limit results
            stmt = stmt.limit(limit)
            
            # Execute
            result = await self.db.execute(stmt)
            pipelines = result.scalars().all()
            
            # Format results
            formatted = []
            for pipeline in pipelines:
                formatted.append({
                    "id": str(pipeline.id),
                    "name": pipeline.name,
                    "description": pipeline.description,
                    "is_default": pipeline.is_default,
                })
            
            logger.debug(f"Found {len(formatted)} pipelines for query: {query}")
            return formatted
        except Exception as e:
            logger.error(f"Error getting relevant pipelines: {e}", exc_info=True)
            return []

    async def get_relevant_tasks(
        self,
        user_id: int,
        query: str,
        limit: int = None
    ) -> List[Dict[str, Any]]:
        """Get relevant project tasks based on query"""
        ProjectTask, TaskStatus = _get_project_task_model()
        if ProjectTask is None:
            return []
        
        if limit is None:
            limit = self.MAX_ITEMS_PER_TYPE
        
        try:
            query_lower = query.lower()
            
            # Detect status filters
            status_filter = None
            if any(phrase in query_lower for phrase in ["en cours", "in progress", "doing"]):
                status_filter = TaskStatus.IN_PROGRESS
            elif any(phrase in query_lower for phrase in ["à faire", "todo", "à commencer"]):
                status_filter = TaskStatus.TODO
            elif any(phrase in query_lower for phrase in ["terminé", "terminée", "completed", "done", "fini"]):
                status_filter = TaskStatus.COMPLETED
            elif any(phrase in query_lower for phrase in ["bloqué", "blocked"]):
                status_filter = TaskStatus.BLOCKED
            
            # Check if counting query
            is_counting_query = any(phrase in query_lower for phrase in [
                "combien", "how many", "nombre", "total", "count", "quantité"
            ])
            
            # Build query with tenant scoping
            stmt = select(ProjectTask).options(
                selectinload(ProjectTask.project),
                selectinload(ProjectTask.assignee)
            )
            stmt = scope_query(stmt, ProjectTask)
            
            # Apply status filter if detected
            if status_filter:
                stmt = stmt.where(ProjectTask.status == status_filter)
            
            # For counting queries, increase limit significantly
            if is_counting_query:
                limit = min(limit * 10, 500)
                logger.info(f"Counting task query detected - returning all tasks (limit: {limit})")
            
            # Limit results
            stmt = stmt.limit(limit)
            
            # Execute
            result = await self.db.execute(stmt)
            tasks = result.scalars().all()
            
            # Format results
            formatted = []
            for task in tasks:
                formatted.append({
                    "id": task.id,
                    "title": task.title,
                    "status": task.status.value if hasattr(task.status, 'value') else str(task.status),
                    "priority": task.priority.value if hasattr(task.priority, 'value') else str(task.priority),
                    "project": task.project.name if task.project else None,
                    "assignee": f"{task.assignee.first_name} {task.assignee.last_name}" if task.assignee else None,
                    "due_date": task.due_date.isoformat() if task.due_date else None,
                })
            
            logger.debug(f"Found {len(formatted)} tasks for query: {query}")
            return formatted
        except Exception as e:
            logger.error(f"Error getting relevant tasks: {e}", exc_info=True)
            return []

    async def get_relevant_vacation_requests(
        self,
        user_id: int,
        query: str,
        limit: int = None
    ) -> List[Dict[str, Any]]:
        """Get relevant vacation requests based on query"""
        VacationRequest = _get_vacation_request_model()
        if VacationRequest is None:
            return []
        
        if limit is None:
            limit = self.MAX_ITEMS_PER_TYPE
        
        try:
            query_lower = query.lower()
            
            # Detect status filters
            status_filter = None
            if any(phrase in query_lower for phrase in ["en attente", "pending", "en attente d'approbation"]):
                status_filter = "pending"
            elif any(phrase in query_lower for phrase in ["approuvé", "approved", "approuvée", "approuvées"]):
                status_filter = "approved"
            elif any(phrase in query_lower for phrase in ["refusé", "rejected", "refusée", "refusées"]):
                status_filter = "rejected"
            
            # Check if counting query
            is_counting_query = any(phrase in query_lower for phrase in [
                "combien", "how many", "nombre", "total", "count", "quantité"
            ])
            
            # Build query with tenant scoping via Employee
            # VacationRequest doesn't have team_id, so we scope via Employee
            Employee = _get_employee_model()
            if Employee is None:
                return []
            
            stmt = select(VacationRequest).join(Employee).options(
                selectinload(VacationRequest.employee)
            )
            # Scope via Employee's team_id
            stmt = scope_query(stmt, Employee)
            
            # Apply status filter if detected
            if status_filter:
                stmt = stmt.where(VacationRequest.status == status_filter)
            
            # For counting queries, increase limit significantly
            if is_counting_query:
                limit = min(limit * 10, 500)
                logger.info(f"Counting vacation request query detected - returning all (limit: {limit})")
            
            # Limit results
            stmt = stmt.limit(limit)
            
            # Execute
            result = await self.db.execute(stmt)
            vacation_requests = result.scalars().all()
            
            # Format results
            formatted = []
            for vr in vacation_requests:
                formatted.append({
                    "id": vr.id,
                    "employee": f"{vr.employee.first_name} {vr.employee.last_name}" if vr.employee else None,
                    "start_date": vr.start_date.isoformat() if vr.start_date else None,
                    "end_date": vr.end_date.isoformat() if vr.end_date else None,
                    "status": vr.status,
                    "reason": vr.reason,
                })
            
            logger.debug(f"Found {len(formatted)} vacation requests for query: {query}")
            return formatted
        except Exception as e:
            logger.error(f"Error getting relevant vacation requests: {e}", exc_info=True)
            return []

    async def get_relevant_expense_accounts(
        self,
        user_id: int,
        query: str,
        limit: int = None
    ) -> List[Dict[str, Any]]:
        """Get relevant expense accounts based on query"""
        ExpenseAccount, ExpenseAccountStatus = _get_expense_account_model()
        if ExpenseAccount is None:
            return []
        
        if limit is None:
            limit = self.MAX_ITEMS_PER_TYPE
        
        try:
            query_lower = query.lower()
            
            # Detect status filters
            status_filter = None
            if any(phrase in query_lower for phrase in ["en attente", "pending", "soumis", "submitted", "en révision", "under review"]):
                # Map to appropriate status
                if "soumis" in query_lower or "submitted" in query_lower:
                    status_filter = ExpenseAccountStatus.SUBMITTED.value
                elif "révision" in query_lower or "review" in query_lower:
                    status_filter = ExpenseAccountStatus.UNDER_REVIEW.value
                else:
                    status_filter = ExpenseAccountStatus.SUBMITTED.value
            elif any(phrase in query_lower for phrase in ["approuvé", "approved", "approuvée", "approuvées"]):
                status_filter = ExpenseAccountStatus.APPROVED.value
            elif any(phrase in query_lower for phrase in ["refusé", "rejected", "refusée", "refusées"]):
                status_filter = ExpenseAccountStatus.REJECTED.value
            elif any(phrase in query_lower for phrase in ["brouillon", "draft"]):
                status_filter = ExpenseAccountStatus.DRAFT.value
            
            # Check if counting query
            is_counting_query = any(phrase in query_lower for phrase in [
                "combien", "how many", "nombre", "total", "count", "quantité"
            ])
            
            # Build query with tenant scoping via Employee
            # ExpenseAccount doesn't have team_id, so we scope via Employee
            Employee = _get_employee_model()
            if Employee is None:
                return []
            
            stmt = select(ExpenseAccount).join(Employee).options(
                selectinload(ExpenseAccount.employee)
            )
            # Scope via Employee's team_id
            stmt = scope_query(stmt, Employee)
            
            # Apply status filter if detected
            if status_filter:
                stmt = stmt.where(ExpenseAccount.status == status_filter)
            
            # For counting queries, increase limit significantly
            if is_counting_query:
                limit = min(limit * 10, 500)
                logger.info(f"Counting expense account query detected - returning all (limit: {limit})")
            
            # Limit results
            stmt = stmt.limit(limit)
            
            # Execute
            result = await self.db.execute(stmt)
            expense_accounts = result.scalars().all()
            
            # Format results
            formatted = []
            for ea in expense_accounts:
                formatted.append({
                    "id": ea.id,
                    "account_number": ea.account_number,
                    "title": ea.title,
                    "status": ea.status,
                    "total_amount": float(ea.total_amount) if ea.total_amount else 0.0,
                    "currency": ea.currency,
                    "employee": f"{ea.employee.first_name} {ea.employee.last_name}" if ea.employee else None,
                    "submitted_at": ea.submitted_at.isoformat() if ea.submitted_at else None,
                })
            
            logger.debug(f"Found {len(formatted)} expense accounts for query: {query}")
            return formatted
        except Exception as e:
            logger.error(f"Error getting relevant expense accounts: {e}", exc_info=True)
            return []

    async def get_relevant_transactions(
        self,
        user_id: int,
        query: str,
        limit: int = None
    ) -> List[Dict[str, Any]]:
        """Get relevant transactions based on query"""
        Transaction, TransactionStatus = _get_transaction_model()
        if Transaction is None:
            return []
        
        if limit is None:
            limit = self.MAX_ITEMS_PER_TYPE
        
        try:
            query_lower = query.lower()
            
            # Check if counting query
            is_counting_query = any(phrase in query_lower for phrase in [
                "combien", "how many", "nombre", "total", "count", "quantité"
            ])
            
            # Detect if query is about expenses (outgoing money)
            is_expense_query = any(phrase in query_lower for phrase in [
                "dépense", "dépenses", "expense", "expenses", "sortie", "sorties"
            ])
            
            # Build query with tenant scoping
            stmt = select(Transaction)
            stmt = scope_query(stmt, Transaction)
            
            # Filter by type if expense query
            if is_expense_query:
                from app.models import TransactionType
                stmt = stmt.where(Transaction.type == TransactionType.EXPENSE)
            
            # For counting queries, increase limit significantly
            if is_counting_query:
                limit = min(limit * 10, 500)
                logger.info(f"Counting transaction query detected - returning all (limit: {limit})")
            
            # Limit results
            stmt = stmt.limit(limit)
            
            # Execute
            result = await self.db.execute(stmt)
            transactions = result.scalars().all()
            
            # Format results
            formatted = []
            for trans in transactions:
                formatted.append({
                    "id": trans.id,
                    "description": trans.description,
                    "amount": float(trans.amount) if trans.amount else 0.0,
                    "type": trans.type.value if hasattr(trans.type, 'value') else str(trans.type),
                    "status": trans.status.value if hasattr(trans.status, 'value') else str(trans.status),
                    "date": trans.transaction_date.isoformat() if trans.transaction_date else None,
                    "currency": trans.currency,
                })
            
            logger.debug(f"Found {len(formatted)} transactions for query: {query}")
            return formatted
        except Exception as e:
            logger.error(f"Error getting relevant transactions: {e}", exc_info=True)
            return []

    def _extract_time_range(self, query: str) -> Optional[tuple]:
        """
        Extrait une plage de dates de la requête
        Retourne (start_date, end_date) ou None
        """
        from datetime import datetime, timedelta
        query_lower = query.lower()
        
        now = datetime.now()
        
        # "ce mois" / "this month"
        if any(phrase in query_lower for phrase in ["ce mois", "this month", "ce mois-ci"]):
            start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            end = now
            return (start, end)
        
        # "cette semaine" / "this week"
        if any(phrase in query_lower for phrase in ["cette semaine", "this week", "cette semaine-ci"]):
            # Lundi de cette semaine
            days_since_monday = now.weekday()
            start = now - timedelta(days=days_since_monday)
            start = start.replace(hour=0, minute=0, second=0, microsecond=0)
            end = now
            return (start, end)
        
        # "le mois dernier" / "last month"
        if any(phrase in query_lower for phrase in ["le mois dernier", "last month", "mois dernier"]):
            # Premier jour du mois dernier
            if now.month == 1:
                start = now.replace(year=now.year - 1, month=12, day=1, hour=0, minute=0, second=0, microsecond=0)
            else:
                start = now.replace(month=now.month - 1, day=1, hour=0, minute=0, second=0, microsecond=0)
            # Dernier jour du mois dernier
            if now.month == 1:
                end = now.replace(year=now.year - 1, month=12, day=31, hour=23, minute=59, second=59)
            else:
                # Calculer le dernier jour du mois précédent
                from calendar import monthrange
                last_day = monthrange(now.year, now.month - 1)[1]
                end = now.replace(month=now.month - 1, day=last_day, hour=23, minute=59, second=59)
            return (start, end)
        
        return None

    async def get_relevant_time_entries(
        self,
        user_id: int,
        query: str,
        limit: int = None
    ) -> List[Dict[str, Any]]:
        """Get relevant time entries based on query"""
        TimeEntry = _get_time_entry_model()
        if TimeEntry is None:
            return []
        
        if limit is None:
            limit = self.MAX_ITEMS_PER_TYPE
        
        try:
            query_lower = query.lower()
            
            # Check if counting query
            is_counting_query = any(phrase in query_lower for phrase in [
                "combien", "how many", "nombre", "total", "count", "quantité"
            ])
            
            # Extract time range if present
            time_range = self._extract_time_range(query)
            
            # Detect if query is about specific employee or project
            Employee = _get_employee_model()
            Project = _get_project_model()
            Project = Project[0] if Project and isinstance(Project, tuple) else Project
            
            # Build query with tenant scoping
            stmt = select(TimeEntry).options(
                selectinload(TimeEntry.user),
                selectinload(TimeEntry.project),
                selectinload(TimeEntry.task)
            )
            stmt = scope_query(stmt, TimeEntry)
            
            # Apply time range filter
            if time_range:
                start_date, end_date = time_range
                stmt = stmt.where(TimeEntry.date >= start_date, TimeEntry.date <= end_date)
            
            # For counting queries, increase limit significantly
            if is_counting_query:
                limit = min(limit * 10, 500)
                logger.info(f"Counting time entry query detected - returning all (limit: {limit})")
            
            # Limit results
            stmt = stmt.limit(limit)
            
            # Execute
            result = await self.db.execute(stmt)
            time_entries = result.scalars().all()
            
            # Format results with aggregation
            formatted = []
            total_hours = 0
            by_employee = {}
            by_project = {}
            
            for te in time_entries:
                hours = te.duration / 3600.0 if te.duration else 0
                total_hours += hours
                
                # Aggregate by employee
                employee_name = None
                if te.user:
                    if Employee and te.user.employee:
                        employee_name = f"{te.user.employee.first_name} {te.user.employee.last_name}"
                    else:
                        employee_name = f"{te.user.first_name} {te.user.last_name}"
                
                if employee_name:
                    by_employee[employee_name] = by_employee.get(employee_name, 0) + hours
                
                # Aggregate by project
                project_name = te.project.name if te.project else None
                if project_name:
                    by_project[project_name] = by_project.get(project_name, 0) + hours
                
                formatted.append({
                    "id": te.id,
                    "description": te.description,
                    "duration_hours": hours,
                    "date": te.date.isoformat() if te.date else None,
                    "employee": employee_name,
                    "project": project_name,
                    "task": te.task.title if te.task else None,
                })
            
            # Add aggregation info to first entry or as metadata
            if formatted:
                formatted[0]["_aggregation"] = {
                    "total_hours": total_hours,
                    "by_employee": by_employee,
                    "by_project": by_project,
                }
            
            logger.debug(f"Found {len(formatted)} time entries for query: {query} (total: {total_hours:.2f}h)")
            return formatted
        except Exception as e:
            logger.error(f"Error getting relevant time entries: {e}", exc_info=True)
            return []

    async def get_relevant_invoices(
        self,
        user_id: int,
        query: str,
        limit: int = None
    ) -> List[Dict[str, Any]]:
        """Get relevant invoices based on query"""
        Invoice, InvoiceStatus = _get_invoice_model()
        if Invoice is None:
            return []
        
        if limit is None:
            limit = self.MAX_ITEMS_PER_TYPE
        
        try:
            query_lower = query.lower()
            
            # Detect status filters
            status_filter = None
            if any(phrase in query_lower for phrase in ["en attente", "pending", "impayé", "impayée", "unpaid", "en attente de paiement", "ouvert", "open"]):
                status_filter = InvoiceStatus.OPEN
            elif any(phrase in query_lower for phrase in ["payé", "paid", "payée", "payées"]):
                status_filter = InvoiceStatus.PAID
            elif any(phrase in query_lower for phrase in ["annulé", "void", "annulée", "annulées"]):
                status_filter = InvoiceStatus.VOID
            elif any(phrase in query_lower for phrase in ["brouillon", "draft"]):
                status_filter = InvoiceStatus.DRAFT
            
            # Check if counting query
            is_counting_query = any(phrase in query_lower for phrase in [
                "combien", "how many", "nombre", "total", "count", "quantité"
            ])
            
            # Build query with tenant scoping
            stmt = select(Invoice).options(
                selectinload(Invoice.user)
            )
            stmt = scope_query(stmt, Invoice)
            
            # Apply status filter if detected
            if status_filter:
                stmt = stmt.where(Invoice.status == status_filter)
            
            # For counting queries, increase limit significantly
            if is_counting_query:
                limit = min(limit * 10, 500)
                logger.info(f"Counting invoice query detected - returning all (limit: {limit})")
            
            # Limit results
            stmt = stmt.limit(limit)
            
            # Execute
            result = await self.db.execute(stmt)
            invoices = result.scalars().all()
            
            # Format results
            formatted = []
            for inv in invoices:
                formatted.append({
                    "id": inv.id,
                    "invoice_number": inv.invoice_number,
                    "amount_due": float(inv.amount_due) if inv.amount_due else 0.0,
                    "amount_paid": float(inv.amount_paid) if inv.amount_paid else 0.0,
                    "status": inv.status.value if hasattr(inv.status, 'value') else str(inv.status),
                    "due_date": inv.due_date.isoformat() if inv.due_date else None,
                    "paid_at": inv.paid_at.isoformat() if inv.paid_at else None,
                    "currency": inv.currency,
                    "user": f"{inv.user.first_name} {inv.user.last_name}" if inv.user else None,
                })
            
            logger.debug(f"Found {len(formatted)} invoices for query: {query}")
            return formatted
        except Exception as e:
            logger.error(f"Error getting relevant invoices: {e}", exc_info=True)
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
        
        if data_types.get("pipelines"):
            result["pipelines"] = await self.get_relevant_pipelines(user_id, query)
        
        if data_types.get("tasks"):
            result["tasks"] = await self.get_relevant_tasks(user_id, query)
        
        if data_types.get("vacation_requests"):
            result["vacation_requests"] = await self.get_relevant_vacation_requests(user_id, query)
        
        if data_types.get("expense_accounts"):
            result["expense_accounts"] = await self.get_relevant_expense_accounts(user_id, query)
        
        if data_types.get("transactions"):
            result["transactions"] = await self.get_relevant_transactions(user_id, query)
        
        if data_types.get("time_entries"):
            result["time_entries"] = await self.get_relevant_time_entries(user_id, query)
        
        if data_types.get("invoices"):
            result["invoices"] = await self.get_relevant_invoices(user_id, query)
        
        return result

    async def get_structure_context(self) -> str:
        """Get structural context about the ERP system (pages, tables, structure)"""
        structure_parts = []
        
        # Main application pages/modules
        structure_parts.append("=== STRUCTURE ERP NUKLEO ===")
        structure_parts.append("")
        
        structure_parts.append("PAGES PRINCIPALES:")
        structure_parts.append("Format URL: /fr/dashboard/[module] ou /[locale]/dashboard/[module]")
        pages_info = [
            ("Dashboard", "/dashboard", "Vue d'ensemble de l'ERP"),
            ("Contacts", "/dashboard/contacts", "Gestion des contacts"),
            ("Entreprises", "/dashboard/entreprises", "Gestion des entreprises (clients/prospects)"),
            ("Projets", "/dashboard/projets", "Gestion des projets"),
            ("Opportunités", "/dashboard/opportunites", "Pipeline de vente et opportunités"),
            ("Tâches", "/dashboard/taches", "Gestion des tâches"),
            ("Équipes", "/dashboard/equipes", "Gestion des équipes"),
            ("Employés", "/dashboard/employes", "Gestion des employés"),
            ("Facturation", "/dashboard/facturation", "Factures et finances"),
            ("Trésorerie", "/dashboard/tresorerie", "Transactions et comptabilité"),
            ("Calendrier", "/dashboard/calendrier", "Événements et rendez-vous"),
            ("Feuilles de temps", "/dashboard/feuilles-temps", "Suivi du temps"),
            ("Vacances", "/dashboard/vacances", "Demandes de congés"),
            ("Paramètres Leo", "/settings/leo", "Configuration de l'assistant IA"),
        ]
        for name, path, desc in pages_info:
            structure_parts.append(f"  - {name}: {path} - {desc}")
        structure_parts.append("")
        
        # Main database entities/tables
        structure_parts.append("ENTITÉS PRINCIPALES (Tables):")
        entities_info = [
            ("contacts", "Contacts - personnes avec entreprises"),
            ("companies", "Entreprises - clients et prospects"),
            ("projects", "Projets - projets et missions"),
            ("project_tasks", "Tâches de projet"),
            ("opportunites", "Opportunités - deals et ventes"),
            ("pipelines", "Pipelines de vente"),
            ("employees", "Employés - ressources humaines"),
            ("clients", "Clients - entreprises clientes"),
            ("quotes", "Devis"),
            ("invoices", "Factures"),
            ("transactions", "Transactions financières"),
            ("bank_accounts", "Comptes bancaires"),
            ("time_entries", "Feuilles de temps"),
            ("vacation_requests", "Demandes de vacances"),
            ("calendar_events", "Événements calendrier"),
            ("files", "Fichiers et documents"),
        ]
        for table, desc in entities_info:
            structure_parts.append(f"  - {table}: {desc}")
        structure_parts.append("")
        
        # Key relationships
        structure_parts.append("RELATIONS CLÉS:")
        relationships = [
            "Contact → Company (un contact appartient à une entreprise)",
            "Company → Client (une entreprise peut être un client)",
            "Opportunite → Company (une opportunité est liée à une entreprise)",
            "Opportunite → Pipeline (une opportunité appartient à un pipeline)",
            "Project → Company (un projet est pour une entreprise)",
            "Project → Employee (un projet a des employés assignés)",
            "ProjectTask → Project (une tâche appartient à un projet)",
            "TimeEntry → Project (une feuille de temps est liée à un projet)",
            "Quote → Company (un devis est pour une entreprise)",
            "Invoice → Company (une facture est pour une entreprise)",
        ]
        for rel in relationships:
            structure_parts.append(f"  - {rel}")
        structure_parts.append("")
        
        return "\n".join(structure_parts)
    
    async def build_context_string(
        self,
        data: Dict[str, List[Dict[str, Any]]],
        query: str
    ) -> str:
        """Format data into readable context string - SIMPLIFIED for better AI understanding"""
        context_parts = []
        query_lower = query.lower()
        
        # Add structure context for navigation/help queries
        is_navigation_query = any(phrase in query_lower for phrase in [
            "où", "where", "comment trouver", "how to find", "page", "module",
            "structure", "organisation", "naviguer", "navigate", "aide", "help"
        ])
        
        if is_navigation_query:
            structure_context = await self.get_structure_context()
            context_parts.append(structure_context)
        
        # Detect counting queries
        is_counting_query = any(phrase in query_lower for phrase in [
            "combien", "how many", "nombre", "total", "count", "quantité"
        ])
        
        # For counting queries, provide SIMPLE summary first
        if is_counting_query:
            summary_parts = []
            if data.get("contacts"):
                summary_parts.append(f"CONTACTS: {len(data['contacts'])}")
            if data.get("companies"):
                clients_count = sum(1 for c in data["companies"] if c.get("is_client"))
                if any(word in query_lower for word in ["client", "clients", "cleint", "cleints"]):
                    summary_parts.append(f"CLIENTS: {clients_count}")
                else:
                    summary_parts.append(f"ENTREPRISES: {len(data['companies'])} (dont {clients_count} clients)")
            if data.get("employees"):
                summary_parts.append(f"EMPLOYÉS: {len(data['employees'])}")
            if data.get("opportunities"):
                summary_parts.append(f"OPPORTUNITÉS: {len(data['opportunities'])}")
            if data.get("pipelines"):
                summary_parts.append(f"PIPELINES: {len(data['pipelines'])}")
            if data.get("projects"):
                summary_parts.append(f"PROJETS: {len(data['projects'])}")
            if data.get("tasks"):
                # Count by status
                tasks = data["tasks"]
                in_progress = sum(1 for t in tasks if t.get("status") == "in_progress")
                todo = sum(1 for t in tasks if t.get("status") == "todo")
                completed = sum(1 for t in tasks if t.get("status") == "completed")
                if any(word in query_lower for word in ["en cours", "in progress"]):
                    summary_parts.append(f"TÂCHES EN COURS: {in_progress}")
                else:
                    summary_parts.append(f"TÂCHES: {len(tasks)} ({in_progress} en cours, {todo} à faire, {completed} terminées)")
            if data.get("vacation_requests"):
                # Count by status
                vrs = data["vacation_requests"]
                pending = sum(1 for v in vrs if v.get("status") == "pending")
                approved = sum(1 for v in vrs if v.get("status") == "approved")
                if any(word in query_lower for word in ["en attente", "pending"]):
                    summary_parts.append(f"VACANCES EN ATTENTE: {pending}")
                elif any(word in query_lower for word in ["approuvé", "approved"]):
                    summary_parts.append(f"VACANCES APPROUVÉES: {approved}")
                else:
                    summary_parts.append(f"DEMANDES VACANCES: {len(vrs)} ({pending} en attente, {approved} approuvées)")
            if data.get("expense_accounts"):
                # Count by status
                eas = data["expense_accounts"]
                approved = sum(1 for e in eas if e.get("status") == "approved")
                pending = sum(1 for e in eas if e.get("status") in ["submitted", "under_review"])
                if any(word in query_lower for word in ["approuvé", "approved"]):
                    summary_parts.append(f"DÉPENSES APPROUVÉES: {approved}")
                elif any(word in query_lower for word in ["en attente", "pending"]):
                    summary_parts.append(f"DÉPENSES EN ATTENTE: {pending}")
                else:
                    summary_parts.append(f"COMPTES DÉPENSES: {len(eas)} ({approved} approuvés, {pending} en attente)")
            if data.get("transactions"):
                transactions = data["transactions"]
                expenses = [t for t in transactions if t.get("type") == "expense"]
                total_expenses = sum(float(t.get("amount", 0) or 0) for t in expenses)
                if is_counting_query:
                    summary_parts.append(f"TRANSACTIONS: {len(transactions)} (Dépenses: {len(expenses)}, Total: {total_expenses:,.2f}€)")
            if data.get("time_entries"):
                time_entries = data["time_entries"]
                aggregation = time_entries[0].get("_aggregation") if time_entries else None
                total_hours = aggregation.get("total_hours", 0) if aggregation else sum(te.get("duration_hours", 0) for te in time_entries)
                if is_counting_query:
                    summary_parts.append(f"FEUILLES DE TEMPS: {len(time_entries)} entrées ({total_hours:.2f}h)")
            if data.get("invoices"):
                invoices = data["invoices"]
                open_invoices = [i for i in invoices if i.get("status") == "open"]
                total_open = sum(float(i.get("amount_due", 0) or 0) for i in open_invoices)
                if is_counting_query:
                    if any(word in query_lower for word in ["impayé", "unpaid", "en attente"]):
                        summary_parts.append(f"FACTURES EN ATTENTE: {len(open_invoices)} ({total_open:,.2f}€)")
                    else:
                        summary_parts.append(f"FACTURES: {len(invoices)} ({len(open_invoices)} en attente = {total_open:,.2f}€)")
            
            if summary_parts:
                context_parts.append("RÉSUMÉ: " + " | ".join(summary_parts))
                context_parts.append("")
        
        # Detailed data (simplified format)
        if data.get("contacts"):
            if not is_counting_query:
                context_parts.append(f"=== CONTACTS ({len(data['contacts'])}) ===")
            # For counting queries, only show a few examples
            max_contacts = 5 if is_counting_query else 10
            for contact in data["contacts"][:max_contacts]:
                line = f"{contact['nom_complet']}"
                if contact.get("email"):
                    line += f" ({contact['email']})"
                if contact.get("entreprise"):
                    line += f" - {contact['entreprise']}"
                context_parts.append(line)
            if is_counting_query and len(data["contacts"]) > max_contacts:
                context_parts.append(f"... et {len(data['contacts']) - max_contacts} autres")
            context_parts.append("")
        
        if data.get("companies"):
            if not is_counting_query:
                total_companies = len(data["companies"])
                clients_count = sum(1 for c in data["companies"] if c.get("is_client"))
                context_parts.append(f"=== ENTREPRISES ({total_companies}, dont {clients_count} clients) ===")
            
            # For counting queries about clients, show only count, not list
            if is_counting_query and any(word in query_lower for word in ["client", "clients"]):
                clients_count = sum(1 for c in data["companies"] if c.get("is_client"))
                context_parts.append(f"Nombre total de CLIENTS: {clients_count}")
            else:
                # Show companies (limited for readability)
                max_companies = 10
                for company in data["companies"][:max_companies]:
                    line = f"{company['name']}"
                    if company.get("is_client"):
                        line += " [CLIENT]"
                    else:
                        line += " [PROSPECT]"
                    context_parts.append(line)
                if len(data["companies"]) > max_companies:
                    context_parts.append(f"... et {len(data['companies']) - max_companies} autres")
            context_parts.append("")
        
        if data.get("opportunities"):
            opps = data["opportunities"]
            # Detect if query is about Closed Won/Lost
            query_lower = query.lower()
            is_closed_won_query = any(phrase in query_lower for phrase in ["closed won", "won", "gagné", "réussi"])
            is_closed_lost_query = any(phrase in query_lower for phrase in ["closed lost", "lost", "perdu"])
            
            if is_counting_query:
                # For counting, show summary with totals
                total_opps = len(opps)
                if is_closed_won_query:
                    closed_won = [o for o in opps if o.get("stage") and "Closed Won" in str(o.get("stage"))]
                    total_amount = sum(float(o.get("montant", 0) or 0) for o in closed_won)
                    context_parts.append(f"=== OPPORTUNITÉS CLOSED WON ({len(closed_won)}) ===")
                    context_parts.append(f"Montant total: {total_amount:,.2f}€")
                elif is_closed_lost_query:
                    closed_lost = [o for o in opps if o.get("stage") and "Closed Lost" in str(o.get("stage"))]
                    context_parts.append(f"=== OPPORTUNITÉS CLOSED LOST ({len(closed_lost)}) ===")
                else:
                    if total_opps > 0:
                        max_amount = max((float(opp.get("montant", 0) or 0) for opp in opps), default=0)
                        context_parts.append(f"=== OPPORTUNITÉS ({total_opps}) ===")
                        context_parts.append(f"Montant maximum: {max_amount}€")
            else:
                context_parts.append(f"=== OPPORTUNITÉS ({len(opps)}) ===")
                # Show top opportunities by amount
                sorted_opps = sorted(opps, key=lambda x: float(x.get("montant", 0) or 0), reverse=True)
                for opp in sorted_opps[:10]:
                    line = f"{opp['nom']}"
                    if opp.get("montant"):
                        line += f" - {opp['montant']}€"
                    if opp.get("stage"):
                        line += f" [Stage: {opp['stage']}]"
                    elif opp.get("statut"):
                        line += f" [Statut: {opp['statut']}]"
                    context_parts.append(line)
            context_parts.append("")
        
        if data.get("pipelines"):
            if is_counting_query:
                context_parts.append(f"PIPELINES DE VENTE: {len(data['pipelines'])}")
            else:
                context_parts.append(f"=== PIPELINES ({len(data['pipelines'])}) ===")
                for pipeline in data["pipelines"]:
                    line = f"{pipeline['name']}"
                    if pipeline.get("is_default"):
                        line += " [PAR DÉFAUT]"
                    context_parts.append(line)
                context_parts.append("")
        
        if data.get("tasks"):
            if not is_counting_query:
                tasks = data["tasks"]
                # Group by status
                in_progress = [t for t in tasks if t.get("status") == "in_progress"]
                todo = [t for t in tasks if t.get("status") == "todo"]
                completed = [t for t in tasks if t.get("status") == "completed"]
                
                context_parts.append(f"=== TÂCHES ({len(tasks)}) ===")
                if in_progress:
                    context_parts.append(f"En cours ({len(in_progress)}):")
                    for task in in_progress[:10]:
                        line = f"- {task['title']}"
                        if task.get("project"):
                            line += f" [Projet: {task['project']}]"
                        if task.get("assignee"):
                            line += f" [Assigné: {task['assignee']}]"
                        context_parts.append(line)
                if todo and len(context_parts) < 20:  # Limit total output
                    context_parts.append(f"À faire ({len(todo)}):")
                    for task in todo[:5]:
                        context_parts.append(f"- {task['title']}")
                context_parts.append("")
        
        if data.get("vacation_requests"):
            vrs = data["vacation_requests"]
            # Group by status
            pending = [v for v in vrs if v.get("status") == "pending"]
            approved = [v for v in vrs if v.get("status") == "approved"]
            
            # Check if query specifically asks for pending
            query_lower = query.lower()
            wants_pending = any(phrase in query_lower for phrase in ["en attente", "pending", "en attente d'approbation"])
            wants_list = any(phrase in query_lower for phrase in ["nomme", "liste", "list", "donne", "montre", "affiche", "quelles sont"])
            
            if is_counting_query and not wants_list:
                # Just show count
                if wants_pending:
                    context_parts.append(f"DEMANDES DE VACANCES EN ATTENTE: {len(pending)}")
                else:
                    context_parts.append(f"DEMANDES DE VACANCES: {len(vrs)} ({len(pending)} en attente, {len(approved)} approuvées)")
            else:
                # Show detailed list
                context_parts.append(f"=== DEMANDES DE VACANCES ({len(vrs)}) ===")
                if pending:
                    context_parts.append(f"En attente ({len(pending)}):")
                    for vr in pending[:20]:  # Show more for listing requests
                        line = f"- {vr['employee']}"
                        if vr.get("start_date") and vr.get("end_date"):
                            line += f": {vr['start_date']} au {vr['end_date']}"
                        if vr.get("reason"):
                            line += f" ({vr['reason'][:50]})"
                        context_parts.append(line)
                if approved and (not wants_pending or wants_list) and len(context_parts) < 35:
                    context_parts.append(f"Approuvées ({len(approved)}):")
                    for vr in approved[:10]:
                        line = f"- {vr['employee']}"
                        if vr.get("start_date") and vr.get("end_date"):
                            line += f": {vr['start_date']} au {vr['end_date']}"
                        context_parts.append(line)
            context_parts.append("")
        
        if data.get("expense_accounts"):
            eas = data["expense_accounts"]
            # Group by status
            approved = [e for e in eas if e.get("status") == "approved"]
            pending = [e for e in eas if e.get("status") in ["submitted", "under_review"]]
            
            # Check if user wants to list them
            wants_list = any(phrase in query_lower for phrase in ["nomme", "liste", "list", "donne", "montre", "affiche"])
            
            if is_counting_query and not wants_list:
                # Just show count
                if any(word in query_lower for word in ["approuvé", "approved", "validé", "validée"]):
                    context_parts.append(f"COMPTES DE DÉPENSES APPROUVÉS: {len(approved)}")
                else:
                    context_parts.append(f"COMPTES DE DÉPENSES: {len(eas)} ({len(approved)} approuvés, {len(pending)} en attente)")
            else:
                # Show detailed list
                context_parts.append(f"=== COMPTES DE DÉPENSES ({len(eas)}) ===")
                if approved:
                    context_parts.append(f"Approuvés ({len(approved)}):")
                    for ea in approved[:20]:  # Show more for listing requests
                        line = f"- {ea['title']}"
                        if ea.get("account_number"):
                            line += f" ({ea['account_number']})"
                        if ea.get("total_amount"):
                            line += f": {ea['total_amount']:.2f} {ea.get('currency', 'EUR')}"
                        if ea.get("employee"):
                            line += f" [{ea['employee']}]"
                        context_parts.append(line)
                if pending and (wants_list or len(context_parts) < 30):
                    context_parts.append(f"En attente ({len(pending)}):")
                    for ea in pending[:10]:
                        line = f"- {ea['title']}"
                        if ea.get("total_amount"):
                            line += f": {ea['total_amount']:.2f} {ea.get('currency', 'EUR')}"
                        context_parts.append(line)
                context_parts.append("")
        
        if data.get("transactions"):
            transactions = data["transactions"]
            expenses = [t for t in transactions if t.get("type") == "expense"]
            income = [t for t in transactions if t.get("type") == "income"]
            total_expenses = sum(float(t.get("amount", 0) or 0) for t in expenses)
            total_income = sum(float(t.get("amount", 0) or 0) for t in income)
            
            query_lower = query.lower()
            wants_list = any(phrase in query_lower for phrase in ["nomme", "liste", "list", "donne", "montre", "affiche"])
            
            if is_counting_query and not wants_list:
                context_parts.append(f"TRANSACTIONS: {len(transactions)} (Dépenses: {len(expenses)} = {total_expenses:,.2f}€, Revenus: {len(income)} = {total_income:,.2f}€)")
            else:
                context_parts.append(f"=== TRANSACTIONS ({len(transactions)}) ===")
                if expenses:
                    context_parts.append(f"Dépenses ({len(expenses)}, Total: {total_expenses:,.2f}€):")
                    for trans in expenses[:20]:
                        line = f"- {trans['description']}"
                        if trans.get("amount"):
                            line += f": {trans['amount']:,.2f} {trans.get('currency', 'EUR')}"
                        if trans.get("date"):
                            line += f" [{trans['date']}]"
                        context_parts.append(line)
                if income and wants_list:
                    context_parts.append(f"Revenus ({len(income)}, Total: {total_income:,.2f}€):")
                    for trans in income[:10]:
                        line = f"- {trans['description']}"
                        if trans.get("amount"):
                            line += f": {trans['amount']:,.2f} {trans.get('currency', 'EUR')}"
                        context_parts.append(line)
            context_parts.append("")
        
        if data.get("time_entries"):
            time_entries = data["time_entries"]
            query_lower = query.lower()
            wants_list = any(phrase in query_lower for phrase in ["nomme", "liste", "list", "donne", "montre", "affiche"])
            
            # Extract aggregation if available
            aggregation = None
            if time_entries and time_entries[0].get("_aggregation"):
                aggregation = time_entries[0].pop("_aggregation")
            
            if is_counting_query and not wants_list:
                # Just show totals
                total_hours = aggregation.get("total_hours", 0) if aggregation else sum(te.get("duration_hours", 0) for te in time_entries)
                context_parts.append(f"FEUILLES DE TEMPS: {len(time_entries)} entrées, Total: {total_hours:.2f}h")
                if aggregation and aggregation.get("by_employee"):
                    context_parts.append("Par employé:")
                    for emp, hours in list(aggregation["by_employee"].items())[:5]:
                        context_parts.append(f"  - {emp}: {hours:.2f}h")
            else:
                # Show detailed list
                context_parts.append(f"=== FEUILLES DE TEMPS ({len(time_entries)}) ===")
                if aggregation:
                    total_hours = aggregation.get("total_hours", 0)
                    context_parts.append(f"Total heures: {total_hours:.2f}h")
                    if aggregation.get("by_employee"):
                        context_parts.append("Par employé:")
                        for emp, hours in list(aggregation["by_employee"].items())[:10]:
                            context_parts.append(f"  - {emp}: {hours:.2f}h")
                    if aggregation.get("by_project"):
                        context_parts.append("Par projet:")
                        for proj, hours in list(aggregation["by_project"].items())[:10]:
                            context_parts.append(f"  - {proj}: {hours:.2f}h")
                context_parts.append("Détails:")
                for te in time_entries[:20]:
                    line = f"- {te.get('description', 'Sans description')}"
                    if te.get("duration_hours"):
                        line += f": {te['duration_hours']:.2f}h"
                    if te.get("employee"):
                        line += f" [{te['employee']}]"
                    if te.get("project"):
                        line += f" (Projet: {te['project']})"
                    if te.get("date"):
                        line += f" - {te['date'][:10]}"
                    context_parts.append(line)
            context_parts.append("")
        
        if data.get("invoices"):
            invoices = data["invoices"]
            query_lower = query.lower()
            wants_list = any(phrase in query_lower for phrase in ["nomme", "liste", "list", "donne", "montre", "affiche"])
            
            # Group by status
            open_invoices = [i for i in invoices if i.get("status") == "open"]
            paid_invoices = [i for i in invoices if i.get("status") == "paid"]
            total_open = sum(float(i.get("amount_due", 0) or 0) for i in open_invoices)
            total_paid = sum(float(i.get("amount_paid", 0) or 0) for i in paid_invoices)
            
            if is_counting_query and not wants_list:
                # Just show counts and totals
                if any(word in query_lower for word in ["impayé", "unpaid", "en attente", "open"]):
                    context_parts.append(f"FACTURES EN ATTENTE: {len(open_invoices)} (Total: {total_open:,.2f}€)")
                else:
                    context_parts.append(f"FACTURES: {len(invoices)} (Ouvertes: {len(open_invoices)} = {total_open:,.2f}€, Payées: {len(paid_invoices)} = {total_paid:,.2f}€)")
            else:
                # Show detailed list
                context_parts.append(f"=== FACTURES ({len(invoices)}) ===")
                if open_invoices:
                    context_parts.append(f"En attente ({len(open_invoices)}, Total: {total_open:,.2f}€):")
                    for inv in open_invoices[:20]:
                        line = f"- {inv.get('invoice_number', f'FACT-{inv.get('id')}')}"
                        if inv.get("amount_due"):
                            line += f": {inv['amount_due']:,.2f} {inv.get('currency', 'EUR')}"
                        if inv.get("due_date"):
                            line += f" - Échéance: {inv['due_date'][:10]}"
                        if inv.get("user"):
                            line += f" [{inv['user']}]"
                        context_parts.append(line)
                if paid_invoices and wants_list:
                    context_parts.append(f"Payées ({len(paid_invoices)}, Total: {total_paid:,.2f}€):")
                    for inv in paid_invoices[:10]:
                        line = f"- {inv.get('invoice_number', f'FACT-{inv.get('id')}')}"
                        if inv.get("amount_paid"):
                            line += f": {inv['amount_paid']:,.2f} {inv.get('currency', 'EUR')}"
                        context_parts.append(line)
            context_parts.append("")
        
        if data.get("projects"):
            if not is_counting_query:
                context_parts.append(f"=== PROJETS ({len(data['projects'])}) ===")
                for project in data["projects"][:5]:
                    line = f"{project['name']}"
                    if project.get("status"):
                        line += f" [{project['status']}]"
                    context_parts.append(line)
                context_parts.append("")
        
        if data.get("employees"):
            employees = data["employees"]
            # Check if query is about birthdays or hire dates
            query_lower = query.lower()
            is_birthday_query = any(phrase in query_lower for phrase in ["anniversaire", "birthday", "date de naissance"])
            is_hire_date_query = any(phrase in query_lower for phrase in ["date d'embauche", "hire date", "embauche", "anniversaire d'embauche"])
            
            if not is_counting_query:
                context_parts.append(f"=== EMPLOYÉS ({len(employees)}) ===")
                for employee in employees[:20]:  # Show more for birthday/hire date queries
                    line = f"{employee['nom_complet']}"
                    if employee.get("email"):
                        line += f" ({employee['email']})"
                    if is_birthday_query and employee.get("anniversaire"):
                        line += f" - Anniversaire: {employee['anniversaire']}"
                    if is_hire_date_query and employee.get("date_embauche"):
                        line += f" - Date d'embauche: {employee['date_embauche']}"
                    context_parts.append(line)
                context_parts.append("")
        
        # Always add a brief structure summary at the end for context awareness
        # This helps Leo understand the system structure even for data queries
        if not is_navigation_query:
            context_parts.append("")
            context_parts.append("=== RÉFÉRENCE SYSTÈME ===")
            context_parts.append("Modules: Dashboard, Contacts, Entreprises, Projets, Opportunités, Tâches, Employés, Facturation, Trésorerie, Calendrier")
            context_parts.append("Tables: contacts, companies, projects, opportunites, pipelines, employees, invoices, transactions, time_entries")
            context_parts.append("Relations: Contact→Company, Opportunity→Company→Pipeline, Project→Company→Employee")
        
        return "\n".join(context_parts)
