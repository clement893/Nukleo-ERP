"""
Commercial Quotes Endpoints
API endpoints for managing commercial quotes (devis)
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from datetime import datetime

from app.core.database import get_db
from app.dependencies import get_current_user
from app.models.quote import Quote
from app.models.quote_line_item import QuoteLineItem
from app.models.company import Company
from app.models.user import User
from app.schemas.quote import QuoteCreate, QuoteUpdate, Quote as QuoteSchema, QuoteLineItemCreate
from app.core.logging import logger
from decimal import Decimal

router = APIRouter(prefix="/commercial/quotes", tags=["commercial-quotes"])


async def generate_quote_number(db: AsyncSession) -> str:
    """Generate a unique quote number"""
    # Get current year
    year = datetime.now().year
    
    # Find the highest quote number for this year
    result = await db.execute(
        select(func.max(Quote.quote_number))
        .where(Quote.quote_number.like(f"DEV-{year}-%"))
    )
    max_number = result.scalar_one_or_none()
    
    if max_number:
        # Extract the number part and increment
        try:
            number_part = int(max_number.split("-")[-1])
            new_number = number_part + 1
        except (ValueError, IndexError):
            new_number = 1
    else:
        new_number = 1
    
    return f"DEV-{year}-{new_number:03d}"


@router.get("/", response_model=List[QuoteSchema])
async def list_quotes(
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    company_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
) -> List[Quote]:
    """
    Get list of quotes
    
    Args:
        skip: Number of records to skip
        limit: Maximum number of records to return
        company_id: Optional company filter
        status: Optional status filter
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        List of quotes
    """
    query = select(Quote)
    
    if company_id:
        query = query.where(Quote.company_id == company_id)
    if status:
        query = query.where(Quote.status == status)
    
    query = query.options(
        selectinload(Quote.company),
        selectinload(Quote.user),
        selectinload(Quote.line_items)
    ).order_by(Quote.created_at.desc()).offset(skip).limit(limit)
    
    result = await db.execute(query)
    quotes = result.scalars().all()
    
    # Convert to response format
    quote_list = []
    for quote in quotes:
        quote_dict = {
            "id": quote.id,
            "quote_number": quote.quote_number,
            "company_id": quote.company_id,
            "company_name": quote.company.name if quote.company else None,
            "title": quote.title,
            "description": quote.description,
            "amount": float(quote.amount) if quote.amount else None,
            "currency": quote.currency,
            "pricing_type": quote.pricing_type,
            "status": quote.status,
            "valid_until": quote.valid_until.isoformat() if quote.valid_until else None,
            "notes": quote.notes,
            "user_name": f"{quote.user.first_name} {quote.user.last_name}" if quote.user else None,
            "line_items": [
                {
                    "id": item.id,
                    "quote_id": item.quote_id,
                    "description": item.description,
                    "quantity": float(item.quantity) if item.quantity else None,
                    "unit_price": float(item.unit_price) if item.unit_price else None,
                    "total_price": float(item.total_price) if item.total_price else None,
                    "line_order": item.line_order,
                    "created_at": item.created_at,
                    "updated_at": item.updated_at,
                }
                for item in sorted(quote.line_items, key=lambda x: x.line_order)
            ] if quote.line_items else [],
            "created_at": quote.created_at,
            "updated_at": quote.updated_at,
        }
        quote_list.append(QuoteSchema(**quote_dict))
    
    return quote_list


@router.get("/{quote_id}", response_model=QuoteSchema)
async def get_quote(
    quote_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Quote:
    """
    Get a specific quote by ID
    
    Args:
        quote_id: Quote ID
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        Quote details
        
    Raises:
        HTTPException: If quote not found
    """
    result = await db.execute(
        select(Quote)
        .options(
            selectinload(Quote.company),
            selectinload(Quote.user),
            selectinload(Quote.line_items)
        )
        .where(Quote.id == quote_id)
    )
    quote = result.scalar_one_or_none()
    
    if not quote:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quote not found"
        )
    
    quote_dict = {
        "id": quote.id,
        "quote_number": quote.quote_number,
        "company_id": quote.company_id,
        "company_name": quote.company.name if quote.company else None,
        "title": quote.title,
        "description": quote.description,
        "amount": float(quote.amount) if quote.amount else None,
        "currency": quote.currency,
        "pricing_type": quote.pricing_type,
        "status": quote.status,
        "valid_until": quote.valid_until.isoformat() if quote.valid_until else None,
        "notes": quote.notes,
        "user_name": f"{quote.user.first_name} {quote.user.last_name}" if quote.user else None,
        "line_items": [
            {
                "id": item.id,
                "quote_id": item.quote_id,
                "description": item.description,
                "quantity": float(item.quantity) if item.quantity else None,
                "unit_price": float(item.unit_price) if item.unit_price else None,
                "total_price": float(item.total_price) if item.total_price else None,
                "line_order": item.line_order,
                "created_at": item.created_at,
                "updated_at": item.updated_at,
            }
            for item in sorted(quote.line_items, key=lambda x: x.line_order)
        ] if quote.line_items else [],
        "created_at": quote.created_at,
        "updated_at": quote.updated_at,
    }
    
    return QuoteSchema(**quote_dict)


@router.post("/", response_model=QuoteSchema, status_code=status.HTTP_201_CREATED)
async def create_quote(
    request: Request,
    quote_data: QuoteCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Quote:
    """
    Create a new quote
    
    Args:
        quote_data: Quote creation data
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        Created quote
    """
    # Validate company exists if provided
    if quote_data.company_id:
        company_result = await db.execute(
            select(Company).where(Company.id == quote_data.company_id)
        )
        if not company_result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Company not found"
            )
    
    # Generate quote number if not provided
    quote_number = quote_data.quote_number
    if not quote_number:
        quote_number = await generate_quote_number(db)
    
    quote = Quote(
        quote_number=quote_number,
        company_id=quote_data.company_id,
        title=quote_data.title,
        description=quote_data.description,
        amount=quote_data.amount,
        currency=quote_data.currency,
        pricing_type=quote_data.pricing_type or "fixed",
        status=quote_data.status,
        valid_until=quote_data.valid_until,
        notes=quote_data.notes,
        user_id=current_user.id,
    )
    
    db.add(quote)
    await db.commit()
    await db.refresh(quote)
    
    # Create line items if provided
    total_amount = Decimal(0)
    if quote_data.line_items:
        for idx, line_item_data in enumerate(quote_data.line_items):
            # Calculate total_price if not provided
            total_price = line_item_data.total_price
            if not total_price and line_item_data.quantity and line_item_data.unit_price:
                total_price = line_item_data.quantity * line_item_data.unit_price
            
            if total_price:
                total_amount += total_price
            
            line_item = QuoteLineItem(
                quote_id=quote.id,
                description=line_item_data.description,
                quantity=line_item_data.quantity,
                unit_price=line_item_data.unit_price,
                total_price=total_price,
                line_order=idx,
            )
            db.add(line_item)
        
        # Update quote amount if not provided or if it's the sum of line items
        if not quote.amount:
            quote.amount = total_amount
        elif quote_data.pricing_type == "hourly" and quote_data.line_items:
            # For hourly quotes, recalculate from line items
            quote.amount = total_amount
        
        await db.commit()
    
    await db.refresh(quote, ["company", "user", "line_items"])
    
    quote_dict = {
        "id": quote.id,
        "quote_number": quote.quote_number,
        "company_id": quote.company_id,
        "company_name": quote.company.name if quote.company else None,
        "title": quote.title,
        "description": quote.description,
        "amount": float(quote.amount) if quote.amount else None,
        "currency": quote.currency,
        "pricing_type": quote.pricing_type,
        "status": quote.status,
        "valid_until": quote.valid_until.isoformat() if quote.valid_until else None,
        "notes": quote.notes,
        "user_name": f"{quote.user.first_name} {quote.user.last_name}" if quote.user else None,
        "line_items": [
            {
                "id": item.id,
                "quote_id": item.quote_id,
                "description": item.description,
                "quantity": float(item.quantity) if item.quantity else None,
                "unit_price": float(item.unit_price) if item.unit_price else None,
                "total_price": float(item.total_price) if item.total_price else None,
                "line_order": item.line_order,
                "created_at": item.created_at,
                "updated_at": item.updated_at,
            }
            for item in sorted(quote.line_items, key=lambda x: x.line_order)
        ] if quote.line_items else [],
        "created_at": quote.created_at,
        "updated_at": quote.updated_at,
    }
    
    return QuoteSchema(**quote_dict)


@router.put("/{quote_id}", response_model=QuoteSchema)
async def update_quote(
    request: Request,
    quote_id: int,
    quote_data: QuoteUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Quote:
    """
    Update a quote
    
    Args:
        quote_id: Quote ID
        quote_data: Quote update data
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        Updated quote
        
    Raises:
        HTTPException: If quote not found
    """
    result = await db.execute(
        select(Quote).where(Quote.id == quote_id)
    )
    quote = result.scalar_one_or_none()
    
    if not quote:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quote not found"
        )
    
    # Validate company exists if provided
    if quote_data.company_id is not None:
        company_result = await db.execute(
            select(Company).where(Company.id == quote_data.company_id)
        )
        if not company_result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Company not found"
            )
    
    # Update fields (excluding line_items which are handled separately)
    update_data = quote_data.model_dump(exclude_unset=True, exclude={"line_items"})
    for field, value in update_data.items():
        if field != "line_items":
            setattr(quote, field, value)
    
    # Handle line items update
    if quote_data.line_items is not None:
        # Delete existing line items
        result_items = await db.execute(
            select(QuoteLineItem).where(QuoteLineItem.quote_id == quote_id)
        )
        existing_items = result_items.scalars().all()
        for item in existing_items:
            await db.delete(item)
        
        # Create new line items
        total_amount = Decimal(0)
        for idx, line_item_data in enumerate(quote_data.line_items):
            # Calculate total_price if not provided
            total_price = line_item_data.total_price
            if not total_price and line_item_data.quantity and line_item_data.unit_price:
                total_price = line_item_data.quantity * line_item_data.unit_price
            
            if total_price:
                total_amount += total_price
            
            line_item = QuoteLineItem(
                quote_id=quote.id,
                description=line_item_data.description,
                quantity=line_item_data.quantity,
                unit_price=line_item_data.unit_price,
                total_price=total_price,
                line_order=idx,
            )
            db.add(line_item)
        
        # Update quote amount if not explicitly set
        if not quote_data.amount and quote_data.line_items:
            quote.amount = total_amount
    
    await db.commit()
    await db.refresh(quote)
    await db.refresh(quote, ["company", "user", "line_items"])
    
    quote_dict = {
        "id": quote.id,
        "quote_number": quote.quote_number,
        "company_id": quote.company_id,
        "company_name": quote.company.name if quote.company else None,
        "title": quote.title,
        "description": quote.description,
        "amount": float(quote.amount) if quote.amount else None,
        "currency": quote.currency,
        "pricing_type": quote.pricing_type,
        "status": quote.status,
        "valid_until": quote.valid_until.isoformat() if quote.valid_until else None,
        "notes": quote.notes,
        "user_name": f"{quote.user.first_name} {quote.user.last_name}" if quote.user else None,
        "line_items": [
            {
                "id": item.id,
                "quote_id": item.quote_id,
                "description": item.description,
                "quantity": float(item.quantity) if item.quantity else None,
                "unit_price": float(item.unit_price) if item.unit_price else None,
                "total_price": float(item.total_price) if item.total_price else None,
                "line_order": item.line_order,
                "created_at": item.created_at,
                "updated_at": item.updated_at,
            }
            for item in sorted(quote.line_items, key=lambda x: x.line_order)
        ] if quote.line_items else [],
        "created_at": quote.created_at,
        "updated_at": quote.updated_at,
    }
    
    return QuoteSchema(**quote_dict)


@router.delete("/{quote_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_quote(
    request: Request,
    quote_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    """
    Delete a quote
    
    Args:
        quote_id: Quote ID
        current_user: Current authenticated user
        db: Database session
        
    Raises:
        HTTPException: If quote not found
    """
    result = await db.execute(
        select(Quote).where(Quote.id == quote_id)
    )
    quote = result.scalar_one_or_none()
    
    if not quote:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quote not found"
        )
    
    await db.delete(quote)
    await db.commit()
