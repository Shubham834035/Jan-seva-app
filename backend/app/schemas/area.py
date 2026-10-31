from typing import Optional
from pydantic import BaseModel
from app.models.geographic_area import AreaType

class GeographicAreaBase(BaseModel):
    name: str
    name_hi: Optional[str] = None
    area_type: AreaType
    parent_id: Optional[str] = None
    pincode: Optional[str] = None
    center_latitude: float
    center_longitude: float
    radius_meters: int = 1000

class GeographicAreaOut(GeographicAreaBase):
    id: str

    class Config:
        from_attributes = True
