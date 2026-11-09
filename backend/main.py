import requests
from backend.paypal_service import create_paypal_order, capture_paypal_order
import random
from fastapi import FastAPI, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import select


from backend.database import Base, engine, get_db
from backend.models import SensorReading, Alert, MaintenanceBooking
from datetime import datetime, timezone
from backend.ai_engine import analyze_drainage_risk
from fastapi.responses import FileResponse


Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="DrainCare AI",
    description="AI-powered drainage monitoring and maintenance platform",
    version="1.0.0"
)


class SensorData(BaseModel):
    sensor_id: str
    location: str
    water_level: float = Field(ge=0)
    temperature: float
    gas_level: float = Field(ge=0)
    
class BookingData(BaseModel):
    customer_name: str
    phone: str
    email: str
    location: str
    service_type: str




def calculate_status(water_level, temperature, gas_level):
    # Temporary demo thresholds.
    # Calibrate these using the actual sensors before real deployment.
    if water_level >= 80 or temperature >= 50 or gas_level >= 700:
        return "Critical"

    if water_level >= 60 or temperature >= 40 or gas_level >= 400:
        return "Warning"

    return "Normal"

def sync_alert(db: Session, reading: SensorReading):

    # Find an existing unresolved alert for this sensor
    active_alert = db.scalar(
        select(Alert)
        .where(
            Alert.sensor_id == reading.sensor_id,
            Alert.location == reading.location,
            Alert.is_resolved.is_(False)
        )
        .order_by(Alert.id.desc())
    )

    # Resolve an existing alert when readings return to Normal
    if reading.status == "Normal":
        if active_alert:
            active_alert.is_resolved = True
            active_alert.resolved_at = datetime.now(timezone.utc)
            db.commit()
        return

    message = (
        f"{reading.status}: Drainage readings exceeded "
        "the configured demo thresholds."
    )

    # Create a new alert if no unresolved alert exists
    if active_alert is None:
        new_alert = Alert(
            sensor_id=reading.sensor_id,
            location=reading.location,
            reading_id=reading.id,
            level=reading.status,
            message=message,
            is_resolved=False
        )
        db.add(new_alert)

    else:
        # Update the existing alert if the condition changes
        active_alert.reading_id = reading.id
        active_alert.level = reading.status
        active_alert.message = message

    db.commit()



@app.get("/")
def home():
    return {
        "project": "DrainCare AI",
        "status": "Running successfully",
        "message": "Welcome to DrainCare AI!"
    }


@app.get("/health")
def health():
    return {
        "backend": "Online",
        "database": "Connected"
    }


@app.post("/sensors/readings")
def add_sensor_reading(data: SensorData, db: Session = Depends(get_db)):

    status = calculate_status(
        data.water_level,
        data.temperature,
        data.gas_level
    )

    reading = SensorReading(
        sensor_id=data.sensor_id,
        location=data.location,
        water_level=data.water_level,
        temperature=data.temperature,
        gas_level=data.gas_level,
        status=status
    )

    db.add(reading)
    db.commit()
    db.refresh(reading)
    sync_alert(db, reading)


    return {
        "message": "Sensor reading saved successfully",
        "reading_id": reading.id,
        "status": reading.status
    }



@app.get("/sensors/readings")
def get_sensor_readings(db: Session = Depends(get_db)):

    readings = db.scalars(
        select(SensorReading).order_by(SensorReading.id.desc())
    ).all()

    return [
        {
            "id": reading.id,
            "sensor_id": reading.sensor_id,
            "location": reading.location,
            "water_level": reading.water_level,
            "temperature": reading.temperature,
            "gas_level": reading.gas_level,
            "status": reading.status,
            "created_at": reading.created_at
        }
        for reading in readings
    ]


    
@app.get("/ai/analyze/{reading_id}")
def analyze_reading(reading_id: int, db: Session = Depends(get_db)):

    reading = db.get(SensorReading, reading_id)

    if reading is None:
        raise HTTPException(
            status_code=404,
            detail="Sensor reading not found"
        )

    analysis = analyze_drainage_risk(
        reading.water_level,
        reading.temperature,
        reading.gas_level
    )

    return {
        "reading_id": reading.id,
        "sensor_id": reading.sensor_id,
        "location": reading.location,
        "sensor_status": reading.status,
        "ai_analysis": analysis
    }

@app.get("/dashboard", response_class=FileResponse)
def dashboard():
    return FileResponse("frontend/index.html")


@app.post("/sensors/simulate")
def simulate_sensor_reading(db: Session = Depends(get_db)):

    water_level = round(random.uniform(20, 95), 2)
    temperature = round(random.uniform(25, 55), 2)
    gas_level = round(random.uniform(100, 800), 2)

    status = calculate_status(
        water_level,
        temperature,
        gas_level
    )

    reading = SensorReading(
        sensor_id="ESP32_SIM_001",
        location="Building A - Drainage 01",
        water_level=water_level,
        temperature=temperature,
        gas_level=gas_level,
        status=status
    )

    db.add(reading)
    db.commit()
    db.refresh(reading)
    sync_alert(db, reading)

    return {
        "message": "Simulated sensor reading saved",
        "reading_id": reading.id,
        "water_level": reading.water_level,
        "temperature": reading.temperature,
        "gas_level": reading.gas_level,
        "status": reading.status
    }

@app.get("/alerts")
def get_alerts(
    include_resolved: bool = False,
    db: Session = Depends(get_db)
):

    query = select(Alert)

    if not include_resolved:
        query = query.where(Alert.is_resolved.is_(False))

    alerts = db.scalars(
        query.order_by(Alert.id.desc())
    ).all()

    return [
        {
            "id": alert.id,
            "sensor_id": alert.sensor_id,
            "location": alert.location,
            "reading_id": alert.reading_id,
            "level": alert.level,
            "message": alert.message,
            "is_resolved": alert.is_resolved,
            "created_at": alert.created_at,
            "resolved_at": alert.resolved_at
        }
        for alert in alerts
    ]

@app.post("/bookings")
def create_booking(
    data: BookingData,
    db: Session = Depends(get_db)
):
    booking = MaintenanceBooking(
        customer_name=data.customer_name,
        phone=data.phone,
        email=data.email,
        location=data.location,
        service_type=data.service_type,
        booking_status="Pending",
        payment_status="Pending",
        amount=1000.0
    )

    db.add(booking)
    db.commit()
    db.refresh(booking)

    return {
        "message": "Maintenance booking created successfully",
        "booking_id": booking.id,
        "customer_name": booking.customer_name,
        "booking_status": booking.booking_status,
        "payment_status": booking.payment_status
    }

@app.get("/bookings")
def get_bookings(db: Session = Depends(get_db)):

    bookings = db.scalars(
        select(MaintenanceBooking).order_by(
            MaintenanceBooking.id.desc()
        )
    ).all()

    return [
        {
            "booking_id": booking.id,
            "customer_name": booking.customer_name,
            "phone": booking.phone,
            "email": booking.email,
            "location": booking.location,
            "service_type": booking.service_type,
            "booking_status": booking.booking_status,
            "payment_status": booking.payment_status,
            "amount": booking.amount,
            "created_at": booking.created_at
        }
        for booking in bookings
    ]

@app.post("/bookings/{booking_id}/create-payment")
def create_booking_payment(
    booking_id: int,
    db: Session = Depends(get_db)
):
    # Find the booking
    booking = db.get(MaintenanceBooking, booking_id)

    if booking is None:
        raise HTTPException(
            status_code=404,
            detail="Booking not found"
        )

    # Prevent creating another payment for an already paid booking
    if booking.payment_status == "Paid":
        raise HTTPException(
            status_code=400,
            detail="This booking has already been paid"
        )

    try:
        # Create PayPal Sandbox order
        paypal_order = create_paypal_order()

        # Save PayPal order ID in the database
        booking.paypal_order_id = paypal_order["id"]
        db.commit()
        db.refresh(booking)

        # Find the PayPal approval link
        approval_url = next(
            (
                link["href"]
                for link in paypal_order.get("links", [])
                if link.get("rel") in ("approve", "payer-action")
            ),
                None
        )

        if not approval_url:
            raise HTTPException(
                status_code=502,
                detail="PayPal approval link was not returned"
            )

        return {
            "message": "PayPal order created successfully",
            "booking_id": booking.id,
            "paypal_order_id": paypal_order["id"],
            "amount_inr": booking.amount,
            "paypal_amount": "12.00 USD",
            "approval_url": approval_url
        }

    except requests.RequestException as error:
        db.rollback()
        print("PAYPAL ERROR:", repr(error))
        if error.response is not None:
            print("PAYPAL STATUS:", error.response.status_code)
            print("PAYPAL RESPONSE:", error.response.text)
        raise HTTPException(
            status_code=502,
            detail="PayPal request failed. Check the VS Code terminal."
    )

    
@app.get("/payment/success")
def paypal_payment_success(
    token: str,
    PayerID: str | None = None,
    db: Session = Depends(get_db)
):
    # Find the booking associated with this PayPal order
    booking = db.scalar(
        select(MaintenanceBooking).where(
            MaintenanceBooking.paypal_order_id == token
        )
    )

    if booking is None:
        raise HTTPException(
            status_code=404,
            detail="No booking found for this PayPal order"
        )

    if booking.payment_status == "Paid":
        return {
            "message": "Payment was already completed",
            "booking_id": booking.id,
            "payment_status": "Paid"
        }

    try:
        # Capture the approved payment through PayPal
        capture_result = capture_paypal_order(token)

        print("PAYPAL CAPTURE RESPONSE:", capture_result)

        # Only mark Paid when PayPal confirms COMPLETED
        if capture_result.get("status") == "COMPLETED":
            booking.payment_status = "Paid"
            db.commit()
            db.refresh(booking)

            return {
                "message": "Payment completed successfully!",
                "booking_id": booking.id,
                "paypal_order_id": token,
                "payment_status": booking.payment_status,
                "paypal_status": capture_result["status"]
            }

        return {
            "message": "Payment is not yet completed",
            "booking_id": booking.id,
            "payment_status": booking.payment_status,
            "paypal_status": capture_result.get("status")
        }

    except requests.RequestException as error:
        db.rollback()

        print("PAYPAL CAPTURE ERROR:", repr(error))

        if error.response is not None:
            print("PAYPAL RESPONSE:", error.response.text)

        raise HTTPException(
            status_code=502,
            detail="PayPal payment capture failed. Check terminal."
        )


@app.get("/payment/cancel")
def paypal_payment_cancel():
    return {
        "message": "Payment was cancelled",
        "payment_status": "Pending"
    }





    return readings

