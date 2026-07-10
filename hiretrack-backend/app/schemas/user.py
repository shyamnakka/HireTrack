from datetime import datetime
from pydantic import BaseModel, EmailStr, ConfigDict, Field


# Base schema containing common user fields
class UserBase(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr


# Schema for user registration request
class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=128)


# Schema for partial profile update requests
class UserUpdate(BaseModel):
    name: str | None = Field(
        default=None,
        min_length=2,
        max_length=100
    )

    email: EmailStr | None = None

    password: str | None = Field(
        default=None,
        min_length=8,
        max_length=128
    )


# Schema for safe API responses
class UserResponse(UserBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)