from typing import Optional
from pydantic import BaseModel
from app.models.category import PriorityLevel

class ProblemCategoryBase(BaseModel):
    code: str
    name_en: str
    name_hi: str
    description: Optional[str] = None
    icon: str = "alert-circle"
    default_priority: PriorityLevel = PriorityLevel.MEDIUM
    is_active: bool = True

class ProblemCategoryOut(ProblemCategoryBase):
    id: str

    class Config:
        from_attributes = True
