from fastapi.testclient import TestClient

def get_auth_token(client: TestClient, email: str) -> str:
    res = client.post("/api/v1/auth/login", json={"email": email, "password": "TestPass@123"})
    return res.json()["access_token"]

def test_officer_assigned_records_and_boundary_isolation(client: TestClient):
    token_citizen = get_auth_token(client, "citizen1@test.in")

    # Complaint assigned to Office 1 (Ward 1)
    res = client.post(
        "/api/v1/complaints/",
        headers={"Authorization": f"Bearer {token_citizen}"},
        data={
            "title": "Severe road cavity near post office",
            "description": "Cavity causing traffic jams in front of post office.",
            "category_id": "cat-roads-uuid",
            "geographic_area_id": "ward-1-uuid",
            "locality_landmark": "Post Office Lane",
            "latitude": 23.2508,
            "longitude": 77.4108
        }
    )
    complaint_id = res.json()["id"]

    # Officer 1 (assigned to Office 1) can view the complaint
    token_officer1 = get_auth_token(client, "officer1@test.gov.in")
    view_res = client.get(f"/api/v1/complaints/{complaint_id}", headers={"Authorization": f"Bearer {token_officer1}"})
    assert view_res.status_code == 200

    # Officer 2 (assigned to Office 2) is forbidden from viewing this complaint!
    token_officer2 = get_auth_token(client, "officer2@test.gov.in")
    view_res2 = client.get(f"/api/v1/complaints/{complaint_id}", headers={"Authorization": f"Bearer {token_officer2}"})
    assert view_res2.status_code == 403
    assert "outside your authorized office jurisdiction" in view_res2.json()["detail"].lower()

def test_officer_status_update_and_timeline(client: TestClient):
    token_citizen = get_auth_token(client, "citizen1@test.in")
    token_officer1 = get_auth_token(client, "officer1@test.gov.in")

    res = client.post(
        "/api/v1/complaints/",
        headers={"Authorization": f"Bearer {token_citizen}"},
        data={
            "title": "Road depression near water tank",
            "description": "Road surface depressed after water pipe works.",
            "category_id": "cat-roads-uuid",
            "geographic_area_id": "ward-1-uuid",
            "locality_landmark": "Water Tank Road",
            "latitude": 23.2509,
            "longitude": 77.4109
        }
    )
    complaint_id = res.json()["id"]

    # Officer 1 updates status to IN_PROGRESS
    update_res = client.post(
        f"/api/v1/officer/{complaint_id}/status",
        headers={"Authorization": f"Bearer {token_officer1}"},
        data={
            "new_status": "IN_PROGRESS",
            "action_note": "Inspection completed. Patching crew assigned for tomorrow."
        }
    )
    assert update_res.status_code == 200
    updated_data = update_res.json()
    assert updated_data["status"] == "IN_PROGRESS"

    # Timeline event was created and tagged honestly
    timeline = updated_data["timeline"]
    latest_event = timeline[-1]
    assert latest_event["new_status"] == "IN_PROGRESS"
    assert "Officer One" in latest_event["actor_name"]
    assert latest_event["is_external_confirmed"] is False

def test_public_privacy_leak_prevention(client: TestClient):
    token_citizen = get_auth_token(client, "citizen1@test.in")

    # Citizen submits complaint with sensitive private information in description/address
    res = client.post(
        "/api/v1/complaints/",
        headers={"Authorization": f"Bearer {token_citizen}"},
        data={
            "title": "Broken storm drain near private residence",
            "description": "Drain broken outside flat 402, citizen phone 9876543210.",
            "category_id": "cat-roads-uuid",
            "geographic_area_id": "ward-1-uuid",
            "locality_landmark": "Sector 4 Block B",
            "latitude": 23.250555,
            "longitude": 77.410555
        }
    )
    complaint_data = res.json()
    cp_id = complaint_data["common_problem_id"]

    # Anonymous user views the public common problem page
    public_res = client.get(f"/api/v1/common-problems/{cp_id}")
    assert public_res.status_code == 200
    public_data = public_res.json()

    # Verify that:
    # 1. Citizen names are NOT present in the public response
    # 2. Citizen phone numbers are NOT present
    # 3. Exact coordinates are generalized (rounded)
    public_text = str(public_data).lower()
    assert "citizen1@test.in" not in public_text
    assert "9876543210" not in public_text
    assert "test citizen 1" not in public_text

    # Linked reports list only shows tracking numbers, dates, and status
    for report in public_data["linked_reports"]:
        assert "citizen" not in report
        assert "phone" not in report
        assert "description" not in report
