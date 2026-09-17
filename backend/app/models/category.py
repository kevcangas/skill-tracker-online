from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import SyncBaseModel

class SkillCategory(SyncBaseModel):
    __tablename__ = "categories"

    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    color = Column(String(30), default="#3B82F6")  # HEX color code
    icon = Column(String(50), default="folder")     # Icon identifier

    skills = relationship("Skill", back_populates="category", cascade="all, delete-orphan")
