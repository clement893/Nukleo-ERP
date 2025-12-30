"""
Commercial Module Schemas
Pydantic schemas for commercial operations
"""

from .contact import Contact, ContactCreate, ContactUpdate, ContactBase, ContactInDB
from .company import Company, CompanyCreate, CompanyUpdate, CompanyBase
from .quote import Quote, QuoteCreate, QuoteUpdate, QuoteBase
from .submission import Submission, SubmissionCreate, SubmissionUpdate, SubmissionBase
from .opportunity import Opportunity, OpportunityCreate, OpportunityUpdate, OpportunityBase
from .pipeline import Pipeline, PipelineCreate, PipelineUpdate, PipelineBase, PipelineStage, PipelineStageCreate

__all__ = [
    # Contact
    "Contact",
    "ContactCreate",
    "ContactUpdate",
    "ContactBase",
    "ContactInDB",
    # Company
    "Company",
    "CompanyCreate",
    "CompanyUpdate",
    "CompanyBase",
    # Quote
    "Quote",
    "QuoteCreate",
    "QuoteUpdate",
    "QuoteBase",
    # Submission
    "Submission",
    "SubmissionCreate",
    "SubmissionUpdate",
    "SubmissionBase",
    # Opportunity
    "Opportunity",
    "OpportunityCreate",
    "OpportunityUpdate",
    "OpportunityBase",
    # Pipeline
    "Pipeline",
    "PipelineCreate",
    "PipelineUpdate",
    "PipelineBase",
    "PipelineStage",
    "PipelineStageCreate",
]
