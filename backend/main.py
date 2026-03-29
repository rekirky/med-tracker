from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine
import models
from routers import users, medications, logs

models.Base.metadata.create_all(bind=engine)

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
