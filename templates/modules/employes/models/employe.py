"""
Employés Module - Employee Model
Modèle pour les employés
"""

from datetime import datetime, date
from typing import Optional
from uuid import UUID, uuid4

from sqlalchemy import Column, String, Text, DateTime, Date, ForeignKey, Enum as SQLEnum, Boolean, Numeric
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import relationship

from app.core.database import Base
import enum


class EmployeeStatus(str, enum.Enum):
    """Statuts possibles d'un employé"""
    ACTIVE = "active"
    INACTIVE = "inactive"
    ON_LEAVE = "on_leave"
    TERMINATED = "terminated"


class EmployeeType(str, enum.Enum):
    """Types d'employés"""
    FULL_TIME = "full_time"
    PART_TIME = "part_time"
    CONTRACTOR = "contractor"
    INTERN = "intern"


class Employee(Base):
    """Modèle Employee pour le module Employés"""
    __tablename__ = "employees"

    id: UUID = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    
    # Informations personnelles
    first_name: str = Column(String(100), nullable=False)
    last_name: str = Column(String(100), nullable=False)
    email: str = Column(String(255), nullable=False, unique=True, index=True)
    phone: Optional[str] = Column(String(20), nullable=True)
    
    # Informations professionnelles
    employee_number: Optional[str] = Column(String(50), nullable=True, unique=True, index=True)
    job_title: Optional[str] = Column(String(100), nullable=True)
    department: Optional[str] = Column(String(100), nullable=True)
    employee_type: EmployeeType = Column(SQLEnum(EmployeeType), default=EmployeeType.FULL_TIME, nullable=False)
    status: EmployeeStatus = Column(SQLEnum(EmployeeStatus), default=EmployeeStatus.ACTIVE, nullable=False)
    
    # Dates importantes
    hire_date: Optional[date] = Column(Date, nullable=True)
    termination_date: Optional[date] = Column(Date, nullable=True)
    
    # Informations de rémunération
    salary: Optional[float] = Column(Numeric(10, 2), nullable=True)
    hourly_rate: Optional[float] = Column(Numeric(8, 2), nullable=True)
    
    # Informations additionnelles
    address: Optional[str] = Column(Text, nullable=True)
    city: Optional[str] = Column(String(100), nullable=True)
    postal_code: Optional[str] = Column(String(20), nullable=True)
    country: Optional[str] = Column(String(100), nullable=True)
    notes: Optional[str] = Column(Text, nullable=True)
    
    # Relations
    manager_id: Optional[UUID] = Column(PG_UUID(as_uuid=True), ForeignKey("employees.id"), nullable=True)
    team_id: Optional[UUID] = Column(PG_UUID(as_uuid=True), ForeignKey("teams.id"), nullable=True)
    user_id: Optional[UUID] = Column(PG_UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, unique=True)
    
    # Timestamps
    created_at: datetime = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: datetime = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<Employee {self.first_name} {self.last_name}>"
