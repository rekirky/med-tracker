from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import json
from database import get_db
import models

router = APIRouter()


class MedicationCreate(BaseModel):
    user_id: int
    name: str
    dosage: Optional[str] = None
    scheduled_times: Optional[list[str]] = []
    notes: Optional[str] = None


class MedicationUpdate(BaseModel):
    name: Optional[str] = None
    dosage: Optional[str] = None
    scheduled_times: Optional[list[str]] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = None


def med_to_dict(med):
    return {
        "id": med.id,
        "user_id": med.user_id,
        "name": med.name,
        "dosage": med.dosage,
        "scheduled_times": json.loads(med.scheduled_times) if med.scheduled_times else [],
        "notes": med.notes,
        "is_active": med.is_active,
    }


@router.get("/user/{user_id}")
def get_user_medications(user_id: int, active_only: bool = True, db: Session = Depends(get_db)):
    query = db.query(models.Medication).filter(models.Medication.user_id == user_id)
    if active_only:
        query = query.filter(models.Medication.is_active == True)
    meds = query.order_by(models.Medication.name).all()
    return [med_to_dict(m) for m in meds]


@router.post("/")
def create_medication(med: MedicationCreate, db: Session = Depends(get_db)):
    db_med = models.Medication(
        user_id=med.user_id,
        name=med.name.strip(),
        dosage=med.dosage,
        scheduled_times=json.dumps(sorted(med.scheduled_times or [])),
        notes=med.notes,
    )
    db.add(db_med)
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
    if update.scheduled_times is not None:
        med.scheduled_times = json.dumps(sorted(update.scheduled_times))
    if update.notes is not None:
        med.notes = update.notes
    if update.is_active is not None:
        med.is_active = update.is_active
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
