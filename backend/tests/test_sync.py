import uuid
from datetime import datetime, timedelta, timezone

def get_auth_header(client, email="sync_user@example.com"):
    client.post("/api/v1/auth/register", json={"email": email, "password": "password123"})
    res = client.post("/api/v1/auth/token", data={"username": email, "password": "password123"})
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_sync_push_and_pull(client):
    headers = get_auth_header(client)

    cat_id = str(uuid.uuid4())
    skill_id = str(uuid.uuid4())
    now_iso = datetime.now(timezone.utc).isoformat()

    # 1. Push payload from simulated mobile app
    push_data = {
        "categories": [
            {
                "id": cat_id,
                "name": "Mobile Dev",
                "color": "#3B82F6",
                "icon": "phone",
                "updated_at": now_iso,
                "is_deleted": False
            }
        ],
        "skills": [
            {
                "id": skill_id,
                "category_id": cat_id,
                "name": "Kotlin Room SQLite",
                "description": "Offline-First Mobile",
                "target_hours": 100.0,
                "current_level": "Intermediate",
                "updated_at": now_iso,
                "is_deleted": False
            }
        ],
        "logs": [],
        "milestones": []
    }

    push_res = client.post("/api/v1/sync/push", json=push_data, headers=headers)
    assert push_res.status_code == 200
    summary = push_res.json()
    assert summary["processed_categories"] == 1
    assert summary["processed_skills"] == 1

    # 2. Pull server state
    pull_res = client.get("/api/v1/sync/pull", headers=headers)
    assert pull_res.status_code == 200
    pull_data = pull_res.json()
    assert len(pull_data["categories"]) == 1
    assert len(pull_data["skills"]) == 1
    assert pull_data["skills"][0]["name"] == "Kotlin Room SQLite"

def test_sync_last_write_wins(client):
    headers = get_auth_header(client, email="lww_user@example.com")

    cat_id = str(uuid.uuid4())
    t1 = (datetime.now(timezone.utc) - timedelta(minutes=10)).isoformat()
    t2 = datetime.now(timezone.utc).isoformat()

    # Old push
    client.post("/api/v1/sync/push", json={
        "categories": [{
            "id": cat_id, "name": "Version 1", "color": "#000", "icon": "folder",
            "updated_at": t1, "is_deleted": False
        }],
        "skills": [], "logs": [], "milestones": []
    }, headers=headers)

    # Newer push
    client.post("/api/v1/sync/push", json={
        "categories": [{
            "id": cat_id, "name": "Version 2 (Newer)", "color": "#FFF", "icon": "folder",
            "updated_at": t2, "is_deleted": False
        }],
        "skills": [], "logs": [], "milestones": []
    }, headers=headers)

    # Verify Newer version won
    pull_res = client.get("/api/v1/sync/pull", headers=headers)
    assert pull_res.json()["categories"][0]["name"] == "Version 2 (Newer)"

def test_update_and_delete_skill(client):
    headers = get_auth_header(client, email="crud_user@example.com")

    # 1. Create skill via REST
    create_res = client.post("/api/v1/skills", json={
        "name": "Python Fast API",
        "target_hours": 50.0,
        "current_level": "Beginner"
    }, headers=headers)
    assert create_res.status_code == 201
    skill_data = create_res.json()
    skill_id = skill_data["id"]

    # 2. Update skill via PUT /skills/{id}
    update_res = client.put(f"/api/v1/skills/{skill_id}", json={
        "name": "Python FastAPI Advanced",
        "current_level": "Advanced",
        "target_hours": 150.0
    }, headers=headers)
    assert update_res.status_code == 200
    assert update_res.json()["name"] == "Python FastAPI Advanced"
    assert update_res.json()["current_level"] == "Advanced"

    # 3. Delete skill via DELETE /skills/{id}
    del_res = client.delete(f"/api/v1/skills/{skill_id}", headers=headers)
    assert del_res.status_code == 204

    # 4. Verify skill is excluded from active skills list
    get_res = client.get("/api/v1/skills", headers=headers)
    assert len(get_res.json()) == 0

def test_sync_mobile_category_resolution(client):
    headers = get_auth_header(client, email="mobile_cat_user@example.com")
    now_iso = datetime.now(timezone.utc).isoformat()
    skill_uuid = str(uuid.uuid4())
    log_uuid = str(uuid.uuid4())

    # Simulate mobile app push: category_id is null, but category name is passed from SQLite
    push_data = {
        "categories": [],
        "skills": [
            {
                "id": skill_uuid,
                "category_id": None,
                "category": "Tecnología",
                "name": "React Native Mobile",
                "description": "Cross-platform app",
                "target_hours": 120.0,
                "current_level": "Beginner",
                "updated_at": now_iso,
                "is_deleted": False
            }
        ],
        "logs": [
            {
                "id": log_uuid,
                "skill_id": skill_uuid,
                "duration_minutes": 90,
                "notes": "State management and sync",
                "logged_at": now_iso,
                "updated_at": now_iso,
                "is_deleted": False
            }
        ],
        "milestones": []
    }

    push_res = client.post("/api/v1/sync/push", json=push_data, headers=headers)
    assert push_res.status_code == 200
    summary = push_res.json()
    assert summary["processed_skills"] == 1
    assert summary["processed_logs"] == 1

    # Verify pull returns category string and valid category_id
    pull_res = client.get("/api/v1/sync/pull", headers=headers)
    assert pull_res.status_code == 200
    pulled_skills = pull_res.json()["skills"]
    assert len(pulled_skills) == 1
    assert pulled_skills[0]["name"] == "React Native Mobile"
    assert pulled_skills[0]["category"] == "Tecnología"
    assert pulled_skills[0]["category_id"] is not None

    # Verify dashboard statistics accurately reflect the mobile category and practice time
    dash_res = client.get("/api/v1/stats/dashboard", headers=headers)
    assert dash_res.status_code == 200
    dash_data = dash_res.json()

    # Total hours should be 90 mins -> 1.5 hrs
    assert dash_data["total_hours"] == 1.5

    # Categories breakdown should contain Tecnología with 1.5 hours
    tec_cat = next((c for c in dash_data["categories"] if c["category"] == "Tecnología"), None)
    assert tec_cat is not None
    assert tec_cat["hours"] == 1.5
    assert tec_cat["color"] == "#3B82F6"

    # Detailed skill should list category_name "Tecnología"
    skill_item = next((s for s in dash_data["skills"] if s["id"] == skill_uuid), None)
    assert skill_item is not None
    assert skill_item["category_name"] == "Tecnología"
    assert skill_item["category_color"] == "#3B82F6"

