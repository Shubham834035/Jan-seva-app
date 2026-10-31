import uuid
from datetime import datetime, timezone
import enum
from sqlalchemy import Column, String, Boolean, DateTime, Enum, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class UserRole(str, enum.Enum):
    CITIZEN = "CITIZEN"
    AUTHORITY_OFFICER = "AUTHORITY_OFFICER"
    PLATFORM_ADMIN = "PLATFORM_ADMIN"

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    phone_number = Column(String(20), nullable=True)
    role = Column(Enum(UserRole), default=UserRole.CITIZEN, nullable=False)
    preferred_language = Column(String(10), default="en", nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    complaints = relationship("Complaint", back_populates="citizen", foreign_keys="Complaint.citizen_id")
    officer_assignments = relationship("OfficerAssignment", back_populates="officer")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="user")

class OfficerAssignment(Base):
    __tablename__ = "officer_assignments"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    officer_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    department_id = Column(String(36), ForeignKey("departments.id"), nullable=False)
    office_id = Column(String(36), ForeignKey("offices.id"), nullable=False)
    designation = Column(String(255), nullable=False)
    assigned_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    # Relationships
    officer = relationship("User", back_populates="officer_assignments")
    department = relationship("Department")
    office = relationship("Office")
