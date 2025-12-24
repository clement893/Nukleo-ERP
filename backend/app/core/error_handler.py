"""
Centralized Error Handler
Handles all exceptions and returns standardized error responses
"""

from typing import Dict, Union

from fastapi import Request, status
from fastapi.responses import JSONResponse
from pydantic import ValidationError as PydanticValidationError
from sqlalchemy.exc import SQLAlchemyError

from app.core.exceptions import AppException
from app.core.logging import logger
from app.core.logging_utils import sanitize_log_data


async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
    """Handle application exceptions"""
    from app.core.config import settings
    
    context = sanitize_log_data({
        "status_code": exc.status_code,
        "details": exc.details,
        "path": request.url.path,
        "method": request.method,
    })
    logger.error(
        f"Application error: {exc.message}",
        context=context,
        exc_info=exc,
    )

    # En production, masquer les détails pour éviter la fuite d'information
    if settings.ENVIRONMENT == "production":
        error_response = {
            "success": False,
            "error": {
                "code": "APPLICATION_ERROR",
                "message": "An error occurred. Please contact support if the problem persists.",
            },
            "timestamp": None,
        }
    else:
        # En développement, permettre plus de détails
        error_response = {
            "success": False,
            "error": {
                "code": exc.__class__.__name__,
                "message": exc.message,
                "details": exc.details,
            },
            "timestamp": None,
        }

    return JSONResponse(
        status_code=exc.status_code,
        content=error_response,
    )


async def validation_exception_handler(
    request: Request, exc: PydanticValidationError
) -> JSONResponse:
    """Handle Pydantic validation errors"""
    errors = []
    for error in exc.errors():
        errors.append({
            "field": ".".join(str(loc) for loc in error["loc"]),
            "message": error["msg"],
            "code": error["type"],
        })

    context = sanitize_log_data({
        "errors": errors,
        "path": request.url.path,
        "method": request.method,
    })
    logger.warning(
        "Validation error",
        context=context,
    )

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Validation failed",
                "validationErrors": errors,
            },
            "timestamp": None,
        },
    )


async def database_exception_handler(request: Request, exc: SQLAlchemyError) -> JSONResponse:
    """Handle database errors"""
    context = sanitize_log_data({
        "path": request.url.path,
        "method": request.method,
    })
    logger.error(
        "Database error",
        context=context,
        exc_info=exc,
    )

    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "error": {
                "code": "DATABASE_ERROR",
                "message": "A database error occurred",
                "details": {},
            },
            "timestamp": None,
        },
    )


async def general_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handle all other exceptions"""
    from app.core.config import settings
    
    context = sanitize_log_data({
        "path": request.url.path,
        "method": request.method,
    })
    logger.error(
        f"Unhandled exception: {exc}",
        context=context,
        exc_info=exc,
    )

    # En production, ne pas exposer les détails de l'exception
    if settings.ENVIRONMENT == "production":
        error_response = {
            "success": False,
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An internal error occurred. Please contact support.",
            },
            "timestamp": None,
        }
    else:
        # En développement, permettre plus de détails pour le débogage
        error_response = {
            "success": False,
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": str(exc),
                "type": exc.__class__.__name__,
            },
            "timestamp": None,
        }

    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=error_response,
    )

