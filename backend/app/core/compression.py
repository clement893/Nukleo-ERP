"""
HTTP Compression Middleware
GZip compression for API responses
"""

from fastapi import Request
from fastapi.responses import Response
from starlette.middleware.base import BaseHTTPMiddleware
import gzip
from typing import Callable


class CompressionMiddleware(BaseHTTPMiddleware):
    """Middleware for GZip compression of responses"""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Check if client accepts gzip encoding
        accept_encoding = request.headers.get("Accept-Encoding", "")
        supports_gzip = "gzip" in accept_encoding.lower()
        
        # Call the next middleware/endpoint
        response = await call_next(request)
        
        # Only compress if client accepts gzip and response is JSON/text
        if supports_gzip and response.status_code < 400:
            content_type = response.headers.get("Content-Type", "")
            
            # Compress JSON and text responses (skip binary, images, etc.)
            if "application/json" in content_type or "text/" in content_type or "application/javascript" in content_type:
                # Get response body
                body = response.body
                
                # Skip if already compressed or too small (compression overhead not worth it)
                if len(body) > 1024:  # Only compress if > 1KB
                    # Compress the body (level 6 = good balance between speed and size)
                    compressed_body = gzip.compress(body, compresslevel=6)
                    
                    # Only use compressed version if it's actually smaller
                    if len(compressed_body) < len(body):
                        # Update response
                        response.body = compressed_body
                        response.headers["Content-Encoding"] = "gzip"
                        response.headers["Content-Length"] = str(len(compressed_body))
                        
                        # Update Vary header if it exists
                        vary = response.headers.get("Vary", "")
                        if "Accept-Encoding" not in vary:
                            response.headers["Vary"] = f"{vary}, Accept-Encoding".strip(", ")
        
        return response
