from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.orm import Session
from app.models.notification import Notification

def send_in_app_notification(
    db: Session,
    user_id: str,
    title: str,
    message: str,
    title_hi: Optional[str] = None,
    message_hi: Optional[str] = None,
    complaint_id: Optional[str] = None
) -> Notification:
    """Dispatches an in-app notification to a user with bilingual title and message."""
    notification = Notification(
        user_id=user_id,
        complaint_id=complaint_id,
        title=title,
        title_hi=title_hi or title,
        message=message,
        message_hi=message_hi or message,
        is_read=False,
        created_at=datetime.now(timezone.utc)
    )
    db.add(notification)
    return notification
