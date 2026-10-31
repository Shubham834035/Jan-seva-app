from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.category import ProblemCategory
from app.schemas.category import ProblemCategoryOut

router = APIRouter(prefix="/categories", tags=["Categories"])

@router.get("/", response_model=List[ProblemCategoryOut])
def list_categories(db: Session = Depends(get_db)):
    """Returns all active problem categories for complaint reporting."""
    return db.query(ProblemCategory).filter(ProblemCategory.is_active == True).all()
