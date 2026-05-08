import os
import warnings
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "")
SQLITE_FALLBACK = "sqlite:///./airport_mgmt.db"

try:
    if not DATABASE_URL:
        raise Exception("DATABASE_URL not set")
    engine = create_engine(DATABASE_URL, pool_pre_ping=True)
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
        conn.commit()
except Exception as e:
    warnings.warn(f"PostgreSQL unavailable ({e}). Falling back to SQLite")
    engine = create_engine(SQLITE_FALLBACK, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
