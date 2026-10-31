from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.orm import Session
from app.models.complaint import Complaint, StatusHistory
from app.models.user import User

def add_status_history_entry(
    db: Session,
    complaint: Complaint,
    new_status: str,
    action_title: str,
    action_note: Optional[str] = None,
    actor: Optional[User] = None,
    is_external_confirmed: bool = False,
    resolution_evidence_url: Optional[str] = None
) -> StatusHistory:
    """
    Records an immutable timeline event in the complaint's lifecycle.
    Differentiates between internal prototype simulations and verified external systems.
    """
    old_status = complaint.status.value if hasattr(complaint.status, "value") else str(complaint.status)
    
    actor_id = actor.id if actor else None
    actor_name = actor.full_name if actor else "Jan Seva Platform System"
    actor_role = actor.role.value if actor else "SYSTEM"

    history_entry = StatusHistory(
        complaint_id=complaint.id,
        actor_id=actor_id,
        actor_name=actor_name,
        actor_role=actor_role,
        old_status=old_status,
        new_status=new_status,
        action_title=action_title,
        action_note=action_note,
        is_external_confirmed=is_external_confirmed,
        resolution_evidence_url=resolution_evidence_url,
        created_at=datetime.now(timezone.utc)
    )
    db.add(history_entry)
    return history_entry
