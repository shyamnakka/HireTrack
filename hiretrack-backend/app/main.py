from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import Base, engine
from app.database import get_db
from app.api.routes.auth import router as auth_router
from app.api.routes.users import router as users_router
from app.api.routes.applications import router as applications_router
from app.api.routes.interviews import router as interviews_router
from app.api.routes.reminders import router as reminders_router

# Import models to ensure they are registered with Base.metadata before calling create_all
import app.models

# Create tables in the database on startup (for local development)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="HireTrack API",
    description="Student Placement and Job Application Tracking System API",
    version="1.0.0"
)

from fastapi.middleware.cors import CORSMiddleware

# Enable CORS for the local frontend development origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register endpoints
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(applications_router)
app.include_router(interviews_router)
app.include_router(reminders_router)

@app.get("/")
def read_root():
    return {"message": "HireTrack API is running"}

@app.get("/db-health")
def db_health(db: Session = Depends(get_db)):
    try:
        # Run a simple query to verify database connectivity
        db.execute(text("SELECT 1"))
        return {
            "status": "success",
            "message": "PostgreSQL database connected successfully"
        }
    except Exception as e:
        # Return a clear error response when the connection fails
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database connection failed: {str(e)}"
        )
