from fastapi.testclient import TestClient

def get_auth_token(client: TestClient, email: str = "citizen1@test.in") -> str:
    res = client.post("/api/v1/auth/login", json={"email": email, "password": "TestPass@123"})
    return res.json()["access_token"]

def test_submit_complaint_with_auto_routing(client: TestClient):
    token = get_auth_token(client, "citizen1@test.in")
    
    # Ward 1 + Roads -> Configured to PWD Central Office (office-1-uuid)
    response = client.post(
        "/api/v1/complaints/",
        headers={"Authorization": f"Bearer {token}"},
        data={
            "title": "Severe pothole cluster on Main Street",
            "description": "Two deep craters in front of school entrance causing bike skidding.",
            "category_id": "cat-roads-uuid",
            "geographic_area_id": "ward-1-uuid",
            "locality_landmark": "Near Primary School, Main Street",
            "latitude": 23.2505,
            "longitude": 77.4105
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["tracking_number"].startswith("JS-")
    assert data["routing_status"] == "AUTO_ROUTED"
    assert data["assigned_office_id"] == "office-1-uuid"
    assert data["status"] == "ASSIGNED_PROTOTYPE"
    assert len(data["timeline"]) >= 2

def test_citizen_access_isolation(client: TestClient):
    # Citizen 1 submits a complaint
    token1 = get_auth_token(client, "citizen1@test.in")
    create_res = client.post(
        "/api/v1/complaints/",
        headers={"Authorization": f"Bearer {token1}"},
        data={
            "title": "Private water pipe leak in alley",
            "description": "Clean drinking water leaking continuously for two days.",
            "category_id": "cat-roads-uuid",
            "locality_landmark": "Private Alleyway",
            "latitude": 23.2510,
            "longitude": 77.4110
        }
    )
    complaint_id = create_res.json()["id"]

    # Citizen 1 can access it
    res1 = client.get(f"/api/v1/complaints/{complaint_id}", headers={"Authorization": f"Bearer {token1}"})
    assert res1.status_code == 200

    # Citizen 2 attempts to access citizen 1's complaint -> Forbidden (403)!
    token2 = get_auth_token(client, "citizen2@test.in")
    res2 = client.get(f"/api/v1/complaints/{complaint_id}", headers={"Authorization": f"Bearer {token2}"})
    assert res2.status_code == 403
    assert "access denied" in res2.json()["detail"].lower()

def test_citizen_dispute_flow(client: TestClient):
    token1 = get_auth_token(client, "citizen1@test.in")
    create_res = client.post(
        "/api/v1/complaints/",
        headers={"Authorization": f"Bearer {token1}"},
        data={
            "title": "Road pothole near intersection",
            "description": "Deep hole on the road causing major traffic slowdown.",
            "category_id": "cat-roads-uuid",
            "geographic_area_id": "ward-1-uuid",
            "locality_landmark": "Near intersection",
            "latitude": 23.2512,
            "longitude": 77.4115
        }
    )
    complaint_id = create_res.json()["id"]

    # Officer marks it as RESOLVED
    token_officer = get_auth_token(client, "officer1@test.gov.in")
    update_res = client.post(
        f"/api/v1/officer/{complaint_id}/status",
        headers={"Authorization": f"Bearer {token_officer}"},
        data={"new_status": "RESOLVED", "action_note": "Work completed by team."}
    )
    assert update_res.status_code == 200

    # Citizen disputes the resolution
    disp_res = client.post(
        f"/api/v1/complaints/{complaint_id}/dispute",
        headers={"Authorization": f"Bearer {token1}"},
        json={"dispute_reason": "Pothole was only filled with mud, it got washed away in rain today!"}
    )
    assert disp_res.status_code == 200
    disp_data = disp_res.json()
    assert disp_data["is_disputed"] is True
    assert disp_data["status"] == "UNDER_REVIEW"
