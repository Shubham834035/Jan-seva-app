import json
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from app.core.database import get_db
from app.core.dependencies import get_current_admin
from app.models.user import User, UserRole, OfficerAssignment
from app.models.complaint import Complaint, ComplaintStatus, RoutingStatus, DuplicateReviewStatus
from app.models.common_problem import CommonProblem, CommonProblemStatus
from app.models.authority import Department, Office, AuthorityMapping
from app.models.geographic_area import GeographicArea
from app.models.audit_log import AuditLog
from app.schemas.complaint import ComplaintOut, ComplaintDetailOut, AdminReassignInput, AdminDuplicateReviewInput
from app.schemas.authority import AuthorityMappingOut, AuthorityMappingCreate, DepartmentOut, OfficeOut
from app.schemas.user import UserOut
from app.services.timeline_service import add_status_history_entry

router = APIRouter(prefix="/admin", tags=["Platform Administrator"])

def log_admin_audit(db: Session, user: User, action: str, entity_type: str, entity_id: str, details: dict):
    audit = AuditLog(
        user_id=user.id,
        action=action,
        entity_type=entity_type,
        entity_id=str(entity_id),
        details_json=json.dumps(details),
        created_at=datetime.now(timezone.utc)
    )
    db.add(audit)

# --- 1. UNCERTAIN ROUTING QUEUE ---

@router.get("/uncertain-routing", response_model=List[ComplaintOut])
def get_uncertain_routing_queue(
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Lists complaints where jurisdiction or departmental mapping is ambiguous or unassigned."""
    return db.query(Complaint).options(
        joinedload(Complaint.category),
        joinedload(Complaint.assigned_department),
        joinedload(Complaint.assigned_office)
    ).filter(
        Complaint.routing_status == RoutingStatus.UNCERTAIN
    ).order_by(Complaint.created_at.desc()).all()

@router.post("/complaints/{complaint_id}/reassign", response_model=ComplaintDetailOut)
def reassign_complaint(
    complaint_id: str,
    reassign_in: AdminReassignInput,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Manually assigns or reassigns a complaint to a specific department and office.
    Records rationale in the immutable timeline and system audit log.
    """
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found.")

    dept = db.query(Department).filter(Department.id == reassign_in.department_id).first()
    office = db.query(Office).filter(Office.id == reassign_in.office_id).first()
    if not dept or not office:
        raise HTTPException(status_code=400, detail="Invalid department or office.")

    old_dept_id = complaint.assigned_department_id
    old_office_id = complaint.assigned_office_id

    complaint.assigned_department_id = dept.id
    complaint.assigned_office_id = office.id
    complaint.assigned_officer_id = reassign_in.officer_id
    complaint.routing_status = RoutingStatus.MANUAL_REVIEW
    complaint.status = ComplaintStatus.ASSIGNED_PROTOTYPE
    complaint.routing_notes = f"Manually assigned by Administrator: {reassign_in.reassignment_reason}"

    add_status_history_entry(
        db=db,
        complaint=complaint,
        new_status=ComplaintStatus.ASSIGNED_PROTOTYPE.value,
        action_title="Jurisdiction Reassigned by Administrator",
        action_note=f"Assigned to {dept.name_en} - {office.name}. Reason: {reassign_in.reassignment_reason}",
        actor=current_admin,
        is_external_confirmed=False
    )

    log_admin_audit(
        db=db,
        user=current_admin,
        action="REASSIGN_COMPLAINT",
        entity_type="Complaint",
        entity_id=complaint.id,
        details={
            "old_dept": old_dept_id,
            "new_dept": dept.id,
            "old_office": old_office_id,
            "new_office": office.id,
            "reason": reassign_in.reassignment_reason
        }
    )

    db.commit()
    db.refresh(complaint)
    return complaint

# --- 2. DUPLICATE REVIEW QUEUE ---

@router.get("/duplicate-review", response_model=List[ComplaintOut])
def get_duplicate_review_queue(
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Lists complaints requiring administrator review for potential common problem grouping."""
    return db.query(Complaint).options(
        joinedload(Complaint.category),
        joinedload(Complaint.assigned_department),
        joinedload(Complaint.assigned_office)
    ).filter(
        Complaint.duplicate_review_status == DuplicateReviewStatus.NEEDS_REVIEW
    ).order_by(Complaint.created_at.desc()).all()

@router.post("/complaints/{complaint_id}/duplicate-review", response_model=ComplaintDetailOut)
def resolve_duplicate_review(
    complaint_id: str,
    review_in: AdminDuplicateReviewInput,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Administrator decision on a duplicate / grouping candidate:
    - 'link_to_common': links complaint to existing common problem without losing individual record.
    - 'create_new': establishes a distinct common problem.
    """
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found.")

    if review_in.action == "link_to_common":
        if not review_in.target_common_problem_id:
            raise HTTPException(status_code=400, detail="Target Common Problem ID required.")
        cp = db.query(CommonProblem).filter(CommonProblem.id == review_in.target_common_problem_id).first()
        if not cp:
            raise HTTPException(status_code=404, detail="Target Common Problem not found.")

        complaint.common_problem_id = cp.id
        complaint.duplicate_review_status = DuplicateReviewStatus.AUTO_GROUPED
        cp.report_count += 1
        cp.last_reported_at = datetime.now(timezone.utc)
        note = f"Linked to Common Problem #{cp.id[:8]} by Administrator review. Notes: {review_in.admin_notes or 'Confirmed duplicate'}"

    else:
        # Create separate Common Problem
        new_cp = CommonProblem(
            title=complaint.title,
            description=f"Distinct problem report: {complaint.title}",
            category_id=complaint.category_id,
            geographic_area_id=complaint.geographic_area_id,
            generalized_latitude=round(complaint.latitude, 3) if complaint.latitude else 0.0,
            generalized_longitude=round(complaint.longitude, 3) if complaint.longitude else 0.0,
            locality_name=complaint.locality_landmark,
            status=CommonProblemStatus.IDENTIFIED,
            report_count=1,
            first_reported_at=complaint.created_at,
            last_reported_at=datetime.now(timezone.utc)
        )
        db.add(new_cp)
        db.flush()
        complaint.common_problem_id = new_cp.id
        complaint.duplicate_review_status = DuplicateReviewStatus.RESOLVED_SEPARATE
        note = f"Confirmed as distinct civic problem by Administrator. Notes: {review_in.admin_notes or 'Kept separate'}"

    complaint.duplicate_notes = note

    log_admin_audit(
        db=db,
        user=current_admin,
        action="RESOLVE_DUPLICATE_REVIEW",
        entity_type="Complaint",
        entity_id=complaint.id,
        details={
            "action": review_in.action,
            "target_common_problem_id": review_in.target_common_problem_id,
            "notes": review_in.admin_notes
        }
    )

    db.commit()
    db.refresh(complaint)
    return complaint

# --- 3. AUTHORITY MAPPINGS MANAGEMENT ---

@router.get("/mappings", response_model=List[AuthorityMappingOut])
def list_authority_mappings(
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Lists all configured authority jurisdictional mappings."""
    mappings = db.query(AuthorityMapping).all()
    results = []
    for m in mappings:
        out = AuthorityMappingOut(
            id=m.id,
            category_id=m.category_id,
            category_name=m.category.name_en if m.category else None,
            geographic_area_id=m.geographic_area_id,
            geographic_area_name=m.geographic_area.name if m.geographic_area else None,
            department_id=m.department_id,
            department_name=m.department.name_en if m.department else None,
            office_id=m.office_id,
            office_name=m.office.name if m.office else None,
            is_active=m.is_active,
            notes=m.notes,
            created_at=m.created_at
        )
        results.append(out)
    return results

@router.post("/mappings", response_model=AuthorityMappingOut, status_code=status.HTTP_201_CREATED)
def create_authority_mapping(
    mapping_in: AuthorityMappingCreate,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Creates a new jurisdictional authority routing mapping."""
    mapping = AuthorityMapping(
        category_id=mapping_in.category_id,
        geographic_area_id=mapping_in.geographic_area_id,
        department_id=mapping_in.department_id,
        office_id=mapping_in.office_id,
        notes=mapping_in.notes or "Configured via Administrator Portal",
        is_active=True
    )
    db.add(mapping)
    db.commit()
    db.refresh(mapping)

    log_admin_audit(
        db=db,
        user=current_admin,
        action="CREATE_AUTHORITY_MAPPING",
        entity_type="AuthorityMapping",
        entity_id=mapping.id,
        details={"category_id": mapping.category_id, "area_id": mapping.geographic_area_id}
    )

    return AuthorityMappingOut(
        id=mapping.id,
        category_id=mapping.category_id,
        category_name=mapping.category.name_en if mapping.category else None,
        geographic_area_id=mapping.geographic_area_id,
        geographic_area_name=mapping.geographic_area.name if mapping.geographic_area else None,
        department_id=mapping.department_id,
        department_name=mapping.department.name_en if mapping.department else None,
        office_id=mapping.office_id,
        office_name=mapping.office.name if mapping.office else None,
        is_active=mapping.is_active,
        notes=mapping.notes,
        created_at=mapping.created_at
    )

@router.get("/departments", response_model=List[DepartmentOut])
def list_departments(
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Lists all departments for assignment configuration."""
    return db.query(Department).filter(Department.is_active == True).all()

@router.get("/offices", response_model=List[OfficeOut])
def list_offices(
    department_id: Optional[str] = None,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Lists offices, optionally filtered by department."""
    q = db.query(Office).filter(Office.is_active == True)
    if department_id:
        q = q.filter(Office.department_id == department_id)
    offices = q.all()
    results = []
    for o in offices:
        results.append(OfficeOut(
            id=o.id,
            department_id=o.department_id,
            department_name=o.department.name_en if o.department else None,
            geographic_area_id=o.geographic_area_id,
            geographic_area_name=o.geographic_area.name if o.geographic_area else None,
            name=o.name,
            name_hi=o.name_hi,
            contact_email=o.contact_email,
            contact_phone=o.contact_phone,
            address=o.address,
            is_active=o.is_active
        ))
    return results

# --- 4. AUDIT LOGS ---

@router.get("/audit-logs")
def get_audit_logs(
    limit: int = Query(50, le=100),
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Returns platform administrative audit events."""
    logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit).all()
    return [
        {
            "id": l.id,
            "action": l.action,
            "entity_type": l.entity_type,
            "entity_id": l.entity_id,
            "details": json.loads(l.details_json) if l.details_json else {},
            "admin_name": l.user.full_name if l.user else "System",
            "created_at": l.created_at
        }
        for l in logs
    ]
