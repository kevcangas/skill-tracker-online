import uuid
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.category import SkillCategory
from app.models.skill import Skill
from app.models.log import ProgressLog
from app.models.milestone import Milestone
from app.schemas.sync import SyncPushPayload, SyncPullResponse, SyncResultSummary
from app.schemas.skill import CategoryBase, SkillBase, LogBase, MilestoneBase

DEFAULT_CATEGORIES = [
    {"name": "Tecnología", "color": "#3B82F6", "icon": "code"},
    {"name": "Idiomas", "color": "#10B981", "icon": "globe"},
    {"name": "Arte", "color": "#EC4899", "icon": "palette"},
    {"name": "Música", "color": "#8B5CF6", "icon": "music"},
    {"name": "Deportes y Salud", "color": "#F59E0B", "icon": "activity"},
    {"name": "General", "color": "#6B7280", "icon": "folder"},
]

def ensure_utc(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)

class SyncEngine:
    def __init__(self, db: Session, user_id: str):
        self.db = db
        self.user_id = user_id

    def resolve_or_create_category(self, category_id: Optional[str] = None, category_name: Optional[str] = None) -> Optional[str]:
        """
        Resolves a category ID for a skill:
        1. Checks if category_id exists and belongs to user.
        2. If not, matches category_name case-insensitively with user's categories.
        3. If not found, creates the category on-the-fly.
        4. If neither provided, falls back to the user's 'General' category.
        """
        if category_id:
            existing = self.db.query(SkillCategory).filter(
                SkillCategory.id == category_id,
                SkillCategory.user_id == self.user_id
            ).first()
            if existing:
                return existing.id

        cat_name = (category_name or "").strip()
        if cat_name:
            by_name = self.db.query(SkillCategory).filter(
                SkillCategory.user_id == self.user_id,
                SkillCategory.is_deleted == False,
                func.lower(SkillCategory.name) == cat_name.lower()
            ).first()
            if by_name:
                return by_name.id

            # Create matching category
            default_match = next((d for d in DEFAULT_CATEGORIES if d["name"].lower() == cat_name.lower()), None)
            color = default_match["color"] if default_match else "#3B82F6"
            icon = default_match["icon"] if default_match else "folder"

            new_cat = SkillCategory(
                id=str(uuid.uuid4()),
                user_id=self.user_id,
                name=cat_name,
                color=color,
                icon=icon,
                updated_at=datetime.now(timezone.utc),
                sync_status="SYNCED"
            )
            self.db.add(new_cat)
            self.db.flush()
            return new_cat.id

        # Fallback to user's 'General' category
        general_cat = self.db.query(SkillCategory).filter(
            SkillCategory.user_id == self.user_id,
            SkillCategory.is_deleted == False,
            func.lower(SkillCategory.name) == "general"
        ).first()
        if general_cat:
            return general_cat.id

        new_general = SkillCategory(
            id=str(uuid.uuid4()),
            user_id=self.user_id,
            name="General",
            color="#6B7280",
            icon="folder",
            updated_at=datetime.now(timezone.utc),
            sync_status="SYNCED"
        )
        self.db.add(new_general)
        self.db.flush()
        return new_general.id

    def process_push(self, payload: SyncPushPayload) -> SyncResultSummary:
        server_now = datetime.now(timezone.utc)
        conflicts = 0

        # 1. Process Categories
        cats_count = 0
        for cat in payload.categories:
            client_updated = ensure_utc(cat.updated_at)
            existing = self.db.query(SkillCategory).filter(
                SkillCategory.id == cat.id,
                SkillCategory.user_id == self.user_id
            ).first()

            if not existing:
                new_cat = SkillCategory(
                    id=cat.id,
                    user_id=self.user_id,
                    name=cat.name,
                    color=cat.color or "#3B82F6",
                    icon=cat.icon or "folder",
                    updated_at=client_updated,
                    is_deleted=cat.is_deleted,
                    sync_status="SYNCED"
                )
                self.db.add(new_cat)
                cats_count += 1
            else:
                existing_updated = ensure_utc(existing.updated_at)
                if client_updated > existing_updated:
                    existing.name = cat.name
                    existing.color = cat.color
                    existing.icon = cat.icon
                    existing.updated_at = client_updated
                    existing.is_deleted = cat.is_deleted
                    existing.sync_status = "SYNCED"
                    cats_count += 1
                else:
                    conflicts += 1

        # 2. Process Skills
        skills_count = 0
        for sk in payload.skills:
            client_updated = ensure_utc(sk.updated_at)
            cat_name = getattr(sk, "category", None) or getattr(sk, "category_name", None)
            resolved_category_id = self.resolve_or_create_category(sk.category_id, cat_name)

            existing = self.db.query(Skill).filter(
                Skill.id == sk.id,
                Skill.user_id == self.user_id
            ).first()

            if not existing:
                new_sk = Skill(
                    id=sk.id,
                    user_id=self.user_id,
                    category_id=resolved_category_id,
                    name=sk.name,
                    description=sk.description,
                    is_archived=getattr(sk, "is_archived", False) or False,
                    target_hours=sk.target_hours,
                    current_level=sk.current_level,
                    updated_at=client_updated,
                    is_deleted=sk.is_deleted,
                    sync_status="SYNCED"
                )
                self.db.add(new_sk)
                skills_count += 1
            else:
                existing_updated = ensure_utc(existing.updated_at)
                if client_updated > existing_updated:
                    existing.category_id = resolved_category_id
                    existing.name = sk.name
                    existing.description = sk.description
                    existing.is_archived = getattr(sk, "is_archived", False) or False
                    existing.target_hours = sk.target_hours
                    existing.current_level = sk.current_level
                    existing.updated_at = client_updated
                    existing.is_deleted = sk.is_deleted
                    existing.sync_status = "SYNCED"
                    skills_count += 1
                else:
                    conflicts += 1

        # 3. Process Progress Logs
        logs_count = 0
        for lg in payload.logs:
            client_updated = ensure_utc(lg.updated_at)
            existing = self.db.query(ProgressLog).filter(
                ProgressLog.id == lg.id,
                ProgressLog.user_id == self.user_id
            ).first()

            if not existing:
                new_lg = ProgressLog(
                    id=lg.id,
                    user_id=self.user_id,
                    skill_id=lg.skill_id,
                    duration_minutes=lg.duration_minutes,
                    notes=lg.notes,
                    logged_at=ensure_utc(lg.logged_at),
                    updated_at=client_updated,
                    is_deleted=lg.is_deleted,
                    sync_status="SYNCED"
                )
                self.db.add(new_lg)
                logs_count += 1
            else:
                existing_updated = ensure_utc(existing.updated_at)
                if client_updated > existing_updated:
                    existing.skill_id = lg.skill_id
                    existing.duration_minutes = lg.duration_minutes
                    existing.notes = lg.notes
                    existing.logged_at = ensure_utc(lg.logged_at)
                    existing.updated_at = client_updated
                    existing.is_deleted = lg.is_deleted
                    existing.sync_status = "SYNCED"
                    logs_count += 1
                else:
                    conflicts += 1

        # 4. Process Milestones & Tasks
        ms_count = 0
        for ms in payload.milestones:
            client_updated = ensure_utc(ms.updated_at)
            existing = self.db.query(Milestone).filter(
                Milestone.id == ms.id,
                Milestone.user_id == self.user_id
            ).first()

            due_dt = ensure_utc(ms.due_date) if getattr(ms, "due_date", None) else None

            if not existing:
                new_ms = Milestone(
                    id=ms.id,
                    user_id=self.user_id,
                    skill_id=ms.skill_id,
                    title=ms.title,
                    type=getattr(ms, "type", "milestone") or "milestone",
                    priority=getattr(ms, "priority", "Media") or "Media",
                    is_completed=getattr(ms, "is_completed", False) or False,
                    due_date=due_dt,
                    achieved_at=ensure_utc(ms.achieved_at),
                    updated_at=client_updated,
                    is_deleted=ms.is_deleted,
                    sync_status="SYNCED"
                )
                self.db.add(new_ms)
                ms_count += 1
            else:
                existing_updated = ensure_utc(existing.updated_at)
                if client_updated > existing_updated:
                    existing.skill_id = ms.skill_id
                    existing.title = ms.title
                    existing.type = getattr(ms, "type", "milestone") or "milestone"
                    existing.priority = getattr(ms, "priority", "Media") or "Media"
                    existing.is_completed = getattr(ms, "is_completed", False) or False
                    existing.due_date = due_dt
                    existing.achieved_at = ensure_utc(ms.achieved_at)
                    existing.updated_at = client_updated
                    existing.is_deleted = ms.is_deleted
                    existing.sync_status = "SYNCED"
                    ms_count += 1
                else:
                    conflicts += 1

        self.db.commit()

        return SyncResultSummary(
            processed_categories=cats_count,
            processed_skills=skills_count,
            processed_logs=logs_count,
            processed_milestones=ms_count,
            conflicts_resolved=conflicts,
            server_time=server_now
        )

    def process_pull(self, since: Optional[datetime] = None) -> SyncPullResponse:
        server_now = datetime.now(timezone.utc)

        cat_query = self.db.query(SkillCategory).filter(SkillCategory.user_id == self.user_id)
        sk_query = self.db.query(Skill).filter(Skill.user_id == self.user_id)
        lg_query = self.db.query(ProgressLog).filter(ProgressLog.user_id == self.user_id)
        ms_query = self.db.query(Milestone).filter(Milestone.user_id == self.user_id)

        if since:
            since_utc = ensure_utc(since)
            cat_query = cat_query.filter(SkillCategory.updated_at > since_utc)
            sk_query = sk_query.filter(Skill.updated_at > since_utc)
            lg_query = lg_query.filter(ProgressLog.updated_at > since_utc)
            ms_query = ms_query.filter(Milestone.updated_at > since_utc)

        categories = [CategoryBase.model_validate(c, from_attributes=True) for c in cat_query.all()]
        skills = [SkillBase.model_validate(s, from_attributes=True) for s in sk_query.all()]
        logs = [LogBase.model_validate(l, from_attributes=True) for l in lg_query.all()]
        milestones = [MilestoneBase.model_validate(m, from_attributes=True) for m in ms_query.all()]

        return SyncPullResponse(
            server_time=server_now,
            categories=categories,
            skills=skills,
            logs=logs,
            milestones=milestones
        )
