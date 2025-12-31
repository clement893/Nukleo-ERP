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
        
        # Remove reserved LogRecord attributes from extra to avoid KeyError
        # These are set by Python's logging system and cannot be overwritten
        reserved_attrs = {
            'message', 'name', 'msg', 'args', 'created', 'filename', 
            'funcName', 'levelname', 'levelno', 'lineno', 'module', 
            'msecs', 'pathname', 'process', 'processName', 'relativeCreated',
            'thread', 'threadName', 'exc_info', 'exc_text', 'stack_info'
        }
        
        # Filter out reserved attributes
        filtered_extra = {k: v for k, v in extra.items() if k not in reserved_attrs}
        
        # If 'message' was in context, rename it
        if "message" in extra and "message" not in filtered_extra:
            filtered_extra["log_message"] = extra["message"]
        
        if exc_info:
            filtered_extra["exception"] = {
                "type": type(exc_info).__name__,
                "message": str(exc_info),
            }
        
        # Use logger.log with extra dict - ensure it's passed correctly
        try:
            if exc_info:
                self.logger.log(level, message, extra=filtered_extra, exc_info=exc_info)
            else:
                self.logger.log(level, message, extra=filtered_extra)
        except (TypeError, KeyError) as e:
            # Fallback if extra is not supported or there's a KeyError - log without extra
            if "extra" in str(e).lower() or "message" in str(e).lower():
                if exc_info:
                    self.logger.log(level, f"{message} | Context: {filtered_extra}", exc_info=exc_info)
                else:
                    self.logger.log(level, f"{message} | Context: {filtered_extra}")
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

