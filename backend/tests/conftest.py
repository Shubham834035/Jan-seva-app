import os
import sys
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Set test environment
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import Base, get_db
from app.core.security import get_password_hash
from app.models.user import User, UserRole, OfficerAssignment
from app.models.category import ProblemCategory, PriorityLevel
from app.models.geographic_area import GeographicArea, AreaType
from app.models.authority import Department, Office, AuthorityMapping
from app.models.complaint import Complaint, ComplaintStatus, RoutingStatus, DuplicateReviewStatus
from app.models.common_problem import CommonProblem, CommonProblemStatus
from app.main import app

TEST_DATABASE_URL = "sqlite:///./test_jan_seva.db"
test_engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

def seed_test_database():
    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)
    
    db = TestingSessionLocal()
    
    # 1. Users
    pwd_hash = get_password_hash("TestPass@123")
    citizen1 = User(
        id="citizen-1-uuid",
        email="citizen1@test.in",
        hashed_password=pwd_hash,
        full_name="Test Citizen 1",
        role=UserRole.CITIZEN,
        is_active=True
    )
    citizen2 = User(
        id="citizen-2-uuid",
        email="citizen2@test.in",
        hashed_password=pwd_hash,
        full_name="Test Citizen 2",
        role=UserRole.CITIZEN,
        is_active=True
    )
    officer1 = User(
        id="officer-1-uuid",
        email="officer1@test.gov.in",
        hashed_password=pwd_hash,
        full_name="Officer One",
        role=UserRole.AUTHORITY_OFFICER,
        is_active=True
    )
    officer2 = User(
        id="officer-2-uuid",
        email="officer2@test.gov.in",
        hashed_password=pwd_hash,
        full_name="Officer Two (Different Office)",
        role=UserRole.AUTHORITY_OFFICER,
        is_active=True
    )
    admin = User(
        id="admin-1-uuid",
        email="admin@test.org",
        hashed_password=pwd_hash,
        full_name="Admin User",
        role=UserRole.PLATFORM_ADMIN,
        is_active=True
    )
    db.add_all([citizen1, citizen2, officer1, officer2, admin])

    # 2. Categories
    cat_roads = ProblemCategory(
        id="cat-roads-uuid",
        code="ROADS",
        name_en="Roads & Potholes",
        name_hi="सड़क एवं गड्ढे",
        default_priority=PriorityLevel.HIGH
    )
    cat_waste = ProblemCategory(
        id="cat-waste-uuid",
        code="WASTE",
        name_en="Garbage & Waste",
        name_hi="कचरा संग्रहण",
        default_priority=PriorityLevel.MEDIUM
    )
    db.add_all([cat_roads, cat_waste])

    # 3. Areas
    ward = GeographicArea(
        id="ward-1-uuid",
        name="Ward 1",
        area_type=AreaType.WARD_ZONE,
        center_latitude=23.2500,
        center_longitude=77.4100
    )
    db.add(ward)

    # 4. Department & Offices
    dept = Department(
        id="dept-pwd-uuid",
        code="PWD",
        name_en="PWD Department",
        name_hi="लोक निर्माण विभाग"
    )
    db.add(dept)
    
    office1 = Office(
        id="office-1-uuid",
        department_id="dept-pwd-uuid",
        name="PWD Central Office"
    )
    office2 = Office(
        id="office-2-uuid",
        department_id="dept-pwd-uuid",
        name="PWD North Office"
    )
    db.add_all([office1, office2])

    # Officer 1 assigned to Office 1; Officer 2 assigned to Office 2
    assign1 = OfficerAssignment(
        officer_id="officer-1-uuid",
        department_id="dept-pwd-uuid",
        office_id="office-1-uuid",
        designation="Junior Engineer"
    )
    assign2 = OfficerAssignment(
        officer_id="officer-2-uuid",
        department_id="dept-pwd-uuid",
        office_id="office-2-uuid",
        designation="Senior Engineer"
    )
    db.add_all([assign1, assign2])

    # 5. Authority Mapping (Ward 1 + Roads -> Office 1)
    mapping = AuthorityMapping(
        id="map-1-uuid",
        category_id="cat-roads-uuid",
        geographic_area_id="ward-1-uuid",
        department_id="dept-pwd-uuid",
        office_id="office-1-uuid",
        is_active=True
    )
    db.add(mapping)

    db.commit()
    db.close()

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    seed_test_database()
    yield
    Base.metadata.drop_all(bind=test_engine)
    if os.path.exists("./test_jan_seva.db"):
        try:
            os.remove("./test_jan_seva.db")
        except Exception:
            pass

@pytest.fixture
def db():
    session = TestingSessionLocal()
    yield session
    session.close()

@pytest.fixture
def client(db):
    def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
