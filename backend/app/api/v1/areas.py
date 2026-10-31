from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.geographic_area import GeographicArea, AreaType
from app.schemas.area import GeographicAreaOut

router = APIRouter(prefix="/areas", tags=["Geographic Areas"])

@router.get("/", response_model=List[GeographicAreaOut])
def list_geographic_areas(
    area_type: Optional[AreaType] = None,
    parent_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Returns configured geographic jurisdictions (Wards, Municipalities, Districts)."""
    query = db.query(GeographicArea)
    if area_type:
        query = query.filter(GeographicArea.area_type == area_type)
    if parent_id:
        query = query.filter(GeographicArea.parent_id == parent_id)
    return query.all()
