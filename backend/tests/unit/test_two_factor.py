"""
Unit tests for two-factor authentication utilities
"""

import pytest
import pyotp
from app.core.two_factor import (
    generate_2fa_secret,
    generate_2fa_qr_code,
    verify_2fa_token,
    generate_backup_codes,
)


class TestTwoFactorAuth:
    """Test 2FA utilities"""
    
    def test_generate_2fa_secret(self):
        """Test generating 2FA secret"""
        secret = generate_2fa_secret()
        
        assert secret is not None
        assert len(secret) > 0
        # Should be base32 encoded
        assert isinstance(secret, str)
    
    def test_verify_2fa_token_valid(self):
        """Test verifying valid 2FA token"""
        secret = generate_2fa_secret()
        totp = pyotp.TOTP(secret)
        token = totp.now()
        
        assert verify_2fa_token(secret, token) is True
    
    def test_verify_2fa_token_invalid(self):
        """Test verifying invalid 2FA token"""
        secret = generate_2fa_secret()
        
        assert verify_2fa_token(secret, "000000") is False
    
    def test_generate_backup_codes(self):
        """Test generating backup codes"""
        codes = generate_backup_codes()
        
        assert len(codes) == 10  # Default number of backup codes
        assert all(len(code) == 8 for code in codes)  # Each code should be 8 characters
        assert len(set(codes)) == 10  # All codes should be unique
    
    def test_generate_backup_codes_custom_count(self):
        """Test generating custom number of backup codes"""
        codes = generate_backup_codes(count=5)
        
        assert len(codes) == 5
        assert all(len(code) == 8 for code in codes)

