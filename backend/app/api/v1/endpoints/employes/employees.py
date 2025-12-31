"""
Employees API Endpoints
API endpoints for managing employees
"""

from typing import List, Optional, Dict
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, delete
from io import BytesIO
from datetime import datetime as dt
import json
import uuid
import zipfile
import os
import unicodedata
import re

from app.core.database import get_db
from app.core.cache_enhanced import cache_query
from app.dependencies import get_current_user
from app.models.employee import Employee
from app.models.user import User
from app.schemas.employee import EmployeeCreate, EmployeeUpdate, Employee as EmployeeSchema
from app.services.import_service import ImportService
from app.services.export_service import ExportService
from app.services.s3_service import S3Service
from app.core.logging import logger

router = APIRouter(prefix="/employes/employees", tags=["employes"])

# In-memory store for import logs (in production, use Redis)
import_logs: Dict[str, List[Dict[str, any]]] = {}
import_status: Dict[str, Dict[str, any]] = {}


def normalize_filename(name: str) -> str:
    """
    Normalize a name for filename matching.
    - Convert to lowercase
    - Remove accents
    - Replace spaces and special characters with underscores
    - Remove multiple underscores
    """
    if not name:
        return ""
    # Convert to lowercase
    name = name.lower().strip()
    # Remove accents
    name = unicodedata.normalize('NFD', name)
    name = ''.join(char for char in name if unicodedata.category(char) != 'Mn')
    # Replace spaces and special characters with underscores
    name = re.sub(r'[^\w\-]', '_', name)
    # Remove multiple underscores
    name = re.sub(r'_+', '_', name)
    # Remove leading/trailing underscores
    name = name.strip('_')
    return name


# Cache for presigned URLs
_presigned_url_cache: dict[str, tuple[str, float]] = {}
_cache_max_size = 1000


def regenerate_photo_url(photo_url: Optional[str], employee_id: Optional[int] = None) -> Optional[str]:
    """
    Regenerate presigned URL for an employee photo.
    """
    if not photo_url:
        return None
    
    if not S3Service.is_configured():
        logger.warning(f"S3 not configured, returning original photo_url for employee {employee_id}")
        return photo_url
    
    try:
        s3_service = S3Service()
        file_key = None
        
        if photo_url.startswith('http'):
            from urllib.parse import urlparse, parse_qs, unquote
            parsed = urlparse(photo_url)
            query_params = parse_qs(parsed.query)
            if 'key' in query_params:
                file_key = unquote(query_params['key'][0])
            else:
                path = parsed.path.strip('/')
                if 'employees/photos' in path:
                    idx = path.find('employees/photos')
                    if idx != -1:
                        file_key = path[idx:]
                elif path.startswith('employees/'):
                    file_key = path
        else:
            file_key = photo_url
        
        if file_key:
            file_key = file_key.strip('/')
            if not file_key.startswith('employees/photos'):
                if not file_key.startswith('employees/'):
                    file_key = f"employees/photos/{file_key}"
            
            import time
            if file_key in _presigned_url_cache:
                cached_url, expiration_timestamp = _presigned_url_cache[file_key]
                current_time = time.time()
                buffer_seconds = 3600
                if current_time < (expiration_timestamp - buffer_seconds):
                    return cached_url
                else:
                    del _presigned_url_cache[file_key]
            
            try:
                expiration_seconds = 604800  # 7 days
                presigned_url = s3_service.generate_presigned_url(file_key, expiration=expiration_seconds)
                if presigned_url:
                    expiration_timestamp = time.time() + expiration_seconds
                    _presigned_url_cache[file_key] = (presigned_url, expiration_timestamp)
                    
                    if len(_presigned_url_cache) > _cache_max_size:
                        oldest_key = next(iter(_presigned_url_cache))
                        del _presigned_url_cache[oldest_key]
                    
                    return presigned_url
            except Exception as e:
                logger.error(f"Failed to generate presigned URL for employee {employee_id}: {e}", exc_info=True)
                return None
        else:
            return photo_url
    except Exception as e:
        logger.error(f"Failed to regenerate presigned URL for employee {employee_id}: {e}", exc_info=True)
        return None


@router.get("/", response_model=List[EmployeeSchema])
@cache_query(expire=60, tags=["employees"])
async def list_employees(
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
) -> List[Employee]:
    """
    Get list of employees
    """
    # Handle case where columns might not exist yet (migration not applied)
    # Try normal query first, fallback to explicit column selection if columns are missing
    try:
        query = select(Employee).order_by(Employee.created_at.desc()).offset(skip).limit(limit)
        result = await db.execute(query)
        employees = result.scalars().all()
    except Exception as e:
        error_str = str(e).lower()
        # Check if error is due to missing columns
        if 'does not exist' in error_str or 'undefinedcolumn' in error_str or 'column' in error_str:
            logger.warning(f"Some columns not found in database. Using fallback query. Error: {e}")
            # Fallback: select only columns that definitely exist (core columns)
            from types import SimpleNamespace
            try:
                query = select(
                    Employee.id,
                    Employee.first_name,
                    Employee.last_name,
                    Employee.email,
                    Employee.phone,
                    Employee.linkedin,
                    Employee.photo_url,
                    Employee.photo_filename,
                    Employee.hire_date,
                    Employee.birthday,
                    Employee.created_at,
                    Employee.updated_at
                ).order_by(Employee.created_at.desc()).offset(skip).limit(limit)
                result = await db.execute(query)
                # Convert result tuples to simple objects with Employee attributes
                employees = []
                for row in result.all():
                    emp = SimpleNamespace(
                        id=row[0],
                        first_name=row[1],
                        last_name=row[2],
                        email=row[3],
                        phone=row[4],
                        linkedin=row[5],
                        photo_url=row[6],
                        photo_filename=row[7],
                        hire_date=row[8],
                        birthday=row[9],
                        created_at=row[10],
                        updated_at=row[11],
                        user_id=None,  # Column might not exist yet
                        team_id=None,  # Column might not exist yet
                        capacity_hours_per_week=None  # Column might not exist yet
                    )
                    employees.append(emp)
            except Exception as fallback_error:
                logger.error(f"Fallback query also failed: {fallback_error}", exc_info=True)
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"A database error occurred: {str(fallback_error)}"
                )
        else:
            logger.error(f"Database error in list_employees: {e}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"A database error occurred: {str(e)}"
            )
    
    employee_list = []
    for employee in employees:
        photo_url = regenerate_photo_url(employee.photo_url, employee.id)
        employee_dict = {
            "id": employee.id,
            "first_name": employee.first_name,
            "last_name": employee.last_name,
            "email": employee.email,
            "phone": employee.phone,
            "linkedin": employee.linkedin,
            "photo_url": photo_url,
            "photo_filename": getattr(employee, 'photo_filename', None),
            "hire_date": employee.hire_date.isoformat() if employee.hire_date else None,
            "birthday": employee.birthday.isoformat() if employee.birthday else None,
            "user_id": getattr(employee, 'user_id', None),
            "team_id": getattr(employee, 'team_id', None),
            "capacity_hours_per_week": getattr(employee, 'capacity_hours_per_week', None),
            "created_at": employee.created_at,
            "updated_at": employee.updated_at,
        }
        try:
            employee_list.append(EmployeeSchema(**employee_dict))
        except Exception as schema_error:
            logger.warning(f"Error creating EmployeeSchema for employee {employee.id}: {schema_error}")
            # Try without optional fields that might not be in schema
            employee_dict_minimal = {
                "id": employee.id,
                "first_name": employee.first_name,
                "last_name": employee.last_name,
                "email": employee.email,
                "phone": employee.phone,
                "linkedin": employee.linkedin,
                "photo_url": photo_url,
                "photo_filename": getattr(employee, 'photo_filename', None),
                "hire_date": employee.hire_date.isoformat() if employee.hire_date else None,
                "birthday": employee.birthday.isoformat() if employee.birthday else None,
                "created_at": employee.created_at,
                "updated_at": employee.updated_at,
            }
            employee_list.append(EmployeeSchema(**employee_dict_minimal))
    
    return employee_list


@router.get("/{employee_id}", response_model=EmployeeSchema)
async def get_employee(
    employee_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Employee:
    """
    Get a specific employee by ID
    """
    # Handle case where user_id column might not exist yet (migration not applied)
    try:
        result = await db.execute(
            select(Employee).where(Employee.id == employee_id)
        )
        employee = result.scalar_one_or_none()
    except Exception as e:
        error_str = str(e).lower()
        # Check if error is due to missing user_id column
        if 'user_id' in error_str and ('does not exist' in error_str or 'undefinedcolumn' in error_str):
            logger.warning(f"user_id column not found in database. Please run migration: alembic upgrade head. Error: {e}")
            # Fallback: select columns explicitly excluding user_id
            from types import SimpleNamespace
            result = await db.execute(
                select(
                    Employee.id,
                    Employee.first_name,
                    Employee.last_name,
                    Employee.email,
                    Employee.phone,
                    Employee.linkedin,
                    Employee.photo_url,
                    Employee.photo_filename,
                    Employee.hire_date,
                    Employee.birthday,
                    Employee.created_at,
                    Employee.updated_at
                ).where(Employee.id == employee_id)
            )
            row = result.first()
            if not row:
                employee = None
            else:
                employee = SimpleNamespace(
                    id=row[0],
                    first_name=row[1],
                    last_name=row[2],
                    email=row[3],
                    phone=row[4],
                    linkedin=row[5],
                    photo_url=row[6],
                    photo_filename=row[7],
                    hire_date=row[8],
                    birthday=row[9],
                    created_at=row[10],
                    updated_at=row[11],
                    user_id=None,  # Column doesn't exist yet
                    team_id=None  # Column doesn't exist yet
                )
        else:
            logger.error(f"Database error in get_employee: {e}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"A database error occurred: {str(e)}"
            )
    
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found"
        )
    
    photo_url = regenerate_photo_url(employee.photo_url, employee.id)
    
    employee_dict = {
        "id": employee.id,
        "first_name": employee.first_name,
        "last_name": employee.last_name,
        "email": employee.email,
        "phone": employee.phone,
        "linkedin": employee.linkedin,
        "photo_url": photo_url,
        "photo_filename": getattr(employee, 'photo_filename', None),
        "hire_date": employee.hire_date.isoformat() if employee.hire_date else None,
        "birthday": employee.birthday.isoformat() if employee.birthday else None,
        "user_id": getattr(employee, 'user_id', None),
        "team_id": getattr(employee, 'team_id', None),
        "created_at": employee.created_at,
        "updated_at": employee.updated_at,
    }
    
    return EmployeeSchema(**employee_dict)


@router.post("/", response_model=EmployeeSchema, status_code=status.HTTP_201_CREATED)
async def create_employee(
    request: Request,
    employee_data: EmployeeCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Employee:
    """
    Create a new employee
    """
    employee = Employee(
        first_name=employee_data.first_name,
        last_name=employee_data.last_name,
        email=employee_data.email,
        phone=employee_data.phone,
        linkedin=employee_data.linkedin,
        photo_url=employee_data.photo_url,
        photo_filename=getattr(employee_data, 'photo_filename', None),
        hire_date=employee_data.hire_date,
        birthday=employee_data.birthday,
        team_id=getattr(employee_data, 'team_id', None),
    )
    
    db.add(employee)
    await db.commit()
    await db.refresh(employee)
    
    photo_url = regenerate_photo_url(employee.photo_url, employee.id)
    
    employee_dict = {
        "id": employee.id,
        "first_name": employee.first_name,
        "last_name": employee.last_name,
        "email": employee.email,
        "phone": employee.phone,
        "linkedin": employee.linkedin,
        "photo_url": photo_url,
        "photo_filename": getattr(employee, 'photo_filename', None),
        "hire_date": employee.hire_date.isoformat() if employee.hire_date else None,
        "birthday": employee.birthday.isoformat() if employee.birthday else None,
        "user_id": getattr(employee, 'user_id', None),
        "team_id": getattr(employee, 'team_id', None),
        "created_at": employee.created_at,
        "updated_at": employee.updated_at,
    }
    
    return EmployeeSchema(**employee_dict)


@router.put("/{employee_id}", response_model=EmployeeSchema)
async def update_employee(
    request: Request,
    employee_id: int,
    employee_data: EmployeeUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Employee:
    """
    Update an employee
    """
    result = await db.execute(
        select(Employee).where(Employee.id == employee_id)
    )
    employee = result.scalar_one_or_none()
    
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found"
        )
    
    update_data = employee_data.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(employee, field, value)
    
    await db.commit()
    await db.refresh(employee)
    
    photo_url = regenerate_photo_url(employee.photo_url, employee.id)
    
    employee_dict = {
        "id": employee.id,
        "first_name": employee.first_name,
        "last_name": employee.last_name,
        "email": employee.email,
        "phone": employee.phone,
        "linkedin": employee.linkedin,
        "photo_url": photo_url,
        "photo_filename": getattr(employee, 'photo_filename', None),
        "hire_date": employee.hire_date.isoformat() if employee.hire_date else None,
        "birthday": employee.birthday.isoformat() if employee.birthday else None,
        "user_id": getattr(employee, 'user_id', None),
        "team_id": getattr(employee, 'team_id', None),
        "created_at": employee.created_at,
        "updated_at": employee.updated_at,
    }
    
    return EmployeeSchema(**employee_dict)


@router.delete("/bulk", status_code=status.HTTP_200_OK)
async def delete_all_employees(
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """
    Delete all employees from the database
    """
    count_result = await db.execute(select(func.count(Employee.id)))
    count = count_result.scalar_one()
    
    if count == 0:
        return {
            "message": "No employees found",
            "deleted_count": 0
        }
    
    await db.execute(delete(Employee))
    await db.commit()
    
    logger.info(f"User {current_user.id} deleted all {count} employees")
    
    return {
        "message": f"Successfully deleted {count} employee(s)",
        "deleted_count": count
    }


@router.post("/{employee_id}/link-user/{user_id}", response_model=EmployeeSchema)
async def link_employee_to_user(
    request: Request,
    employee_id: int,
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Employee:
    """
    Link an employee to a user account
    
    Args:
        employee_id: Employee ID
        user_id: User ID to link
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        Updated employee with user linked
        
    Raises:
        HTTPException: If employee or user not found, or if user is already linked to another employee
    """
    # Get employee
    employee_result = await db.execute(
        select(Employee).where(Employee.id == employee_id)
    )
    employee = employee_result.scalar_one_or_none()
    
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found"
        )
    
    # Get user
    user_result = await db.execute(
        select(User).where(User.id == user_id)
    )
    user = user_result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check if user is already linked to another employee
    existing_employee_result = await db.execute(
        select(Employee).where(Employee.user_id == user_id)
    )
    existing_employee = existing_employee_result.scalar_one_or_none()
    
    if existing_employee and existing_employee.id != employee_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"User is already linked to employee {existing_employee.id} ({existing_employee.first_name} {existing_employee.last_name})"
        )
    
    # Check if employee is already linked to another user (shouldn't happen with unique constraint, but check anyway)
    if employee.user_id and employee.user_id != user_id:
        # Unlink from previous user first
        logger.info(f"Employee {employee_id} was linked to user {employee.user_id}, unlinking before linking to {user_id}")
    
    # Link employee to user
    employee.user_id = user_id
    await db.commit()
    await db.refresh(employee)
    
    logger.info(f"User {current_user.id} linked employee {employee_id} to user {user_id}")
    
    photo_url = regenerate_photo_url(employee.photo_url, employee.id)
    
    employee_dict = {
        "id": employee.id,
        "first_name": employee.first_name,
        "last_name": employee.last_name,
        "email": employee.email,
        "phone": employee.phone,
        "linkedin": employee.linkedin,
        "photo_url": photo_url,
        "photo_filename": getattr(employee, 'photo_filename', None),
        "hire_date": employee.hire_date.isoformat() if employee.hire_date else None,
        "birthday": employee.birthday.isoformat() if employee.birthday else None,
        "user_id": employee.user_id,
        "created_at": employee.created_at,
        "updated_at": employee.updated_at,
    }
    
    return EmployeeSchema(**employee_dict)


@router.delete("/{employee_id}/unlink-user", response_model=EmployeeSchema)
async def unlink_employee_from_user(
    request: Request,
    employee_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Employee:
    """
    Unlink an employee from a user account
    
    Args:
        employee_id: Employee ID
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        Updated employee with user unlinked
        
    Raises:
        HTTPException: If employee not found
    """
    # Get employee
    employee_result = await db.execute(
        select(Employee).where(Employee.id == employee_id)
    )
    employee = employee_result.scalar_one_or_none()
    
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found"
        )
    
    # Unlink employee from user
    employee.user_id = None
    await db.commit()
    await db.refresh(employee)
    
    logger.info(f"User {current_user.id} unlinked employee {employee_id} from user")
    
    photo_url = regenerate_photo_url(employee.photo_url, employee.id)
    
    employee_dict = {
        "id": employee.id,
        "first_name": employee.first_name,
        "last_name": employee.last_name,
        "email": employee.email,
        "phone": employee.phone,
        "linkedin": employee.linkedin,
        "photo_url": photo_url,
        "photo_filename": getattr(employee, 'photo_filename', None),
        "hire_date": employee.hire_date.isoformat() if employee.hire_date else None,
        "birthday": employee.birthday.isoformat() if employee.birthday else None,
        "user_id": employee.user_id,
        "created_at": employee.created_at,
        "updated_at": employee.updated_at,
    }
    
    return EmployeeSchema(**employee_dict)


@router.delete("/{employee_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_employee(
    request: Request,
    employee_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    """
    Delete an employee
    """
    result = await db.execute(
        select(Employee).where(Employee.id == employee_id)
    )
    employee = result.scalar_one_or_none()
    
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found"
        )
    
    await db.delete(employee)
    await db.commit()


def add_import_log(import_id: str, message: str, level: str = "info", data: Optional[Dict] = None):
    """Add a log entry to the import logs"""
    if import_id not in import_logs:
        import_logs[import_id] = []
    
    log_entry = {
        "timestamp": dt.now().isoformat(),
        "level": level,
        "message": message,
        "data": data or {}
    }
    import_logs[import_id].append(log_entry)
    
    if len(import_logs[import_id]) > 1000:
        import_logs[import_id] = import_logs[import_id][-1000:]


def update_import_status(import_id: str, status: str, progress: Optional[int] = None, total: Optional[int] = None):
    """Update import status"""
    if import_id not in import_status:
        import_status[import_id] = {}
    
    import_status[import_id].update({
        "status": status,
        "updated_at": dt.now().isoformat()
    })
    
    if progress is not None:
        import_status[import_id]["progress"] = progress
    if total is not None:
        import_status[import_id]["total"] = total


@router.get("/import/{import_id}/logs")
async def stream_import_logs(
    import_id: str,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Stream import logs via Server-Sent Events (SSE)
    """
    async def event_generator():
        last_index = 0
        
        while True:
            if import_id in import_status:
                status_info = import_status[import_id]
                if status_info.get("status") == "completed" or status_info.get("status") == "failed":
                    if import_id in import_logs:
                        logs = import_logs[import_id]
                        for log in logs[last_index:]:
                            yield f"data: {json.dumps(log)}\n\n"
                    
                    yield f"data: {json.dumps({'type': 'status', 'data': status_info})}\n\n"
                    yield f"data: {json.dumps({'type': 'done'})}\n\n"
                    break
            
            if import_id in import_logs:
                logs = import_logs[import_id]
                if len(logs) > last_index:
                    for log in logs[last_index:]:
                        yield f"data: {json.dumps(log)}\n\n"
                    last_index = len(logs)
            
            if import_id in import_status:
                status_info = import_status[import_id]
                yield f"data: {json.dumps({'type': 'status', 'data': status_info})}\n\n"
            
            import asyncio
            await asyncio.sleep(0.5)
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )


@router.post("/import")
async def import_employees(
    file: UploadFile = File(...),
    import_id: Optional[str] = Query(None, description="Optional import ID for tracking logs"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Import employees from Excel file or ZIP file (Excel + photos)
    
    Supported column names (case-insensitive, accent-insensitive):
    - First Name: first_name, prénom, prenom, firstname, first name
    - Last Name: last_name, nom, name, lastname, last name, surname
    - Email: email, courriel, e-mail, mail
    - Phone: phone, téléphone, telephone, tel, mobile
    - LinkedIn: linkedin, linkedin_url, linkedin url
    - Hire Date: hire_date, date_embauche, date embauche, date d'embauche
    - Birthday: birthday, anniversaire, date de naissance, birth_date, dob
    - Photo URL: photo_url, photo, photo url, image_url, avatar
    - Photo Filename: photo_filename, nom_fichier_photo (for matching photos in ZIP)
    """
    if not import_id:
        import_id = str(uuid.uuid4())
    
    import_logs[import_id] = []
    import_status[import_id] = {
        "status": "started",
        "progress": 0,
        "total": 0,
        "created_at": dt.now().isoformat()
    }
    
    add_import_log(import_id, f"Début de l'import du fichier: {file.filename}", "info")
    
    try:
        file_content = await file.read()
        filename = file.filename or ""
        file_ext = os.path.splitext(filename.lower())[1]
        
        photos_dict = {}
        excel_content = None
        
        if file_ext == '.zip':
            add_import_log(import_id, "Détection d'un fichier ZIP, extraction en cours...", "info")
            try:
                with zipfile.ZipFile(BytesIO(file_content), 'r') as zip_ref:
                    photo_count = 0
                    for file_info in zip_ref.namelist():
                        file_name_lower = file_info.lower()
                        
                        if file_name_lower.endswith(('.xlsx', '.xls')):
                            if excel_content is None:
                                excel_content = zip_ref.read(file_info)
                                add_import_log(import_id, f"Fichier Excel trouvé dans le ZIP: {file_info}", "info")
                        
                        elif file_name_lower.endswith(('.jpg', '.jpeg', '.png', '.gif', '.webp')):
                            photo_content = zip_ref.read(file_info)
                            photo_filename = os.path.basename(file_info)
                            photo_filename_normalized = normalize_filename(photo_filename)
                            photos_dict[photo_filename.lower()] = photo_content
                            if photo_filename_normalized != photo_filename.lower():
                                photos_dict[photo_filename_normalized] = photo_content
                            photo_count += 1
                    
                    add_import_log(import_id, f"Extraction ZIP terminée: {photo_count} photo(s) trouvée(s)", "info")
                
                if excel_content is None:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="No Excel file found in ZIP"
                    )
                
                file_content = excel_content
            except zipfile.BadZipFile:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid ZIP file format"
                )
        
        add_import_log(import_id, "Lecture du fichier Excel...", "info")
        try:
            result = ImportService.import_from_excel(
                file_content=file_content,
                has_headers=True
            )
        except Exception as e:
            add_import_log(import_id, f"ERREUR lors de la lecture Excel: {str(e)}", "error")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Error reading Excel file: {str(e)}"
            )
        
        if not result or 'data' not in result:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid Excel file format or empty file"
            )
        
        total_rows = len(result['data'])
        add_import_log(import_id, f"Fichier Excel lu avec succès: {total_rows} ligne(s) trouvée(s)", "info")
        update_import_status(import_id, "processing", progress=0, total=total_rows)
        
        def normalize_key(key: str) -> str:
            if not key:
                return ''
            normalized = str(key).lower().strip()
            normalized = unicodedata.normalize('NFD', normalized)
            normalized = ''.join(c for c in normalized if unicodedata.category(c) != 'Mn')
            return normalized
        
        def get_field_value(row: dict, possible_names: list) -> Optional[str]:
            for name in possible_names:
                if name in row and row[name] is not None:
                    value = str(row[name]).strip()
                    if value:
                        return value
            
            normalized_row = {normalize_key(k): v for k, v in row.items()}
            for name in possible_names:
                normalized_name = normalize_key(name)
                if normalized_name in normalized_row and normalized_row[normalized_name] is not None:
                    value = str(normalized_row[normalized_name]).strip()
                    if value:
                        return value
            
            return None
        
        created_employees = []
        errors = []
        warnings = []
        photos_uploaded = 0
        
        s3_service = S3Service() if S3Service.is_configured() else None
        
        for idx, row_data in enumerate(result['data']):
            try:
                first_name = get_field_value(row_data, ['first_name', 'prénom', 'prenom', 'firstname', 'first name'])
                last_name = get_field_value(row_data, ['last_name', 'nom', 'name', 'lastname', 'last name', 'surname'])
                email = get_field_value(row_data, ['email', 'courriel', 'e-mail', 'mail'])
                phone = get_field_value(row_data, ['phone', 'téléphone', 'telephone', 'tel', 'mobile'])
                linkedin = get_field_value(row_data, ['linkedin', 'linkedin_url', 'linkedin url'])
                
                hire_date_raw = get_field_value(row_data, ['hire_date', 'date_embauche', 'date embauche', "date d'embauche"])
                hire_date = None
                if hire_date_raw:
                    try:
                        from dateutil import parser
                        hire_date = parser.parse(str(hire_date_raw)).date()
                    except (ImportError, ValueError):
                        try:
                            date_str = str(hire_date_raw).strip()
                            for fmt in ['%Y-%m-%d', '%d/%m/%Y', '%d-%m-%Y', '%Y/%m/%d']:
                                try:
                                    hire_date = dt.strptime(date_str, fmt).date()
                                    break
                                except ValueError:
                                    continue
                        except (ValueError, TypeError):
                            pass
                
                birthday_raw = get_field_value(row_data, ['birthday', 'anniversaire', 'date de naissance', 'birth_date', 'dob'])
                birthday = None
                if birthday_raw:
                    try:
                        from dateutil import parser
                        birthday = parser.parse(str(birthday_raw)).date()
                    except (ImportError, ValueError):
                        try:
                            date_str = str(birthday_raw).strip()
                            for fmt in ['%Y-%m-%d', '%d/%m/%Y', '%d-%m-%Y', '%Y/%m/%d']:
                                try:
                                    birthday = dt.strptime(date_str, fmt).date()
                                    break
                                except ValueError:
                                    continue
                        except (ValueError, TypeError):
                            pass
                
                if not first_name or not first_name.strip():
                    errors.append({
                        'row': idx + 2,
                        'data': row_data,
                        'error': 'Le prénom est obligatoire'
                    })
                    continue
                
                if not last_name or not last_name.strip():
                    errors.append({
                        'row': idx + 2,
                        'data': row_data,
                        'error': 'Le nom est obligatoire'
                    })
                    continue
                
                photo_url = None
                photo_filename = get_field_value(row_data, ['photo_filename', 'nom_fichier_photo'])
                
                if photos_dict and photo_filename:
                    photo_filename_normalized = normalize_filename(photo_filename)
                    pattern_to_use = None
                    
                    if photo_filename.lower() in photos_dict:
                        pattern_to_use = photo_filename.lower()
                    elif photo_filename_normalized in photos_dict:
                        pattern_to_use = photo_filename_normalized
                    
                    if pattern_to_use and pattern_to_use in photos_dict:
                        try:
                            photo_content = photos_dict[pattern_to_use]
                            
                            class TempUploadFile:
                                def __init__(self, filename: str, content: bytes):
                                    self.filename = filename
                                    self.content_type = 'image/jpeg' if filename.lower().endswith(('.jpg', '.jpeg')) else ('image/png' if filename.lower().endswith('.png') else 'image/webp')
                                    self.file = BytesIO(content)
                                    self.file.seek(0)
                            
                            temp_file = TempUploadFile(photo_filename, photo_content)
                            
                            upload_result = s3_service.upload_file(
                                file=temp_file,
                                folder='employees/photos',
                                user_id=str(current_user.id)
                            )
                            
                            photo_url = upload_result.get('file_key')
                            if photo_url and not photo_url.startswith('employees/photos'):
                                photo_url = f"employees/photos/{photo_url}" if not photo_url.startswith('employees/') else photo_url
                            
                            if photo_url:
                                photos_uploaded += 1
                        except Exception as e:
                            logger.error(f"Failed to upload photo for {first_name} {last_name}: {e}", exc_info=True)
                            warnings.append({
                                'row': idx + 2,
                                'type': 'photo_upload_error',
                                'message': f"Erreur lors de l'upload de la photo: {str(e)}",
                                'data': {'employee': f"{first_name} {last_name}"}
                            })
                
                employee_data = EmployeeCreate(
                    first_name=first_name.strip(),
                    last_name=last_name.strip(),
                    email=email,
                    phone=phone,
                    linkedin=linkedin,
                    photo_url=photo_url,
                    photo_filename=photo_filename,
                    hire_date=hire_date,
                    birthday=birthday,
                )
                
                employee = Employee(**employee_data.model_dump(exclude_none=True))
                db.add(employee)
                created_employees.append(employee)
                
                add_import_log(import_id, f"Ligne {idx + 2}: Employé créé: {first_name} {last_name}", "info")
                update_import_status(import_id, "processing", progress=idx + 1, total=total_rows)
                
            except Exception as e:
                logger.error(f"Error processing row {idx + 2}: {e}", exc_info=True)
                errors.append({
                    'row': idx + 2,
                    'data': row_data,
                    'error': str(e)
                })
                continue
        
        await db.commit()
        
        for employee in created_employees:
            await db.refresh(employee)
        
        serialized_employees = []
        for employee in created_employees:
            photo_url = regenerate_photo_url(employee.photo_url, employee.id)
            employee_dict = {
                "id": employee.id,
                "first_name": employee.first_name,
                "last_name": employee.last_name,
                "email": employee.email,
                "phone": employee.phone,
                "linkedin": employee.linkedin,
                "photo_url": photo_url,
                "photo_filename": getattr(employee, 'photo_filename', None),
                "hire_date": employee.hire_date.isoformat() if employee.hire_date else None,
                "birthday": employee.birthday.isoformat() if employee.birthday else None,
                "user_id": getattr(employee, 'user_id', None),
                "created_at": employee.created_at,
                "updated_at": employee.updated_at,
            }
            serialized_employees.append(EmployeeSchema(**employee_dict))
        
        add_import_log(import_id, f"✅ Import terminé: {len(created_employees)} employé(s) importé(s)", "success")
        update_import_status(import_id, "completed", progress=total_rows, total=total_rows)
        
        return {
            'total_rows': total_rows,
            'valid_rows': len(created_employees),
            'invalid_rows': len(errors),
            'errors': errors,
            'warnings': warnings,
            'photos_uploaded': photos_uploaded,
            'data': serialized_employees,
            'import_id': import_id
        }
        
    except HTTPException:
        if import_id:
            update_import_status(import_id, "failed")
        raise
    except Exception as e:
        if import_id:
            add_import_log(import_id, f"ERREUR inattendue: {str(e)}", "error")
            update_import_status(import_id, "failed")
        logger.error(f"Unexpected error in import_employees: {e}", exc_info=True)
        try:
            await db.rollback()
        except Exception:
            pass
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred during import: {str(e)}"
        )


@router.get("/export")
async def export_employees(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Export employees to Excel file
    """
    try:
        result = await db.execute(
            select(Employee).order_by(Employee.created_at.desc())
        )
        employees = result.scalars().all()
        
        export_data = []
        for employee in employees:
            hire_date_str = ''
            if employee.hire_date:
                try:
                    hire_date_str = employee.hire_date.isoformat()
                except Exception:
                    hire_date_str = str(employee.hire_date)
            
            birthday_str = ''
            if employee.birthday:
                try:
                    birthday_str = employee.birthday.isoformat()
                except Exception:
                    birthday_str = str(employee.birthday)
            
            export_data.append({
                'Prénom': employee.first_name or '',
                'Nom': employee.last_name or '',
                'Courriel': employee.email or '',
                'Téléphone': employee.phone or '',
                'LinkedIn': employee.linkedin or '',
                'Date d\'embauche': hire_date_str,
                'Anniversaire': birthday_str,
                'Photo URL': employee.photo_url or '',
            })
        
        if not export_data:
            export_data = [{
                'Prénom': '',
                'Nom': '',
                'Courriel': '',
                'Téléphone': '',
                'LinkedIn': '',
                'Date d\'embauche': '',
                'Anniversaire': '',
                'Photo URL': '',
            }]
        
        from datetime import datetime
        buffer, filename = ExportService.export_to_excel(
            data=export_data,
            filename=f"employees_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
        )
        
        return StreamingResponse(
            buffer,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except Exception as e:
        logger.error(f"Unexpected export error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur inattendue lors de l'export: {str(e)}"
        )
