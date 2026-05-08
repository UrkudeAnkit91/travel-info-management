from sqlalchemy import Column, Integer, Float, DateTime, String, Text, func
from app.database.connection import Base


class PassengerData(Base):
    __tablename__ = "passengers_data"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    timestamp = Column(DateTime, nullable=False)
    passenger_count = Column(Integer, nullable=False)
    terminal = Column(String(50), nullable=False)
    wait_time = Column(Float, nullable=True)
    created_at = Column(DateTime, server_default=func.now())


class FlightData(Base):
    __tablename__ = "flight_data"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    flight_id = Column(String(20), nullable=False, unique=True)
    airline = Column(String(100), nullable=False)
    departure_time = Column(DateTime, nullable=False)
    weather = Column(String(50), nullable=False)
    delay_minutes = Column(Float, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
