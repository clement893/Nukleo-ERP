"""Tests for authentication endpoints."""

import pytest
from httpx import AsyncClient

from app.main import app


@pytest.mark.asyncio
async def test_register_user():
    """Test user registration."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post(
            "/api/auth/register",
            json={
                "email": "test@example.com",
                "name": "Test User",
                "password": "password123",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "test@example.com"
        assert data["name"] == "Test User"


@pytest.mark.asyncio
async def test_register_duplicate_email():
    """Test registering with duplicate email."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        # First registration
        await client.post(
            "/api/auth/register",
            json={
                "email": "duplicate@example.com",
                "name": "User 1",
                "password": "password123",
            },
        )

        # Second registration with same email
        response = await client.post(
            "/api/auth/register",
            json={
                "email": "duplicate@example.com",
                "name": "User 2",
                "password": "password123",
            },
        )
        assert response.status_code == 400


@pytest.mark.asyncio
async def test_login():
    """Test user login."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        # Register user
        await client.post(
            "/api/auth/register",
            json={
                "email": "login@example.com",
                "name": "Login User",
                "password": "password123",
            },
        )

        # Login
        response = await client.post(
            "/api/auth/login",
            json={
                "email": "login@example.com",
                "password": "password123",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_login_invalid_credentials():
    """Test login with invalid credentials."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post(
            "/api/auth/login",
            json={
                "email": "nonexistent@example.com",
                "password": "wrongpassword",
            },
        )
        assert response.status_code == 401
