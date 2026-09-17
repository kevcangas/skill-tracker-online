from typing import Optional
from datetime import datetime
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.v1.auth import get_current_user
from app.models.user import User
from app.schemas.sync import SyncPushPayload, SyncPullResponse, SyncResultSummary
from app.services.sync_engine import SyncEngine

router = APIRouter(prefix="/sync", tags=["Synchronization Engine"])

@router.post("/push", response_model=SyncResultSummary)
def sync_push(
    payload: SyncPushPayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    """
    Paso 4: Process batch sync push from client (Android App or Web Client).
    Applies Last-Write-Wins (LWW) conflict resolution and atomic database persistence.
    """
    engine = SyncEngine(db=db, user_id=current_user.id)
    return engine.process_push(payload)

@router.get("/pull", response_model=SyncPullResponse)
def sync_pull(
    since: Optional[datetime] = Query(None, description="ISO-8601 UTC Timestamp of last sync"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Paso 4: Process sync pull from server. Returns all records modified since `since` timestamp.
    """
    engine = SyncEngine(db=db, user_id=current_user.id)
    return engine.process_pull(since=since)

@router.post("/batch", response_model=SyncPullResponse)
def sync_batch(
    payload: SyncPushPayload,
    since: Optional[datetime] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Section 3D: Batch sync endpoint that executes push and pull in a single HTTP request round-trip.
    """
    engine = SyncEngine(db=db, user_id=current_user.id)
    engine.process_push(payload)
    return engine.process_pull(since=since)
