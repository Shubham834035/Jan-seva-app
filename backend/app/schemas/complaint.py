from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from app.models.complaint import ComplaintStatus, RoutingStatus, DuplicateReviewStatus, AttachmentType
from app.models.category import PriorityLevel
from app.schemas.category import ProblemCategoryOut
from app.schemas.authority import DepartmentOut, OfficeOut
from app.schemas.common_problem import CommonProblemOut

class ComplaintCreate(BaseModel):
    title: str = Field(..., min_length=5, max_length=200)
    description: str = Field(..., min_length=15, max_length=2000)
    category_id: str
    geographic_area_id: Optional[str] = None
    state: str = "Madhya Pradesh"
    district: str = "Devgarh"
    city: str = "Mayanagari"
    locality_landmark: str = Field(..., min_length=3, max_length=255)
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class AttachmentOut(BaseModel):
    id: str
    file_path: str
    original_filename: str
    mime_type: str
    file_size_bytes: int
    attachment_type: AttachmentType
    uploaded_at: datetime

    class Config:
        from_attributes = True

class TimelineEventOut(BaseModel):
    id: str
    actor_name: str
    actor_role: str
    old_status: Optional[str] = None
    new_status: str
    action_title: str
    action_note: Optional[str] = None
    is_external_confirmed: bool
    resolution_evidence_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ComplaintOut(BaseModel):
    id: str
    tracking_number: str
    title: str
    description: str
    category_id: str
    category: Optional[ProblemCategoryOut] = None
    geographic_area_id: Optional[str] = None
    state: str
    district: str
    city: str
    locality_landmark: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    status: ComplaintStatus
    priority: PriorityLevel
    routing_status: RoutingStatus
    routing_notes: Optional[str] = None
    assigned_department_id: Optional[str] = None
    assigned_department: Optional[DepartmentOut] = None
    assigned_office_id: Optional[str] = None
    assigned_office: Optional[OfficeOut] = None
    common_problem_id: Optional[str] = None
    duplicate_review_status: DuplicateReviewStatus
    duplicate_confidence: Optional[float] = None
    is_disputed: bool
    dispute_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ComplaintDetailOut(ComplaintOut):
    attachments: List[AttachmentOut] = []
    timeline: List[TimelineEventOut] = []
    common_problem: Optional[CommonProblemOut] = None

class StatusUpdateInput(BaseModel):
    new_status: ComplaintStatus
    action_note: str = Field(..., min_length=5, max_length=1000)
    resolution_evidence_url: Optional[str] = None

class DisputeInput(BaseModel):
    dispute_reason: str = Field(..., min_length=10, max_length=1000)

class AdminReassignInput(BaseModel):
    department_id: str
    office_id: str
    officer_id: Optional[str] = None
    reassignment_reason: str = Field(..., min_length=5, max_length=500)

class AdminDuplicateReviewInput(BaseModel):
    action: str = Field(..., description="'link_to_common' or 'create_new' or 'keep_separate'")
    target_common_problem_id: Optional[str] = None
    admin_notes: Optional[str] = None
