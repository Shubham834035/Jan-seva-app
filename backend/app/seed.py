import sys
import os
from datetime import datetime, timezone, timedelta

# Ensure backend root is on path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal, Base, engine
from app.core.security import get_password_hash
from app.models.user import User, UserRole, OfficerAssignment
from app.models.category import ProblemCategory, PriorityLevel
from app.models.geographic_area import GeographicArea, AreaType
from app.models.authority import Department, Office, AuthorityMapping
from app.models.common_problem import CommonProblem, CommonProblemStatus
from app.models.complaint import (
    Complaint,
    ComplaintStatus,
    RoutingStatus,
    DuplicateReviewStatus,
    StatusHistory,
)
from app.models.notification import Notification

def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Check if already seeded
    if db.query(User).filter(User.email == "admin@janseva.org").first():
        print("Database already contains seed data. Skipping re-seed.")
        db.close()
        return

    print("--- SEEDING JAN SEVA DEMO DATA ---")

    # 1. Categories
    cat_roads = ProblemCategory(
        code="ROADS_POTHOLES",
        name_en="Damaged Roads & Potholes",
        name_hi="सड़क एवं गड्ढे",
        description="Potholes, broken asphalt, dangerous road craters, or cave-ins.",
        icon="alert-triangle",
        default_priority=PriorityLevel.HIGH
    )
    cat_light = ProblemCategory(
        code="STREETLIGHTS",
        name_en="Broken Streetlights & Electrical",
        name_hi="स्ट्रीट लाइट एवं बिजली",
        description="Dark streets, malfunctioning lamps, exposed wires or poles.",
        icon="zap",
        default_priority=PriorityLevel.MEDIUM
    )
    cat_water = ProblemCategory(
        code="WATER_SUPPLY",
        name_en="Water Supply & Pipe Leakage",
        name_hi="जल आपूर्ति एवं रिसाव",
        description="Contaminated drinking water, pipeline bursts, or low pressure.",
        icon="droplet",
        default_priority=PriorityLevel.HIGH
    )
    cat_drain = ProblemCategory(
        code="DRAINAGE_SEWAGE",
        name_en="Drainage & Sewage Overflow",
        name_hi="नाली एवं सीवेज ओवरफ्लो",
        description="Choked storm drains, open manholes, or street waterlogging.",
        icon="waves",
        default_priority=PriorityLevel.HIGH
    )
    cat_waste = ProblemCategory(
        code="GARBAGE_WASTE",
        name_en="Garbage & Solid Waste",
        name_hi="कचरा संग्रहण एवं सफाई",
        description="Uncollected municipal garbage, open dumping, or litter bins.",
        icon="trash-2",
        default_priority=PriorityLevel.MEDIUM
    )
    cat_infra = ProblemCategory(
        code="PUBLIC_INFRA",
        name_en="Public Infrastructure & Parks",
        name_hi="सार्वजनिक बुनियादी ढांचा",
        description="Damaged bus stops, broken public benches, footpaths, or park facilities.",
        icon="building",
        default_priority=PriorityLevel.LOW
    )

    db.add_all([cat_roads, cat_light, cat_water, cat_drain, cat_waste, cat_infra])
    db.flush()

    # 2. Geographic Hierarchy
    state = GeographicArea(
        name="Madhya Pradesh",
        name_hi="मध्य प्रदेश",
        area_type=AreaType.STATE,
        center_latitude=23.2599,
        center_longitude=77.4126,
        radius_meters=500000
    )
    db.add(state)
    db.flush()

    district = GeographicArea(
        name="Devgarh District",
        name_hi="देवगढ़ जिला",
        area_type=AreaType.DISTRICT,
        parent_id=state.id,
        center_latitude=23.2550,
        center_longitude=77.4100,
        radius_meters=40000
    )
    db.add(district)
    db.flush()

    municipality = GeographicArea(
        name="Mayanagari Municipal Corporation",
        name_hi="मायानगरी नगर निगम",
        area_type=AreaType.MUNICIPALITY,
        parent_id=district.id,
        center_latitude=23.2500,
        center_longitude=77.4100,
        radius_meters=15000
    )
    db.add(municipality)
    db.flush()

    ward4 = GeographicArea(
        name="Ward 4 - Gandhi Nagar",
        name_hi="वार्ड 4 - गांधी नगर",
        area_type=AreaType.WARD_ZONE,
        parent_id=municipality.id,
        pincode="462001",
        center_latitude=23.2520,
        center_longitude=77.4120,
        radius_meters=2000
    )
    ward12 = GeographicArea(
        name="Ward 12 - Shivaji Chowk",
        name_hi="वार्ड 12 - शिवाजी चौक",
        area_type=AreaType.WARD_ZONE,
        parent_id=municipality.id,
        pincode="462002",
        center_latitude=23.2610,
        center_longitude=77.4190,
        radius_meters=2000
    )
    db.add_all([ward4, ward12])
    db.flush()

    # 3. Departments & Offices
    dept_pwd = Department(
        code="PWD_CIVIC",
        name_en="Public Works Department (PWD)",
        name_hi="लोक निर्माण विभाग",
        description="Responsible for arterial roads, bridges, and major public infrastructure."
    )
    dept_waste = Department(
        code="SOLID_WASTE",
        name_en="Municipal Solid Waste & Sanitation",
        name_hi="ठोस अपशिष्ट एवं स्वच्छता विभाग",
        description="Responsible for daily street sweeping, garbage clearance, and dustbins."
    )
    dept_water = Department(
        code="WATER_WORKS",
        name_en="Jal Nigam & Sewerage Board",
        name_hi="जल निगम एवं सीवरेज बोर्ड",
        description="Drinking water delivery, pipeline maintenance, and sewage control."
    )
    db.add_all([dept_pwd, dept_waste, dept_water])
    db.flush()

    office_pwd = Office(
        department_id=dept_pwd.id,
        geographic_area_id=municipality.id,
        name="PWD Central Division Office (Mayanagari)",
        name_hi="लोक निर्माण केंद्रीय संभाग कार्यालय",
        contact_email="pwd.mayanagari@demo.gov.in",
        contact_phone="+91-755-2550100",
        address="PWD Complex, Civil Lines, Mayanagari"
    )
    office_waste = Office(
        department_id=dept_waste.id,
        geographic_area_id=ward4.id,
        name="Sanitation Zonal Office - Zone 2 (Ward 4)",
        name_hi="स्वच्छता जोनल कार्यालय 2",
        contact_email="sanitation.z2@demo.gov.in",
        contact_phone="+91-755-2550200",
        address="Near Subzi Mandi, Gandhi Nagar, Mayanagari"
    )
    office_water = Office(
        department_id=dept_water.id,
        geographic_area_id=municipality.id,
        name="Mayanagari Water Works Office",
        name_hi="मायानगरी जल प्रदाय कार्यालय",
        contact_email="water.works@demo.gov.in",
        contact_phone="+91-755-2550300",
        address="Water Tank Road, Devgarh Hill, Mayanagari"
    )
    db.add_all([office_pwd, office_waste, office_water])
    db.flush()

    # 4. Authority Mappings (Configurable Rules)
    mapping_pwd_ward4 = AuthorityMapping(
        category_id=cat_roads.id,
        geographic_area_id=ward4.id,
        department_id=dept_pwd.id,
        office_id=office_pwd.id,
        notes="Configured rule: Roads in Ward 4 routed to PWD Central Division."
    )
    mapping_waste_ward4 = AuthorityMapping(
        category_id=cat_waste.id,
        geographic_area_id=ward4.id,
        department_id=dept_waste.id,
        office_id=office_waste.id,
        notes="Configured rule: Ward 4 garbage collection assigned to Sanitation Zone 2."
    )
    mapping_water_ward4 = AuthorityMapping(
        category_id=cat_water.id,
        geographic_area_id=ward4.id,
        department_id=dept_water.id,
        office_id=office_water.id,
        notes="Configured rule: Water supply grievances routed to Water Works."
    )
    # Parent-level fallback mapping for Ward 12 or others
    mapping_pwd_city = AuthorityMapping(
        category_id=cat_roads.id,
        geographic_area_id=municipality.id,
        department_id=dept_pwd.id,
        office_id=office_pwd.id,
        notes="Municipal fallback rule: City-wide roads routed to PWD Central."
    )
    db.add_all([mapping_pwd_ward4, mapping_waste_ward4, mapping_water_ward4, mapping_pwd_city])
    db.flush()

    # 5. Users
    pwd_hash_citizen = get_password_hash("Citizen@123")
    pwd_hash_officer = get_password_hash("Officer@123")
    pwd_hash_admin = get_password_hash("Admin@123")

    user_citizen = User(
        email="citizen@example.in",
        hashed_password=pwd_hash_citizen,
        full_name="Rajesh Kumar",
        phone_number="9876543210",
        role=UserRole.CITIZEN,
        preferred_language="en",
        is_active=True
    )
    user_citizen2 = User(
        email="citizen2@example.in",
        hashed_password=pwd_hash_citizen,
        full_name="Sunita Sharma",
        phone_number="9876543211",
        role=UserRole.CITIZEN,
        preferred_language="hi",
        is_active=True
    )
    user_officer_pwd = User(
        email="pwd_officer@demo.gov.in",
        hashed_password=pwd_hash_officer,
        full_name="Er. Amit Verma",
        phone_number="9876500001",
        role=UserRole.AUTHORITY_OFFICER,
        preferred_language="en",
        is_active=True
    )
    user_officer_waste = User(
        email="waste_officer@demo.gov.in",
        hashed_password=pwd_hash_officer,
        full_name="Dr. Neha Patel",
        phone_number="9876500002",
        role=UserRole.AUTHORITY_OFFICER,
        preferred_language="en",
        is_active=True
    )
    user_admin = User(
        email="admin@janseva.org",
        hashed_password=pwd_hash_admin,
        full_name="Mayank Srivastava",
        phone_number="9876599999",
        role=UserRole.PLATFORM_ADMIN,
        preferred_language="en",
        is_active=True
    )

    db.add_all([user_citizen, user_citizen2, user_officer_pwd, user_officer_waste, user_admin])
    db.flush()

    # Officer Jurisdictional Assignments
    assign_pwd = OfficerAssignment(
        officer_id=user_officer_pwd.id,
        department_id=dept_pwd.id,
        office_id=office_pwd.id,
        designation="Executive Engineer (Roads & Infrastructure)"
    )
    assign_waste = OfficerAssignment(
        officer_id=user_officer_waste.id,
        department_id=dept_waste.id,
        office_id=office_waste.id,
        designation="Zonal Health & Sanitation Officer"
    )
    db.add_all([assign_pwd, assign_waste])
    db.flush()

    # 6. Seed Common Problem (demonstrating deduplication without data loss)
    now_utc = datetime.now(timezone.utc)
    cp_pothole = CommonProblem(
        title="Dangerous Road Craters & Potholes on MG Road near Central Market",
        description="Multiple citizens have reported severe asphalt erosion and deep potholes causing vehicular damage and traffic delays on MG Road.",
        category_id=cat_roads.id,
        geographic_area_id=ward4.id,
        generalized_latitude=23.252,
        generalized_longitude=77.412,
        locality_name="MG Road, near Central Market Gate 2, Gandhi Nagar",
        status=CommonProblemStatus.IN_PROGRESS,
        report_count=2,
        first_reported_at=now_utc - timedelta(days=3),
        last_reported_at=now_utc - timedelta(hours=4)
    )
    db.add(cp_pothole)
    db.flush()

    # Individual Complaint 1 (Rajesh Kumar)
    complaint1 = Complaint(
        tracking_number="JS-2026-00001",
        citizen_id=user_citizen.id,
        category_id=cat_roads.id,
        geographic_area_id=ward4.id,
        title="Deep potholes in front of Central Market Main Gate",
        description="Two large potholes measuring over 1.5 feet wide are open on the main carriage way. Water fills up in rain and causes scooters to skid.",
        state="Madhya Pradesh",
        district="Devgarh",
        city="Mayanagari",
        locality_landmark="Opposite Central Market Gate 2, MG Road",
        latitude=23.2521,
        longitude=77.4122,
        status=ComplaintStatus.IN_PROGRESS,
        priority=PriorityLevel.HIGH,
        assigned_department_id=dept_pwd.id,
        assigned_office_id=office_pwd.id,
        assigned_officer_id=user_officer_pwd.id,
        routing_status=RoutingStatus.AUTO_ROUTED,
        routing_notes="Auto-routed via Ward 4 PWD jurisdiction mapping rules. (Prototype Simulation)",
        common_problem_id=cp_pothole.id,
        duplicate_review_status=DuplicateReviewStatus.AUTO_GROUPED,
        duplicate_confidence=0.88,
        duplicate_notes="Linked to MG Road Common Problem #1. Individual citizen report preserved.",
        created_at=now_utc - timedelta(days=3),
        updated_at=now_utc - timedelta(days=1)
    )

    # Individual Complaint 2 (Sunita Sharma) - reported same pothole 2 days later
    complaint2 = Complaint(
        tracking_number="JS-2026-00002",
        citizen_id=user_citizen2.id,
        category_id=cat_roads.id,
        geographic_area_id=ward4.id,
        title="Severe crater on MG Road near market causing bike accidents",
        description="Dangerous pothole cluster right outside the market entrance. Saw two bikes fall today. Needs urgent road asphalt repair.",
        state="Madhya Pradesh",
        district="Devgarh",
        city="Mayanagari",
        locality_landmark="MG Road Central Market approach",
        latitude=23.2523,
        longitude=77.4124,
        status=ComplaintStatus.IN_PROGRESS,
        priority=PriorityLevel.HIGH,
        assigned_department_id=dept_pwd.id,
        assigned_office_id=office_pwd.id,
        assigned_officer_id=user_officer_pwd.id,
        routing_status=RoutingStatus.AUTO_ROUTED,
        routing_notes="Auto-routed via Ward 4 PWD jurisdiction mapping rules. (Prototype Simulation)",
        common_problem_id=cp_pothole.id,
        duplicate_review_status=DuplicateReviewStatus.AUTO_GROUPED,
        duplicate_confidence=0.91,
        duplicate_notes="Smart duplicate detection identified high-confidence proximity (25m) and lexical overlap. Preserved distinct tracking record.",
        created_at=now_utc - timedelta(hours=4),
        updated_at=now_utc - timedelta(hours=2)
    )

    # Individual Complaint 3 (Sanitation Issue in same ward - remains separate!)
    complaint3 = Complaint(
        tracking_number="JS-2026-00003",
        citizen_id=user_citizen.id,
        category_id=cat_waste.id,
        geographic_area_id=ward4.id,
        title="Uncollected garbage accumulating near Gandhi Nagar Bus Stand",
        description="The municipal collection vehicle has not visited for 4 days. Waste is overflowing onto the pedestrian footpath creating foul smell.",
        state="Madhya Pradesh",
        district="Devgarh",
        city="Mayanagari",
        locality_landmark="Gandhi Nagar Bus Stand Stop No. 3",
        latitude=23.2545,
        longitude=77.4150,
        status=ComplaintStatus.ASSIGNED_PROTOTYPE,
        priority=PriorityLevel.MEDIUM,
        assigned_department_id=dept_waste.id,
        assigned_office_id=office_waste.id,
        assigned_officer_id=user_officer_waste.id,
        routing_status=RoutingStatus.AUTO_ROUTED,
        routing_notes="Auto-assigned to Sanitation Zonal Office 2 via Ward 4 waste mapping rules.",
        duplicate_review_status=DuplicateReviewStatus.NONE,
        created_at=now_utc - timedelta(days=1),
        updated_at=now_utc - timedelta(days=1)
    )

    # Individual Complaint 4 (Uncertain Routing Demo - no ward specified / ambiguous)
    complaint4 = Complaint(
        tracking_number="JS-2026-00004",
        citizen_id=user_citizen.id,
        category_id=cat_infra.id,
        geographic_area_id=None,
        title="Damaged boundary railing on new express bypass highway",
        description="Railing broken by an overturned truck on the newly opened bypass road corridor outside the municipal ring road boundary.",
        state="Madhya Pradesh",
        district="Devgarh",
        city="Mayanagari",
        locality_landmark="Outer Bypass Km 14, Near Toll plaza",
        latitude=23.2800,
        longitude=77.4400,
        status=ComplaintStatus.RECEIVED_BY_PLATFORM,
        priority=PriorityLevel.LOW,
        routing_status=RoutingStatus.UNCERTAIN,
        routing_notes="No geographic ward or jurisdiction mapping found for outer bypass. Placed in Administrator Routing Queue.",
        duplicate_review_status=DuplicateReviewStatus.NONE,
        created_at=now_utc - timedelta(hours=10),
        updated_at=now_utc - timedelta(hours=10)
    )

    # Individual Complaint 5 (Potential Duplicate requiring Administrator Review)
    complaint5 = Complaint(
        tracking_number="JS-2026-00005",
        citizen_id=user_citizen2.id,
        category_id=cat_roads.id,
        geographic_area_id=ward4.id,
        title="Road surface uneven and damaged near Central Library Lane",
        description="Asphalt is loose and rough on library lane about 250 meters away from market.",
        state="Madhya Pradesh",
        district="Devgarh",
        city="Mayanagari",
        locality_landmark="Central Library Lane, Ward 4",
        latitude=23.2538,
        longitude=77.4135,
        status=ComplaintStatus.ASSIGNED_PROTOTYPE,
        priority=PriorityLevel.MEDIUM,
        assigned_department_id=dept_pwd.id,
        assigned_office_id=office_pwd.id,
        routing_status=RoutingStatus.AUTO_ROUTED,
        routing_notes="Auto-routed via Ward 4 PWD mapping.",
        duplicate_review_status=DuplicateReviewStatus.NEEDS_REVIEW,
        duplicate_confidence=0.58,
        duplicate_notes="Medium confidence similarity (0.58) with MG Road Common Problem. Flagged for Administrator Duplicate Review.",
        created_at=now_utc - timedelta(hours=5),
        updated_at=now_utc - timedelta(hours=5)
    )

    db.add_all([complaint1, complaint2, complaint3, complaint4, complaint5])
    db.flush()

    # Timeline Histories for Complaint 1
    h1 = StatusHistory(
        complaint_id=complaint1.id,
        actor_id=user_citizen.id,
        actor_name=user_citizen.full_name,
        actor_role="CITIZEN",
        old_status=None,
        new_status=ComplaintStatus.SUBMITTED.value,
        action_title="Complaint Submitted by Citizen",
        action_note="Citizen reported deep potholes with geographic location and photos.",
        is_external_confirmed=False,
        created_at=now_utc - timedelta(days=3)
    )
    h2 = StatusHistory(
        complaint_id=complaint1.id,
        actor_id=None,
        actor_name="Jan Seva Smart Routing Engine",
        actor_role="SYSTEM",
        old_status=ComplaintStatus.SUBMITTED.value,
        new_status=ComplaintStatus.ASSIGNED_PROTOTYPE.value,
        action_title="Assigned to PWD Central Division (Prototype)",
        action_note="Assigned to PWD Mayanagari based on Ward 4 jurisdictional mapping rules. (Prototype Simulation)",
        is_external_confirmed=False,
        created_at=now_utc - timedelta(days=3, hours=-1)
    )
    h3 = StatusHistory(
        complaint_id=complaint1.id,
        actor_id=user_officer_pwd.id,
        actor_name=user_officer_pwd.full_name,
        actor_role="AUTHORITY_OFFICER",
        old_status=ComplaintStatus.ASSIGNED_PROTOTYPE.value,
        new_status=ComplaintStatus.IN_PROGRESS.value,
        action_title="Road Inspection and Patchwork Scheduled",
        action_note="Site inspected by junior engineer. Bitumen patchwork gang deployed for road repair tomorrow morning. (Prototype Simulation)",
        is_external_confirmed=False,
        created_at=now_utc - timedelta(days=1)
    )
    db.add_all([h1, h2, h3])

    # In-app notifications
    n1 = Notification(
        user_id=user_citizen.id,
        complaint_id=complaint1.id,
        title="Complaint Status: In Progress",
        title_hi="शिकायत स्थिति: कार्य प्रगति पर है",
        message="Er. Amit Verma from PWD has commenced work on your road grievance #JS-2026-00001.",
        message_hi="लोक निर्माण विभाग के अभियंता अमित वर्मा ने आपकी शिकायत #JS-2026-00001 पर कार्य प्रारंभ कर दिया है।",
        is_read=False,
        created_at=now_utc - timedelta(days=1)
    )
    db.add(n1)

    db.commit()
    print("DEMO SEED DATA SUCCESSFULLY POPULATED!")
    print(f"Citizen Test Account: {user_citizen.email} (Password: Citizen@123)")
    print(f"Citizen 2 Test Account: {user_citizen2.email} (Password: Citizen@123)")
    print(f"PWD Officer Test Account: {user_officer_pwd.email} (Password: Officer@123)")
    print(f"Sanitation Officer Test Account: {user_officer_waste.email} (Password: Officer@123)")
    print(f"Platform Admin Test Account: {user_admin.email} (Password: Admin@123)")
    db.close()

if __name__ == "__main__":
    seed()
