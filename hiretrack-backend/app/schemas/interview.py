from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel, Field, HttpUrl, ConfigDict

# Allowed formats for the interview mode
InterviewMode = Literal["Online", "In-Person", "Telephonic"]

# Allowed states for the interview result
InterviewResult = Literal["Pending", "Cleared", "Failed", "Cancelled"]

# Base schema with common fields for interviews
class InterviewBase(BaseModel):
    round_name: str = Field(min_length=2, max_length=100)
    interview_date: datetime
    interview_mode: InterviewMode
    meeting_link: Optional[HttpUrl] = Field(default=None)
    result: InterviewResult = Field(default="Pending")
    preparation_notes: Optional[str] = Field(default=None)
    post_interview_feedback: Optional[str] = Field(default=None)

# Schema for creating a new interview round
class InterviewCreate(InterviewBase):
    pass

# Schema for updating an interview round (all fields optional)
class InterviewUpdate(BaseModel):
    round_name: Optional[str] = Field(default=None, min_length=2, max_length=100)
    interview_date: Optional[datetime] = Field(default=None)
    interview_mode: Optional[InterviewMode] = Field(default=None)
    meeting_link: Optional[HttpUrl] = Field(default=None)
    result: Optional[InterviewResult] = Field(default=None)
    preparation_notes: Optional[str] = Field(default=None)
    post_interview_feedback: Optional[str] = Field(default=None)

# Schema for returning interview details in API responses
class InterviewResponse(InterviewBase):
    id: int
    application_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
