import math
import re
from datetime import datetime, timezone
from typing import Optional, Tuple, List
from sqlalchemy.orm import Session
from app.models.complaint import Complaint, DuplicateReviewStatus
from app.models.common_problem import CommonProblem, CommonProblemStatus

def calculate_haversine_distance_meters(
    lat1: float, lon1: float,
    lat2: float, lon2: float
) -> float:
    """Calculates great-circle distance between two GPS coordinates in meters."""
    R = 6371000.0  # Earth radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (math.sin(delta_phi / 2.0) ** 2 +
         math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c

def extract_normalized_tokens(text: str) -> set:
    """Cleans and extracts meaningful normalized keyword tokens from text."""
    if not text:
        return set()
    cleaned = re.sub(r"[^\w\s]", " ", text.lower())
    stop_words = {
        "the", "a", "an", "is", "in", "at", "of", "on", "and", "or", "for", "with",
        "to", "from", "by", "near", "road", "street", "area", "please", "fix",
        "hai", "ka", "ki", "ke", "ko", "me", "se", "par"
    }
    tokens = {word.strip() for word in cleaned.split() if len(word.strip()) > 2 and word.strip() not in stop_words}
    return tokens

def compute_similarity_score(
    new_title: str,
    new_desc: str,
    new_lat: Optional[float],
    new_lon: Optional[float],
    existing_title: str,
    existing_desc: str,
    existing_lat: Optional[float],
    existing_lon: Optional[float],
    existing_created_at: datetime
) -> Tuple[float, str]:
    """
    Computes a multi-factor match score between 0.0 and 1.0.
    Factors:
    - Distance (within 350 meters)
    - Keyword / Jaccard token overlap
    - Submission Recency
    """
    # 1. Geographic distance factor
    distance_score = 0.0
    dist_meters = 0.0
    if new_lat is not None and new_lon is not None and existing_lat is not None and existing_lon is not None:
        dist_meters = calculate_haversine_distance_meters(new_lat, new_lon, existing_lat, existing_lon)
        if dist_meters > 350.0:
            # Different locations on road (> 350m apart) should remain separate
            return (0.0, f"Distance {int(dist_meters)}m exceeds civic grouping threshold of 350m.")
        if dist_meters <= 50.0:
            distance_score = 1.0
        else:
            distance_score = max(0.0, 1.0 - (dist_meters / 350.0))
    else:
        # If coordinates unavailable, fallback to conservative text matching
        distance_score = 0.4

    # 2. Keyword similarity (Jaccard similarity on tokens)
    tokens1 = extract_normalized_tokens(new_title + " " + new_desc)
    tokens2 = extract_normalized_tokens(existing_title + " " + existing_desc)
    intersection = tokens1.intersection(tokens2)
    union = tokens1.union(tokens2)
    jaccard_score = (len(intersection) / len(union)) if union else 0.0

    # 3. Recency factor
    now_utc = datetime.now(timezone.utc)
    if existing_created_at.tzinfo is None:
        existing_time = existing_created_at.replace(tzinfo=timezone.utc)
    else:
        existing_time = existing_created_at
    days_apart = abs((now_utc - existing_time).days)
    if days_apart <= 14:
        time_score = 1.0
    elif days_apart <= 45:
        time_score = 0.7
    else:
        time_score = 0.3

    total_score = (0.55 * distance_score) + (0.35 * jaccard_score) + (0.10 * time_score)
    rationale = (
        f"Multi-factor score: {total_score:.2f} (Dist: {int(dist_meters)}m [{distance_score:.2f}], "
        f"Lexical overlap: {jaccard_score:.2f}, Recency: {time_score:.2f})"
    )
    return (total_score, rationale)

def process_complaint_deduplication(
    db: Session,
    new_complaint: Complaint
) -> Tuple[Optional[CommonProblem], DuplicateReviewStatus, float, str]:
    """
    Evaluates existing complaints and common problems in the same category.
    Returns: (matched_common_problem, duplicate_status, confidence, rationale)
    """
    # Find existing complaints in the same category within recent 60 days
    candidates = db.query(Complaint).filter(
        Complaint.category_id == new_complaint.category_id,
        Complaint.id != new_complaint.id,
        Complaint.status.notin_(["REJECTED"])
    ).order_by(Complaint.created_at.desc()).limit(30).all()

    best_match_complaint: Optional[Complaint] = None
    best_score = 0.0
    best_rationale = "No similar existing complaints detected."

    for candidate in candidates:
        score, rationale = compute_similarity_score(
            new_title=new_complaint.title,
            new_desc=new_complaint.description,
            new_lat=new_complaint.latitude,
            new_lon=new_complaint.longitude,
            existing_title=candidate.title,
            existing_desc=candidate.description,
            existing_lat=candidate.latitude,
            existing_lon=candidate.longitude,
            existing_created_at=candidate.created_at
        )
        if score > best_score:
            best_score = score
            best_match_complaint = candidate
            best_rationale = rationale

    # Evaluate against thresholds:
    # High confidence (>= 0.70): Automatic grouping
    # Medium confidence (0.40 <= score < 0.70): Flag for Administrator Duplicate Review
    # Low confidence (< 0.40): Create fresh Common Problem
    if best_score >= 0.70 and best_match_complaint:
        # Group into the matched complaint's common problem
        common_prob = best_match_complaint.common_problem
        if not common_prob:
            # Create a common problem for the existing one and link both
            common_prob = CommonProblem(
                title=best_match_complaint.title,
                description=f"Common civic issue aggregate: {best_match_complaint.title}",
                category_id=new_complaint.category_id,
                geographic_area_id=new_complaint.geographic_area_id,
                generalized_latitude=round(new_complaint.latitude, 3) if new_complaint.latitude else 0.0,
                generalized_longitude=round(new_complaint.longitude, 3) if new_complaint.longitude else 0.0,
                locality_name=new_complaint.locality_landmark,
                status=CommonProblemStatus.IDENTIFIED,
                report_count=2,
                first_reported_at=best_match_complaint.created_at,
                last_reported_at=datetime.now(timezone.utc)
            )
            db.add(common_prob)
            db.flush()
            best_match_complaint.common_problem_id = common_prob.id
        else:
            common_prob.report_count += 1
            common_prob.last_reported_at = datetime.now(timezone.utc)

        return (
            common_prob,
            DuplicateReviewStatus.AUTO_GROUPED,
            best_score,
            f"High confidence match ({best_score:.2f}) linked to Common Problem #{common_prob.id[:8]} while preserving separate complaint record."
        )

    elif best_score >= 0.40 and best_match_complaint:
        # Medium confidence: Queued for Administrator Duplicate Review
        target_cp = best_match_complaint.common_problem
        return (
            target_cp,
            DuplicateReviewStatus.NEEDS_REVIEW,
            best_score,
            f"Medium confidence similarity ({best_score:.2f}) with #{best_match_complaint.tracking_number}. Sent to Admin Duplicate Review Queue."
        )

    else:
        # Low confidence: Standalone issue, create distinct Common Problem
        new_cp = CommonProblem(
            title=new_complaint.title,
            description=f"Public problem report: {new_complaint.title}",
            category_id=new_complaint.category_id,
            geographic_area_id=new_complaint.geographic_area_id,
            generalized_latitude=round(new_complaint.latitude, 3) if new_complaint.latitude else 0.0,
            generalized_longitude=round(new_complaint.longitude, 3) if new_complaint.longitude else 0.0,
            locality_name=new_complaint.locality_landmark,
            status=CommonProblemStatus.IDENTIFIED,
            report_count=1,
            first_reported_at=datetime.now(timezone.utc),
            last_reported_at=datetime.now(timezone.utc)
        )
        db.add(new_cp)
        db.flush()
        return (
            new_cp,
            DuplicateReviewStatus.NONE,
            best_score,
            "Low similarity score; created distinct new common problem."
        )
