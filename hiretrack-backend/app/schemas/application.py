from datetime import date, datetime
from decimal import Decimal
from typing import Literal, Optional
from pydantic import BaseModel, Field, HttpUrl, ConfigDict

# Allowed stages for the application.status field
ApplicationStatus = Literal[
    "Applied",
    "Online Assessment",
    "Technical Interview",
    "HR Interview",
    "Selected",
    "Rejected",
    "Withdrawn"
]

# Base schema with common fields for applications
class ApplicationBase(BaseModel):
    company_name: str = Field(min_length=2, max_length=100)
    job_role: str = Field(min_length=2, max_length=100)
    job_location: Optional[str] = Field(default=None, max_length=100)
    job_url: Optional[HttpUrl] = Field(default=None)
    applied_date: Optional[date] = Field(default=None)
    status: ApplicationStatus = Field(default="Applied")
    package_amount: Optional[Decimal] = Field(default=None, ge=0)
    package_currency: str = Field(default="INR", max_length=10)
    notes: Optional[str] = Field(default=None)

# Schema for creating a new application
class ApplicationCreate(ApplicationBase):
    pass

# Schema for partially updating an application (all fields optional)
class ApplicationUpdate(BaseModel):
    company_name: Optional[str] = Field(default=None, min_length=2, max_length=100)
    job_role: Optional[str] = Field(default=None, min_length=2, max_length=100)
    job_location: Optional[str] = Field(default=None, max_length=100)
    job_url: Optional[HttpUrl] = Field(default=None)
    applied_date: Optional[date] = Field(default=None)
    status: Optional[ApplicationStatus] = Field(default=None)
    package_amount: Optional[Decimal] = Field(default=None, ge=0)
    package_currency: Optional[str] = Field(default=None, max_length=10)
    notes: Optional[str] = Field(default=None)

# Schema for returning application details in API responses
class ApplicationResponse(ApplicationBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
