from typing import Any, Dict, List, Optional, Union
from pydantic import AnyHttpUrl, PostgresDsn, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8

    POSTGRES_SERVER: str
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str
    POSTGRES_PORT: int = 5432
    SQLALCHEMY_DATABASE_URI: Optional[PostgresDsn] = None
    SQLALCHEMY_ECHO: bool = False

    @field_validator("SQLALCHEMY_DATABASE_URI", mode="before")
    @classmethod
    def assemble_db_connection(cls, v: Optional[str], info: Any) -> Any:
        if isinstance(v, str):
            return v
        
        # Build async connection string
        return PostgresDsn.build(
            scheme="postgresql+asyncpg",
            username=info.data.get("POSTGRES_USER"),
            password=info.data.get("POSTGRES_PASSWORD"),
            host=info.data.get("POSTGRES_SERVER"),
            port=info.data.get("POSTGRES_PORT"),
            path=info.data.get("POSTGRES_DB"),
        )

    BACKEND_CORS_ORIGINS: List[AnyHttpUrl] = []

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, str) and v.startswith("["):
            import json
            try:
                return json.loads(v)
            except json.JSONDecodeError:
                return []
        return v
    
    GEMINI_API_KEY: Optional[str] = None
    GROQ_API_KEY: Optional[str] = None
    NEWS_API_KEY: Optional[str] = None
    GOOGLE_CLIENT_ID: Optional[str] = None
    GOOGLE_CLIENT_SECRET: Optional[str] = None
    GOOGLE_CLIENT_IDS: List[str] = []
    EMBEDDING_MODEL_PATH: Optional[str] = None
    EMBEDDING_WARMUP_ON_STARTUP: bool = True
    SENTIMENT_MODEL_DIR: Optional[str] = None
    SENTIMENT_JOB_ENABLED: bool = True
    SENTIMENT_JOB_INTERVAL_MINUTES: int = 10
    SENTIMENT_JOB_BATCH_SIZE: int = 50
    SENTIMENT_JOB_MAX_ARTICLES: Optional[int] = None

    # RAG / LLM routing
    SECONDARY_MODEL_URL: Optional[str] = None
    PRIMARY_MODEL_API_KEY: Optional[str] = None
    PRIMARY_MODEL_NAME: str = "models/gemini-2.0-flash"
    RAG_TOP_K: int = 5
    RAG_MAX_RETRIES: int = 2
    RAG_HISTORY_LIMIT: int = 20
    SENTIMENT_ADMIN_KEY: Optional[str] = None

    @field_validator("GOOGLE_CLIENT_IDS", mode="before")
    @classmethod
    def assemble_google_client_ids(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [item.strip() for item in v.split(",") if item.strip()]
        if isinstance(v, str) and v.startswith("["):
            import json

            try:
                raw = json.loads(v)
                if isinstance(raw, list):
                    return [str(item).strip() for item in raw if str(item).strip()]
            except json.JSONDecodeError:
                return []
        if isinstance(v, list):
            return [str(item).strip() for item in v if str(item).strip()]
        return []

    model_config = SettingsConfigDict(
        env_file=".env", case_sensitive=True, env_file_encoding="utf-8"
    )


settings = Settings()
