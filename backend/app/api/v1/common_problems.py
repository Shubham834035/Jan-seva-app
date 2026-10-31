from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from app.core.database import get_db
from app.models.common_problem import CommonProblem
from app.models.complaint import Complaint
from app.schemas.common_problem import CommonProblemOut, CommonProblemDetailOut, PublicLinkedReportSummary
from app.services.duplicate_detector import calculate_haversine_distance_meters

router = APIRouter(prefix="/common-problems", tags=["Common Problems (Public)"])

@router.get("/", response_model=List[CommonProblemOut])
def list_common_problems(
    category_id: Optional[str] = None,
    area_id: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = Query(50, le=100),
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """
    Public aggregated list of civic problems.
    Privacy Guarantee: Displays generalized locations and report counts. No personal citizen data is exposed.
    """
    query = db.query(CommonProblem).options(
        joinedload(CommonProblem.category),
        joinedload(CommonProblem.geographic_area)
    )

    if category_id:
        query = query.filter(CommonProblem.category_id == category_id)
    if area_id:
        query = query.filter(CommonProblem.geographic_area_id == area_id)
    if status:
        query = query.filter(CommonProblem.status == status)

    return query.order_by(CommonProblem.report_count.desc(), CommonProblem.last_reported_at.desc()).offset(offset).limit(limit).all()

@router.get("/nearby", response_model=List[CommonProblemOut])
def find_nearby_common_problems(
    latitude: float = Query(...),
    longitude: float = Query(...),
    radius_meters: float = Query(2000.0, le=10000.0),
    category_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Searches for public civic problems within the specified radius (default 2km) using geospatial calculation.
    """
    query = db.query(CommonProblem).options(
        joinedload(CommonProblem.category),
        joinedload(CommonProblem.geographic_area)
    )
    if category_id:
        query = query.filter(CommonProblem.category_id == category_id)

    all_problems = query.all()
    nearby = []
    for p in all_problems:
        if p.generalized_latitude and p.generalized_longitude:
            dist = calculate_haversine_distance_meters(
                latitude, longitude,
                p.generalized_latitude, p.generalized_longitude
            )
            if dist <= radius_meters:
                nearby.append(p)

    return nearby

@router.get("/{problem_id}", response_model=CommonProblemDetailOut)
def get_common_problem_detail(
    problem_id: str,
    db: Session = Depends(get_db)
):
    """
    Returns public problem information with aggregate report counts.
    Strict Privacy Rule:
    Does NOT reveal citizen names, phone numbers, or exact residential addresses.
    """
    problem = db.query(CommonProblem).options(
        joinedload(CommonProblem.category),
        joinedload(CommonProblem.geographic_area)
    ).filter(CommonProblem.id == problem_id).first()

    if not problem:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Common problem report not found.",
        )

    # Fetch linked reports and sanitize strictly
    linked_complaints = db.query(Complaint).filter(
        Complaint.common_problem_id == problem.id
    ).order_by(Complaint.created_at.desc()).all()

    sanitized_reports = [
        PublicLinkedReportSummary(
            tracking_number=c.tracking_number,
            reported_at=c.created_at,
            status=c.status.value
        )
        for c in linked_complaints
    ]

    detail = CommonProblemDetailOut(
        id=problem.id,
        title=problem.title,
        description=problem.description,
        category_id=problem.category_id,
        category=problem.category,
        geographic_area_id=problem.geographic_area_id,
        generalized_latitude=problem.generalized_latitude,
        generalized_longitude=problem.generalized_longitude,
        locality_name=problem.locality_name,
        status=problem.status,
        report_count=problem.report_count,
        first_reported_at=problem.first_reported_at,
        last_reported_at=problem.last_reported_at,
        resolved_at=problem.resolved_at,
        linked_reports=sanitized_reports
    )
    return detail
