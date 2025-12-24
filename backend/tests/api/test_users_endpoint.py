"""
API endpoint tests for users
"""

import pytest
from httpx import AsyncClient


@pytest.mark.api
class TestUsersEndpoint:
    """Test users API endpoints"""
    
    @pytest.mark.asyncio
    async def test_list_users_pagination(
        self,
        client: AsyncClient,
        test_user_token: str,
    ):
        """Test listing users with pagination"""
        headers = {"Authorization": f"Bearer {test_user_token}"}
        
        response = await client.get(
            "/api/v1/users/?page=1&page_size=10",
            headers=headers,
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "total" in data
        assert "page" in data
        assert "page_size" in data
        assert "total_pages" in data
        assert "has_next" in data
        assert "has_previous" in data
    
    @pytest.mark.asyncio
    async def test_list_users_filter_active(
        self,
        client: AsyncClient,
        test_user_token: str,
    ):
        """Test filtering users by active status"""
        headers = {"Authorization": f"Bearer {test_user_token}"}
        
        response = await client.get(
            "/api/v1/users/?is_active=true",
            headers=headers,
        )
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data["items"], list)
    
    @pytest.mark.asyncio
    async def test_list_users_search(
        self,
        client: AsyncClient,
        test_user_token: str,
    ):
        """Test searching users"""
        headers = {"Authorization": f"Bearer {test_user_token}"}
        
        response = await client.get(
            "/api/v1/users/?search=test",
            headers=headers,
        )
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data["items"], list)
    
    @pytest.mark.asyncio
    async def test_get_user_by_id(
        self,
        client: AsyncClient,
        test_user_token: str,
        db_session,
    ):
        """Test getting user by ID"""
        # First, get current user to get an ID
        headers = {"Authorization": f"Bearer {test_user_token}"}
        me_response = await client.get("/api/v1/users/me", headers=headers)
        
        if me_response.status_code == 200:
            user_id = me_response.json()["id"]
            
            response = await client.get(
                f"/api/v1/users/{user_id}",
                headers=headers,
            )
            
            assert response.status_code == 200
            data = response.json()
            assert "id" in data
            assert "email" in data
    
    @pytest.mark.asyncio
    async def test_get_user_not_found(
        self,
        client: AsyncClient,
        test_user_token: str,
    ):
        """Test getting non-existent user"""
        headers = {"Authorization": f"Bearer {test_user_token}"}
        
        response = await client.get(
            "/api/v1/users/99999",
            headers=headers,
        )
        
        assert response.status_code == 404

