from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from app.models.user import UserRole

# Standard robust email regex that doesn't trigger blocking DNS queries
EMAIL_REGEX = r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"

class UserBase(BaseModel):
    email: str = Field(..., pattern=EMAIL_REGEX, description="Valid email address")
    full_name: str = Field(..., min_length=2, max_length=100)
    phone_number: Optional[str] = Field(None, max_length=20)
    preferred_language: str = Field("en", max_length=10)

class UserCreate(UserBase):
    password: str = Field(..., min_length=6, max_length=100)
    # Security requirement: Citizens cannot self-assign privileged roles!
    # Role is strictly set to CITIZEN during public registration.

class UserLogin(BaseModel):
    email: str = Field(..., pattern=EMAIL_REGEX)
    password: str

class OfficerAssignmentOut(BaseModel):
    id: str
    department_id: str
    department_name: Optional[str] = None
    office_id: str
    office_name: Optional[str] = None
    designation: str

    class Config:
        from_attributes = True

class UserOut(UserBase):
    id: str
    role: UserRole
    is_active: bool
    created_at: datetime
    assignments: Optional[List[OfficerAssignmentOut]] = None

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

class TokenPayload(BaseModel):
    sub: Optional[str] = None
    role: Optional[str] = None
    exp: Optional[int] = None
