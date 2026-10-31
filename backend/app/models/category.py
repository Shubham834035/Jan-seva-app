import uuid
import enum
from sqlalchemy import Column, String, Boolean, Enum, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class PriorityLevel(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class ProblemCategory(Base):
    __tablename__ = "problem_categories"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    code = Column(String(50), unique=True, index=True, nullable=False)
    name_en = Column(String(255), nullable=False)
    name_hi = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    icon = Column(String(50), default="alert-circle", nullable=False)
    default_priority = Column(Enum(PriorityLevel), default=PriorityLevel.MEDIUM, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    # Relationships
    complaints = relationship("Complaint", back_populates="category")
    authority_mappings = relationship("AuthorityMapping", back_populates="category")
    common_problems = relationship("CommonProblem", back_populates="category")
