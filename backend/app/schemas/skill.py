from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel

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
    name: str
    description: Optional[str] = None
    is_archived: bool = False
    target_hours: float = 100.0
    current_level: str = "Beginner"
    updated_at: datetime
    is_deleted: bool = False

class SkillCreate(BaseModel):
    name: str
    category_id: Optional[str] = None
    description: Optional[str] = None
    is_archived: Optional[bool] = False
    target_hours: Optional[float] = 100.0
    current_level: Optional[str] = "Beginner"

class SkillUpdate(BaseModel):
    name: Optional[str] = None
    category_id: Optional[str] = None
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

