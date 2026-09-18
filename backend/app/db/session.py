"""
Database connection.

One engine for the whole app. Creating a connection is expensive,
so SQLAlchemy keeps a pool of them open and hands them out.
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from app.config import settings

# Fail fast if the database is down, instead of holding every request open
engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"connect_timeout": 5, "options": "-c statement_timeout=5000"},
)

SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)

Base = declarative_base()

def get_db():
    """Give a route one session, and always close it afterwards."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
