"""
Unit tests for compression middleware
"""

import pytest
from fastapi import Request
from fastapi.responses import Response
from app.core.compression import CompressionMiddleware


class TestCompressionMiddleware:
    """Test CompressionMiddleware"""
    
    @pytest.fixture
    def middleware(self):
        """Create compression middleware instance"""
        return CompressionMiddleware(
            app=None,
            min_size=1024,
            compress_level=6,
            use_brotli=True,
        )
    
    def test_supports_compression_gzip(self, middleware):
        """Test GZip compression support detection"""
        supports_gzip, supports_brotli = middleware._supports_compression("gzip")
        assert supports_gzip is True
        assert supports_brotli is False
    
    def test_supports_compression_brotli(self, middleware):
        """Test Brotli compression support detection"""
        supports_gzip, supports_brotli = middleware._supports_compression("br, gzip")
        assert supports_gzip is True
        assert supports_brotli is True
    
    def test_compress_gzip(self, middleware):
        """Test GZip compression"""
        data = b"test data " * 200  # Make it large enough
        compressed = middleware._compress_gzip(data)
        
        assert compressed != data
        assert len(compressed) < len(data)
    
    def test_compress_brotli(self, middleware):
        """Test Brotli compression"""
        data = b"test data " * 200  # Make it large enough
        compressed = middleware._compress_brotli(data)
        
        if compressed:  # Brotli might not be available
            assert compressed != data
            assert len(compressed) < len(data)

