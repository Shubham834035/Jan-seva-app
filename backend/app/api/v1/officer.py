import os
import uuid
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session, joinedload
from app.core.config import settings
from app.core.database import get_db
from app.core.dependencies import get_current_officer
from app.models.user import User, OfficerAssignment
from app.models.complaint import Complaint, ComplaintStatus, ComplaintAttachment, AttachmentType
from app.models.common_problem import CommonProblem, CommonProblemStatus
from app.schemas.complaint import ComplaintOut, ComplaintDetailOut
from app.services.timeline_service import add_status_history_entry
from app.services.notification_service import send_in_app_notification

router = APIRouter(prefix="/officer", tags=["Authority Officer"])

@router.get("/assigned", response_model=List[ComplaintOut])
def list_assigned_complaints(
    status_filter: Optional[ComplaintStatus] = None,
    category_id: Optional[str] = None,
    current_officer: User = Depends(get_current_officer),
    db: Session = Depends(get_db)
):
    """
    Lists complaints assigned to the officer's authorized office.
    Strict Server-Side Authorization:
    Officers can ONLY access complaints assigned to their office jurisdiction.
    """
    assignments = db.query(OfficerAssignment).filter(
        OfficerAssignment.officer_id == current_officer.id,
        OfficerAssignment.is_active == True
    ).all()
    office_ids = [a.office_id for a in assignments]
    if not office_ids:
        return []

    query = db.query(Complaint).options(
        joinedload(Complaint.category),
        joinedload(Complaint.assigned_department),
        joinedload(Complaint.assigned_office)
    ).filter(Complaint.assigned_office_id.in_(office_ids))

    if status_filter:
        query = query.filter(Complaint.status == status_filter)
    if category_id:
        query = query.filter(Complaint.category_id == category_id)

    return query.order_by(Complaint.created_at.desc()).all()

@router.post("/{complaint_id}/status", response_model=ComplaintDetailOut)
async def update_complaint_status(
    complaint_id: str,
    new_status: ComplaintStatus = Form(...),
    action_note: str = Form(..., min_length=5, max_length=1000),
    resolution_proof: Optional[UploadFile] = File(None),
    current_officer: User = Depends(get_current_officer),
    db: Session = Depends(get_db)
):
    """
    Updates the complaint status and appends an immutable timeline event.
    Permitted statuses: IN_PROGRESS, RESOLVED, REJECTED, RETURNED_FOR_CLARIFICATION.
    Optionally accepts resolution photographic proof.
    """
    assignments = db.query(OfficerAssignment).filter(
        OfficerAssignment.officer_id == current_officer.id,
        OfficerAssignment.is_active == True
    ).all()
    office_ids = {a.office_id for a in assignments}

    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint not found.",
        )

    if complaint.assigned_office_id not in office_ids:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Unauthorized: You do not have permission to manage complaints for this office.",
        )

    # Resolution proof upload if provided
    proof_url = None
    if resolution_proof and resolution_proof.filename:
        if resolution_proof.content_type not in settings.ALLOWED_IMAGE_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid image format. Allowed: JPG, PNG, WEBP.",
            )
        contents = await resolution_proof.read()
        if len(contents) > settings.MAX_UPLOAD_SIZE_BYTES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Image exceeds maximum size of {settings.MAX_UPLOAD_SIZE_BYTES // (1024 * 1024)}MB.",
            )
        file_ext = os.path.splitext(resolution_proof.filename)[1].lower() or ".jpg"
        unique_filename = f"res_{uuid.uuid4()}{file_ext}"
        save_path = os.path.join(settings.UPLOAD_DIR, "resolutions", unique_filename)
        with open(save_path, "wb") as f:
            f.write(contents)
        proof_url = f"/uploads/resolutions/{unique_filename}"

        attachment = ComplaintAttachment(
            complaint_id=complaint.id,
            file_path=proof_url,
            original_filename=resolution_proof.filename,
            mime_type=resolution_proof.content_type,
            file_size_bytes=len(contents),
            attachment_type=AttachmentType.RESOLUTION_PROOF
        )
        db.add(attachment)

    old_status = complaint.status
    complaint.status = new_status
    complaint.assigned_officer_id = current_officer.id
    complaint.updated_at = datetime.now(timezone.utc)

    # Action title based on status
    status_titles = {
        ComplaintStatus.IN_PROGRESS: "Work Started by Responsible Office",
        ComplaintStatus.RESOLVED: "Issue Resolved by Responsible Office",
        ComplaintStatus.REJECTED: "Complaint Rejected with Reason",
        ComplaintStatus.RETURNED_FOR_CLARIFICATION: "Clarification Requested from Citizen"
    }
    action_title = status_titles.get(new_status, f"Status Updated to {new_status.value}")

    # Honest disclosure: marked as platform simulation unless external government integration exists
    add_status_history_entry(
        db=db,
        complaint=complaint,
        new_status=new_status.value,
        action_title=action_title,
        action_note=f"{action_note} (Prototype action by {current_officer.full_name})",
        actor=current_officer,
        is_external_confirmed=False,
        resolution_evidence_url=proof_url
    )

    # Check and update CommonProblem status if resolved
    if new_status == ComplaintStatus.RESOLVED and complaint.common_problem_id:
        cp = db.query(CommonProblem).filter(CommonProblem.id == complaint.common_problem_id).first()
        if cp:
            # Check if all other complaints in this common problem are resolved
            other_active = db.query(Complaint).filter(
                Complaint.common_problem_id == cp.id,
                Complaint.id != complaint.id,
                Complaint.status.notin_([ComplaintStatus.RESOLVED, ComplaintStatus.REJECTED])
            ).count()
            if other_active == 0:
                cp.status = CommonProblemStatus.RESOLVED
                cp.resolved_at = datetime.now(timezone.utc)

    # Notify Citizen
    status_msg_en = f"Your complaint #{complaint.tracking_number} status has been updated to '{new_status.value}': {action_note}"
    status_msg_hi = f"आपकी शिकायत #{complaint.tracking_number} की स्थिति '{new_status.value}' में अपडेट की गई है: {action_note}"
    send_in_app_notification(
        db=db,
        user_id=complaint.citizen_id,
        title=f"Complaint Status Update: {new_status.value}",
        title_hi=f"शिकायत स्थिति अपडेट: {new_status.value}",
        message=status_msg_en,
        message_hi=status_msg_hi,
        complaint_id=complaint.id
    )

    db.commit()
    db.refresh(complaint)
    return complaint
