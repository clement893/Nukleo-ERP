"""
Shared utilities for import logging via Server-Sent Events (SSE)
"""
from typing import Dict, List, Optional
from datetime import datetime as dt
import json
import asyncio
from fastapi import HTTPException, status, Request, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.models.user import User
from app.core.logging import logger

# In-memory store for import logs (in production, use Redis)
import_logs: Dict[str, List[Dict[str, any]]] = {}
import_status: Dict[str, Dict[str, any]] = {}


def add_import_log(import_id: str, message: str, level: str = "info", data: Optional[Dict] = None):
    """Add a log entry to the import logs"""
    if import_id not in import_logs:
        import_logs[import_id] = []
    
    log_entry = {
        "timestamp": dt.now().isoformat(),
        "level": level,
        "message": message,
        "data": data or {}
    }
    import_logs[import_id].append(log_entry)
    
    # Keep only last 1000 logs per import
    if len(import_logs[import_id]) > 1000:
        import_logs[import_id] = import_logs[import_id][-1000:]


def update_import_status(import_id: str, status: str, progress: Optional[int] = None, total: Optional[int] = None):
    """Update import status"""
    if import_id not in import_status:
        import_status[import_id] = {}
    
    import_status[import_id].update({
        "status": status,
        "updated_at": dt.now().isoformat()
    })
    
    if progress is not None:
        import_status[import_id]["progress"] = progress
    if total is not None:
        import_status[import_id]["total"] = total


async def get_current_user_from_query(
    request: Request,
    db: AsyncSession,
) -> User:
    """
    Get current user from query parameter (for SSE endpoints that can't use headers)
    EventSource doesn't support custom headers, so we accept token in query params
    """
    from app.core.security import decode_token
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # Try to get token from query parameter first (for SSE)
    token = request.query_params.get("token")
    
    # Fallback to Authorization header if no query param
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header.replace("Bearer ", "")
    
    if not token:
        raise credentials_exception
    
    # Decode token
    payload = decode_token(token, token_type="access")
    if not payload:
        raise credentials_exception
    
    username: str = payload.get("sub")
    if username is None:
        raise credentials_exception
    
    # Get user from database
    result = await db.execute(select(User).where(User.email == username))
    user = result.scalar_one_or_none()
    
    if user is None or not user.is_active:
        raise credentials_exception
    
    return user


async def stream_import_logs_generator(import_id: str):
    """Generator function for SSE streaming of import logs"""
    last_index = 0
    
    while True:
        # Check if import is complete
        if import_id in import_status:
            status_info = import_status[import_id]
            if status_info.get("status") == "completed" or status_info.get("status") == "failed":
                # Send final logs
                if import_id in import_logs:
                    logs = import_logs[import_id]
                    for log in logs[last_index:]:
                        yield f"data: {json.dumps(log)}\n\n"
                
                # Send final status
                yield f"data: {json.dumps({'type': 'status', 'data': status_info})}\n\n"
                yield f"data: {json.dumps({'type': 'done'})}\n\n"
                break
        
        # Send new logs
        if import_id in import_logs:
            logs = import_logs[import_id]
            if len(logs) > last_index:
                for log in logs[last_index:]:
                    yield f"data: {json.dumps(log)}\n\n"
                last_index = len(logs)
        
        # Send status update
        if import_id in import_status:
            status_info = import_status[import_id]
            yield f"data: {json.dumps({'type': 'status', 'data': status_info})}\n\n"
        
        await asyncio.sleep(0.5)  # Check every 500ms


def create_sse_logs_endpoint(router, endpoint_path: str):
    """
    Create an SSE logs endpoint for a router
    
    Args:
        router: FastAPI router instance
        endpoint_path: Path for the endpoint (e.g., "/import/{import_id}/logs")
    """
    @router.get(endpoint_path)
    async def stream_import_logs(
        import_id: str,
        request: Request,
        current_user: User = Depends(get_current_user_from_query),
        db: AsyncSession = Depends(get_db),
    ):
        """
        Stream import logs via Server-Sent Events (SSE)
        Note: Uses query parameter authentication because EventSource doesn't support custom headers
        """
        return StreamingResponse(
            stream_import_logs_generator(import_id),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",
            }
        )
