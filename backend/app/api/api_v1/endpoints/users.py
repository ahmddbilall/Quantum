from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api import deps
from app.schemas.user import User, UserUpdate
from app.services.user_service import user_service

router = APIRouter()

@router.get("/me", response_model=User)
async def read_user_me(
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    return current_user

@router.patch("/me", response_model=User)
async def update_user_me(
    *,
    db: AsyncSession = Depends(deps.get_db),
    user_in: UserUpdate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    user = await user_service.update(db, db_obj=current_user, obj_in=user_in)
    return user
