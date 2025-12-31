"""
Structured Logging for Backend
Provides consistent logging with levels and context
"""

import logging
import sys
from typing import Any, Dict, Optional

from pythonjsonlogger import jsonlogger


class StructuredLogger:
    """Structured logger with JSON output"""

    def __init__(self, name: str = "app"):
        self.logger = logging.getLogger(name)
        self.logger.setLevel(logging.DEBUG)

        # Remove existing handlers
        self.logger.handlers = []

        # Create console handler with JSON formatter
        handler = logging.StreamHandler(sys.stdout)
        formatter = jsonlogger.JsonFormatter(
            "%(asctime)s %(name)s %(levelname)s %(message)s %(pathname)s %(lineno)d"
        )
        handler.setFormatter(formatter)
        self.logger.addHandler(handler)

    def _log(
        self,
        level: int,
        message: str,
        context: Optional[Dict[str, Any]] = None,
        exc_info: Optional[Exception] = None,
    ) -> None:
        """Internal logging method"""
        # Build extra dict for structured logging
        extra = context.copy() if context else {}
        if exc_info:
            extra["exception"] = {
                "type": type(exc_info).__name__,
                "message": str(exc_info),
            }
        
        # Use logger.log with extra dict - ensure it's passed correctly
        try:
            if exc_info:
                self.logger.log(level, message, extra=extra, exc_info=exc_info)
            else:
                self.logger.log(level, message, extra=extra)
        except TypeError as e:
            # Fallback if extra is not supported - log without extra
            if "extra" in str(e).lower():
                if exc_info:
                    self.logger.log(level, f"{message} | Context: {extra}", exc_info=exc_info)
                else:
                    self.logger.log(level, f"{message} | Context: {extra}")
            else:
                raise

    def debug(self, message: str, context: Optional[Dict[str, Any]] = None) -> None:
        """Log debug message"""
        self._log(logging.DEBUG, message, context)

    def info(self, message: str, context: Optional[Dict[str, Any]] = None) -> None:
        """Log info message"""
        self._log(logging.INFO, message, context)

    def warning(
        self,
        message: str,
        context: Optional[Dict[str, Any]] = None,
        exc_info: Optional[Exception] = None,
    ) -> None:
        """Log warning message"""
        self._log(logging.WARNING, message, context, exc_info)

    def error(
        self,
        message: str,
        context: Optional[Dict[str, Any]] = None,
        exc_info: Optional[Exception] = None,
    ) -> None:
        """Log error message"""
        self._log(logging.ERROR, message, context, exc_info)

    def critical(
        self,
        message: str,
        context: Optional[Dict[str, Any]] = None,
        exc_info: Optional[Exception] = None,
    ) -> None:
        """Log critical message"""
        self._log(logging.CRITICAL, message, context, exc_info)


# Create default logger instance
logger = StructuredLogger("app")

