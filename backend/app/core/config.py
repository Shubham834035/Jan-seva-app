import os
from typing import List, Union
from pydantic import AnyHttpUrl, validator
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Jan Seva - Citizen Problem Reporting & Resolution Platform"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "jan-seva-super-secret-production-grade-key-2026-prototype"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database
    DATABASE_URL: str = "sqlite:///./jan_seva.db"
    
    # Media & Uploads
    UPLOAD_DIR: str = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "uploads")
    MAX_UPLOAD_SIZE_BYTES: int = 5 * 1024 * 1024  # 5 MB
    ALLOWED_IMAGE_TYPES: List[str] = ["image/jpeg", "image/png", "image/webp", "image/jpg"]
    
    # CORS
BACKEND_CORS_ORIGINS: List[str] = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "https://jan-seva-app.vercel.app",
]
    
    # Environment & Demo Mode
    DEMO_MODE: bool = True
    DEMO_DISCLAIMER: str = (
        "PROTOTYPE NOTICE: This platform is an independent civic prototype and is not officially operated "
        "by the Government of India or municipal entities. Authority assignments and status updates are simulations."
    )

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()

# Ensure uploads directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(os.path.join(settings.UPLOAD_DIR, "complaints"), exist_ok=True)
os.makedirs(os.path.join(settings.UPLOAD_DIR, "resolutions"), exist_ok=True)
