from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from database import engine, SessionLocal
import models
from routers import users, medications, logs

models.Base.metadata.create_all(bind=engine)


def migrate_db():
    """Idempotent column migrations — safe to run on every startup."""
    with engine.connect() as conn:
        migrations = [
            "ALTER TABLE users ADD COLUMN gender TEXT",
            "ALTER TABLE medications ADD COLUMN frequency TEXT DEFAULT 'on-demand'",
            "ALTER TABLE medications ADD COLUMN daily_time TEXT",
        ]
        for sql in migrations:
            try:
                conn.execute(text(sql))
            except Exception:
                pass  # column already exists
        conn.commit()


migrate_db()

app = FastAPI(title="Med Tracker API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(medications.router, prefix="/api/medications", tags=["medications"])
app.include_router(logs.router, prefix="/api/logs", tags=["logs"])


@app.get("/api/health")
def health():
    return {"status": "ok"}
