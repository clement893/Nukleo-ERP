"""
Centralized Error Handler
Handles all exceptions and returns standardized error responses
"""

from typing import Any, Dict

from fastapi import Request, status
from fastapi.responses import JSONResponse
from pydantic import ValidationError as PydanticValidationError
from sqlalchemy.exc import SQLAlchemyError

from app.core.exceptions import AppException
from app.core.logging import logger
from app.core.logging_utils import sanitize_log_data


async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
    """Handle application exceptions"""
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

    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": {
                "code": exc.__class__.__name__,
                "message": exc.message,
                "details": exc.details,
            },
            "timestamp": None,  # Will be set by middleware
        },
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
    context = sanitize_log_data({
        "path": request.url.path,
        "method": request.method,
    })
    logger.error(
        "Unhandled exception",
        context=context,
        exc_info=exc,
    )

    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected error occurred",
                "details": {},
            },
            "timestamp": None,
        },
    )

