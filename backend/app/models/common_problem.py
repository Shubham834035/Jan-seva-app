import uuid
from datetime import datetime, timezone
import enum
from sqlalchemy import Column, String, Float, Integer, Enum, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class CommonProblemStatus(str, enum.Enum):
    IDENTIFIED = "IDENTIFIED"
    INVESTIGATING = "INVESTIGATING"
    IN_PROGRESS = "IN_PROGRESS"
    RESOLVED = "RESOLVED"
    CLOSED = "CLOSED"

class CommonProblem(Base):
    __tablename__ = "common_problems"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    category_id = Column(String(36), ForeignKey("problem_categories.id"), nullable=False)
    geographic_area_id = Column(String(36), ForeignKey("geographic_areas.id"), nullable=True)
    
    # Generalized location (rounded coordinates to 3 decimals to protect citizen privacy)
    generalized_latitude = Column(Float, nullable=False)
    generalized_longitude = Column(Float, nullable=False)
    locality_name = Column(String(255), nullable=False)
    
    status = Column(Enum(CommonProblemStatus), default=CommonProblemStatus.IDENTIFIED, nullable=False)
    report_count = Column(Integer, default=1, nullable=False)
    
    first_reported_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    last_reported_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    resolved_at = Column(DateTime, nullable=True)

    # Relationships
    category = relationship("ProblemCategory", back_populates="common_problems")
    geographic_area = relationship("GeographicArea", back_populates="common_problems")
    complaints = relationship("Complaint", back_populates="common_problem")
