import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.core.database import Base, engine
from app.api.v1 import (
    auth,
    complaints,
    common_problems,
    officer,
    admin,
    categories,
    areas,
    analytics,
    notifications,
)

# Automatically create tables if not existing
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Citizen Problem Reporting, Smart Routing & Resolution Platform for India (MVP Prototype)",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static media mount for attachments (complaint evidence & resolution proofs)
if os.path.exists(settings.UPLOAD_DIR):
    app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Include Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(complaints.router, prefix=settings.API_V1_STR)
app.include_router(common_problems.router, prefix=settings.API_V1_STR)
app.include_router(officer.router, prefix=settings.API_V1_STR)
app.include_router(admin.router, prefix=settings.API_V1_STR)
app.include_router(categories.router, prefix=settings.API_V1_STR)
app.include_router(areas.router, prefix=settings.API_V1_STR)
app.include_router(analytics.router, prefix=settings.API_V1_STR)
app.include_router(notifications.router, prefix=settings.API_V1_STR)

@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "demo_mode": settings.DEMO_MODE,
        "disclaimer": settings.DEMO_DISCLAIMER
    }

@app.get("/", tags=["Root"])
def root():
    return {
        "message": "Welcome to Jan Seva - Citizen Problem Reporting & Smart Routing Platform",
        "version": "1.0.0",
        "api_docs": "/docs",
        "prototype_notice": settings.DEMO_DISCLAIMER
    }
