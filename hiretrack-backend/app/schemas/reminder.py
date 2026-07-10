from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict

# Base schema with common fields for reminders
class ReminderBase(BaseModel):
    title: str = Field(min_length=2, max_length=200)
    description: Optional[str] = Field(default=None)
    reminder_date: datetime
    is_completed: bool = Field(default=False)

# Schema for creating a new reminder
class ReminderCreate(ReminderBase):
    application_id: Optional[int] = Field(default=None)

# Schema for updating a reminder (all fields optional)
class ReminderUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=2, max_length=200)
    description: Optional[str] = Field(default=None)
    reminder_date: Optional[datetime] = Field(default=None)
    is_completed: Optional[bool] = Field(default=None)
    application_id: Optional[int] = Field(default=None)

# Schema for returning reminder details in API responses
class ReminderResponse(ReminderBase):
    id: int
    user_id: int
    application_id: Optional[int] = Field(default=None)
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
