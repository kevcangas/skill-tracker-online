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

def test_register_short_password_rejected(client):
    response = client.post(
        "/api/v1/auth/register",
        json={"email": "short@example.com", "password": "123"}
    )
    assert response.status_code == 400
    assert "al menos 6 caracteres" in response.json()["detail"]

def test_refresh_token_keep_alive(client):
    # Register & Login
    client.post(
        "/api/v1/auth/register",
        json={"email": "refresh@example.com", "password": "password123"}
    )
    login_res = client.post(
        "/api/v1/auth/token",
        data={"username": "refresh@example.com", "password": "password123"}
    )
    token = login_res.json()["access_token"]

    # Refresh token to keep session alive
    refresh_res = client.post(
        "/api/v1/auth/refresh",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert refresh_res.status_code == 200
    new_token_data = refresh_res.json()
    assert "access_token" in new_token_data
    assert new_token_data["token_type"] == "bearer"

def test_refresh_token_unauthorized(client):
    refresh_res = client.post(
        "/api/v1/auth/refresh",
        headers={"Authorization": "Bearer invalid_token_12345"}
    )
    assert refresh_res.status_code == 401

