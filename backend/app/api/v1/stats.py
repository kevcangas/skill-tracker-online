from typing import Dict, Any, List
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends
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

@router.get("/dashboard")
def get_dashboard_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Computes analytics metrics and entity lists for Web SPA Dashboard:
    - Total Practice Hours
    - Total Skills Count
    - Active Streak (days with practice logs)
    - Consistency Heatmap (last 90 days)
    - Category hours breakdown
    - Detailed skills list with accumulated hours and archive status
    - Recent Practice Sessions (Logs)
    - Milestones list
    - Tasks list (with priority, completed status, and due dates)
    """
    user_id = current_user.id

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

    # Skills detail with hours & archive status
    skills_list = db.query(Skill).filter(Skill.user_id == user_id, Skill.is_deleted == False).all()
    detailed_skills = []
    for s in skills_list:
        sk_minutes = db.query(func.coalesce(func.sum(ProgressLog.duration_minutes), 0)).filter(
            ProgressLog.skill_id == s.id,
            ProgressLog.is_deleted == False
        ).scalar()
        sk_hours = round(sk_minutes / 60.0, 1)
        detailed_skills.append({
            "id": s.id,
            "name": s.name,
            "category_id": s.category_id,
            "category_name": s.category.name if s.category else "General",
            "category_color": s.category.color if s.category else "#6B7280",
            "description": s.description or "",
            "is_archived": getattr(s, "is_archived", False) or False,
            "practiced_hours": sk_hours
        })

    # Recent Practice Sessions (Logs)
    raw_logs = db.query(ProgressLog).filter(
        ProgressLog.user_id == user_id,
        ProgressLog.is_deleted == False
    ).order_by(ProgressLog.logged_at.desc()).all()

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
        "heatmap": heatmap_data,
        "categories": category_hours,
        "skills": detailed_skills,
        "logs": recent_logs,
        "milestones": milestones_list,
        "tasks": tasks_list
    }
