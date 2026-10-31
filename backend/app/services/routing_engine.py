import math
from typing import Optional, Tuple
from sqlalchemy.orm import Session
from app.models.complaint import Complaint, ComplaintStatus, RoutingStatus
from app.models.authority import AuthorityMapping, Department, Office
from app.models.geographic_area import GeographicArea

def evaluate_authority_routing(
    db: Session,
    category_id: str,
    geographic_area_id: Optional[str] = None,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None
) -> Tuple[RoutingStatus, Optional[str], Optional[str], str]:
    """
    Evaluates configurable authority mappings for a complaint.
    Returns: (RoutingStatus, department_id, office_id, routing_rationale)
    """
    if not geographic_area_id:
        return (
            RoutingStatus.UNCERTAIN,
            None,
            None,
            "No geographic ward or area specified; placed in administrative routing queue."
        )

    # 1. Check exact category and area mapping
    mapping = db.query(AuthorityMapping).filter(
        AuthorityMapping.category_id == category_id,
        AuthorityMapping.geographic_area_id == geographic_area_id,
        AuthorityMapping.is_active == True
    ).first()

    if mapping:
        dept = db.query(Department).filter(Department.id == mapping.department_id).first()
        office = db.query(Office).filter(Office.id == mapping.office_id).first()
        dept_name = dept.name_en if dept else "Configured Department"
        office_name = office.name if office else "Configured Office"
        rationale = (
            f"Auto-routed in prototype based on active jurisdictional mapping for area to "
            f"{dept_name} ({office_name}). (Prototype Simulation)"
        )
        return (RoutingStatus.AUTO_ROUTED, mapping.department_id, mapping.office_id, rationale)

    # 2. Check parent area (e.g., Municipality level if ward mapping is unconfigured)
    area = db.query(GeographicArea).filter(GeographicArea.id == geographic_area_id).first()
    if area and area.parent_id:
        parent_mapping = db.query(AuthorityMapping).filter(
            AuthorityMapping.category_id == category_id,
            AuthorityMapping.geographic_area_id == area.parent_id,
            AuthorityMapping.is_active == True
        ).first()

        if parent_mapping:
            dept = db.query(Department).filter(Department.id == parent_mapping.department_id).first()
            office = db.query(Office).filter(Office.id == parent_mapping.office_id).first()
            dept_name = dept.name_en if dept else "Configured Department"
            office_name = office.name if office else "Configured Office"
            rationale = (
                f"Auto-routed via parent municipal jurisdiction mapping to {dept_name} ({office_name}). "
                f"(Prototype Simulation)"
            )
            return (RoutingStatus.AUTO_ROUTED, parent_mapping.department_id, parent_mapping.office_id, rationale)

    # 3. No clear active mapping exists -> Uncertain Routing
    return (
        RoutingStatus.UNCERTAIN,
        None,
        None,
        "No matching authority mapping found for this category and area. Sent to Administrator Routing Queue."
    )
