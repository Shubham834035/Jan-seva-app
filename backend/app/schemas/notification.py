from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class NotificationOut(BaseModel):
    id: str
    complaint_id: Optional[str] = None
    title: str
    title_hi: Optional[str] = None
    message: str
    message_hi: Optional[str] = None
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True
