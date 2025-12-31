"""
Project Import/Export Endpoints
"""

from typing import Optional, Dict, List, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from sqlalchemy.orm import selectinload
from io import BytesIO
import pandas as pd
import zipfile
import json
import uuid
import asyncio
from datetime import datetime as dt

from app.core.database import get_db
from app.dependencies import get_current_user
from app.models.project import Project, ProjectStatus
from app.models.user import User
from app.models.client import Client
from app.models.employee import Employee
from app.schemas.project import ProjectCreate
from app.core.logging import logger
from app.services.export_service import ExportService
from app.utils.import_logs import (
    import_logs, import_status, add_import_log, update_import_status,
    get_current_user_from_query, stream_import_logs_generator
)

router = APIRouter()


# SSE endpoint for import logs
@router.get("/import/{import_id}/logs")
async def stream_import_logs(
    import_id: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    Stream import logs via Server-Sent Events (SSE) for projects import
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


async def find_client_by_name(
    client_name: str,
    db: AsyncSession,
) -> Optional[int]:
    """Find a Client ID by name using intelligent matching (searches first_name, last_name, and email)"""
    if not client_name or not client_name.strip():
        return None
    
    client_name_normalized = client_name.strip().lower()
    
    # Try exact match on first_name + last_name
    name_parts = client_name_normalized.split()
    if len(name_parts) >= 2:
        first_name = name_parts[0]
        last_name = " ".join(name_parts[1:])
        result = await db.execute(
            select(Client).where(
                and_(
                    func.lower(Client.first_name) == first_name,
                    func.lower(Client.last_name) == last_name
                )
            )
        )
        client = result.scalar_one_or_none()
        if client:
            return client.id
    
    # Try exact match on email
    result = await db.execute(
        select(Client).where(func.lower(Client.email) == client_name_normalized)
    )
    client = result.scalar_one_or_none()
    if client:
        return client.id
    
    # Try partial match on first_name
    result = await db.execute(
        select(Client).where(func.lower(Client.first_name).contains(client_name_normalized))
    )
    client = result.scalar_one_or_none()
    if client:
        return client.id
    
    # Try partial match on last_name
    result = await db.execute(
        select(Client).where(func.lower(Client.last_name).contains(client_name_normalized))
    )
    client = result.scalar_one_or_none()
    if client:
        return client.id
    
    # Try partial match on email
    result = await db.execute(
        select(Client).where(func.lower(Client.email).contains(client_name_normalized))
    )
    client = result.scalar_one_or_none()
    if client:
        return client.id
    
    return None


async def find_employee_by_name(
    employee_name: str,
    db: AsyncSession,
) -> Optional[int]:
    """Find an employee ID by name (first_name last_name)"""
    if not employee_name or not employee_name.strip():
        return None
    
    parts = employee_name.strip().split()
    if len(parts) < 2:
        return None
    
    first_name = parts[0]
    last_name = " ".join(parts[1:])
    
    result = await db.execute(
        select(Employee).where(
            func.lower(Employee.first_name) == first_name.lower(),
            func.lower(Employee.last_name) == last_name.lower()
        )
    )
    employee = result.scalar_one_or_none()
    if employee:
        return employee.id
    
    return None


@router.post("/import")
async def import_projects(
    file: UploadFile = File(...),
    import_id: Optional[str] = Query(None, description="Optional import ID for tracking"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Import projects from Excel file or ZIP file (Excel + documents)
    
    Supported column names (case-insensitive):
    - Name: name, nom, nom du projet, project name
    - Description: description, desc, descriptif
    - Status: status, statut, état (active, archived, completed)
    - Client: client, client_name, client name, entreprise, company, company_name
    - Client ID: client_id, id_client, company_id, id_company
    - Responsable: responsable, responsable_name, employee, employee_name, responsable name
    - Responsable ID: responsable_id, id_responsable, employee_id, id_employee
    """
    try:
        file_content = await file.read()
        file_extension = file.filename.split('.')[-1].lower() if file.filename else ''
        
        projects_data = []
        errors = []
        warnings = []
        
        if file_extension == 'zip':
            # Handle ZIP file
            with zipfile.ZipFile(BytesIO(file_content), 'r') as zip_file:
                # Find Excel file in ZIP
                excel_files = [f for f in zip_file.namelist() if f.endswith(('.xlsx', '.xls'))]
                if not excel_files:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="No Excel file found in ZIP"
                    )
                
                excel_file = excel_files[0]
                excel_content = zip_file.read(excel_file)
                df = pd.read_excel(BytesIO(excel_content))
        else:
            # Handle direct Excel file
            df = pd.read_excel(BytesIO(file_content))
        
        # Normalize column names
        column_mapping = {
            'name': ['name', 'nom', 'nom du projet', 'project name', 'project_name'],
            'description': ['description', 'desc', 'descriptif'],
            'status': ['status', 'statut', 'état', 'state'],
            'client': ['client', 'client_name', 'client name', 'entreprise', 'company', 'company_name', 'company name'],
            'client_id': ['client_id', 'id_client', 'company_id', 'id_company', 'company id'],
            'responsable': ['responsable', 'responsable_name', 'employee', 'employee_name', 'responsable name', 'employee name'],
            'responsable_id': ['responsable_id', 'id_responsable', 'employee_id', 'id_employee', 'responsable id', 'employee id'],
        }
        
        normalized_columns = {}
        for col in df.columns:
            col_lower = str(col).lower().strip()
            for key, aliases in column_mapping.items():
                if col_lower in aliases:
                    normalized_columns[col] = key
                    break
        
        total_rows = len(df)
        add_import_log(import_id, f"Fichier Excel lu avec succès: {total_rows} ligne(s) trouvée(s)", "info")
        update_import_status(import_id, "processing", progress=0, total=total_rows)
        
        stats = {
            "total_processed": 0,
            "created_new": 0,
            "errors": 0
        }
        
        add_import_log(import_id, f"Début du traitement de {total_rows} ligne(s)...", "info")
        
        # Process rows
        for idx, row in df.iterrows():
            try:
                stats["total_processed"] += 1
                update_import_status(import_id, "processing", progress=idx + 1, total=total_rows)
                
                # Log progress every 10 rows
                if (idx + 1) % 10 == 0 or idx < 5:
                    add_import_log(import_id, f"📊 Ligne {idx + 1}/{total_rows}: Traitement en cours... (créés: {stats['created_new']}, erreurs: {stats['errors']})", "info", {"progress": idx + 1, "total": total_rows, "stats": stats.copy()})
                
                project_data = {}
                
                # Name (required)
                name_col = next((col for col, key in normalized_columns.items() if key == 'name'), None)
                if name_col and pd.notna(row.get(name_col)):
                    project_data['name'] = str(row[name_col]).strip()
                else:
                    stats["errors"] += 1
                    add_import_log(import_id, f"Ligne {idx + 2}: ❌ Nom requis manquant", "error", {"row": idx + 2})
                    errors.append({
                        "row": idx + 2,  # +2 because Excel is 1-indexed and has header
                        "data": row.to_dict(),
                        "error": "Name is required"
                    })
                    continue
                
                # Description
                desc_col = next((col for col, key in normalized_columns.items() if key == 'description'), None)
                if desc_col and pd.notna(row.get(desc_col)):
                    project_data['description'] = str(row[desc_col]).strip()
                
                # Status - store as string to avoid enum conversion issues in bulk insert
                status_col = next((col for col, key in normalized_columns.items() if key == 'status'), None)
                if status_col and pd.notna(row.get(status_col)):
                    status_str = str(row[status_col]).strip().lower()
                    if status_str in ['active', 'archived', 'completed']:
                        project_data['status'] = status_str  # Store as string, not enum
                    else:
                        project_data['status'] = 'active'  # Store as string
                        warnings.append({
                            "row": idx + 2,
                            "type": "invalid_status",
                            "message": f"Invalid status '{status_str}', defaulting to 'active'",
                            "data": {"status": status_str}
                        })
                else:
                    project_data['status'] = 'active'  # Store as string
                
                # Client ID or Client Name
                client_id_col = next((col for col, key in normalized_columns.items() if key == 'client_id'), None)
                client_name_col = next((col for col, key in normalized_columns.items() if key == 'client'), None)
                
                client_id = None
                if client_id_col and pd.notna(row.get(client_id_col)):
                    try:
                        client_id = int(row[client_id_col])
                    except (ValueError, TypeError):
                        pass
                
                if not client_id and client_name_col and pd.notna(row.get(client_name_col)):
                    client_name = str(row[client_name_col]).strip()
                    matched_client_id = await find_client_by_name(client_name, db)
                    if matched_client_id:
                        client_id = matched_client_id
                    else:
                        warnings.append({
                            "row": idx + 2,
                            "type": "client_not_found",
                            "message": f"Client '{client_name}' not found",
                            "data": {"client_name": client_name}
                        })
                
                if client_id:
                    project_data['client_id'] = client_id
                
                # Responsable ID or Responsable Name
                responsable_id_col = next((col for col, key in normalized_columns.items() if key == 'responsable_id'), None)
                responsable_name_col = next((col for col, key in normalized_columns.items() if key == 'responsable'), None)
                
                responsable_id = None
                if responsable_id_col and pd.notna(row.get(responsable_id_col)):
                    try:
                        responsable_id = int(row[responsable_id_col])
                    except (ValueError, TypeError):
                        pass
                
                if not responsable_id and responsable_name_col and pd.notna(row.get(responsable_name_col)):
                    responsable_name = str(row[responsable_name_col]).strip()
                    matched_responsable_id = await find_employee_by_name(responsable_name, db)
                    if matched_responsable_id:
                        responsable_id = matched_responsable_id
                    else:
                        warnings.append({
                            "row": idx + 2,
                            "type": "responsable_not_found",
                            "message": f"Responsable '{responsable_name}' not found",
                            "data": {"responsable_name": responsable_name}
                        })
                
                if responsable_id:
                    project_data['responsable_id'] = responsable_id
                
                # Create project
                # Convert status string to enum for ProjectCreate validation
                status_enum = None
                if isinstance(project_data.get('status'), str):
                    status_enum = ProjectStatus(project_data['status'])
                    project_data['status'] = status_enum
                else:
                    status_enum = project_data.get('status', ProjectStatus.ACTIVE)
                    project_data['status'] = status_enum
                
                project_create = ProjectCreate(**project_data)
                
                # For bulk insert with asyncpg, we need to use the enum's value (string) directly
                # SQLAlchemy's Enum column with asyncpg doesn't convert Python enums correctly in bulk inserts
                # We'll use setattr to bypass the normal assignment and set the string value directly
                project = Project(
                    name=project_create.name,
                    description=project_create.description,
                    user_id=current_user.id,
                    client_id=project_create.client_id,
                    responsable_id=project_create.responsable_id,
                )
                # Set status using the enum value (string) directly to avoid asyncpg conversion issues
                # SQLAlchemy's Enum column will accept the string value and convert it internally
                setattr(project, 'status', project_create.status.value)
                
                db.add(project)
                projects_data.append(project)
                stats["created_new"] += 1
                add_import_log(import_id, f"Ligne {idx + 2}: Nouveau projet créé - {project_data['name']}", "info", {"row": idx + 2, "action": "created", "project_name": project_data['name']})
                
            except Exception as e:
                stats["errors"] += 1
                error_msg = f"Ligne {idx + 2}: ❌ Erreur lors de l'import - {str(e)}"
                add_import_log(import_id, error_msg, "error", {"row": idx + 2, "error": str(e)})
                errors.append({
                    "row": idx + 2,
                    "data": row.to_dict(),
                    "error": str(e)
                })
        
        add_import_log(import_id, f"Sauvegarde de {len(projects_data)} projet(s) dans la base de données...", "info")
        await db.commit()
        
        # Refresh projects to get IDs
        for project in projects_data:
            await db.refresh(project)
        
        add_import_log(import_id, f"Sauvegarde réussie: {len(projects_data)} projet(s) créé(s)", "success")
        
        # Final logs
        add_import_log(import_id, f"✅ Import terminé: {len(projects_data)} projet(s) importé(s), {len(errors)} erreur(s)", "success", {
            "total_valid": len(projects_data),
            "total_errors": len(errors)
        })
        update_import_status(import_id, "completed", progress=total_rows, total=total_rows)
        
        return {
            "total_rows": len(df),
            "valid_rows": len(projects_data),
            "invalid_rows": len(errors),
            "errors": errors,
            "warnings": warnings,
            "data": [{"id": p.id, "name": p.name} for p in projects_data],
            "import_id": import_id,
        }
        
    except Exception as e:
        logger.error(f"Import error: {e}", exc_info=True)
        if 'import_id' in locals():
            add_import_log(import_id, f"❌ Erreur inattendue lors de l'import: {str(e)}", "error")
            update_import_status(import_id, "failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Import failed: {str(e)}"
        )


@router.get("/export")
async def export_projects(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Export all projects to Excel format
    """
    try:
        result = await db.execute(
            select(Project)
            .options(
                selectinload(Project.client),
                selectinload(Project.responsable)
            )
            .where(Project.user_id == current_user.id)
            .order_by(Project.created_at.desc())
        )
        projects = result.scalars().all()
        
        # Prepare data for Excel
        data = []
        for project in projects:
            data.append({
                "Nom du projet": project.name,
                "Description": project.description or "",
                "Statut": project.status.value if project.status else "",
                "Client": f"{project.client.first_name} {project.client.last_name}".strip() if project.client else "",
                "Client ID": project.client_id or "",
                "Responsable": f"{project.responsable.first_name} {project.responsable.last_name}" if project.responsable else "",
                "Responsable ID": project.responsable_id or "",
                "Date de création": project.created_at.strftime("%Y-%m-%d") if project.created_at else "",
                "Date de modification": project.updated_at.strftime("%Y-%m-%d") if project.updated_at else "",
            })
        
        df = pd.DataFrame(data)
        
        # Create Excel file in memory
        output = BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name='Projets')
        
        output.seek(0)
        
        return StreamingResponse(
            BytesIO(output.read()),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={
                "Content-Disposition": f"attachment; filename=projets-{datetime.now().strftime('%Y-%m-%d')}.xlsx"
            }
        )
        
    except Exception as e:
        logger.error(f"Export error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Export failed: {str(e)}"
        )
