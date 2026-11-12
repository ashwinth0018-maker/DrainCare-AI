
import os

from sqlalchemy import select

from backend.database import SessionLocal
from backend.models import User
from backend.auth import hash_password


TEST_USERS = [
    {
        "username": "admin_test",
        "full_name": "DrainCare Admin",
        "email": "admin_test@example.com",
        "password": os.getenv("TEST_ADMIN_PASSWORD"),
        "role": "admin",
    },
    {
        "username": "worker_test",
        "full_name": "DrainCare Worker",
        "email": "worker_test@example.com",
        "password": os.getenv("TEST_WORKER_PASSWORD"),
        "role": "worker",
    },
]


def create_test_users():

    # Validate passwords before database operations
    for data in TEST_USERS:
        if not data["password"]:
            raise ValueError(
                f"Missing password for {data['username']}"
            )

    db = SessionLocal()

    try:
        for data in TEST_USERS:

            existing = db.scalar(
                select(User).where(
                    User.username == data["username"]
                )
            )

            if existing:
                print(
                    f"{data['username']} already exists. Skipping."
                )
                continue

            user = User(
                username=data["username"],
                full_name=data["full_name"],
                email=data["email"],
                role=data["role"],
                password_hash=hash_password(data["password"]),
            )

            db.add(user)

            print(
                f"Created: {data['username']} ({data['role']})"
            )

        db.commit()
        print("Test account setup completed.")

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    create_test_users()

