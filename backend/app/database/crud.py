from sqlalchemy.orm import Session
from app.models.schemas import PassengerData, FlightData
from datetime import datetime


def get_passengers(db: Session, skip: int = 0, limit: int = 100):
    return db.query(PassengerData).offset(skip).limit(limit).all()


def get_flights(db: Session, skip: int = 0, limit: int = 100):
    return db.query(FlightData).offset(skip).limit(limit).all()


def create_passenger(db: Session, timestamp: datetime, passenger_count: int,
                     terminal: str, wait_time: float = None):
    record = PassengerData(
        timestamp=timestamp,
        passenger_count=passenger_count,
        terminal=terminal,
        wait_time=wait_time
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def create_flight(db: Session, flight_id: str, airline: str,
                  departure_time: datetime, weather: str,
                  delay_minutes: float = None):
    record = FlightData(
        flight_id=flight_id,
        airline=airline,
        departure_time=departure_time,
        weather=weather,
        delay_minutes=delay_minutes
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record
