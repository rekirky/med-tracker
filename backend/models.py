from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    medications = relationship("Medication", back_populates="user", cascade="all, delete-orphan")


class Medication(Base):
    __tablename__ = "medications"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    dosage = Column(String)
    scheduled_times = Column(Text, default="[]")  # JSON array of "HH:MM" strings
    notes = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    user = relationship("User", back_populates="medications")


class MedicationLog(Base):
    __tablename__ = "medication_logs"
    id = Column(Integer, primary_key=True)
    medication_id = Column(Integer, nullable=True)  # kept for grouping; nullable if med deleted
    medication_name = Column(String, nullable=False)  # stored at log time so history survives deletes
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    taken_at = Column(DateTime, server_default=func.now())
    notes = Column(Text)
