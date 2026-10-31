from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.complaint import Complaint, ComplaintStatus
from app.models.category import ProblemCategory
from app.models.common_problem import CommonProblem
from app.models.geographic_area import GeographicArea

router = APIRouter(prefix="/analytics", tags=["Civic Analytics"])

@router.get("/overview")
def get_civic_analytics_overview(
    db: Session = Depends(get_db)
):
    """
    Returns platform-wide civic metrics.
    Clarification Note: Prototype simulation metrics - not official government records.
    """
    total_complaints = db.query(Complaint).count()
    under_review = db.query(Complaint).filter(Complaint.status.in_([ComplaintStatus.SUBMITTED, ComplaintStatus.RECEIVED_BY_PLATFORM, ComplaintStatus.UNDER_REVIEW])).count()
    in_progress = db.query(Complaint).filter(Complaint.status.in_([ComplaintStatus.ASSIGNED_PROTOTYPE, ComplaintStatus.IN_PROGRESS])).count()
    resolved = db.query(Complaint).filter(Complaint.status == ComplaintStatus.RESOLVED).count()
    rejected = db.query(Complaint).filter(Complaint.status == ComplaintStatus.REJECTED).count()

    # Complaints by category
    cat_counts = db.query(
        ProblemCategory.name_en,
        ProblemCategory.name_hi,
        func.count(Complaint.id)
    ).join(Complaint, Complaint.category_id == ProblemCategory.id, isouter=True
    ).group_by(ProblemCategory.id).all()

    by_category = [
        {"name_en": c[0], "name_hi": c[1], "count": c[2]}
        for c in cat_counts
    ]

    # Top Common Problems with highest report counts
    top_common = db.query(CommonProblem).order_by(
        CommonProblem.report_count.desc()
    ).limit(5).all()

    top_issues = [
        {
            "id": p.id,
            "title": p.title,
            "locality": p.locality_name,
            "report_count": p.report_count,
            "status": p.status.value
        }
        for p in top_issues_records if False
    ] if False else [
        {
            "id": p.id,
            "title": p.title,
            "locality": p.locality_name,
            "report_count": p.report_count,
            "status": p.status.value
        }
        for p in top_common
    ]

    resolution_rate = round((resolved / total_complaints * 100), 1) if total_complaints > 0 else 0.0

    return {
        "disclaimer": "PROTOTYPE ANALYTICS: Calculated from simulated local testing and citizen reports.",
        "total_complaints": total_complaints,
        "under_review": under_review,
        "in_progress": in_progress,
        "resolved": resolved,
        "rejected": rejected,
        "resolution_rate_percent": resolution_rate,
        "by_category": by_category,
        "top_common_problems": top_issues
    }
