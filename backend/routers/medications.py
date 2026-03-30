from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from database import get_db
import models

router = APIRouter()

VALID_FREQUENCIES = {"on-demand", "daily", "4h", "6h"}


class MedicationCreate(BaseModel):
    user_id: int
    name: str
    dosage: Optional[str] = None
    frequency: str = "on-demand"
    daily_time: Optional[str] = None   # "HH:MM" — required when frequency == "daily"
    last_taken: Optional[str] = None   # "HH:MM" — seeds an initial log for today
    notes: Optional[str] = None
    is_optional: bool = False


class MedicationUpdate(BaseModel):
    name: Optional[str] = None
    dosage: Optional[str] = None
    frequency: Optional[str] = None
    daily_time: Optional[str] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = None
    is_optional: Optional[bool] = None


def med_to_dict(med):
    return {
        "id": med.id,
        "user_id": med.user_id,
        "name": med.name,
        "dosage": med.dosage,
        "frequency": med.frequency or "on-demand",
        "daily_time": med.daily_time,
        "notes": med.notes,
        "is_optional": bool(med.is_optional),
        "is_active": med.is_active,
    }


@router.get("/user/{user_id}")
def get_user_medications(user_id: int, active_only: bool = True, db: Session = Depends(get_db)):
    query = db.query(models.Medication).filter(models.Medication.user_id == user_id)
    if active_only:
        query = query.filter(models.Medication.is_active == True)
    return [med_to_dict(m) for m in query.order_by(models.Medication.name).all()]


@router.post("/")
def create_medication(med: MedicationCreate, db: Session = Depends(get_db)):
    if med.frequency not in VALID_FREQUENCIES:
        raise HTTPException(status_code=400, detail=f"Invalid frequency: {med.frequency}")

    db_med = models.Medication(
        user_id=med.user_id,
        name=med.name.strip(),
        dosage=med.dosage,
        frequency=med.frequency,
        daily_time=med.daily_time if med.frequency == "daily" else None,
        notes=med.notes,
        is_optional=med.is_optional,
    )
    db.add(db_med)
    db.flush()  # get db_med.id before committing

    if med.last_taken:
        try:
            h, m = map(int, med.last_taken.split(":"))
            taken_at = datetime.now().replace(hour=h, minute=m, second=0, microsecond=0)
            db_log = models.MedicationLog(
                medication_id=db_med.id,
                medication_name=db_med.name,
                user_id=db_med.user_id,
                taken_at=taken_at,
            )
            db.add(db_log)
        except ValueError:
            pass  # bad time format — skip the seed log

    db.commit()
    db.refresh(db_med)
    return med_to_dict(db_med)


@router.put("/{med_id}")
def update_medication(med_id: int, update: MedicationUpdate, db: Session = Depends(get_db)):
    med = db.query(models.Medication).filter(models.Medication.id == med_id).first()
    if not med:
        raise HTTPException(status_code=404, detail="Medication not found")
    if update.name is not None:
        med.name = update.name.strip()
    if update.dosage is not None:
        med.dosage = update.dosage
    if update.frequency is not None:
        if update.frequency not in VALID_FREQUENCIES:
            raise HTTPException(status_code=400, detail=f"Invalid frequency: {update.frequency}")
        med.frequency = update.frequency
    if update.daily_time is not None:
        med.daily_time = update.daily_time
    if update.notes is not None:
        med.notes = update.notes
    if update.is_active is not None:
        med.is_active = update.is_active
    if update.is_optional is not None:
        med.is_optional = update.is_optional
    db.commit()
    db.refresh(med)
    return med_to_dict(med)


@router.delete("/{med_id}")
def delete_medication(med_id: int, db: Session = Depends(get_db)):
    med = db.query(models.Medication).filter(models.Medication.id == med_id).first()
    if not med:
        raise HTTPException(status_code=404, detail="Medication not found")
    db.delete(med)
    db.commit()
    return {"ok": True}
