from typing import Optional, Literal
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field
from uuid import UUID


class NotificationPreferences(BaseModel):
    breaking: bool = True
    daily: bool = True
    weekly: bool = False
    personalized: bool = True


class UserPreferences(BaseModel):
    class WatchlistItem(BaseModel):
        symbol: str
        name: str
        type: Literal["stock", "crypto"]
        price: str = "--"
        change: str = "--"
        changePercent: str = "--"

    categories: list[str] = Field(default_factory=list)
    sources: list[str] = Field(default_factory=list)
    watchlist: list[WatchlistItem] = Field(default_factory=list)
    updateFrequency: str = "real-time"
    notifications: NotificationPreferences = Field(default_factory=NotificationPreferences)
    language: str = "English"
    timezone: str = "UTC"


class UserProfile(BaseModel):
    phone: str = ""
    location: str = ""
    bio: str = ""

class UserBase(BaseModel):
    email: EmailStr = Field(..., description="User email address")
    full_name: Optional[str] = Field(None, description="User full name")
    is_active: Optional[bool] = True
    is_superuser: bool = False

class UserCreate(UserBase):
    password: str = Field(..., min_length=8, description="Password must be at least 8 characters")

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    password: Optional[str] = None
    email: Optional[EmailStr] = None
    preferences: Optional[UserPreferences] = None
    profile: Optional[UserProfile] = None

class UserInDBBase(UserBase):
    id: UUID
    created_at: Optional[datetime] = None
    preferences: UserPreferences = Field(default_factory=UserPreferences)
    profile: UserProfile = Field(default_factory=UserProfile)

    class Config:
        from_attributes = True

class User(UserInDBBase):
    pass

class UserInDB(UserInDBBase):
    hashed_password: str
