from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date
from database import get_db
import models

router = APIRouter()


class LogCreate(BaseModel):
    medication_id: int
    user_id: int
    notes: Optional[str] = None
    taken_at: Optional[str] = None  # "HH:MM" — if omitted, uses current time


def log_to_dict(log):
    return {
        "id": log.id,
        "medication_id": log.medication_id,
        "medication_name": log.medication_name,
        "user_id": log.user_id,
        "taken_at": log.taken_at.strftime("%Y-%m-%dT%H:%M:%S") if log.taken_at else None,
        "notes": log.notes,
    }


@router.post("/")
def log_medication(log: LogCreate, db: Session = Depends(get_db)):
    med = db.query(models.Medication).filter(models.Medication.id == log.medication_id).first()
    if not med:
        raise HTTPException(status_code=404, detail="Medication not found")
    if log.taken_at:
        try:
            h, m = map(int, log.taken_at.split(":"))
            taken_at = datetime.now().replace(hour=h, minute=m, second=0, microsecond=0)
        except ValueError:
            taken_at = datetime.now()
    else:
        taken_at = datetime.now()

    db_log = models.MedicationLog(
        medication_id=log.medication_id,
        medication_name=med.name,
        user_id=log.user_id,
        notes=log.notes,
        taken_at=taken_at,
    )
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return log_to_dict(db_log)


@router.get("/user/{user_id}/today")
def get_today_logs(user_id: int, db: Session = Depends(get_db)):
    today = date.today()
    logs = (
        db.query(models.MedicationLog)
        .filter(
            models.MedicationLog.user_id == user_id,
            func.date(models.MedicationLog.taken_at) == today,
        )
        .order_by(models.MedicationLog.taken_at)
        .all()
    )
    return [log_to_dict(l) for l in logs]


@router.get("/user/{user_id}/date/{log_date}")
def get_logs_by_date(user_id: int, log_date: str, db: Session = Depends(get_db)):
    try:
        target_date = date.fromisoformat(log_date)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format")
    logs = (
        db.query(models.MedicationLog)
        .filter(
            models.MedicationLog.user_id == user_id,
            func.date(models.MedicationLog.taken_at) == target_date,
        )
        .order_by(models.MedicationLog.taken_at)
        .all()
    )
    return [log_to_dict(l) for l in logs]


@router.delete("/{log_id}")
def delete_log(log_id: int, db: Session = Depends(get_db)):
    log = db.query(models.MedicationLog).filter(models.MedicationLog.id == log_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Log not found")
    db.delete(log)
    db.commit()
    return {"ok": True}
