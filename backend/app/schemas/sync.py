from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from app.schemas.skill import CategoryBase, SkillBase, LogBase, MilestoneBase

class SyncPushPayload(BaseModel):
    categories: List[CategoryBase] = []
    skills: List[SkillBase] = []
    logs: List[LogBase] = []
    milestones: List[MilestoneBase] = []

class SyncPullResponse(BaseModel):
    server_time: datetime
    categories: List[CategoryBase] = []
    skills: List[SkillBase] = []
    logs: List[LogBase] = []
    milestones: List[MilestoneBase] = []

class SyncResultSummary(BaseModel):
    processed_categories: int = 0
    processed_skills: int = 0
    processed_logs: int = 0
    processed_milestones: int = 0
    conflicts_resolved: int = 0
    server_time: datetime
