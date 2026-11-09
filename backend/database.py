
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

# SQLite database location
DATABASE_URL = "sqlite:///./draincare.db"

# Create database engine
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}
)

# Create database sessions
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# Base class for database models
class Base(DeclarativeBase):
    pass


# Database connection dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
