import uuid
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.v1.auth import get_current_user
from app.models.user import User
from app.models.category import SkillCategory
from app.models.skill import Skill
from app.models.log import ProgressLog
from app.models.milestone import Milestone
from app.schemas.skill import (
    CategoryBase, CategoryCreate,
    SkillBase, SkillCreate, SkillUpdate,
    LogBase, LogCreate, LogUpdate,
    MilestoneBase, MilestoneCreate, MilestoneUpdate
)

router = APIRouter(tags=["Skills & Management"])

# Standard default categories matching Android app defaults
DEFAULT_CATEGORIES = [
    {"name": "Tecnología", "color": "#3B82F6", "icon": "code"},
    {"name": "Idiomas", "color": "#10B981", "icon": "globe"},
    {"name": "Arte", "color": "#EC4899", "icon": "palette"},
    {"name": "Música", "color": "#8B5CF6", "icon": "music"},
    {"name": "Deportes y Salud", "color": "#F59E0B", "icon": "activity"},
    {"name": "General", "color": "#6B7280", "icon": "folder"},
]

# Categories
@router.get("/categories", response_model=List[CategoryBase])
def get_categories(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    cats = db.query(SkillCategory).filter(
        SkillCategory.user_id == current_user.id,
        SkillCategory.is_deleted == False
    ).all()

    if not cats:
        now = datetime.now(timezone.utc)
        created_cats = []
        for d in DEFAULT_CATEGORIES:
            cat = SkillCategory(
                id=str(uuid.uuid4()),
                user_id=current_user.id,
                name=d["name"],
                color=d["color"],
                icon=d["icon"],
                updated_at=now
            )
            db.add(cat)
            created_cats.append(cat)
        db.commit()
        for cat in created_cats:
            db.refresh(cat)
        return created_cats

    return cats

@router.post("/categories", response_model=CategoryBase, status_code=status.HTTP_201_CREATED)
def create_category(cat_in: CategoryCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    cat = SkillCategory(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        name=cat_in.name,
        color=cat_in.color or "#3B82F6",
        icon=cat_in.icon or "folder",
        updated_at=datetime.now(timezone.utc)
    )
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat

# Skills
@router.get("/skills", response_model=List[SkillBase])
def get_skills(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Skill).filter(
        Skill.user_id == current_user.id,
        Skill.is_deleted == False
    ).all()

@router.post("/skills", response_model=SkillBase, status_code=status.HTTP_201_CREATED)
def create_skill(skill_in: SkillCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    skill = Skill(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        category_id=skill_in.category_id,
        name=skill_in.name,
        description=skill_in.description,
        is_archived=skill_in.is_archived or False,
        target_hours=skill_in.target_hours or 100.0,
        current_level=skill_in.current_level or "Beginner",
        updated_at=datetime.now(timezone.utc)
    )
    db.add(skill)
    db.commit()
    db.refresh(skill)
    return skill

@router.put("/skills/{skill_id}", response_model=SkillBase)
def update_skill(skill_id: str, skill_in: SkillUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    skill = db.query(Skill).filter(
        Skill.id == skill_id,
        Skill.user_id == current_user.id,
        Skill.is_deleted == False
    ).first()
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    
    if skill_in.name is not None:
        skill.name = skill_in.name
    if skill_in.category_id is not None:
        skill.category_id = skill_in.category_id
    if skill_in.description is not None:
        skill.description = skill_in.description
    if skill_in.is_archived is not None:
        skill.is_archived = skill_in.is_archived
    if skill_in.target_hours is not None:
        skill.target_hours = skill_in.target_hours
    if skill_in.current_level is not None:
        skill.current_level = skill_in.current_level

    skill.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(skill)
    return skill

@router.delete("/skills/{skill_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_skill(skill_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    skill = db.query(Skill).filter(
        Skill.id == skill_id,
        Skill.user_id == current_user.id,
        Skill.is_deleted == False
    ).first()
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    
    skill.is_deleted = True
    skill.updated_at = datetime.now(timezone.utc)
    db.commit()
    return None

# Progress Logs
@router.get("/logs", response_model=List[LogBase])
def get_logs(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(ProgressLog).filter(
        ProgressLog.user_id == current_user.id,
        ProgressLog.is_deleted == False
    ).order_by(ProgressLog.logged_at.desc()).all()

@router.post("/logs", response_model=LogBase, status_code=status.HTTP_201_CREATED)
def create_log(log_in: LogCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    skill = db.query(Skill).filter(Skill.id == log_in.skill_id, Skill.user_id == current_user.id).first()
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    
    logged_at = log_in.logged_at or datetime.now(timezone.utc)
    log = ProgressLog(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        skill_id=log_in.skill_id,
        duration_minutes=log_in.duration_minutes,
        notes=log_in.notes,
        logged_at=logged_at,
        updated_at=datetime.now(timezone.utc)
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log

@router.put("/logs/{log_id}", response_model=LogBase)
def update_log(log_id: str, log_in: LogUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    log = db.query(ProgressLog).filter(
        ProgressLog.id == log_id,
        ProgressLog.user_id == current_user.id,
        ProgressLog.is_deleted == False
    ).first()
    if not log:
        raise HTTPException(status_code=404, detail="Log not found")
    
    if log_in.skill_id is not None:
        skill = db.query(Skill).filter(Skill.id == log_in.skill_id, Skill.user_id == current_user.id).first()
        if not skill:
            raise HTTPException(status_code=404, detail="Skill not found")
        log.skill_id = log_in.skill_id
    if log_in.duration_minutes is not None:
        log.duration_minutes = log_in.duration_minutes
    if log_in.notes is not None:
        log.notes = log_in.notes
    if log_in.logged_at is not None:
        log.logged_at = log_in.logged_at
    
    log.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(log)
    return log

@router.delete("/logs/{log_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_log(log_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    log = db.query(ProgressLog).filter(
        ProgressLog.id == log_id,
        ProgressLog.user_id == current_user.id,
        ProgressLog.is_deleted == False
    ).first()
    if not log:
        raise HTTPException(status_code=404, detail="Log not found")
    
    log.is_deleted = True
    log.updated_at = datetime.now(timezone.utc)
    db.commit()
    return None

# Milestones / Tasks
@router.get("/milestones", response_model=List[MilestoneBase])
def get_milestones(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Milestone).filter(
        Milestone.user_id == current_user.id,
        Milestone.is_deleted == False
    ).order_by(Milestone.achieved_at.desc()).all()

@router.post("/milestones", response_model=MilestoneBase, status_code=status.HTTP_201_CREATED)
def create_milestone(ms_in: MilestoneCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    skill = db.query(Skill).filter(Skill.id == ms_in.skill_id, Skill.user_id == current_user.id).first()
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")

    achieved_at = ms_in.achieved_at or datetime.now(timezone.utc)
    ms = Milestone(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        skill_id=ms_in.skill_id,
        title=ms_in.title,
        type=ms_in.type or "milestone",
        priority=ms_in.priority or "Media",
        is_completed=ms_in.is_completed or False,
        due_date=ms_in.due_date,
        achieved_at=achieved_at,
        updated_at=datetime.now(timezone.utc)
    )
    db.add(ms)
    db.commit()
    db.refresh(ms)
    return ms

@router.put("/milestones/{ms_id}", response_model=MilestoneBase)
def update_milestone(ms_id: str, ms_in: MilestoneUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    ms = db.query(Milestone).filter(
        Milestone.id == ms_id,
        Milestone.user_id == current_user.id,
        Milestone.is_deleted == False
    ).first()
    if not ms:
        raise HTTPException(status_code=404, detail="Milestone not found")

    if ms_in.skill_id is not None:
        skill = db.query(Skill).filter(Skill.id == ms_in.skill_id, Skill.user_id == current_user.id).first()
        if not skill:
            raise HTTPException(status_code=404, detail="Skill not found")
        ms.skill_id = ms_in.skill_id
    if ms_in.title is not None:
        ms.title = ms_in.title
    if ms_in.priority is not None:
        ms.priority = ms_in.priority
    if ms_in.is_completed is not None:
        ms.is_completed = ms_in.is_completed
    if ms_in.due_date is not None:
        ms.due_date = ms_in.due_date

    ms.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(ms)
    return ms

@router.delete("/milestones/{ms_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_milestone(ms_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    ms = db.query(Milestone).filter(
        Milestone.id == ms_id,
        Milestone.user_id == current_user.id,
        Milestone.is_deleted == False
    ).first()
    if not ms:
        raise HTTPException(status_code=404, detail="Milestone not found")
    
    ms.is_deleted = True
    ms.updated_at = datetime.now(timezone.utc)
    db.commit()
    return None

