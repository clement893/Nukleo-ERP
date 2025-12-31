"""
Commercial Opportunities Endpoints
API endpoints for managing commercial opportunities
"""

from typing import List, Optional, Dict
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, and_
from datetime import datetime as dt
from sqlalchemy.orm import selectinload
import zipfile
import os
import uuid
import json
import asyncio
from io import BytesIO

from app.core.database import get_db
from app.dependencies import get_current_user
from app.models.pipeline import Opportunite, Pipeline, PipelineStage
from app.models.company import Company
from app.models.contact import Contact
from app.models.user import User
from app.schemas.opportunity import OpportunityCreate, OpportunityUpdate, Opportunity as OpportunitySchema
from app.services.import_service import ImportService
from app.services.export_service import ExportService
from app.core.logging import logger
from app.utils.import_logs import (
    import_logs, import_status, add_import_log, update_import_status,
    get_current_user_from_query, stream_import_logs_generator
)

router = APIRouter(prefix="/commercial/opportunities", tags=["commercial-opportunities"])


async def find_company_by_name(
    company_name: str,
    db: AsyncSession,
    all_companies: Optional[List[Company]] = None,
    company_name_to_id: Optional[dict] = None
) -> Optional[int]:
    """
    Find a company ID by name using intelligent matching.
    
    Matching strategy:
    1. Exact match (case-insensitive)
    2. Match without legal form (SARL, SA, SAS, EURL)
    3. Partial match (contains)
    
    Args:
        company_name: Company name to search for
        db: Database session
        all_companies: Optional pre-loaded list of companies (for performance)
        company_name_to_id: Optional pre-built mapping (for performance)
        
    Returns:
        Company ID if found, None otherwise
    """
    if not company_name or not company_name.strip():
        return None
    
    # Load companies if not provided
    if all_companies is None or company_name_to_id is None:
        companies_result = await db.execute(select(Company))
        all_companies = companies_result.scalars().all()
        company_name_to_id = {}
        for company in all_companies:
            if company.name:
                company_name_to_id[company.name.lower().strip()] = company.id
    
    company_name_normalized = company_name.strip().lower()
    # Remove common prefixes/suffixes for better matching
    company_name_clean = company_name_normalized.replace('sarl', '').replace('sa', '').replace('sas', '').replace('eurl', '').strip()
    
    # Try exact match first
    if company_name_normalized in company_name_to_id:
        return company_name_to_id[company_name_normalized]
    
    # Try match without legal form
    if company_name_clean and company_name_clean in company_name_to_id:
        return company_name_to_id[company_name_clean]
    
    # Try partial match (contains)
    matched_company_id = None
    for stored_name, stored_id in company_name_to_id.items():
        stored_clean = stored_name.replace('sarl', '').replace('sa', '').replace('sas', '').replace('eurl', '').strip()
        if (company_name_clean and stored_clean and 
            (company_name_clean in stored_clean or stored_clean in company_name_clean)):
            matched_company_id = stored_id
            break
    
    # If no match with cleaned, try original normalized
    if not matched_company_id:
        for stored_name, stored_id in company_name_to_id.items():
            if (company_name_normalized in stored_name or stored_name in company_name_normalized):
                matched_company_id = stored_id
                break
    
    return matched_company_id


async def find_contact_by_name(
    first_name: str,
    last_name: str,
    company_id: Optional[int] = None,
    db: AsyncSession = None,
    all_contacts: Optional[List[Contact]] = None,
    contact_name_to_id: Optional[dict] = None
) -> Optional[int]:
    """
    Find a contact ID by first name and last name using intelligent matching.
    
    Matching strategy:
    1. Exact match (case-insensitive) on first_name + last_name
    2. If company_id provided, also filter by company_id
    
    Args:
        first_name: Contact first name
        last_name: Contact last name
        company_id: Optional company ID to filter by
        db: Database session
        all_contacts: Optional pre-loaded list of contacts (for performance)
        contact_name_to_id: Optional pre-built mapping (for performance)
        
    Returns:
        Contact ID if found, None otherwise
    """
    if not first_name or not last_name or not first_name.strip() or not last_name.strip():
        return None
    
    # Load contacts if not provided
    if all_contacts is None or contact_name_to_id is None:
        query = select(Contact)
        if company_id:
            query = query.where(Contact.company_id == company_id)
        contacts_result = await db.execute(query)
        all_contacts = contacts_result.scalars().all()
        contact_name_to_id = {}
        for contact in all_contacts:
            if contact.first_name and contact.last_name:
                full_name = f"{contact.first_name.strip().lower()} {contact.last_name.strip().lower()}"
                contact_name_to_id[full_name] = contact.id
    
    # Normalize search name
    search_name = f"{first_name.strip().lower()} {last_name.strip().lower()}"
    
    # Try exact match
    if search_name in contact_name_to_id:
        return contact_name_to_id[search_name]
    
    # Try matching with company filter if company_id provided
    if company_id:
        for contact in all_contacts:
            if contact.company_id == company_id:
                contact_full_name = f"{contact.first_name.strip().lower()} {contact.last_name.strip().lower()}"
                if contact_full_name == search_name:
                    return contact.id
    
    return None


# SSE endpoint for import logs
@router.get("/import/{import_id}/logs")
async def stream_import_logs(
    import_id: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    Stream import logs via Server-Sent Events (SSE) for opportunities import
    Note: Uses query parameter authentication because EventSource doesn't support custom headers
    """
    # Authenticate user
    current_user = await get_current_user_from_query(request, db)
    
    return StreamingResponse(
        stream_import_logs_generator(import_id),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )


@router.get("/", response_model=List[OpportunitySchema])
async def list_opportunities(
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status: Optional[str] = Query(None),
    pipeline_id: Optional[UUID] = Query(None),
    stage_id: Optional[UUID] = Query(None),
    company_id: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
) -> List[Opportunite]:
    """
    Get list of opportunities
    
    Args:
        skip: Number of records to skip
        limit: Maximum number of records to return
        status: Optional status filter
        pipeline_id: Optional pipeline filter
        stage_id: Optional stage filter
        company_id: Optional company filter
        search: Optional search term (searches in name and description)
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        List of opportunities
    """
    query = select(Opportunite)
    
    # Apply filters
    if status:
        query = query.where(Opportunite.status == status)
    if pipeline_id:
        query = query.where(Opportunite.pipeline_id == pipeline_id)
    if stage_id:
        query = query.where(Opportunite.stage_id == stage_id)
    if company_id:
        query = query.where(Opportunite.company_id == company_id)
    if search:
        search_term = f"%{search}%"
        query = query.where(
            or_(
                Opportunite.name.ilike(search_term),
                Opportunite.description.ilike(search_term),
            )
        )
    
    query = query.options(
        selectinload(Opportunite.pipeline),
        selectinload(Opportunite.stage),
        selectinload(Opportunite.company),
        selectinload(Opportunite.assigned_to),
        selectinload(Opportunite.created_by),
        selectinload(Opportunite.contacts),
    ).order_by(Opportunite.created_at.desc()).offset(skip).limit(limit)
    
    result = await db.execute(query)
    opportunities = result.scalars().all()
    
    # Convert to response format
    opportunity_list = []
    for opp in opportunities:
        # Get contact names and IDs
        contact_names = [f"{c.first_name} {c.last_name}" for c in opp.contacts] if opp.contacts else []
        contact_ids = [c.id for c in opp.contacts] if opp.contacts else []
        
        opportunity_dict = {
            "id": opp.id,
            "name": opp.name,
            "description": opp.description,
            "amount": float(opp.amount) if opp.amount else None,
            "probability": opp.probability,
            "expected_close_date": opp.expected_close_date,
            "status": opp.status,
            "segment": opp.segment,
            "region": opp.region,
            "service_offer_link": opp.service_offer_link,
            "notes": opp.notes,
            "pipeline_id": opp.pipeline_id,
            "pipeline_name": opp.pipeline.name if opp.pipeline else None,
            "stage_id": opp.stage_id,
            "stage_name": opp.stage.name if opp.stage else None,
            "company_id": opp.company_id,
            "company_name": opp.company.name if opp.company else None,
            "assigned_to_id": opp.assigned_to_id,
            "assigned_to_name": f"{opp.assigned_to.first_name} {opp.assigned_to.last_name}" if opp.assigned_to else None,
            "created_by_name": f"{opp.created_by.first_name} {opp.created_by.last_name}" if opp.created_by else None,
            "opened_at": opp.opened_at,
            "closed_at": opp.closed_at,
            "contact_names": contact_names,
            "contact_ids": contact_ids,
            "created_at": opp.created_at,
            "updated_at": opp.updated_at,
        }
        opportunity_list.append(OpportunitySchema(**opportunity_dict))
    
    return opportunity_list


@router.get("/{opportunity_id}", response_model=OpportunitySchema)
async def get_opportunity(
    opportunity_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Opportunite:
    """
    Get a specific opportunity by ID
    
    Args:
        opportunity_id: Opportunity ID
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        Opportunity details
        
    Raises:
        HTTPException: If opportunity not found
    """
    result = await db.execute(
        select(Opportunite)
        .options(
            selectinload(Opportunite.pipeline),
            selectinload(Opportunite.stage),
            selectinload(Opportunite.company),
            selectinload(Opportunite.assigned_to),
            selectinload(Opportunite.created_by),
            selectinload(Opportunite.contacts),
        )
        .where(Opportunite.id == opportunity_id)
    )
    opportunity = result.scalar_one_or_none()
    
    if not opportunity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Opportunity not found"
        )
    
    # Get contact names and IDs
    contact_names = [f"{c.first_name} {c.last_name}" for c in opportunity.contacts] if opportunity.contacts else []
    contact_ids = [c.id for c in opportunity.contacts] if opportunity.contacts else []
    
    # Convert to response format
    opportunity_dict = {
        "id": opportunity.id,
        "name": opportunity.name,
        "description": opportunity.description,
        "amount": float(opportunity.amount) if opportunity.amount else None,
        "probability": opportunity.probability,
        "expected_close_date": opportunity.expected_close_date,
        "status": opportunity.status,
        "segment": opportunity.segment,
        "region": opportunity.region,
        "service_offer_link": opportunity.service_offer_link,
        "notes": opportunity.notes,
        "pipeline_id": opportunity.pipeline_id,
        "pipeline_name": opportunity.pipeline.name if opportunity.pipeline else None,
        "stage_id": opportunity.stage_id,
        "stage_name": opportunity.stage.name if opportunity.stage else None,
        "company_id": opportunity.company_id,
        "company_name": opportunity.company.name if opportunity.company else None,
        "company_logo_url": opportunity.company.logo_url if opportunity.company else None,
        "assigned_to_id": opportunity.assigned_to_id,
        "assigned_to_name": f"{opportunity.assigned_to.first_name} {opportunity.assigned_to.last_name}" if opportunity.assigned_to else None,
        "created_by_name": f"{opportunity.created_by.first_name} {opportunity.created_by.last_name}" if opportunity.created_by else None,
        "opened_at": opportunity.opened_at,
        "closed_at": opportunity.closed_at,
        "contact_names": contact_names,
        "contact_ids": contact_ids,
        "created_at": opportunity.created_at,
        "updated_at": opportunity.updated_at,
    }
    
    return OpportunitySchema(**opportunity_dict)


@router.post("/", response_model=OpportunitySchema, status_code=status.HTTP_201_CREATED)
async def create_opportunity(
    request: Request,
    opportunity_data: OpportunityCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Opportunite:
    """
    Create a new opportunity
    
    Args:
        opportunity_data: Opportunity creation data
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        Created opportunity
    """
    # Validate pipeline exists
    pipeline_result = await db.execute(
        select(Pipeline).where(Pipeline.id == opportunity_data.pipeline_id)
    )
    if not pipeline_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pipeline not found"
        )
    
    # Validate stage exists if provided
    if opportunity_data.stage_id:
        stage_result = await db.execute(
            select(PipelineStage).where(PipelineStage.id == opportunity_data.stage_id)
        )
        if not stage_result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Pipeline stage not found"
            )
    
    # Validate company exists if provided
    if opportunity_data.company_id:
        company_result = await db.execute(
            select(Company).where(Company.id == opportunity_data.company_id)
        )
        if not company_result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Company not found"
            )
    
    # Validate assigned user exists if provided
    if opportunity_data.assigned_to_id:
        user_result = await db.execute(
            select(User).where(User.id == opportunity_data.assigned_to_id)
        )
        if not user_result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Assigned user not found"
            )
    
    # Create opportunity
    opportunity = Opportunite(
        name=opportunity_data.name,
        description=opportunity_data.description,
        amount=opportunity_data.amount,
        probability=opportunity_data.probability,
        expected_close_date=opportunity_data.expected_close_date,
        status=opportunity_data.status,
        segment=opportunity_data.segment,
        region=opportunity_data.region,
        service_offer_link=opportunity_data.service_offer_link,
        notes=opportunity_data.notes,
        pipeline_id=opportunity_data.pipeline_id,
        stage_id=opportunity_data.stage_id,
        company_id=opportunity_data.company_id,
        assigned_to_id=opportunity_data.assigned_to_id,
        created_by_id=current_user.id,
        opened_at=opportunity_data.opened_at or dt.now(),
    )
    
    db.add(opportunity)
    await db.flush()  # Flush to get the ID
    
    # Add contacts if provided
    if opportunity_data.contact_ids:
        contact_results = await db.execute(
            select(Contact).where(Contact.id.in_(opportunity_data.contact_ids))
        )
        contacts = contact_results.scalars().all()
        opportunity.contacts.extend(contacts)
    
    await db.commit()
    await db.refresh(opportunity)
    
    # Load relationships
    await db.refresh(opportunity, ["pipeline", "stage", "company", "assigned_to", "created_by", "contacts"])
    
    # Get contact names and IDs
    contact_names = [f"{c.first_name} {c.last_name}" for c in opportunity.contacts] if opportunity.contacts else []
    contact_ids = [c.id for c in opportunity.contacts] if opportunity.contacts else []
    
    # Convert to response format
    opportunity_dict = {
        "id": opportunity.id,
        "name": opportunity.name,
        "description": opportunity.description,
        "amount": float(opportunity.amount) if opportunity.amount else None,
        "probability": opportunity.probability,
        "expected_close_date": opportunity.expected_close_date,
        "status": opportunity.status,
        "segment": opportunity.segment,
        "region": opportunity.region,
        "service_offer_link": opportunity.service_offer_link,
        "notes": opportunity.notes,
        "pipeline_id": opportunity.pipeline_id,
        "pipeline_name": opportunity.pipeline.name if opportunity.pipeline else None,
        "stage_id": opportunity.stage_id,
        "stage_name": opportunity.stage.name if opportunity.stage else None,
        "company_id": opportunity.company_id,
        "company_name": opportunity.company.name if opportunity.company else None,
        "company_logo_url": opportunity.company.logo_url if opportunity.company else None,
        "assigned_to_id": opportunity.assigned_to_id,
        "assigned_to_name": f"{opportunity.assigned_to.first_name} {opportunity.assigned_to.last_name}" if opportunity.assigned_to else None,
        "created_by_name": f"{opportunity.created_by.first_name} {opportunity.created_by.last_name}" if opportunity.created_by else None,
        "opened_at": opportunity.opened_at,
        "closed_at": opportunity.closed_at,
        "contact_names": contact_names,
        "contact_ids": contact_ids,
        "created_at": opportunity.created_at,
        "updated_at": opportunity.updated_at,
    }
    
    return OpportunitySchema(**opportunity_dict)


@router.put("/{opportunity_id}", response_model=OpportunitySchema)
async def update_opportunity(
    request: Request,
    opportunity_id: UUID,
    opportunity_data: OpportunityUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Opportunite:
    """
    Update an opportunity
    
    Args:
        opportunity_id: Opportunity ID
        opportunity_data: Opportunity update data
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        Updated opportunity
        
    Raises:
        HTTPException: If opportunity not found
    """
    result = await db.execute(
        select(Opportunite).where(Opportunite.id == opportunity_id)
    )
    opportunity = result.scalar_one_or_none()
    
    if not opportunity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Opportunity not found"
        )
    
    # Validate pipeline exists if provided
    if opportunity_data.pipeline_id is not None:
        pipeline_result = await db.execute(
            select(Pipeline).where(Pipeline.id == opportunity_data.pipeline_id)
        )
        if not pipeline_result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Pipeline not found"
            )
    
    # Validate stage exists if provided
    if opportunity_data.stage_id is not None:
        stage_result = await db.execute(
            select(PipelineStage).where(PipelineStage.id == opportunity_data.stage_id)
        )
        if not stage_result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Pipeline stage not found"
            )
    
    # Validate company exists if provided
    if opportunity_data.company_id is not None:
        company_result = await db.execute(
            select(Company).where(Company.id == opportunity_data.company_id)
        )
        if not company_result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Company not found"
            )
    
    # Validate assigned user exists if provided
    if opportunity_data.assigned_to_id is not None:
        user_result = await db.execute(
            select(User).where(User.id == opportunity_data.assigned_to_id)
        )
        if not user_result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Assigned user not found"
            )
    
    # Update fields
    update_data = opportunity_data.model_dump(exclude_unset=True, exclude={'contact_ids'})
    for field, value in update_data.items():
        setattr(opportunity, field, value)
    
    # Update contacts if provided
    if 'contact_ids' in opportunity_data.model_dump(exclude_unset=True):
        contact_ids = opportunity_data.contact_ids
        if contact_ids is not None:
            contact_results = await db.execute(
                select(Contact).where(Contact.id.in_(contact_ids))
            )
            contacts = contact_results.scalars().all()
            opportunity.contacts = contacts
    
    await db.commit()
    await db.refresh(opportunity)
    await db.refresh(opportunity, ["pipeline", "stage", "company", "assigned_to", "created_by", "contacts"])
    
    # Get contact names and IDs
    contact_names = [f"{c.first_name} {c.last_name}" for c in opportunity.contacts] if opportunity.contacts else []
    contact_ids = [c.id for c in opportunity.contacts] if opportunity.contacts else []
    
    # Convert to response format
    opportunity_dict = {
        "id": opportunity.id,
        "name": opportunity.name,
        "description": opportunity.description,
        "amount": float(opportunity.amount) if opportunity.amount else None,
        "probability": opportunity.probability,
        "expected_close_date": opportunity.expected_close_date,
        "status": opportunity.status,
        "segment": opportunity.segment,
        "region": opportunity.region,
        "service_offer_link": opportunity.service_offer_link,
        "notes": opportunity.notes,
        "pipeline_id": opportunity.pipeline_id,
        "pipeline_name": opportunity.pipeline.name if opportunity.pipeline else None,
        "stage_id": opportunity.stage_id,
        "stage_name": opportunity.stage.name if opportunity.stage else None,
        "company_id": opportunity.company_id,
        "company_name": opportunity.company.name if opportunity.company else None,
        "company_logo_url": opportunity.company.logo_url if opportunity.company else None,
        "assigned_to_id": opportunity.assigned_to_id,
        "assigned_to_name": f"{opportunity.assigned_to.first_name} {opportunity.assigned_to.last_name}" if opportunity.assigned_to else None,
        "created_by_name": f"{opportunity.created_by.first_name} {opportunity.created_by.last_name}" if opportunity.created_by else None,
        "opened_at": opportunity.opened_at,
        "closed_at": opportunity.closed_at,
        "contact_names": contact_names,
        "contact_ids": contact_ids,
        "created_at": opportunity.created_at,
        "updated_at": opportunity.updated_at,
    }
    
    return OpportunitySchema(**opportunity_dict)


@router.delete("/{opportunity_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_opportunity(
    request: Request,
    opportunity_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    """
    Delete an opportunity
    
    Args:
        opportunity_id: Opportunity ID
        current_user: Current authenticated user
        db: Database session
        
    Raises:
        HTTPException: If opportunity not found
    """
    result = await db.execute(
        select(Opportunite).where(Opportunite.id == opportunity_id)
    )
    opportunity = result.scalar_one_or_none()
    
    if not opportunity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Opportunity not found"
        )
    
    await db.delete(opportunity)
    await db.commit()


@router.post("/import")
async def import_opportunities(
    file: UploadFile = File(...),
    import_id: Optional[str] = Query(None, description="Unique ID for this import process"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Import opportunities from Excel file
    
    Args:
        file: Excel file with opportunities data
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        Import results with data, errors, and warnings
    """
    # Generate import_id if not provided
    if not import_id:
        import_id = f"import_{int(dt.now().timestamp() * 1000)}_{uuid.uuid4().hex[:8]}"
    
    # Initialize logs and status
    import_logs[import_id] = []
    import_status[import_id] = {
        "status": "started",
        "progress": 0,
        "total": 0,
        "created_at": dt.now().isoformat()
    }
    
    add_import_log(import_id, f"Début de l'import du fichier: {file.filename}", "info")
    
    try:
        # Read file content
        file_content = await file.read()
        add_import_log(import_id, f"Fichier lu: {len(file_content)} bytes", "info")
        
        # Import from Excel
        add_import_log(import_id, "Lecture du fichier Excel...", "info")
        result = ImportService.import_from_excel(
            file_content=file_content,
            has_headers=True
        )
        
        total_rows = len(result.get('data', []))
        add_import_log(import_id, f"Fichier Excel lu avec succès: {total_rows} ligne(s) trouvée(s)", "info")
        update_import_status(import_id, "processing", progress=0, total=total_rows)
        
        # Load all companies once to create a name -> ID mapping
        add_import_log(import_id, "Chargement des entreprises existantes...", "info")
        companies_result = await db.execute(select(Company))
        all_companies = companies_result.scalars().all()
        company_name_to_id = {}
        for company in all_companies:
            if company.name:
                company_name_to_id[company.name.lower().strip()] = company.id
        add_import_log(import_id, f"{len(company_name_to_id)} entreprise(s) chargée(s) pour le matching", "info")
        
        # Load all contacts once to create a name -> ID mapping
        add_import_log(import_id, "Chargement des contacts existants...", "info")
        contacts_result = await db.execute(select(Contact))
        all_contacts = contacts_result.scalars().all()
        contact_name_to_id = {}
        for contact in all_contacts:
            if contact.first_name and contact.last_name:
                full_name = f"{contact.first_name.strip().lower()} {contact.last_name.strip().lower()}"
                contact_name_to_id[full_name] = contact.id
        add_import_log(import_id, f"{len(contact_name_to_id)} contact(s) chargé(s) pour le matching", "info")
        
        # Process imported data
        created_opportunities = []
        errors = []
        stats = {
            "total_processed": 0,
            "created_new": 0,
            "errors": 0
        }
        
        # Helper function to normalize column names (case-insensitive, accent-insensitive)
        import unicodedata
        import re
        
        def normalize_key(key: str) -> str:
            """Normalize column name for matching"""
            if not key:
                return ''
            normalized = str(key).lower().strip()
            normalized = unicodedata.normalize('NFD', normalized)
            normalized = ''.join(c for c in normalized if unicodedata.category(c) != 'Mn')
            return normalized
        
        def get_field_value(row: dict, possible_names: list) -> Optional[str]:
            """Get field value trying multiple possible column names"""
            # First try exact match (case-sensitive)
            for name in possible_names:
                if name in row and row[name] is not None:
                    value = str(row[name]).strip()
                    if value:
                        return value
            
            # Then try case-insensitive match
            row_lower_keys = {k.lower(): v for k, v in row.items()}
            for name in possible_names:
                if name.lower() in row_lower_keys and row_lower_keys[name.lower()] is not None:
                    value = str(row_lower_keys[name.lower()]).strip()
                    if value:
                        return value
            
            # Then try normalized match (case-insensitive, accent-insensitive)
            normalized_row = {normalize_key(k): v for k, v in row.items()}
            for name in possible_names:
                normalized_name = normalize_key(name)
                if normalized_name in normalized_row and normalized_row[normalized_name] is not None:
                    value = str(normalized_row[normalized_name]).strip()
                    if value:
                        return value
            
            return None
        
        add_import_log(import_id, f"Début du traitement de {total_rows} ligne(s)...", "info")
        
        # Get default pipeline if available (for cases where pipeline_id is not in Excel)
        default_pipeline = None
        try:
            pipeline_result = await db.execute(select(Pipeline).limit(1))
            default_pipeline = pipeline_result.scalar_one_or_none()
            if default_pipeline:
                add_import_log(import_id, f"Pipeline par défaut trouvé: {default_pipeline.name} (ID: {default_pipeline.id})", "info")
        except Exception as e:
            logger.warning(f"Could not get default pipeline: {e}")
        
        for idx, row_data in enumerate(result['data']):
            try:
                stats["total_processed"] += 1
                update_import_status(import_id, "processing", progress=idx + 1, total=total_rows)
                
                # Log progress every 10 rows
                if (idx + 1) % 10 == 0 or idx < 5:
                    add_import_log(import_id, f"📊 Ligne {idx + 1}/{total_rows}: Traitement en cours... (créés: {stats['created_new']}, erreurs: {stats['errors']})", "info", {"progress": idx + 1, "total": total_rows, "stats": stats.copy()})
                
                # Map Excel columns to Opportunity fields using flexible matching
                name = get_field_value(row_data, [
                    'name', 'nom', 'Nom de l\'opportunité', 'opportunité', 'opportunite', 
                    'titre', 'title', 'nom_opportunite', 'nom_opportunité'
                ])
                
                if not name:
                    stats["errors"] += 1
                    error_msg = f"Ligne {idx + 2}: ❌ Nom de l'opportunité requis mais non trouvé dans les colonnes"
                    add_import_log(import_id, error_msg, "error", {"row": idx + 2, "available_columns": list(row_data.keys())[:10]})
                    errors.append({
                        'row': idx + 2,
                        'data': row_data,
                        'error': 'Name is required'
                    })
                    continue
                
                # Get pipeline_id (try to find in Excel, or use default)
                pipeline_id_str = get_field_value(row_data, [
                    'pipeline_id', 'pipeline', 'pipeline_id', 'id_pipeline', 'pipeline uuid'
                ])
                
                if not pipeline_id_str and default_pipeline:
                    pipeline_id_str = str(default_pipeline.id)
                    add_import_log(import_id, f"Ligne {idx + 2}: Pipeline ID non trouvé, utilisation du pipeline par défaut: {default_pipeline.name}", "info")
                elif not pipeline_id_str:
                    stats["errors"] += 1
                    error_msg = f"Ligne {idx + 2}: ❌ Pipeline ID requis mais non trouvé et aucun pipeline par défaut disponible"
                    add_import_log(import_id, error_msg, "error", {"row": idx + 2, "available_columns": list(row_data.keys())[:10]})
                    errors.append({
                        'row': idx + 2,
                        'data': row_data,
                        'error': 'Pipeline ID is required'
                    })
                    continue
                
                try:
                    pipeline_id = UUID(pipeline_id_str)
                except ValueError:
                    stats["errors"] += 1
                    error_msg = f"Ligne {idx + 2}: ❌ Pipeline ID invalide: {pipeline_id_str}"
                    add_import_log(import_id, error_msg, "error", {"row": idx + 2, "pipeline_id_str": pipeline_id_str})
                    errors.append({
                        'row': idx + 2,
                        'data': row_data,
                        'error': f'Invalid pipeline ID: {pipeline_id_str}'
                    })
                    continue
                
                # Validate pipeline exists
                pipeline_result = await db.execute(
                    select(Pipeline).where(Pipeline.id == pipeline_id)
                )
                if not pipeline_result.scalar_one_or_none():
                    stats["errors"] += 1
                    error_msg = f"Ligne {idx + 2}: ❌ Pipeline non trouvé: {pipeline_id}"
                    add_import_log(import_id, error_msg, "error", {"row": idx + 2, "pipeline_id": str(pipeline_id)})
                    errors.append({
                        'row': idx + 2,
                        'data': row_data,
                        'error': f'Pipeline not found: {pipeline_id}'
                    })
                    continue
                
                # Handle company matching by name or ID using flexible matching
                company_id = None
                company_name = get_field_value(row_data, [
                    'company_name', 'entreprise', 'Entreprise', 'nom_entreprise', 'company', 
                    'société', 'societe', 'organisation', 'organization'
                ])
                company_id_raw = get_field_value(row_data, [
                    'company_id', 'id_entreprise', 'entreprise_id', 'company id', 'id company'
                ])
                
                if company_id_raw:
                    try:
                        company_id = int(float(str(company_id_raw)))
                        # Verify company exists
                        company_result = await db.execute(
                            select(Company).where(Company.id == company_id)
                        )
                        if not company_result.scalar_one_or_none():
                            stats["errors"] += 1
                            error_msg = f"Ligne {idx + 2}: ❌ Entreprise ID {company_id} non trouvée"
                            add_import_log(import_id, error_msg, "error", {"row": idx + 2, "company_id": company_id})
                            errors.append({
                                'row': idx + 2,
                                'data': row_data,
                                'error': f'Company ID {company_id} not found'
                            })
                            continue
                    except (ValueError, TypeError):
                        stats["errors"] += 1
                        error_msg = f"Ligne {idx + 2}: ❌ ID entreprise invalide: {company_id_raw}"
                        add_import_log(import_id, error_msg, "error", {"row": idx + 2, "company_id_raw": company_id_raw})
                        errors.append({
                            'row': idx + 2,
                            'data': row_data,
                            'error': f'Invalid company ID: {company_id_raw}'
                        })
                        continue
                elif company_name:
                    # Try to find existing company by name
                    matched_company_id = await find_company_by_name(
                        company_name=company_name,
                        db=db,
                        all_companies=all_companies,
                        company_name_to_id=company_name_to_id
                    )
                    if matched_company_id:
                        company_id = matched_company_id
                        add_import_log(import_id, f"Ligne {idx + 2}: Entreprise '{company_name}' matchée avec ID {matched_company_id}", "info")
                    else:
                        add_import_log(import_id, f"Ligne {idx + 2}: ⚠️ Entreprise '{company_name}' non trouvée, opportunité créée sans entreprise", "warning")
                
                # Handle contact matching by name using flexible matching
                contact_ids = []
                contact_name = get_field_value(row_data, [
                    'contact_name', 'contact', 'Contact', 'nom_contact', 'contact_nom'
                ])
                contact_first_name = get_field_value(row_data, [
                    'contact_first_name', 'contact_prenom', 'Contact Prénom', 'prenom_contact', 'contact prénom'
                ])
                contact_last_name = get_field_value(row_data, [
                    'contact_last_name', 'contact_nom', 'Contact Nom', 'nom_contact', 'contact nom'
                ])
                
                if contact_name:
                    # Try to parse "First Last" format
                    name_parts = contact_name.strip().split(' ', 1)
                    if len(name_parts) == 2:
                        contact_first_name = name_parts[0]
                        contact_last_name = name_parts[1]
                    elif len(name_parts) == 1:
                        contact_last_name = name_parts[0]
                
                if contact_first_name and contact_last_name:
                    matched_contact_id = await find_contact_by_name(
                        first_name=contact_first_name,
                        last_name=contact_last_name,
                        company_id=company_id,
                        db=db,
                        all_contacts=all_contacts,
                        contact_name_to_id=contact_name_to_id
                    )
                    if matched_contact_id:
                        contact_ids.append(matched_contact_id)
                        add_import_log(import_id, f"Ligne {idx + 2}: Contact '{contact_first_name} {contact_last_name}' matché avec ID {matched_contact_id}", "info")
                    else:
                        add_import_log(import_id, f"Ligne {idx + 2}: ⚠️ Contact '{contact_first_name} {contact_last_name}' non trouvé", "warning")
                
                # Get other fields using flexible matching
                description = get_field_value(row_data, ['description', 'Description', 'descriptif', 'desc'])
                
                amount_str = get_field_value(row_data, ['amount', 'montant', 'Montant', 'prix', 'valeur'])
                amount = None
                if amount_str:
                    try:
                        amount = float(amount_str)
                    except (ValueError, TypeError):
                        add_import_log(import_id, f"Ligne {idx + 2}: ⚠️ Montant invalide: {amount_str}, ignoré", "warning")
                
                probability_str = get_field_value(row_data, ['probability', 'probabilité', 'Probabilité', 'probabilite'])
                probability = None
                if probability_str:
                    try:
                        probability = int(float(probability_str))
                        if probability < 0 or probability > 100:
                            probability = None
                            add_import_log(import_id, f"Ligne {idx + 2}: ⚠️ Probabilité hors limites (0-100): {probability_str}, ignorée", "warning")
                    except (ValueError, TypeError):
                        add_import_log(import_id, f"Ligne {idx + 2}: ⚠️ Probabilité invalide: {probability_str}, ignorée", "warning")
                
                status_val = get_field_value(row_data, ['status', 'statut', 'Statut', 'état', 'etat'])
                segment = get_field_value(row_data, ['segment', 'Segment', 'segmentation'])
                region = get_field_value(row_data, ['region', 'région', 'Région', 'Region'])
                service_offer_link = get_field_value(row_data, ['service_offer_link', 'lien_offre', 'lien', 'url'])
                notes = get_field_value(row_data, ['notes', 'Notes', 'note', 'commentaires', 'commentaire'])
                
                stage_id_str = get_field_value(row_data, ['stage_id', 'stage', 'stade', 'Stage', 'Stade'])
                stage_id = None
                if stage_id_str:
                    try:
                        stage_id = UUID(stage_id_str)
                    except ValueError:
                        add_import_log(import_id, f"Ligne {idx + 2}: ⚠️ Stage ID invalide: {stage_id_str}, ignoré", "warning")
                
                assigned_to_id_str = get_field_value(row_data, ['assigned_to_id', 'assigned_to', 'assigné', 'assigné_à', 'assigned to'])
                assigned_to_id = None
                if assigned_to_id_str:
                    try:
                        assigned_to_id = int(float(str(assigned_to_id_str)))
                    except (ValueError, TypeError):
                        add_import_log(import_id, f"Ligne {idx + 2}: ⚠️ ID assigné invalide: {assigned_to_id_str}, ignoré", "warning")
                
                opportunity_data = OpportunityCreate(
                    name=name,
                    description=description,
                    amount=amount,
                    probability=probability,
                    status=status_val,
                    segment=segment,
                    region=region,
                    service_offer_link=service_offer_link,
                    notes=notes,
                    pipeline_id=pipeline_id,
                    stage_id=stage_id,
                    company_id=company_id,
                    assigned_to_id=assigned_to_id,
                    contact_ids=contact_ids if contact_ids else None,
                )
                
                # Create opportunity
                opportunity = Opportunite(**opportunity_data.model_dump(exclude={'contact_ids'}))
                opportunity.created_by_id = current_user.id
                opportunity.opened_at = opportunity.opened_at or dt.now()
                
                db.add(opportunity)
                await db.flush()  # Flush to get the ID
                
                # Add contacts if provided
                if contact_ids:
                    contact_results = await db.execute(
                        select(Contact).where(Contact.id.in_(contact_ids))
                    )
                    contacts = contact_results.scalars().all()
                    opportunity.contacts.extend(contacts)
                
                created_opportunities.append(opportunity)
                stats["created_new"] += 1
                add_import_log(import_id, f"Ligne {idx + 2}: Nouvelle opportunité créée - {name}", "info", {"row": idx + 2, "action": "created", "opportunity_name": name})
                
            except Exception as e:
                stats["errors"] += 1
                error_msg = f"Ligne {idx + 2}: ❌ Erreur lors de l'import - {str(e)}"
                add_import_log(import_id, error_msg, "error", {"row": idx + 2, "error": str(e)})
                errors.append({
                    'row': idx + 2,
                    'data': row_data,
                    'error': str(e)
                })
                logger.error(f"Error importing opportunity row {idx + 2}: {str(e)}")
        
        # Commit all opportunities
        add_import_log(import_id, f"Sauvegarde de {len(created_opportunities)} opportunité(s) dans la base de données...", "info")
        if created_opportunities:
            await db.commit()
            for opportunity in created_opportunities:
                await db.refresh(opportunity)
            
            add_import_log(import_id, f"Sauvegarde réussie: {len(created_opportunities)} opportunité(s) créée(s)", "success")
        
        # Final logs
        add_import_log(import_id, f"✅ Import terminé: {len(created_opportunities)} opportunité(s) importée(s), {len(errors)} erreur(s)", "success", {
            "total_valid": len(created_opportunities),
            "total_errors": len(errors)
        })
        update_import_status(import_id, "completed", progress=total_rows, total=total_rows)
        
        return {
            'total_rows': result['total_rows'],
            'valid_rows': len(created_opportunities),
            'invalid_rows': len(errors) + result['invalid_rows'],
            'errors': errors + result['errors'],
            'warnings': result['warnings'],
            'import_id': import_id,
            'data': [OpportunitySchema.model_validate({
                'id': o.id,
                'name': o.name,
                'description': o.description,
                'amount': float(o.amount) if o.amount else None,
                'probability': o.probability,
                'status': o.status,
                'pipeline_id': o.pipeline_id,
                'stage_id': o.stage_id,
                'company_id': o.company_id,
                'created_at': o.created_at,
                'updated_at': o.updated_at,
            }) for o in created_opportunities]
        }
    except Exception as e:
        logger.error(f"Unexpected error in import_opportunities: {e}", exc_info=True)
        if 'import_id' in locals():
            add_import_log(import_id, f"❌ Erreur inattendue lors de l'import: {str(e)}", "error")
            update_import_status(import_id, "failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred during import: {str(e)}"
        )


@router.get("/export")
async def export_opportunities(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Export opportunities to Excel file
    
    Args:
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        Excel file with opportunities data
    """
    try:
        # Get all opportunities
        result = await db.execute(
            select(Opportunite)
            .options(
                selectinload(Opportunite.pipeline),
                selectinload(Opportunite.stage),
                selectinload(Opportunite.company),
                selectinload(Opportunite.assigned_to),
                selectinload(Opportunite.contacts),
            )
            .order_by(Opportunite.created_at.desc())
        )
        opportunities = result.scalars().all()
        
        # Convert to dict format for export
        export_data = []
        for opportunity in opportunities:
            try:
                contact_names = ', '.join([f"{c.first_name} {c.last_name}" for c in opportunity.contacts]) if opportunity.contacts else ''
                
                export_data.append({
                    'Nom de l\'opportunité': opportunity.name or '',
                    'Description': opportunity.description or '',
                    'Montant': float(opportunity.amount) if opportunity.amount else '',
                    'Probabilité': opportunity.probability or '',
                    'Statut': opportunity.status or '',
                    'Pipeline': opportunity.pipeline.name if opportunity.pipeline else '',
                    'Stade': opportunity.stage.name if opportunity.stage else '',
                    'Entreprise': opportunity.company.name if opportunity.company else '',
                    'Segment': opportunity.segment or '',
                    'Région': opportunity.region or '',
                    'Lien offre de service': opportunity.service_offer_link or '',
                    'Notes': opportunity.notes or '',
                    'Contacts liés': contact_names,
                    'Assigné à': f"{opportunity.assigned_to.first_name} {opportunity.assigned_to.last_name}" if opportunity.assigned_to else '',
                    'Date d\'ouverture': opportunity.opened_at.isoformat() if opportunity.opened_at else '',
                    'Date de fermeture': opportunity.closed_at.isoformat() if opportunity.closed_at else '',
                })
            except Exception as e:
                logger.error(f"Error processing opportunity {opportunity.id} for export: {e}")
                continue
        
        # Handle empty data case
        if not export_data:
            export_data = [{
                'Nom de l\'opportunité': '',
                'Description': '',
                'Montant': '',
                'Probabilité': '',
                'Statut': '',
                'Pipeline': '',
                'Stade': '',
                'Entreprise': '',
                'Segment': '',
                'Région': '',
                'Lien offre de service': '',
                'Notes': '',
                'Contacts liés': '',
                'Assigné à': '',
                'Date d\'ouverture': '',
                'Date de fermeture': '',
            }]
        
        # Export to Excel
        from datetime import datetime
        buffer, filename = ExportService.export_to_excel(
            data=export_data,
            filename=f"opportunities_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
        )
        
        return StreamingResponse(
            buffer,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except ValueError as e:
        logger.error(f"Export validation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Erreur lors de l'export: {str(e)}"
        )
    except ImportError as e:
        logger.error(f"Export dependency error: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Le service d'export Excel n'est pas disponible. Veuillez contacter l'administrateur."
        )
    except Exception as e:
        logger.error(f"Unexpected export error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur inattendue lors de l'export: {str(e)}"
        )
