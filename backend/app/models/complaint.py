import uuid
from datetime import datetime, timezone
import enum
from sqlalchemy import Column, String, Float, Integer, Enum, ForeignKey, DateTime, Text, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.category import PriorityLevel

class ComplaintStatus(str, enum.Enum):
    SUBMITTED = "SUBMITTED"
    RECEIVED_BY_PLATFORM = "RECEIVED_BY_PLATFORM"
    UNDER_REVIEW = "UNDER_REVIEW"
    ASSIGNED_PROTOTYPE = "ASSIGNED_PROTOTYPE"
    IN_PROGRESS = "IN_PROGRESS"
    RESOLVED = "RESOLVED"
    REJECTED = "REJECTED"
    RETURNED_FOR_CLARIFICATION = "RETURNED_FOR_CLARIFICATION"

class RoutingStatus(str, enum.Enum):
    AUTO_ROUTED = "AUTO_ROUTED"
    MANUAL_REVIEW = "MANUAL_REVIEW"
    UNCERTAIN = "UNCERTAIN"

class DuplicateReviewStatus(str, enum.Enum):
    NONE = "NONE"
    AUTO_GROUPED = "AUTO_GROUPED"
    NEEDS_REVIEW = "NEEDS_REVIEW"
    RESOLVED_SEPARATE = "RESOLVED_SEPARATE"

class AttachmentType(str, enum.Enum):
    CITIZEN_EVIDENCE = "CITIZEN_EVIDENCE"
    RESOLUTION_PROOF = "RESOLUTION_PROOF"

class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tracking_number = Column(String(30), unique=True, index=True, nullable=False)
    
    citizen_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    category_id = Column(String(36), ForeignKey("problem_categories.id"), nullable=False)
    geographic_area_id = Column(String(36), ForeignKey("geographic_areas.id"), nullable=True)
    
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    
    # Location fields
    state = Column(String(100), default="Madhya Pradesh", nullable=False)
    district = Column(String(100), default="Devgarh", nullable=False)
    city = Column(String(100), default="Mayanagari", nullable=False)
    locality_landmark = Column(String(255), nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

    status = Column(Enum(ComplaintStatus), default=ComplaintStatus.SUBMITTED, nullable=False)
    priority = Column(Enum(PriorityLevel), default=PriorityLevel.MEDIUM, nullable=False)

    # Authority Routing
    assigned_department_id = Column(String(36), ForeignKey("departments.id"), nullable=True)
    assigned_office_id = Column(String(36), ForeignKey("offices.id"), nullable=True)
    assigned_officer_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    routing_status = Column(Enum(RoutingStatus), default=RoutingStatus.AUTO_ROUTED, nullable=False)
    routing_notes = Column(Text, nullable=True)

    # Common Problem Link & Duplicate Review
    common_problem_id = Column(String(36), ForeignKey("common_problems.id"), nullable=True)
    duplicate_review_status = Column(Enum(DuplicateReviewStatus), default=DuplicateReviewStatus.NONE, nullable=False)
    duplicate_confidence = Column(Float, nullable=True)
    duplicate_notes = Column(Text, nullable=True)

    # Citizen Dispute / Reopen
    is_disputed = Column(Boolean, default=False, nullable=False)
    dispute_reason = Column(Text, nullable=True)
    disputed_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    citizen = relationship("User", back_populates="complaints", foreign_keys=[citizen_id])
    assigned_officer = relationship("User", foreign_keys=[assigned_officer_id])
    category = relationship("ProblemCategory", back_populates="complaints")
    geographic_area = relationship("GeographicArea", back_populates="complaints")
    assigned_department = relationship("Department", back_populates="complaints")
    assigned_office = relationship("Office", back_populates="complaints")
    common_problem = relationship("CommonProblem", back_populates="complaints")
    attachments = relationship("ComplaintAttachment", back_populates="complaint", cascade="all, delete-orphan")
    timeline = relationship("StatusHistory", back_populates="complaint", cascade="all, delete-orphan", order_by="StatusHistory.created_at.asc()")

class ComplaintAttachment(Base):
    __tablename__ = "complaint_attachments"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    complaint_id = Column(String(36), ForeignKey("complaints.id"), nullable=False)
    file_path = Column(String(500), nullable=False)
    original_filename = Column(String(255), nullable=False)
    mime_type = Column(String(100), nullable=False)
    file_size_bytes = Column(Integer, nullable=False)
    attachment_type = Column(Enum(AttachmentType), default=AttachmentType.CITIZEN_EVIDENCE, nullable=False)
    uploaded_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    complaint = relationship("Complaint", back_populates="attachments")

class StatusHistory(Base):
    __tablename__ = "status_histories"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    complaint_id = Column(String(36), ForeignKey("complaints.id"), nullable=False)
    actor_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    actor_name = Column(String(255), nullable=False)
    actor_role = Column(String(50), nullable=False)
    
    old_status = Column(String(50), nullable=True)
    new_status = Column(String(50), nullable=False)
    action_title = Column(String(255), nullable=False)
    action_note = Column(Text, nullable=True)
    
    # Honest representation of prototype vs confirmed real government systems
    is_external_confirmed = Column(Boolean, default=False, nullable=False)
    resolution_evidence_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    complaint = relationship("Complaint", back_populates="timeline")
    actor = relationship("User", foreign_keys=[actor_id])
