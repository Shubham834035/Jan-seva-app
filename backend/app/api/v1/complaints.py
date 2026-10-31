import os
import uuid
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session, joinedload
from app.core.config import settings
from app.core.database import get_db
from app.core.dependencies import get_current_user, get_current_active_citizen
from app.models.user import User, UserRole, OfficerAssignment
from app.models.category import ProblemCategory, PriorityLevel
from app.models.geographic_area import GeographicArea
from app.models.complaint import (
    Complaint,
    ComplaintStatus,
    RoutingStatus,
    DuplicateReviewStatus,
    AttachmentType,
    ComplaintAttachment,
    StatusHistory,
)
from app.schemas.complaint import (
    ComplaintCreate,
    ComplaintOut,
    ComplaintDetailOut,
    DisputeInput
)
from app.services.routing_engine import evaluate_authority_routing
from app.services.duplicate_detector import process_complaint_deduplication
from app.services.timeline_service import add_status_history_entry
from app.services.notification_service import send_in_app_notification

router = APIRouter(prefix="/complaints", tags=["Complaints"])

def generate_tracking_number(db: Session) -> str:
    year = datetime.now().year
    count = db.query(Complaint).count() + 1
    return f"JS-{year}-{count:05d}"

@router.post("/", response_model=ComplaintDetailOut, status_code=status.HTTP_201_CREATED)
async def submit_complaint(
    title: str = Form(..., min_length=5, max_length=200),
    description: str = Form(..., min_length=15, max_length=2000),
    category_id: str = Form(...),
    geographic_area_id: Optional[str] = Form(None),
    state: str = Form("Madhya Pradesh"),
    district: str = Form("Devgarh"),
    city: str = Form("Mayanagari"),
    locality_landmark: str = Form(..., min_length=3, max_length=255),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
    evidence_file: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_active_citizen),
    db: Session = Depends(get_db)
):
    """
    Submits a new citizen problem complaint.
    1. Validates inputs & category
    2. Evaluates smart authority routing
    3. Runs deterministic duplicate detection & common problem grouping
    4. Handles secure file evidence upload
    5. Records chronological timeline entries
    6. Dispatches confirmation notification
    """
    category = db.query(ProblemCategory).filter(
        ProblemCategory.id == category_id,
        ProblemCategory.is_active == True
    ).first()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The selected problem category is invalid or inactive.",
        )

    # 1. Authority Routing
    routing_status, dept_id, office_id, routing_notes = evaluate_authority_routing(
        db=db,
        category_id=category_id,
        geographic_area_id=geographic_area_id,
        latitude=latitude,
        longitude=longitude
    )

    initial_status = ComplaintStatus.ASSIGNED_PROTOTYPE if dept_id and office_id else ComplaintStatus.RECEIVED_BY_PLATFORM

    tracking_num = generate_tracking_number(db)

    complaint = Complaint(
        tracking_number=tracking_num,
        citizen_id=current_user.id,
        category_id=category_id,
        geographic_area_id=geographic_area_id,
        title=title.strip(),
        description=description.strip(),
        state=state.strip(),
        district=district.strip(),
        city=city.strip(),
        locality_landmark=locality_landmark.strip(),
        latitude=latitude,
        longitude=longitude,
        status=initial_status,
        priority=category.default_priority,
        assigned_department_id=dept_id,
        assigned_office_id=office_id,
        routing_status=routing_status,
        routing_notes=routing_notes,
    )
    db.add(complaint)
    db.flush()

    # 2. Duplicate Detection & Common Problem Grouping
    common_prob, dup_status, dup_conf, dup_notes = process_complaint_deduplication(db, complaint)
    complaint.common_problem_id = common_prob.id if common_prob else None
    complaint.duplicate_review_status = dup_status
    complaint.duplicate_confidence = dup_conf
    complaint.duplicate_notes = dup_notes

    # 3. File upload validation & saving
    if evidence_file and evidence_file.filename:
        if evidence_file.content_type not in settings.ALLOWED_IMAGE_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid file format '{evidence_file.content_type}'. Allowed types: JPG, PNG, WEBP.",
            )
        contents = await evidence_file.read()
        if len(contents) > settings.MAX_UPLOAD_SIZE_BYTES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_BYTES // (1024 * 1024)}MB.",
            )
        
        file_ext = os.path.splitext(evidence_file.filename)[1].lower() or ".jpg"
        unique_filename = f"{uuid.uuid4()}{file_ext}"
        save_path = os.path.join(settings.UPLOAD_DIR, "complaints", unique_filename)
        
        with open(save_path, "wb") as f:
            f.write(contents)

        attachment = ComplaintAttachment(
            complaint_id=complaint.id,
            file_path=f"/uploads/complaints/{unique_filename}",
            original_filename=evidence_file.filename,
            mime_type=evidence_file.content_type,
            file_size_bytes=len(contents),
            attachment_type=AttachmentType.CITIZEN_EVIDENCE
        )
        db.add(attachment)

    # 4. Status Timeline events
    add_status_history_entry(
        db=db,
        complaint=complaint,
        new_status=ComplaintStatus.SUBMITTED.value,
        action_title="Complaint Submitted by Citizen",
        action_note=f"Report registered on Jan Seva platform with tracking reference #{tracking_num}.",
        actor=current_user,
        is_external_confirmed=False
    )

    if dept_id and office_id:
        add_status_history_entry(
            db=db,
            complaint=complaint,
            new_status=ComplaintStatus.ASSIGNED_PROTOTYPE.value,
            action_title="Assigned to Responsible Office in Prototype",
            action_note=routing_notes,
            actor=None,
            is_external_confirmed=False
        )
    else:
        add_status_history_entry(
            db=db,
            complaint=complaint,
            new_status=ComplaintStatus.RECEIVED_BY_PLATFORM.value,
            action_title="Under Review for Jurisdiction Mapping",
            action_note=routing_notes,
            actor=None,
            is_external_confirmed=False
        )

    # 5. In-app confirmation notification
    send_in_app_notification(
        db=db,
        user_id=current_user.id,
        title="Complaint Submitted Successfully",
        title_hi="शिकायत सफलतापूर्वक दर्ज की गई",
        message=f"Your complaint #{tracking_num} has been recorded. You can track progress anytime.",
        message_hi=f"आपकी शिकायत #{tracking_num} दर्ज कर ली गई है। आप कभी भी स्थिति देख सकते हैं।",
        complaint_id=complaint.id
    )

    db.commit()
    db.refresh(complaint)
    return complaint

@router.get("/my", response_model=List[ComplaintOut])
def get_my_complaints(
    current_user: User = Depends(get_current_active_citizen),
    db: Session = Depends(get_db)
):
    """Returns complaints submitted by the authenticated citizen."""
    complaints = db.query(Complaint).options(
        joinedload(Complaint.category),
        joinedload(Complaint.assigned_department),
        joinedload(Complaint.assigned_office)
    ).filter(
        Complaint.citizen_id == current_user.id
    ).order_by(Complaint.created_at.desc()).all()
    return complaints

@router.get("/{complaint_id}", response_model=ComplaintDetailOut)
def get_complaint_details(
    complaint_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns full complaint details with evidence and chronological timeline.
    Security Enforcement:
    - Citizens can ONLY access their own complaints.
    - Officers can ONLY access complaints assigned to their authorized office.
    - Administrators can access all.
    """
    complaint = db.query(Complaint).options(
        joinedload(Complaint.category),
        joinedload(Complaint.assigned_department),
        joinedload(Complaint.assigned_office),
        joinedload(Complaint.common_problem),
        joinedload(Complaint.attachments),
        joinedload(Complaint.timeline)
    ).filter(
        (Complaint.id == complaint_id) | (Complaint.tracking_number == complaint_id)
    ).first()

    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint not found.",
        )

    # Enforce role-based access restrictions
    if current_user.role == UserRole.CITIZEN:
        if complaint.citizen_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: You are not authorized to view this private complaint.",
            )
    elif current_user.role == UserRole.AUTHORITY_OFFICER:
        # Check if complaint is assigned to officer's active office
        officer_offices = db.query(OfficerAssignment.office_id).filter(
            OfficerAssignment.officer_id == current_user.id,
            OfficerAssignment.is_active == True
        ).all()
        allowed_office_ids = {o[0] for o in officer_offices}
        if complaint.assigned_office_id not in allowed_office_ids:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: This complaint is outside your authorized office jurisdiction.",
            )

    return complaint

@router.post("/{complaint_id}/dispute", response_model=ComplaintDetailOut)
def dispute_resolution(
    complaint_id: str,
    dispute_in: DisputeInput,
    current_user: User = Depends(get_current_active_citizen),
    db: Session = Depends(get_db)
):
    """
    Allows a citizen to dispute or reopen a complaint marked as Resolved/Rejected.
    """
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint not found.",
        )

    if complaint.citizen_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the complainant can dispute this resolution.",
        )

    if complaint.status not in (ComplaintStatus.RESOLVED, ComplaintStatus.REJECTED):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Complaints can only be disputed once resolved or rejected.",
        )

    complaint.is_disputed = True
    complaint.dispute_reason = dispute_in.dispute_reason
    complaint.disputed_at = datetime.now(timezone.utc)
    complaint.status = ComplaintStatus.UNDER_REVIEW

    add_status_history_entry(
        db=db,
        complaint=complaint,
        new_status=ComplaintStatus.UNDER_REVIEW.value,
        action_title="Citizen Disputed Resolution",
        action_note=f"Dispute Reason: {dispute_in.dispute_reason}",
        actor=current_user,
        is_external_confirmed=False
    )

    db.commit()
    db.refresh(complaint)
    return complaint
