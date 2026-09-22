from sqlalchemy import Column, String, Integer, Float, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.models.base import SyncBaseModel

class Skill(SyncBaseModel):
    __tablename__ = "skills"

    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    category_id = Column(String(36), ForeignKey("categories.id"), nullable=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    is_archived = Column(Boolean, default=False, nullable=False)
    target_hours = Column(Float, default=100.0)
    current_level = Column(String(100), default="Beginner")

    category = relationship("SkillCategory", back_populates="skills")
    logs = relationship("ProgressLog", back_populates="skill", cascade="all, delete-orphan")
    milestones = relationship("Milestone", back_populates="skill", cascade="all, delete-orphan")
