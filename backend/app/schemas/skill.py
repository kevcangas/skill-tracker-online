from typing import Optional, List, Any
from datetime import datetime
from pydantic import BaseModel, model_validator

class CategoryBase(BaseModel):
    id: str
    name: str
    color: Optional[str] = "#3B82F6"
    icon: Optional[str] = "folder"
    updated_at: datetime
    is_deleted: bool = False

class CategoryCreate(BaseModel):
    name: str
    color: Optional[str] = "#3B82F6"
    icon: Optional[str] = "folder"

class SkillBase(BaseModel):
    id: str
    category_id: Optional[str] = None
    category: Optional[str] = None
    category_name: Optional[str] = None
    name: str
    description: Optional[str] = None
    is_archived: bool = False
    target_hours: float = 100.0
    current_level: str = "Beginner"
    updated_at: datetime
    is_deleted: bool = False

    @model_validator(mode="before")
    @classmethod
    def normalize_category(cls, data: Any) -> Any:
        if isinstance(data, dict):
            cat = data.get("category") or data.get("category_name")
            if cat and isinstance(cat, str):
                data.setdefault("category", cat)
                data.setdefault("category_name", cat)
            return data

        # Extract from ORM model safely without relationship type mismatch
        cat_rel = getattr(data, "category", None)
        cat_name = cat_rel.name if (cat_rel and hasattr(cat_rel, "name")) else None

        return {
            "id": getattr(data, "id", None),
            "category_id": getattr(data, "category_id", None),
            "category": cat_name,
            "category_name": cat_name,
            "name": getattr(data, "name", None),
            "description": getattr(data, "description", None),
            "is_archived": getattr(data, "is_archived", False) or False,
            "target_hours": getattr(data, "target_hours", 100.0) or 100.0,
            "current_level": getattr(data, "current_level", "Beginner") or "Beginner",
            "updated_at": getattr(data, "updated_at", None),
            "is_deleted": getattr(data, "is_deleted", False) or False,
        }

class SkillCreate(BaseModel):
    name: str
    category_id: Optional[str] = None
    category: Optional[str] = None
    category_name: Optional[str] = None
    description: Optional[str] = None
    is_archived: Optional[bool] = False
    target_hours: Optional[float] = 100.0
    current_level: Optional[str] = "Beginner"

class SkillUpdate(BaseModel):
    name: Optional[str] = None
    category_id: Optional[str] = None
    category: Optional[str] = None
    category_name: Optional[str] = None
    description: Optional[str] = None
    is_archived: Optional[bool] = None
    target_hours: Optional[float] = None
    current_level: Optional[str] = None

class LogBase(BaseModel):
    id: str
    skill_id: str
    duration_minutes: int
    notes: Optional[str] = None
    logged_at: datetime
    updated_at: datetime
    is_deleted: bool = False

class LogCreate(BaseModel):
    skill_id: str
    duration_minutes: int
    notes: Optional[str] = None
    logged_at: Optional[datetime] = None

class LogUpdate(BaseModel):
    skill_id: Optional[str] = None
    duration_minutes: Optional[int] = None
    notes: Optional[str] = None
    logged_at: Optional[datetime] = None

class MilestoneBase(BaseModel):
    id: str
    skill_id: str
    title: str
    type: Optional[str] = "milestone"
    priority: Optional[str] = "Media"
    is_completed: bool = False
    due_date: Optional[datetime] = None
    achieved_at: datetime
    updated_at: datetime
    is_deleted: bool = False

class MilestoneCreate(BaseModel):
    skill_id: str
    title: str
    type: Optional[str] = "milestone"
    priority: Optional[str] = "Media"
    is_completed: Optional[bool] = False
    due_date: Optional[datetime] = None
    achieved_at: Optional[datetime] = None

class MilestoneUpdate(BaseModel):
    skill_id: Optional[str] = None
    title: Optional[str] = None
    priority: Optional[str] = None
    is_completed: Optional[bool] = None
    due_date: Optional[datetime] = None

