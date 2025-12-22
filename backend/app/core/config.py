"""
Application Configuration
Uses Pydantic Settings for validation
"""

from functools import lru_cache
from typing import List

from pydantic import Field, PostgresDsn, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings with validation"""

    # Project
    PROJECT_NAME: str = "MODELE API"
    VERSION: str = "1.0.0"
    DESCRIPTION: str = "FastAPI backend with OpenAPI/Swagger auto-generation"
    API_V1_STR: str = "/api/v1"

    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = False

    # CORS
    CORS_ORIGINS: List[str] = Field(
        default=["http://localhost:3000", "http://localhost:3001"],
        description="Allowed CORS origins",
    )

    # Database
    DATABASE_URL: PostgresDsn = Field(
        default="postgresql+asyncpg://user:password@localhost:5432/modele",
        description="Database connection URL",
    )

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def assemble_db_connection(cls, v: str | PostgresDsn) -> str:
        if isinstance(v, str):
            return v
        return str(v)

    # Security
    SECRET_KEY: str = Field(
        default="change-this-secret-key-in-production",
        description="Secret key for JWT tokens",
    )
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    @field_validator("SECRET_KEY")
    @classmethod
    def validate_secret_key(cls, v: str) -> str:
        """Validate SECRET_KEY is set and secure"""
        import os
        env = os.getenv("ENVIRONMENT", "development")
        
        if not v or v == "change-this-secret-key-in-production":
            if env == "production":
                raise ValueError(
                    "SECRET_KEY must be set to a secure value in production. "
                    "Generate one with: python -c 'import secrets; print(secrets.token_urlsafe(32))'"
                )
        elif len(v) < 32:
            raise ValueError("SECRET_KEY must be at least 32 characters long")
        
        return v

    # OpenAPI
    OPENAPI_TAGS: List[dict] = Field(
        default_factory=lambda: [
            {"name": "auth", "description": "Authentication"},
            {"name": "users", "description": "User management"},
        ]
    )

    # Redis Cache (optional)
    REDIS_URL: str = Field(
        default="",
        description="Redis connection URL for caching",
    )

    # SendGrid Email Configuration
    SENDGRID_API_KEY: str = Field(
        default="",
        description="SendGrid API key for sending emails",
    )
    SENDGRID_FROM_EMAIL: str = Field(
        default="noreply@example.com",
        description="Default sender email address",
    )
    SENDGRID_FROM_NAME: str = Field(
        default="MODELE",
        description="Default sender name",
    )

    # Database Connection Pool Configuration
    DB_POOL_SIZE: int = Field(
        default=10,
        description="Database connection pool size",
    )
    DB_MAX_OVERFLOW: int = Field(
        default=20,
        description="Database connection pool max overflow",
    )

    # Stripe Configuration
    STRIPE_SECRET_KEY: str = Field(
        default="",
        description="Stripe secret key",
    )
    STRIPE_PUBLISHABLE_KEY: str = Field(
        default="",
        description="Stripe publishable key",
    )
    STRIPE_WEBHOOK_SECRET: str = Field(
        default="",
        description="Stripe webhook secret for signature verification",
    )

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()


settings = get_settings()

