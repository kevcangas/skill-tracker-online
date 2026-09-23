from datetime import datetime, timedelta, timezone, date
from app.models.user import User
from app.models.skill import Skill
from app.models.log import ProgressLog
from app.models.category import SkillCategory
from app.api.v1.stats import calculate_streak_from_dates, to_local_date_str

def test_calculate_streak_unit():
    today = "2026-09-23"
    yesterday = "2026-09-22"

    # Case 1: Practiced today and yesterday and day before
    dates = ["2026-09-23", "2026-09-22", "2026-09-21"]
    res = calculate_streak_from_dates(dates, today, yesterday)
    assert res["current_streak"] == 3
    assert res["longest_streak"] == 3

    # Case 2: Grace period: practiced yesterday, but hasn't practiced yet today
    dates = ["2026-09-22", "2026-09-21", "2026-09-20"]
    res = calculate_streak_from_dates(dates, today, yesterday)
    assert res["current_streak"] == 3
    assert res["longest_streak"] == 3

    # Case 3: Inactive: practiced 2 days ago, but not yesterday or today
    dates = ["2026-09-21", "2026-09-20"]
    res = calculate_streak_from_dates(dates, today, yesterday)
    assert res["current_streak"] == 0
    assert res["longest_streak"] == 2

    # Case 4: Multiple sessions on same day (deduplication)
    dates = ["2026-09-23", "2026-09-23", "2026-09-22"]
    res = calculate_streak_from_dates(dates, today, yesterday)
    assert res["current_streak"] == 2

    # Case 5: Empty
    res = calculate_streak_from_dates([], today, yesterday)
    assert res["current_streak"] == 0
    assert res["longest_streak"] == 0

def test_dashboard_stats_streak_api(client, db_session):
    # 1. Register and get token
    reg = client.post(
        "/api/v1/auth/register",
        json={"email": "streak_test@example.com", "password": "password123", "full_name": "Streak Tester"}
    )
    assert reg.status_code == 201
    user_id = reg.json()["id"]

    login = client.post(
        "/api/v1/auth/token",
        data={"username": "streak_test@example.com", "password": "password123"}
    )
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Initially 0 streak
    res = client.get("/api/v1/stats/dashboard", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["current_streak"] == 0
    assert data["longest_streak"] == 0

    # 3. Create a category and skill
    cat = SkillCategory(id="cat-streak-1", user_id=user_id, name="Test Cat", color="#3B82F6", sync_status="SYNCED")
    db_session.add(cat)
    db_session.commit()

    sk = Skill(id="sk-streak-1", user_id=user_id, category_id=cat.id, name="Python Mastery", sync_status="SYNCED")
    db_session.add(sk)
    db_session.commit()

    # 4. Add logs for yesterday and today
    now = datetime.now(timezone.utc)
    yesterday = now - timedelta(days=1)

    log_today = ProgressLog(
        id="log-streak-today",
        user_id=user_id,
        skill_id=sk.id,
        duration_minutes=45,
        notes="Practiced today",
        logged_at=now,
        is_deleted=False,
        sync_status="SYNCED"
    )
    log_yesterday = ProgressLog(
        id="log-streak-yesterday",
        user_id=user_id,
        skill_id=sk.id,
        duration_minutes=60,
        notes="Practiced yesterday",
        logged_at=yesterday,
        is_deleted=False,
        sync_status="SYNCED"
    )
    # Add a soft-deleted log that shouldn't count
    log_deleted = ProgressLog(
        id="log-streak-deleted",
        user_id=user_id,
        skill_id=sk.id,
        duration_minutes=30,
        notes="Soft deleted log",
        logged_at=now - timedelta(days=2),
        is_deleted=True,
        sync_status="SYNCED"
    )
    db_session.add_all([log_today, log_yesterday, log_deleted])
    db_session.commit()

    # 5. Check dashboard stats
    res = client.get("/api/v1/stats/dashboard", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["current_streak"] == 2
    assert data["longest_streak"] == 2
    assert data["total_hours"] == 1.8  # (45 + 60) / 60 = 1.75 -> rounded to 1.8

    # Per-skill streak
    skills = data["skills"]
    assert len(skills) == 1
    assert skills[0]["current_streak"] == 2
    assert skills[0]["practiced_hours"] == 1.8
