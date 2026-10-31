from fastapi.testclient import TestClient

def test_valid_citizen_registration(client: TestClient):
    response = client.post("/api/v1/auth/register", json={
        "email": "newcitizen@test.in",
        "full_name": "New Citizen",
        "password": "SecurePassword@123",
        "phone_number": "9876543210",
        "preferred_language": "hi"
    })
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "newcitizen@test.in"
    assert data["user"]["role"] == "CITIZEN"

def test_citizen_cannot_self_assign_privileged_role(client: TestClient):
    # Try to inject role: PLATFORM_ADMIN or AUTHORITY_OFFICER
    response = client.post("/api/v1/auth/register", json={
        "email": "hacker@test.in",
        "full_name": "Privilege Escalation Attempt",
        "password": "Password@123",
        "role": "PLATFORM_ADMIN"
    })
    assert response.status_code == 201
    data = response.json()
    # The system strictly forces CITIZEN regardless of payload!
    assert data["user"]["role"] == "CITIZEN"

def test_duplicate_registration_fails(client: TestClient):
    response = client.post("/api/v1/auth/register", json={
        "email": "citizen1@test.in",
        "full_name": "Duplicate User",
        "password": "Password@123"
    })
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"].lower()

def test_valid_login(client: TestClient):
    response = client.post("/api/v1/auth/login", json={
        "email": "citizen1@test.in",
        "password": "TestPass@123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["role"] == "CITIZEN"

def test_invalid_login(client: TestClient):
    response = client.post("/api/v1/auth/login", json={
        "email": "citizen1@test.in",
        "password": "WrongPassword!"
    })
    assert response.status_code == 401
    assert "incorrect email or password" in response.json()["detail"].lower()

def test_unauthorized_protected_endpoint(client: TestClient):
    response = client.get("/api/v1/complaints/my")
    assert response.status_code == 401
