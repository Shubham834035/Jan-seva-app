from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel
from app.models.common_problem import CommonProblemStatus
from app.schemas.category import ProblemCategoryOut

class CommonProblemBase(BaseModel):
    title: str
    description: Optional[str] = None
    category_id: str
    geographic_area_id: Optional[str] = None
    generalized_latitude: float
    generalized_longitude: float
    locality_name: str
    status: CommonProblemStatus
    report_count: int
    first_reported_at: datetime
    last_reported_at: datetime
    resolved_at: Optional[datetime] = None

class CommonProblemOut(CommonProblemBase):
    id: str
    category: Optional[ProblemCategoryOut] = None

    class Config:
        from_attributes = True

class PublicLinkedReportSummary(BaseModel):
    """Sanitized aggregate report record - no private citizen info!"""
    tracking_number: str
    reported_at: datetime
    status: str

class CommonProblemDetailOut(CommonProblemOut):
    # Only displays aggregate report count and sanitized public report items
    linked_reports: List[PublicLinkedReportSummary] = []
