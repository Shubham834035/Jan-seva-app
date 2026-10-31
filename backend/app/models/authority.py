import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class Department(Base):
    __tablename__ = "departments"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    code = Column(String(50), unique=True, index=True, nullable=False)
    name_en = Column(String(255), nullable=False)
    name_hi = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    # Relationships
    offices = relationship("Office", back_populates="department")
    authority_mappings = relationship("AuthorityMapping", back_populates="department")
    complaints = relationship("Complaint", back_populates="assigned_department")

class Office(Base):
    __tablename__ = "offices"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    department_id = Column(String(36), ForeignKey("departments.id"), nullable=False)
    geographic_area_id = Column(String(36), ForeignKey("geographic_areas.id"), nullable=True)
    name = Column(String(255), nullable=False)
    name_hi = Column(String(255), nullable=True)
    contact_email = Column(String(255), nullable=True)
    contact_phone = Column(String(50), nullable=True)
    address = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    # Relationships
    department = relationship("Department", back_populates="offices")
    geographic_area = relationship("GeographicArea", back_populates="offices")
    authority_mappings = relationship("AuthorityMapping", back_populates="office")
    complaints = relationship("Complaint", back_populates="assigned_office")

class AuthorityMapping(Base):
    __tablename__ = "authority_mappings"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    category_id = Column(String(36), ForeignKey("problem_categories.id"), nullable=False)
    geographic_area_id = Column(String(36), ForeignKey("geographic_areas.id"), nullable=False)
    department_id = Column(String(36), ForeignKey("departments.id"), nullable=False)
    office_id = Column(String(36), ForeignKey("offices.id"), nullable=False)
    
    is_active = Column(Boolean, default=True, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    category = relationship("ProblemCategory", back_populates="authority_mappings")
    geographic_area = relationship("GeographicArea", back_populates="authority_mappings")
    department = relationship("Department", back_populates="authority_mappings")
    office = relationship("Office", back_populates="authority_mappings")
