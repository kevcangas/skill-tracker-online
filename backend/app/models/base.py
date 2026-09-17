import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, DateTime, String, Boolean
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base

def generate_uuid():
    return str(uuid.uuid4())

def utc_now():
    return datetime.now(timezone.utc)

class SyncBaseModel(Base):
    __abstract__ = True

    id = Column(String(36), primary_key=True, default=generate_uuid)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False, index=True)
    is_deleted = Column(Boolean, default=False, nullable=False, index=True)
    sync_status = Column(String(20), default="SYNCED", nullable=False)
