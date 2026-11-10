import requests
from backend.paypal_service import create_paypal_order, capture_paypal_order
import random
from fastapi import FastAPI, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import select, text


from backend.database import Base, engine, get_db
from backend.models import SensorReading, Alert, MaintenanceBooking, User
from datetime import datetime, timezone
from backend.ai_engine import analyze_drainage_risk
from fastapi.responses import FileResponse
from backend.auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
    require_role,
)


Base.metadata.create_all(bind=engine)


# --- Additive column migration (non-destructive) ---
# Adds assigned_worker_id to maintenance_bookings if it doesn't exist yet.
# Preserves all existing rows and data.
with engine.connect() as conn:
    try:
        conn.execute(text("SELECT assigned_worker_id FROM maintenance_bookings LIMIT 1"))
        conn.commit()
    except Exception:
        conn.execute(
            text("ALTER TABLE maintenance_bookings ADD COLUMN assigned_worker_id INTEGER")
        )
        conn.commit()

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
            "assigned_worker_id": booking.assigned_worker_id,
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


# ============================================================
# Authentication & Role-Based Endpoints
# ============================================================

class RegisterData(BaseModel):
    username: str
    full_name: str
    email: str
    password: str
    role: str = Field(pattern="^(resident|worker|admin)$")


class ResidentBookingData(BaseModel):
    phone: str
    location: str
    service_type: str


class AssignWorkerData(BaseModel):
    worker_id: int


class UpdateJobStatusData(BaseModel):
    booking_status: str = Field(pattern="^(Pending|Assigned|In Progress|Solved)$")


def _booking_dict(booking: MaintenanceBooking) -> dict:
    return {
        "booking_id": booking.id,
        "customer_name": booking.customer_name,
        "phone": booking.phone,
        "email": booking.email,
        "location": booking.location,
        "service_type": booking.service_type,
        "booking_status": booking.booking_status,
        "payment_status": booking.payment_status,
        "amount": booking.amount,
        "assigned_worker_id": booking.assigned_worker_id,
        "created_at": booking.created_at,
    }


@app.post("/auth/register")
def register(data: RegisterData, db: Session = Depends(get_db)):
    existing = db.scalar(select(User).where(User.username == data.username))
    if existing:
        raise HTTPException(status_code=400, detail="Username already taken")

    user = User(
        username=data.username,
        full_name=data.full_name,
        email=data.email,
        role=data.role,
        password_hash=hash_password(data.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": str(user.id), "role": user.role})

    return {
        "message": "User registered successfully",
        "user": {
            "id": user.id,
            "username": user.username,
            "full_name": user.full_name,
            "email": user.email,
            "role": user.role,
        },
        "access_token": token,
        "token_type": "bearer",
    }


@app.post("/auth/login")
def login(
    form: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    user = db.scalar(select(User).where(User.username == form.username))
    if user is None or not verify_password(form.password, user.password_hash):
        raise HTTPException(
            status_code=401,
            detail="Invalid username or password",
        )

    token = create_access_token({"sub": str(user.id), "role": user.role})

    return {
        "message": "Login successful",
        "user": {
            "id": user.id,
            "username": user.username,
            "full_name": user.full_name,
            "email": user.email,
            "role": user.role,
        },
        "access_token": token,
        "token_type": "bearer",
    }


@app.get("/auth/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "username": current_user.username,
        "full_name": current_user.full_name,
        "email": current_user.email,
        "role": current_user.role,
    }


# --- Resident endpoints ---

@app.get("/resident/status")
def resident_live_status(
    current_user: User = Depends(require_role("resident")),
    db: Session = Depends(get_db),
):
    latest = db.scalar(
        select(SensorReading).order_by(SensorReading.id.desc())
    )

    if latest is None:
        return {
            "sensor_id": None,
            "location": None,
            "water_level": None,
            "temperature": None,
            "gas_level": None,
            "status": "No data",
            "created_at": None,
            "risk": None,
        }

    risk = analyze_drainage_risk(
        latest.water_level, latest.temperature, latest.gas_level
    )

    return {
        "sensor_id": latest.sensor_id,
        "location": latest.location,
        "water_level": latest.water_level,
        "temperature": latest.temperature,
        "gas_level": latest.gas_level,
        "status": latest.status,
        "created_at": latest.created_at,
        "risk": risk,
    }


@app.get("/resident/alerts")
def resident_alerts(
    current_user: User = Depends(require_role("resident")),
    db: Session = Depends(get_db),
):
    alerts = db.scalars(
        select(Alert)
        .where(Alert.is_resolved.is_(False))
        .order_by(Alert.id.desc())
    ).all()

    return [
        {
            "id": a.id,
            "sensor_id": a.sensor_id,
            "location": a.location,
            "level": a.level,
            "message": a.message,
            "created_at": a.created_at,
        }
        for a in alerts
    ]


@app.post("/resident/bookings")
def resident_create_booking(
    data: ResidentBookingData,
    current_user: User = Depends(require_role("resident")),
    db: Session = Depends(get_db),
):
    booking = MaintenanceBooking(
        customer_name=current_user.full_name,
        phone=data.phone,
        email=current_user.email,
        location=data.location,
        service_type=data.service_type,
        booking_status="Pending",
        payment_status="Pending",
        amount=1000.0,
    )

    db.add(booking)
    db.commit()
    db.refresh(booking)

    return {
        "message": "Maintenance request submitted successfully",
        "booking": _booking_dict(booking),
    }


@app.get("/resident/bookings")
def resident_bookings(
    current_user: User = Depends(require_role("resident")),
    db: Session = Depends(get_db),
):
    bookings = db.scalars(
        select(MaintenanceBooking)
        .where(MaintenanceBooking.email == current_user.email)
        .order_by(MaintenanceBooking.id.desc())
    ).all()

    return [_booking_dict(b) for b in bookings]


@app.get("/resident/bookings/{booking_id}")
def resident_booking_detail(
    booking_id: int,
    current_user: User = Depends(require_role("resident")),
    db: Session = Depends(get_db),
):
    booking = db.get(MaintenanceBooking, booking_id)
    if booking is None:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.email != current_user.email:
        raise HTTPException(status_code=403, detail="You can only view your own bookings")
    return _booking_dict(booking)


# --- Worker endpoints ---

@app.get("/worker/jobs")
def worker_jobs(
    current_user: User = Depends(require_role("worker")),
    db: Session = Depends(get_db),
):
    bookings = db.scalars(
        select(MaintenanceBooking)
        .where(MaintenanceBooking.assigned_worker_id == current_user.id)
        .order_by(MaintenanceBooking.id.desc())
    ).all()

    return [_booking_dict(b) for b in bookings]


@app.post("/worker/jobs/{booking_id}/accept")
def worker_accept_job(
    booking_id: int,
    current_user: User = Depends(require_role("worker")),
    db: Session = Depends(get_db),
):
    booking = db.get(MaintenanceBooking, booking_id)
    if booking is None:
        raise HTTPException(status_code=404, detail="Job not found")
    if booking.assigned_worker_id != current_user.id:
        raise HTTPException(status_code=403, detail="This job is not assigned to you")
    if booking.booking_status != "Assigned":
        raise HTTPException(status_code=400, detail="Job can only be accepted when status is Assigned")

    booking.booking_status = "In Progress"
    db.commit()
    db.refresh(booking)

    return {
        "message": "Job accepted",
        "booking": _booking_dict(booking),
    }


@app.post("/worker/jobs/{booking_id}/progress")
def worker_start_progress(
    booking_id: int,
    current_user: User = Depends(require_role("worker")),
    db: Session = Depends(get_db),
):
    booking = db.get(MaintenanceBooking, booking_id)
    if booking is None:
        raise HTTPException(status_code=404, detail="Job not found")
    if booking.assigned_worker_id != current_user.id:
        raise HTTPException(status_code=403, detail="This job is not assigned to you")

    booking.booking_status = "In Progress"
    db.commit()
    db.refresh(booking)

    return {
        "message": "Job status updated to In Progress",
        "booking": _booking_dict(booking),
    }


@app.post("/worker/jobs/{booking_id}/solve")
def worker_solve_job(
    booking_id: int,
    current_user: User = Depends(require_role("worker")),
    db: Session = Depends(get_db),
):
    booking = db.get(MaintenanceBooking, booking_id)
    if booking is None:
        raise HTTPException(status_code=404, detail="Job not found")
    if booking.assigned_worker_id != current_user.id:
        raise HTTPException(status_code=403, detail="This job is not assigned to you")
    if booking.booking_status != "In Progress":
        raise HTTPException(status_code=400, detail="Job must be In Progress before it can be marked Solved")

    booking.booking_status = "Solved"
    db.commit()
    db.refresh(booking)

    return {
        "message": "Job marked as Solved",
        "booking": _booking_dict(booking),
    }


# --- Admin endpoints ---

@app.get("/admin/dashboard")
def admin_dashboard(
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db),
):
    latest = db.scalar(
        select(SensorReading).order_by(SensorReading.id.desc())
    )
    total_readings = db.scalar(select(SensorReading.id).order_by(SensorReading.id.desc()))
    active_alerts = db.scalars(
        select(Alert).where(Alert.is_resolved.is_(False))
    ).all()
    all_bookings = db.scalars(select(MaintenanceBooking)).all()
    pending_bookings = [b for b in all_bookings if b.booking_status == "Pending"]
    assigned_bookings = [b for b in all_bookings if b.booking_status == "Assigned"]
    in_progress_bookings = [b for b in all_bookings if b.booking_status == "In Progress"]
    solved_bookings = [b for b in all_bookings if b.booking_status == "Solved"]
    unpaid_bookings = [b for b in all_bookings if b.payment_status != "Paid"]

    return {
        "latest_reading": {
            "sensor_id": latest.sensor_id if latest else None,
            "location": latest.location if latest else None,
            "water_level": latest.water_level if latest else None,
            "temperature": latest.temperature if latest else None,
            "gas_level": latest.gas_level if latest else None,
            "status": latest.status if latest else "No data",
            "created_at": latest.created_at if latest else None,
        } if latest else None,
        "total_readings": total_readings or 0,
        "active_alerts": len(active_alerts),
        "critical_alerts": len([a for a in active_alerts if a.level == "Critical"]),
        "total_bookings": len(all_bookings),
        "pending_bookings": len(pending_bookings),
        "assigned_bookings": len(assigned_bookings),
        "in_progress_bookings": len(in_progress_bookings),
        "solved_bookings": len(solved_bookings),
        "unpaid_bookings": len(unpaid_bookings),
    }


@app.get("/admin/maintenance-requests")
def admin_maintenance_requests(
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db),
):
    bookings = db.scalars(
        select(MaintenanceBooking)
        .where(MaintenanceBooking.booking_status.in_(["Pending", "Assigned", "In Progress"]))
        .order_by(MaintenanceBooking.id.desc())
    ).all()

    return [_booking_dict(b) for b in bookings]


@app.get("/admin/workers")
def admin_list_workers(
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db),
):
    workers = db.scalars(
        select(User).where(User.role == "worker").order_by(User.id)
    ).all()

    return [
        {
            "id": w.id,
            "username": w.username,
            "full_name": w.full_name,
            "email": w.email,
        }
        for w in workers
    ]


@app.post("/admin/bookings/{booking_id}/assign")
def admin_assign_worker(
    booking_id: int,
    data: AssignWorkerData,
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db),
):
    booking = db.get(MaintenanceBooking, booking_id)
    if booking is None:
        raise HTTPException(status_code=404, detail="Booking not found")

    worker = db.get(User, data.worker_id)
    if worker is None or worker.role != "worker":
        raise HTTPException(status_code=400, detail="Selected user is not a worker")

    booking.assigned_worker_id = worker.id
    booking.booking_status = "Assigned"
    db.commit()
    db.refresh(booking)

    return {
        "message": f"Job assigned to {worker.full_name}",
        "booking": _booking_dict(booking),
    }


@app.get("/admin/worker-progress")
def admin_worker_progress(
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db),
):
    workers = db.scalars(
        select(User).where(User.role == "worker").order_by(User.id)
    ).all()

    result = []
    for w in workers:
        jobs = db.scalars(
            select(MaintenanceBooking)
            .where(MaintenanceBooking.assigned_worker_id == w.id)
            .order_by(MaintenanceBooking.id.desc())
        ).all()
        result.append({
            "worker": {
                "id": w.id,
                "username": w.username,
                "full_name": w.full_name,
            },
            "total_jobs": len(jobs),
            "in_progress": len([j for j in jobs if j.booking_status == "In Progress"]),
            "solved": len([j for j in jobs if j.booking_status == "Solved"]),
            "unpaid": len([j for j in jobs if j.payment_status != "Paid"]),
            "jobs": [_booking_dict(j) for j in jobs],
        })

    return result
