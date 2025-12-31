"""
Database Health Middleware
Monitors database health and provides early warning for schema issues
"""

from typing import Callable
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp
from app.core.logging import logger
from app.core.database import AsyncSessionLocal
from app.core.schema_validator import SchemaValidator


class DatabaseHealthMiddleware(BaseHTTPMiddleware):
    """
    Middleware that monitors database health and logs warnings
    for schema compatibility issues
    """
    
    def __init__(self, app: ASGIApp, check_interval: int = 100):
        """
        Args:
            app: ASGI application
            check_interval: Number of requests between health checks (default: 100)
        """
        super().__init__(app)
        self.check_interval = check_interval
        self.request_count = 0
        self.last_check_result = None
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Process request and check database health periodically"""
        self.request_count += 1
        
        # Perform health check periodically (not on every request for performance)
        if self.request_count % self.check_interval == 0:
            try:
                # Quick check: verify critical tables exist
                async with AsyncSessionLocal() as session:
                    # Check if projects table has required columns
                    has_client_id = await SchemaValidator.check_column_exists(
                        session, 'projects', 'client_id'
                    )
                    has_responsable_id = await SchemaValidator.check_column_exists(
                        session, 'projects', 'responsable_id'
                    )
                    
                    if not has_client_id or not has_responsable_id:
                        logger.warning(
                            "Database schema may be out of sync. "
                            "Some columns are missing. Consider running: alembic upgrade head",
                            context={
                                "has_client_id": has_client_id,
                                "has_responsable_id": has_responsable_id,
                                "request_path": request.url.path
                            }
                        )
            except Exception as e:
                # Don't log on every check to avoid spam
                if self.request_count % (self.check_interval * 10) == 0:
                    logger.debug(f"Database health check error: {e}")
        
        # Process the request
        response = await call_next(request)
        return response
