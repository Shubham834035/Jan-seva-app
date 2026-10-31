from fastapi.testclient import TestClient

def get_auth_token(client: TestClient, email: str) -> str:
    res = client.post("/api/v1/auth/login", json={"email": email, "password": "TestPass@123"})
    return res.json()["access_token"]

def test_deduplication_and_common_problem_grouping(client: TestClient):
    token1 = get_auth_token(client, "citizen1@test.in")
    token2 = get_auth_token(client, "citizen2@test.in")

    # 1. Citizen 1 reports a pothole on Main Road
    res1 = client.post(
        "/api/v1/complaints/",
        headers={"Authorization": f"Bearer {token1}"},
        data={
            "title": "Huge pothole outside bank on Main Road",
            "description": "Deep dangerous pothole right outside bank gate. Two-wheelers skidding.",
            "category_id": "cat-roads-uuid",
            "geographic_area_id": "ward-1-uuid",
            "locality_landmark": "Main Road near Bank",
            "latitude": 23.25010,
            "longitude": 77.41010
        }
    )
    assert res1.status_code == 201
    c1 = res1.json()
    cp1_id = c1["common_problem_id"]
    assert cp1_id is not None

    # 2. Citizen 2 reports the same issue 20 meters away with overlapping keywords
    res2 = client.post(
        "/api/v1/complaints/",
        headers={"Authorization": f"Bearer {token2}"},
        data={
            "title": "Dangerous pothole crater outside bank entrance",
            "description": "Large road pothole outside bank gate causing vehicle accidents.",
            "category_id": "cat-roads-uuid",
            "geographic_area_id": "ward-1-uuid",
            "locality_landmark": "Main Road in front of Bank",
            "latitude": 23.25015,
            "longitude": 77.41015
        }
    )
    assert res2.status_code == 201
    c2 = res2.json()

    # Core requirement: Both individual complaint records are fully preserved!
    assert c1["id"] != c2["id"]
    assert c1["tracking_number"] != c2["tracking_number"]

    # Both linked to the SAME Common Problem!
    assert c2["common_problem_id"] == cp1_id
    assert c2["duplicate_review_status"] == "AUTO_GROUPED"

    # Verify Common Problem aggregate report count is incremented by 1
    cp_res = client.get(f"/api/v1/common-problems/{cp1_id}")
    assert cp_res.status_code == 200
    cp_data = cp_res.json()
    assert cp_data["report_count"] >= 2
    assert any(r["tracking_number"] == c1["tracking_number"] for r in cp_data["linked_reports"])
    assert any(r["tracking_number"] == c2["tracking_number"] for r in cp_data["linked_reports"])

def test_distinct_issue_in_same_ward_remains_separate(client: TestClient):
    token1 = get_auth_token(client, "citizen1@test.in")

    # Sanitation issue in Ward 1 (different category)
    res_waste = client.post(
        "/api/v1/complaints/",
        headers={"Authorization": f"Bearer {token1}"},
        data={
            "title": "Garbage heap piling up on corner",
            "description": "Uncollected trash bins overflowing on street corner.",
            "category_id": "cat-waste-uuid",
            "geographic_area_id": "ward-1-uuid",
            "locality_landmark": "Corner street bin",
            "latitude": 23.25012,
            "longitude": 77.41012
        }
    )
    assert res_waste.status_code == 201
    c_waste = res_waste.json()

    # Must NOT be grouped with the road pothole
    assert c_waste["duplicate_review_status"] == "NONE"

def test_uncertain_routing_and_admin_reassignment(client: TestClient):
    token1 = get_auth_token(client, "citizen1@test.in")
    token_admin = get_auth_token(client, "admin@test.org")

    # Submit complaint with NO geographic area mapping
    res = client.post(
        "/api/v1/complaints/",
        headers={"Authorization": f"Bearer {token1}"},
        data={
            "title": "Damaged guardrail on unmapped highway stretch",
            "description": "Guardrail broken on highway kilometer 42 outside municipality.",
            "category_id": "cat-roads-uuid",
            "locality_landmark": "Highway KM 42",
            "latitude": 23.3500,
            "longitude": 77.5500
        }
    )
    assert res.status_code == 201
    c = res.json()
    assert c["routing_status"] == "UNCERTAIN"
    assert c["assigned_office_id"] is None

    # Appears in Admin Uncertain Routing Queue
    queue_res = client.get("/api/v1/admin/uncertain-routing", headers={"Authorization": f"Bearer {token_admin}"})
    assert queue_res.status_code == 200
    queue_items = queue_res.json()
    assert any(item["id"] == c["id"] for item in queue_items)

    # Administrator reassigns it
    reassign_res = client.post(
        f"/api/v1/admin/complaints/{c['id']}/reassign",
        headers={"Authorization": f"Bearer {token_admin}"},
        json={
            "department_id": "dept-pwd-uuid",
            "office_id": "office-2-uuid",
            "reassignment_reason": "Jurisdiction assigned to PWD North Office after boundary survey."
        }
    )
    assert reassign_res.status_code == 200
    reassigned = reassign_res.json()
    assert reassigned["assigned_office_id"] == "office-2-uuid"
    assert reassigned["status"] == "ASSIGNED_PROTOTYPE"

def test_admin_reference_data_and_mappings(client, db):
    from app.core.security import create_access_token
    token = create_access_token(subject="admin-1-uuid", role="PLATFORM_ADMIN")
    headers = {"Authorization": f"Bearer {token}"}

    # Test departments listing
    depts_res = client.get("/api/v1/admin/departments", headers=headers)
    assert depts_res.status_code == 200
    depts = depts_res.json()
    assert len(depts) >= 1

    # Test offices listing
    offices_res = client.get("/api/v1/admin/offices", headers=headers)
    assert offices_res.status_code == 200
    offices = offices_res.json()
    assert len(offices) >= 1

    # Test mappings listing
    mappings_res = client.get("/api/v1/admin/mappings", headers=headers)
    assert mappings_res.status_code == 200
    mappings = mappings_res.json()
    assert isinstance(mappings, list)

    # Test audit logs
    logs_res = client.get("/api/v1/admin/audit-logs", headers=headers)
    assert logs_res.status_code == 200
    logs = logs_res.json()
    assert len(logs) >= 1
