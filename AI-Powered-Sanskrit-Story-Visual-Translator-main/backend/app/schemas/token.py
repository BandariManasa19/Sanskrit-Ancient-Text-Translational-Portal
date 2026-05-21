"""
Token Schemas - Pydantic models for JWT authentication
"""
from pydantic import BaseModel
from typing import Optional


class Token(BaseModel):
    """Schema for JWT token response"""
    access_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds until expiration


class TokenData(BaseModel):
    """Schema for decoded token data"""
    username: Optional[str] = None
    user_id: Optional[int] = None


class TokenRefresh(BaseModel):
    """Schema for token refresh request"""
    refresh_token: str


class AuthResponse(BaseModel):
    """Schema for authentication response"""
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: dict
    message: str
