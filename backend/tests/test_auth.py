def test_register_user(client):
    response = client.post(
        "/api/v1/auth/register",
        json={"email": "test@example.com", "password": "password123", "full_name": "Test User"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "test@example.com"
    assert "id" in data

def test_login_user(client):
    # Register first
    client.post(
        "/api/v1/auth/register",
        json={"email": "login@example.com", "password": "password123"}
    )
    # Login
    response = client.post(
        "/api/v1/auth/token",
        data={"username": "login@example.com", "password": "password123"}
    )
    assert response.status_code == 200
    token_data = response.json()
    assert "access_token" in token_data
    assert token_data["token_type"] == "bearer"
