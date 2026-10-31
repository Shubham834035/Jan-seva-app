import uuid
import enum
from sqlalchemy import Column, String, Float, Integer, Enum, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class AreaType(str, enum.Enum):
    STATE = "STATE"
    DISTRICT = "DISTRICT"
    MUNICIPALITY = "MUNICIPALITY"
    WARD_ZONE = "WARD_ZONE"

class GeographicArea(Base):
    __tablename__ = "geographic_areas"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    name_hi = Column(String(255), nullable=True)
    area_type = Column(Enum(AreaType), nullable=False)
    parent_id = Column(String(36), ForeignKey("geographic_areas.id"), nullable=True)
    pincode = Column(String(10), nullable=True, index=True)
    center_latitude = Column(Float, nullable=False)
    center_longitude = Column(Float, nullable=False)
    radius_meters = Column(Integer, default=1000, nullable=False)

    # Self-referencing parent/child
    parent = relationship("GeographicArea", remote_side=[id], backref="children")
    
    # Relationships
    offices = relationship("Office", back_populates="geographic_area")
    authority_mappings = relationship("AuthorityMapping", back_populates="geographic_area")
    complaints = relationship("Complaint", back_populates="geographic_area")
    common_problems = relationship("CommonProblem", back_populates="geographic_area")
