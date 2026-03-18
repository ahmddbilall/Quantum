from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status, Body
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

from app.api import deps
from app.core import security, config
from app.schemas.token import Token
from app.schemas.user import User, UserCreate
from app.services.user_service import user_service
# Import models to ensure no circular import error if needed, though service handles DB ops.

router = APIRouter()

@router.post("/login", response_model=Token)
async def login_access_token(
    db: AsyncSession = Depends(deps.get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    user = await user_service.authenticate(
        db, email=form_data.username, password=form_data.password
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    elif not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    
    access_token_expires = timedelta(minutes=config.settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": security.create_access_token(
            user.email, expires_delta=access_token_expires
        ),
        "token_type": "bearer",
    }

@router.post("/register", response_model=User)
async def register_user(
    *,
    db: AsyncSession = Depends(deps.get_db),
    user_in: UserCreate
) -> Any:
    user = await user_service.get_by_email(db, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system",
        )
    user = await user_service.create(db, obj_in=user_in)
    return user

@router.post("/social-login", response_model=Token)
async def social_login(
    *,
    db: AsyncSession = Depends(deps.get_db),
    provider: str = Body(...),
    token_id: str = Body(...)
) -> Any:
    if provider != "google":
        raise HTTPException(status_code=400, detail="Unsupported provider")

    allowed_client_ids = list(config.settings.GOOGLE_CLIENT_IDS or [])
    if config.settings.GOOGLE_CLIENT_ID:
        primary_client_id = config.settings.GOOGLE_CLIENT_ID.strip()
        if primary_client_id and primary_client_id not in allowed_client_ids:
            allowed_client_ids.append(primary_client_id)

    if not allowed_client_ids:
        raise HTTPException(
            status_code=500,
            detail="Server misconfigured: Missing GOOGLE_CLIENT_ID/GOOGLE_CLIENT_IDS",
        )

    try:
        # Validate Google Token
        id_info = id_token.verify_oauth2_token(
            token_id,
            google_requests.Request(),
            None,
        )

        token_audience = id_info.get("aud")
        if token_audience not in allowed_client_ids:
            raise HTTPException(status_code=400, detail="Invalid token audience")

        if not id_info.get("email_verified", False):
            raise HTTPException(status_code=400, detail="Google email is not verified")
        
        email = id_info.get('email')
        name = id_info.get('name')
        
        if not email:
             raise HTTPException(status_code=400, detail="Invalid token: Email not found")
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid token: {str(e)}")

    # Check if user exists
    user = await user_service.get_by_email(db, email=email)
    if not user:
        # Create new user with random password
        import secrets
        random_password = secrets.token_urlsafe(16)
        user_in = UserCreate(email=email, password=random_password, full_name=name)
        user = await user_service.create(db, obj_in=user_in)
    
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")

    access_token_expires = timedelta(minutes=config.settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": security.create_access_token(
            user.email, expires_delta=access_token_expires
        ),
        "token_type": "bearer",
    }
