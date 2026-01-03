"""
Project Employees Endpoints
API endpoints for managing project-employee assignments
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status as http_status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.dependencies import get_current_user
from app.models.project import Project
from app.models.employee import Employee
from app.models.user import User
from app.models.project_employee import ProjectEmployee
from app.core.logging import logger

router = APIRouter()


@router.get("/{project_id}/employees", response_model=List[dict])
async def get_project_employees(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all employees assigned to a project"""
    try:
        # Check if project exists and user has access
        project_result = await db.execute(
            select(Project).where(Project.id == project_id)
        )
        project = project_result.scalar_one_or_none()
        
        if not project:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND,
                detail="Project not found"
            )
        
        # Get all project employees
        result = await db.execute(
            select(ProjectEmployee, Employee)
            .join(Employee, ProjectEmployee.employee_id == Employee.id)
            .where(ProjectEmployee.project_id == project_id)
        )
        
        employees = []
        for project_employee, employee in result.all():
            employees.append({
                "id": employee.id,
                "employee_id": employee.id,
                "user_id": employee.user_id,
                "first_name": employee.first_name,
                "last_name": employee.last_name,
                "email": employee.email,
                "job_title": employee.job_title,
                "photo_url": employee.photo_url,
                "role": project_employee.role,
                "assigned_at": project_employee.assigned_at.isoformat() if project_employee.assigned_at else None,
            })
        
        return employees
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting project employees: {e}", exc_info=True)
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error getting project employees"
        )


@router.post("/{project_id}/employees/{employee_id}")
async def assign_employee_to_project(
    project_id: int,
    employee_id: int,
    role: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Assign an employee to a project"""
    try:
        # Check if project exists
        project_result = await db.execute(
            select(Project).where(Project.id == project_id)
        )
        project = project_result.scalar_one_or_none()
        
        if not project:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND,
                detail="Project not found"
            )
        
        # Check if employee exists
        employee_result = await db.execute(
            select(Employee).where(Employee.id == employee_id)
        )
        employee = employee_result.scalar_one_or_none()
        
        if not employee:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND,
                detail="Employee not found"
            )
        
        # Check if already assigned
        existing_result = await db.execute(
            select(ProjectEmployee).where(
                and_(
                    ProjectEmployee.project_id == project_id,
                    ProjectEmployee.employee_id == employee_id
                )
            )
        )
        existing = existing_result.scalar_one_or_none()
        
        if existing:
            raise HTTPException(
                status_code=http_status.HTTP_400_BAD_REQUEST,
                detail="Employee already assigned to this project"
            )
        
        # Create assignment
        project_employee = ProjectEmployee(
            project_id=project_id,
            employee_id=employee_id,
            role=role,
            assigned_by_id=current_user.id
        )
        
        db.add(project_employee)
        await db.commit()
        await db.refresh(project_employee)
        
        return {
            "id": project_employee.id,
            "project_id": project_employee.project_id,
            "employee_id": project_employee.employee_id,
            "role": project_employee.role,
            "assigned_at": project_employee.assigned_at.isoformat() if project_employee.assigned_at else None,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error assigning employee to project: {e}", exc_info=True)
        await db.rollback()
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error assigning employee to project"
        )


@router.delete("/{project_id}/employees/{employee_id}")
async def remove_employee_from_project(
    project_id: int,
    employee_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Remove an employee from a project"""
    try:
        # Check if assignment exists
        result = await db.execute(
            select(ProjectEmployee).where(
                and_(
                    ProjectEmployee.project_id == project_id,
                    ProjectEmployee.employee_id == employee_id
                )
            )
        )
        project_employee = result.scalar_one_or_none()
        
        if not project_employee:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND,
                detail="Employee not assigned to this project"
            )
        
        await db.delete(project_employee)
        await db.commit()
        
        return {"message": "Employee removed from project"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error removing employee from project: {e}", exc_info=True)
        await db.rollback()
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error removing employee from project"
        )
