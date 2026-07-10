from typing import Optional
from pydantic import BaseModel, EmailStr, Field

# Schema for login request
class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)

# Schema for token response (compliant with OAuth2 standard)
class TokenResponse(BaseModel):
    access_token: str
    token_type: str = Field(default="bearer")

# Schema for verified token payload data
class TokenPayload(BaseModel):
    sub: Optional[str] = None
