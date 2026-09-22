from sqlalchemy import Column, String, DateTime, ForeignKey, Boolean, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.models.base import SyncBaseModel

class Milestone(SyncBaseModel):
    __tablename__ = "milestones"

    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    skill_id = Column(String(36), ForeignKey("skills.id"), nullable=False, index=True)
    title = Column(Text, nullable=False)
    type = Column(String(100), default="milestone", nullable=False)  # "milestone" or "task"
    priority = Column(String(50), default="Media", nullable=True)  # "Alta", "Media", "Baja"
    is_completed = Column(Boolean, default=False, nullable=False)
    due_date = Column(DateTime(timezone=True), nullable=True)
    achieved_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    skill = relationship("Skill", back_populates="milestones")
