"""
Application Configuration
Uses Pydantic Settings for validation
"""

import os
from functools import lru_cache
from typing import List

from pydantic import Field, PostgresDsn, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings with validation"""

    # Project
    PROJECT_NAME: str = Field(
        default=os.getenv("PROJECT_NAME", "API"),
        description="Project name"
    )
    VERSION: str = "1.0.0"
    DESCRIPTION: str = "FastAPI backend with OpenAPI/Swagger auto-generation"
    API_V1_STR: str = "/api/v1"

    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = False

    # CORS - Use Union to accept both string and list
    CORS_ORIGINS: List[str] = Field(
        default=["http://localhost:3000", "http://localhost:3001"],
        description="Allowed CORS origins",
    )

    @model_validator(mode="before")
    @classmethod
    def parse_cors_origins(cls, data):
        """Parse CORS_ORIGINS from environment variable before Pydantic parsing"""
        import json
        import os
        
        # If data is a dict (normal case), check for CORS_ORIGINS
        if isinstance(data, dict):
            cors_value = data.get("CORS_ORIGINS")
            
            # If not set or empty, set default based on environment
            if not cors_value:
                env = os.getenv("ENVIRONMENT", "development")
                if env == "production":
                    data["CORS_ORIGINS"] = ["https://modele-nextjs-fullstack-production-1e92.up.railway.app"]
                else:
                    data["CORS_ORIGINS"] = ["http://localhost:3000", "http://localhost:3001"]
                return data
            
            # If it's already a list, keep it
            if isinstance(cors_value, list):
                return data
            
            # If it's a string, try to parse it
            if isinstance(cors_value, str):
                # Try JSON first
                try:
                    parsed = json.loads(cors_value)
                    if isinstance(parsed, list):
                        data["CORS_ORIGINS"] = parsed
                        return data
                except (json.JSONDecodeError, ValueError):
                    pass
                
                # Try comma-separated string
                if "," in cors_value:
                    origins = [origin.strip() for origin in cors_value.split(",") if origin.strip()]
                    if origins:
                        data["CORS_ORIGINS"] = origins
                        return data
                
                # Single string
                if cors_value.strip():
                    data["CORS_ORIGINS"] = [cors_value.strip()]
                    return data
            
            # If empty string, set default
            env = os.getenv("ENVIRONMENT", "development")
            if env == "production":
                data["CORS_ORIGINS"] = ["https://modele-nextjs-fullstack-production-1e92.up.railway.app"]
            else:
                data["CORS_ORIGINS"] = ["http://localhost:3000", "http://localhost:3001"]
        
        return data

    # Database
    DATABASE_URL: PostgresDsn = Field(
        default="postgresql+asyncpg://user:password@localhost:5432/modele",
        description="Database connection URL",
    )

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def assemble_db_connection(cls, v: str | PostgresDsn) -> str:
        if isinstance(v, str):
            # Convert postgresql:// to postgresql+asyncpg:// for async support
            if v.startswith("postgresql://") and not v.startswith("postgresql+asyncpg://"):
                v = v.replace("postgresql://", "postgresql+asyncpg://", 1)
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
        default=os.getenv("PROJECT_NAME", "App"),
        description="Default sender name",
    )

    @field_validator("SENDGRID_FROM_EMAIL")
    @classmethod
    def validate_email_format(cls, v: str) -> str:
        """Validate email format"""
        import re
        if v and not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', v):
            raise ValueError(f"Invalid email format: {v}")
        return v

    @field_validator("DATABASE_URL", mode="after")
    @classmethod
    def validate_database_url(cls, v: str) -> str:
        """Validate DATABASE_URL is set in production"""
        import os
        env = os.getenv("ENVIRONMENT", "development")
        
        if env == "production":
            if not v or v == "postgresql+asyncpg://user:password@localhost:5432/modele":
                raise ValueError(
                    "DATABASE_URL must be set to a valid PostgreSQL connection string in production"
                )
        
        return v

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

