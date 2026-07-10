from datetime import datetime
from typing import Optional
from sqlalchemy import String, DateTime, Text, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

class Interview(Base):
    __tablename__ = "interviews"

    id: Mapped[int] = mapped_column(primary_key=True)
    # Added index=True to application_id for faster round lookups
    application_id: Mapped[int] = mapped_column(ForeignKey("applications.id", ondelete="CASCADE"), index=True, nullable=False)
    round_name: Mapped[str] = mapped_column(String(100), nullable=False)
    interview_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    interview_mode: Mapped[str] = mapped_column(String(50), nullable=False)
    meeting_link: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    result: Mapped[str] = mapped_column(String(50), server_default="Pending", default="Pending", nullable=False)
    preparation_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    post_interview_feedback: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )
    
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )

    # Bidirectional relationship back to Application (verified parenthesis)
    application: Mapped["Application"] = relationship("Application", back_populates="interviews")
