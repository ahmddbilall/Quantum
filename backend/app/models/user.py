from sqlalchemy import Boolean, Column, String, DateTime, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.core.database import Base
import uuid


def default_user_profile() -> dict:
    return {
        "phone": "",
        "location": "",
        "bio": "",
    }


def default_user_preferences() -> dict:
    return {
        "categories": [],
        "sources": [],
        "watchlist": [],
        "updateFrequency": "real-time",
        "notifications": {
            "breaking": True,
            "daily": True,
            "weekly": False,
            "personalized": True,
        },
        "language": "English",
        "timezone": "UTC",
    }

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    preferences = Column(JSONB, default=default_user_preferences)
    profile = Column(JSONB, default=default_user_profile)
