from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class DepartmentOut(BaseModel):
    id: str
    code: str
    name_en: str
    name_hi: str
    description: Optional[str] = None
    is_active: bool

    class Config:
        from_attributes = True

class OfficeOut(BaseModel):
    id: str
    department_id: str
    department_name: Optional[str] = None
    geographic_area_id: Optional[str] = None
    geographic_area_name: Optional[str] = None
    name: str
    name_hi: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    address: Optional[str] = None
    is_active: bool

    class Config:
        from_attributes = True

class AuthorityMappingCreate(BaseModel):
    category_id: str
    geographic_area_id: str
    department_id: str
    office_id: str
    notes: Optional[str] = None

class AuthorityMappingOut(BaseModel):
    id: str
    category_id: str
    category_name: Optional[str] = None
    geographic_area_id: str
    geographic_area_name: Optional[str] = None
    department_id: str
    department_name: Optional[str] = None
    office_id: str
    office_name: Optional[str] = None
    is_active: bool
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
