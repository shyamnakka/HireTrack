from datetime import date, datetime
from typing import Optional, List
from decimal import Decimal
from sqlalchemy import String, Date, Numeric, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

class Application(Base):
    __tablename__ = "applications"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    company_name: Mapped[str] = mapped_column(String(100), nullable=False)
    job_role: Mapped[str] = mapped_column(String(100), nullable=False)
    job_location: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    job_url: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    applied_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(String(50), server_default="Applied", default="Applied", nullable=False)
    package_amount: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 2), nullable=True)
    package_currency: Mapped[str] = mapped_column(String(10), server_default="INR", default="INR", nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
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

    # Relationships
    # Bidirectional relationship back to User
    user: Mapped["User"] = relationship("User", back_populates="applications")

    # One Application can have many Interviews.
    interviews: Mapped[List["Interview"]] = relationship(
        "Interview",
        back_populates="application",
        cascade="all, delete-orphan"
    )

    # One Application can have many Reminders (Optional).
    # Removed cascade="all, delete-orphan" so disassociating a reminder from an application
    # only nullifies the application_id field instead of deleting the user's reminder record.
    reminders: Mapped[List["Reminder"]] = relationship(
        "Reminder",
        back_populates="application"
    )
