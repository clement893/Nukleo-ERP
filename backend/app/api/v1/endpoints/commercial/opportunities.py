"""
Commercial Opportunities Endpoints
API endpoints for managing commercial opportunities
"""

from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, and_
from datetime import datetime as dt
from sqlalchemy.orm import selectinload
import zipfile
import os
from io import BytesIO

from app.core.database import get_db
from app.dependencies import get_current_user
from app.models.pipeline import Opportunite, Pipeline, PipelineStage, opportunity_contacts
from app.models.company import Company
from app.models.contact import Contact
from app.models.user import User
from app.schemas.opportunity import OpportunityCreate, OpportunityUpdate, Opportunity as OpportunitySchema
from app.services.import_service import ImportService
from app.services.export_service import ExportService
from app.core.logging import logger

router = APIRouter(prefix="/commercial/opportunities", tags=["commercial-opportunities"])


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
        # Get contact names
        contact_names = [f"{c.first_name} {c.last_name}" for c in opp.contacts] if opp.contacts else []
        
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
    
    # Get contact names
    contact_names = [f"{c.first_name} {c.last_name}" for c in opportunity.contacts] if opportunity.contacts else []
    
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
        "assigned_to_id": opportunity.assigned_to_id,
        "assigned_to_name": f"{opportunity.assigned_to.first_name} {opportunity.assigned_to.last_name}" if opportunity.assigned_to else None,
        "created_by_name": f"{opportunity.created_by.first_name} {opportunity.created_by.last_name}" if opportunity.created_by else None,
        "opened_at": opportunity.opened_at,
        "closed_at": opportunity.closed_at,
        "contact_names": contact_names,
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
    
    # Get contact names
    contact_names = [f"{c.first_name} {c.last_name}" for c in opportunity.contacts] if opportunity.contacts else []
    
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
        "assigned_to_id": opportunity.assigned_to_id,
        "assigned_to_name": f"{opportunity.assigned_to.first_name} {opportunity.assigned_to.last_name}" if opportunity.assigned_to else None,
        "created_by_name": f"{opportunity.created_by.first_name} {opportunity.created_by.last_name}" if opportunity.created_by else None,
        "opened_at": opportunity.opened_at,
        "closed_at": opportunity.closed_at,
        "contact_names": contact_names,
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
    
    # Get contact names
    contact_names = [f"{c.first_name} {c.last_name}" for c in opportunity.contacts] if opportunity.contacts else []
    
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
        "assigned_to_id": opportunity.assigned_to_id,
        "assigned_to_name": f"{opportunity.assigned_to.first_name} {opportunity.assigned_to.last_name}" if opportunity.assigned_to else None,
        "created_by_name": f"{opportunity.created_by.first_name} {opportunity.created_by.last_name}" if opportunity.created_by else None,
        "opened_at": opportunity.opened_at,
        "closed_at": opportunity.closed_at,
        "contact_names": contact_names,
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
    # Read file content
    file_content = await file.read()
    
    # Import from Excel
    result = ImportService.import_from_excel(
        file_content=file_content,
        has_headers=True
    )
    
    # Process imported data
    created_opportunities = []
    errors = []
    
    for idx, row_data in enumerate(result['data']):
        try:
            # Map Excel columns to Opportunity fields
            name = row_data.get('name') or row_data.get('nom') or row_data.get('Nom de l\'opportunité') or ''
            
            if not name:
                errors.append({
                    'row': idx + 2,
                    'data': row_data,
                    'error': 'Name is required'
                })
                continue
            
            # Get pipeline_id (required)
            pipeline_id_str = row_data.get('pipeline_id') or row_data.get('pipeline') or ''
            if not pipeline_id_str:
                errors.append({
                    'row': idx + 2,
                    'data': row_data,
                    'error': 'Pipeline ID is required'
                })
                continue
            
            try:
                pipeline_id = UUID(pipeline_id_str)
            except ValueError:
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
                errors.append({
                    'row': idx + 2,
                    'data': row_data,
                    'error': f'Pipeline not found: {pipeline_id}'
                })
                continue
            
            opportunity_data = OpportunityCreate(
                name=name,
                description=row_data.get('description') or row_data.get('Description') or None,
                amount=float(row_data.get('amount') or row_data.get('montant') or row_data.get('Montant') or 0) if row_data.get('amount') or row_data.get('montant') or row_data.get('Montant') else None,
                probability=int(row_data.get('probability') or row_data.get('probabilité') or 0) if row_data.get('probability') or row_data.get('probabilité') else None,
                status=row_data.get('status') or row_data.get('statut') or None,
                segment=row_data.get('segment') or None,
                region=row_data.get('region') or row_data.get('région') or None,
                service_offer_link=row_data.get('service_offer_link') or row_data.get('lien_offre') or None,
                notes=row_data.get('notes') or None,
                pipeline_id=pipeline_id,
                stage_id=UUID(row_data.get('stage_id') or row_data.get('stage')) if row_data.get('stage_id') or row_data.get('stage') else None,
                company_id=int(row_data.get('company_id') or row_data.get('company')) if row_data.get('company_id') or row_data.get('company') else None,
                assigned_to_id=int(row_data.get('assigned_to_id') or row_data.get('assigned_to')) if row_data.get('assigned_to_id') or row_data.get('assigned_to') else None,
            )
            
            # Create opportunity
            opportunity = Opportunite(**opportunity_data.model_dump(exclude={'contact_ids'}))
            opportunity.created_by_id = current_user.id
            opportunity.opened_at = opportunity.opened_at or dt.now()
            
            db.add(opportunity)
            created_opportunities.append(opportunity)
            
        except Exception as e:
            errors.append({
                'row': idx + 2,
                'data': row_data,
                'error': str(e)
            })
            logger.error(f"Error importing opportunity row {idx + 2}: {str(e)}")
    
    # Commit all opportunities
    if created_opportunities:
        await db.commit()
        for opportunity in created_opportunities:
            await db.refresh(opportunity)
    
    return {
        'total_rows': result['total_rows'],
        'valid_rows': len(created_opportunities),
        'invalid_rows': len(errors) + result['invalid_rows'],
        'errors': errors + result['errors'],
        'warnings': result['warnings'],
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
