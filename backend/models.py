
from datetime import datetime, timezone

from sqlalchemy import Integer, String, Float, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from backend.database import Base


class SensorReading(Base):
    __tablename__ = "sensor_readings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    sensor_id: Mapped[str] = mapped_column(String(50), nullable=False)
    location: Mapped[str] = mapped_column(String(150), nullable=False)
    water_level: Mapped[float] = mapped_column(Float, nullable=False)
    temperature: Mapped[float] = mapped_column(Float, nullable=False)
    gas_level: Mapped[float] = mapped_column(Float, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="Normal")

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc)
    )


class Alert(Base):
    __tablename__ = "alerts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    sensor_id: Mapped[str] = mapped_column(String(50), nullable=False)
    location: Mapped[str] = mapped_column(String(150), nullable=False)

    reading_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("sensor_readings.id"),
        nullable=False
    )

    level: Mapped[str] = mapped_column(String(20), nullable=False)
    message: Mapped[str] = mapped_column(String(255), nullable=False)
    is_resolved: Mapped[bool] = mapped_column(Boolean, default=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc)
    )

    resolved_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        default=None
    )


class MaintenanceBooking(Base):
    __tablename__ = "maintenance_bookings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    customer_name: Mapped[str] = mapped_column(String(100), nullable=False)
    phone: Mapped[str] = mapped_column(String(20), nullable=False)
    email: Mapped[str] = mapped_column(String(150), nullable=False)

    location: Mapped[str] = mapped_column(String(200), nullable=False)
    service_type: Mapped[str] = mapped_column(String(100), nullable=False)

    booking_status: Mapped[str] = mapped_column(
        String(30),
        default="Pending"
    )

    payment_status: Mapped[str] = mapped_column(
        String(30),
        default="Pending"
    )

    amount: Mapped[float] = mapped_column(Float, default=0.0)

    paypal_order_id: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
        default=None
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc)
    )
