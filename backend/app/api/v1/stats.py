from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta, timezone, date
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.api.v1.auth import get_current_user
from app.models.user import User
from app.models.skill import Skill
from app.models.log import ProgressLog
from app.models.category import SkillCategory
from app.models.milestone import Milestone

router = APIRouter(prefix="/stats", tags=["Analytics & Heatmaps"])

def to_local_date_str(dt: datetime, offset_mins: int = 0) -> str:
    """
    Converts a datetime to a 'YYYY-MM-DD' date string shifted by client's timezone offset in minutes.
    In JS, new Date().getTimezoneOffset() returns +360 for UTC-6.
    """
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    local_dt = dt - timedelta(minutes=offset_mins)
    return local_dt.strftime("%Y-%m-%d")

def calculate_streak_from_dates(unique_date_strings: List[str], today_str: str, yesterday_str: str) -> Dict[str, int]:
    """
    Normalized streak calculation adhering to TSK-03:
    1. Filter: is_deleted !== 1 (handled in caller query)
    2. Map timestamps to device local calendar date (YYYY-MM-DD)
    3. Deduplicate dates using a Set
    4. Current Day Grace Period: If user practiced yesterday but not yet today,
       streak remains active.
    5. Consecutive previous days count.
    6. Computes both currentStreak and longestStreak.
    """
    if not unique_date_strings:
        return {"current_streak": 0, "longest_streak": 0}

    date_set = set(unique_date_strings)
    today_d = date.fromisoformat(today_str)
    yesterday_d = date.fromisoformat(yesterday_str)

    current_streak = 0
    if today_str in date_set:
        current_streak = 1
        check_d = today_d - timedelta(days=1)
        while check_d.isoformat() in date_set:
            current_streak += 1
            check_d -= timedelta(days=1)
    elif yesterday_str in date_set:
        # Grace period: session logged yesterday keeps streak active today
        current_streak = 1
        check_d = yesterday_d - timedelta(days=1)
        while check_d.isoformat() in date_set:
            current_streak += 1
            check_d -= timedelta(days=1)
    else:
        current_streak = 0

    # Calculate longest historical streak
    sorted_dates = sorted([date.fromisoformat(d) for d in date_set])
    longest_streak = 0
    if sorted_dates:
        curr_run = 1
        longest_streak = 1
        for i in range(1, len(sorted_dates)):
            diff = (sorted_dates[i] - sorted_dates[i - 1]).days
            if diff == 1:
                curr_run += 1
                if curr_run > longest_streak:
                    longest_streak = curr_run
            elif diff > 1:
                curr_run = 1

    longest_streak = max(longest_streak, current_streak)
    return {"current_streak": current_streak, "longest_streak": longest_streak}

@router.get("/dashboard")
def get_dashboard_stats(
    tz_offset_minutes: Optional[int] = Query(0, description="Client timezone offset in minutes from JS getTimezoneOffset()"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Computes analytics metrics and entity lists for Web SPA Dashboard:
    - Total Practice Hours
    - Total Skills Count
    - Active Streak & Longest Streak (days with practice logs, timezone-normalized with grace period)
    - Consistency Heatmap (last 90 days)
    - Category hours breakdown
    - Detailed skills list with accumulated hours, archive status, and per-skill streak
    - Recent Practice Sessions (Logs)
    - Milestones list
    - Tasks list (with priority, completed status, and due dates)
    """
    user_id = current_user.id
    offset_mins = tz_offset_minutes or 0

    now_utc = datetime.now(timezone.utc)
    now_local = now_utc - timedelta(minutes=offset_mins)
    today_str = now_local.strftime("%Y-%m-%d")
    yesterday_str = (now_local - timedelta(days=1)).strftime("%Y-%m-%d")

    # Total hours
    total_minutes = db.query(func.coalesce(func.sum(ProgressLog.duration_minutes), 0)).filter(
        ProgressLog.user_id == user_id,
        ProgressLog.is_deleted == False
    ).scalar()
    total_hours = round(total_minutes / 60.0, 1)

    # Total skills
    total_skills = db.query(func.count(Skill.id)).filter(
        Skill.user_id == user_id,
        Skill.is_deleted == False
    ).scalar()

    # All active logs for streak and recent list
    raw_logs = db.query(ProgressLog).filter(
        ProgressLog.user_id == user_id,
        ProgressLog.is_deleted == False
    ).order_by(ProgressLog.logged_at.desc()).all()

    # Compute global practice streak
    all_log_dates = [to_local_date_str(lg.logged_at, offset_mins) for lg in raw_logs if lg.logged_at]
    global_streak = calculate_streak_from_dates(all_log_dates, today_str, yesterday_str)

    # Group logs by skill_id for per-skill streak & hour calculation
    logs_by_skill: Dict[str, List[ProgressLog]] = {}
    for lg in raw_logs:
        logs_by_skill.setdefault(lg.skill_id, []).append(lg)

    # Practice logs last 90 days for Heatmap
    start_date = datetime.now(timezone.utc) - timedelta(days=90)
    logs_90 = db.query(
        func.date(ProgressLog.logged_at).label("log_date"),
        func.sum(ProgressLog.duration_minutes).label("total_mins")
    ).filter(
        ProgressLog.user_id == user_id,
        ProgressLog.is_deleted == False,
        ProgressLog.logged_at >= start_date
    ).group_by(func.date(ProgressLog.logged_at)).all()

    heatmap_data = [
        {"date": str(row.log_date), "duration_minutes": int(row.total_mins)}
        for row in logs_90
    ]

    # Category breakdown
    cat_breakdown = db.query(
        SkillCategory.name,
        SkillCategory.color,
        func.coalesce(func.sum(ProgressLog.duration_minutes), 0).label("minutes")
    ).join(Skill, Skill.category_id == SkillCategory.id)\
     .join(ProgressLog, ProgressLog.skill_id == Skill.id)\
     .filter(
         SkillCategory.user_id == user_id,
         SkillCategory.is_deleted == False,
         ProgressLog.is_deleted == False
     ).group_by(SkillCategory.id, SkillCategory.name, SkillCategory.color).all()

    category_hours = [
        {"category": row.name, "color": row.color, "hours": round(row.minutes / 60.0, 1)}
        for row in cat_breakdown
    ]

    # Skills detail with hours, archive status, and per-skill streak
    skills_list = db.query(Skill).filter(Skill.user_id == user_id, Skill.is_deleted == False).all()
    detailed_skills = []
    for s in skills_list:
        s_logs = logs_by_skill.get(s.id, [])
        sk_minutes = sum(l.duration_minutes for l in s_logs)
        sk_hours = round(sk_minutes / 60.0, 1)

        sk_dates = [to_local_date_str(l.logged_at, offset_mins) for l in s_logs if l.logged_at]
        sk_streak = calculate_streak_from_dates(sk_dates, today_str, yesterday_str)["current_streak"]

        detailed_skills.append({
            "id": s.id,
            "name": s.name,
            "category_id": s.category_id,
            "category_name": s.category.name if s.category else "General",
            "category_color": s.category.color if s.category else "#6B7280",
            "description": s.description or "",
            "is_archived": getattr(s, "is_archived", False) or False,
            "practiced_hours": sk_hours,
            "current_streak": sk_streak
        })

    # Recent Practice Sessions (Logs)
    recent_logs = []
    for log in raw_logs:
        recent_logs.append({
            "id": log.id,
            "skill_id": log.skill_id,
            "skill_name": log.skill.name if log.skill else "Habilidad Desconocida",
            "category_color": log.skill.category.color if (log.skill and log.skill.category) else "#3B82F6",
            "duration_minutes": log.duration_minutes,
            "notes": log.notes or "",
            "logged_at": log.logged_at.isoformat() if log.logged_at else ""
        })

    # Milestones & Tasks (separate lists with full properties)
    raw_ms = db.query(Milestone).filter(
        Milestone.user_id == user_id,
        Milestone.is_deleted == False
    ).order_by(Milestone.achieved_at.desc()).all()

    milestones_list = []
    tasks_list = []
    for ms in raw_ms:
        ms_type = getattr(ms, "type", "milestone") or "milestone"
        item = {
            "id": ms.id,
            "skill_id": ms.skill_id,
            "skill_name": ms.skill.name if ms.skill else "Habilidad Desconocida",
            "category_color": ms.skill.category.color if (ms.skill and ms.skill.category) else "#A78BFA",
            "title": ms.title,
            "type": ms_type,
            "priority": getattr(ms, "priority", "Media") or "Media",
            "is_completed": getattr(ms, "is_completed", False) or False,
            "due_date": ms.due_date.isoformat() if getattr(ms, "due_date", None) else None,
            "achieved_at": ms.achieved_at.isoformat() if ms.achieved_at else ""
        }
        if ms_type == "task":
            tasks_list.append(item)
        else:
            milestones_list.append(item)

    return {
        "total_hours": total_hours,
        "total_skills": total_skills,
        "current_streak": global_streak["current_streak"],
        "longest_streak": global_streak["longest_streak"],
        "heatmap": heatmap_data,
        "categories": category_hours,
        "skills": detailed_skills,
        "logs": recent_logs,
        "milestones": milestones_list,
        "tasks": tasks_list
    }
