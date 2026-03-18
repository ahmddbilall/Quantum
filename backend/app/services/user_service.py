from typing import Optional, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.user import User, default_user_preferences, default_user_profile
from app.schemas.user import UserCreate, UserUpdate
from app.core import security

class UserService:
    async def get_by_email(self, db: AsyncSession, email: str) -> Optional[User]:
        result = await db.execute(select(User).where(User.email == email))
        return result.scalars().first()

    async def create(self, db: AsyncSession, obj_in: UserCreate) -> User:
        db_obj = User(
            email=obj_in.email,
            hashed_password=security.get_password_hash(obj_in.password),
            full_name=obj_in.full_name,
            is_active=obj_in.is_active,
            is_superuser=obj_in.is_superuser,
            preferences=default_user_preferences(),
            profile=default_user_profile(),
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def update(self, db: AsyncSession, *, db_obj: User, obj_in: UserUpdate) -> User:
        update_data = obj_in.model_dump(exclude_unset=True)

        if "profile" in update_data and update_data["profile"] is not None:
            base_profile = default_user_profile()
            existing_profile = db_obj.profile if isinstance(db_obj.profile, dict) else {}
            incoming_profile = (
                update_data["profile"] if isinstance(update_data["profile"], dict) else {}
            )
            update_data["profile"] = {
                **base_profile,
                **existing_profile,
                **incoming_profile,
            }

        if "preferences" in update_data and update_data["preferences"] is not None:
            base_preferences = default_user_preferences()
            existing_preferences = db_obj.preferences if isinstance(db_obj.preferences, dict) else {}
            incoming_preferences = (
                update_data["preferences"]
                if isinstance(update_data["preferences"], dict)
                else {}
            )

            existing_notifications = (
                existing_preferences.get("notifications", {})
                if isinstance(existing_preferences.get("notifications", {}), dict)
                else {}
            )
            incoming_notifications = (
                incoming_preferences.get("notifications", {})
                if isinstance(incoming_preferences.get("notifications", {}), dict)
                else {}
            )

            merged_preferences = {
                **base_preferences,
                **existing_preferences,
                **incoming_preferences,
            }
            merged_preferences["notifications"] = {
                **base_preferences["notifications"],
                **existing_notifications,
                **incoming_notifications,
            }
            update_data["preferences"] = merged_preferences
        
        if "password" in update_data:
            hashed_password = security.get_password_hash(update_data["password"])
            del update_data["password"]
            update_data["hashed_password"] = hashed_password
            
        for field in update_data:
            setattr(db_obj, field, update_data[field])

        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def authenticate(self, db: AsyncSession, email: str, password: str) -> Optional[User]:
        user = await self.get_by_email(db, email=email)
        if not user:
            return None
        if not security.verify_password(password, user.hashed_password):
            return None
        return user

user_service = UserService()
