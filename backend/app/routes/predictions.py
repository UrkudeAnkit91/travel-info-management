import os
import joblib
import numpy as np
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime

from app.database.connection import get_db
from app.database.crud import get_passengers, get_flights, create_passenger, create_flight
from app.data.airports import get_airport
from app.data.railways import get_station

router = APIRouter()

MODEL_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "ml")

queue_model = None
queue_label_encoder = None
queue_airport_encoder = None
delay_model = None
delay_airline_encoder = None
delay_weather_encoder = None
delay_airport_encoder = None


def load_models():
    global queue_model, queue_label_encoder, queue_airport_encoder
    global delay_model, delay_airline_encoder, delay_weather_encoder, delay_airport_encoder

    for name in ["queue_model", "queue_label_encoder", "queue_airport_encoder",
                  "delay_model", "delay_airline_encoder", "delay_weather_encoder", "delay_airport_encoder"]:
        path = os.path.join(MODEL_DIR, f"{name}.pkl")
        if os.path.exists(path):
            globals()[name] = joblib.load(path)


load_models()

# Railway models
railway_queue_model = None
railway_queue_platform_encoder = None
railway_queue_station_encoder = None
railway_delay_model = None
railway_delay_weather_encoder = None
railway_delay_station_encoder = None


def load_railway_models():
    global railway_queue_model, railway_queue_platform_encoder, railway_queue_station_encoder
    global railway_delay_model, railway_delay_weather_encoder, railway_delay_station_encoder
    for name in ["railway_queue_model", "railway_queue_platform_encoder", "railway_queue_station_encoder",
                  "railway_delay_model", "railway_delay_weather_encoder", "railway_delay_station_encoder"]:
        path = os.path.join(MODEL_DIR, f"{name}.pkl")
        if os.path.exists(path):
            globals()[name] = joblib.load(path)


load_railway_models()


class QueuePredictRequest(BaseModel):
    hour: int = Field(..., ge=0, le=23)
    passenger_count: int = Field(..., ge=1, le=1000)
    terminal: str = Field(...)
    airport_code: str = Field(default="DEL")


class DelayPredictRequest(BaseModel):
    hour: int = Field(..., ge=0, le=23)
    airline: str = Field(...)
    weather: str = Field(...)
    airport_code: str = Field(default="DEL")


class QueuePredictResponse(BaseModel):
    wait_time: float
    confidence: Optional[float] = None
    airport: Optional[dict] = None


class DelayPredictResponse(BaseModel):
    delay_minutes: float
    confidence: Optional[float] = None
    airport: Optional[dict] = None


@router.post("/predict-queue", response_model=QueuePredictResponse)
def predict_queue(req: QueuePredictRequest, db: Session = Depends(get_db)):
    if queue_model is None or queue_label_encoder is None:
        raise HTTPException(status_code=503, detail="Queue model not loaded")

    ap = get_airport(req.airport_code)
    if not ap:
        raise HTTPException(status_code=400, detail=f"Invalid airport '{req.airport_code}'")

    try:
        terminal_enc = queue_label_encoder.transform([req.terminal])[0]
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid terminal '{req.terminal}'")

    airport_code_enc = 0
    if queue_airport_encoder:
        try:
            airport_code_enc = queue_airport_encoder.transform([req.airport_code])[0]
        except ValueError:
            airport_classes = list(queue_airport_encoder.classes_)
            if req.airport_code in airport_classes:
                airport_code_enc = airport_classes.index(req.airport_code)
            else:
                airport_code_enc = 0

    features = np.array([[req.hour, req.passenger_count, terminal_enc, airport_code_enc]])
    wait_time = float(queue_model.predict(features)[0])
    wait_time = round(max(wait_time, 1.0), 1)

    create_passenger(
        db=db,
        timestamp=datetime.now(),
        passenger_count=req.passenger_count,
        terminal=req.terminal,
        wait_time=wait_time
    )

    return QueuePredictResponse(wait_time=wait_time, airport=ap)


@router.post("/predict-delay", response_model=DelayPredictResponse)
def predict_delay(req: DelayPredictRequest, db: Session = Depends(get_db)):
    if delay_model is None or delay_airline_encoder is None or delay_weather_encoder is None:
        raise HTTPException(status_code=503, detail="Delay model not loaded")

    ap = get_airport(req.airport_code)
    if not ap:
        raise HTTPException(status_code=400, detail=f"Invalid airport '{req.airport_code}'")

    try:
        airline_enc = delay_airline_encoder.transform([req.airline])[0]
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid airline '{req.airline}'")
    try:
        weather_enc = delay_weather_encoder.transform([req.weather])[0]
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid weather '{req.weather}'")

    airport_code_enc = 0
    if delay_airport_encoder:
        try:
            airport_code_enc = delay_airport_encoder.transform([req.airport_code])[0]
        except ValueError:
            airport_classes = list(delay_airport_encoder.classes_)
            if req.airport_code in airport_classes:
                airport_code_enc = airport_classes.index(req.airport_code)

    features = np.array([[req.hour, airline_enc, weather_enc, airport_code_enc]])
    delay_minutes = float(delay_model.predict(features)[0])
    delay_minutes = round(max(delay_minutes, 0.0), 1)

    create_flight(
        db=db,
        flight_id=f"FL{datetime.now().strftime('%Y%m%d%H%M%S')}",
        airline=req.airline,
        departure_time=datetime.now(),
        weather=req.weather,
        delay_minutes=delay_minutes
    )

    return DelayPredictResponse(delay_minutes=delay_minutes, airport=ap)


# ─── Railway Prediction Endpoints ───

class RailwayQueueRequest(BaseModel):
    hour: int = Field(..., ge=0, le=23)
    passenger_count: int = Field(..., ge=1, le=2000)
    platform: str = Field(...)
    station_code: str = Field(default="NDLS")


class RailwayDelayRequest(BaseModel):
    hour: int = Field(..., ge=0, le=23)
    weather: str = Field(...)
    station_code: str = Field(default="NDLS")


class RailwayQueueResponse(BaseModel):
    wait_time: float
    station: Optional[dict] = None


class RailwayDelayResponse(BaseModel):
    delay_minutes: float
    station: Optional[dict] = None


@router.post("/predict-queue-railway", response_model=RailwayQueueResponse)
def predict_railway_queue(req: RailwayQueueRequest):
    if railway_queue_model is None:
        raise HTTPException(status_code=503, detail="Railway queue model not loaded")

    st = get_station(req.station_code)
    if not st:
        raise HTTPException(status_code=400, detail=f"Invalid station '{req.station_code}'")

    try:
        pf_enc = railway_queue_platform_encoder.transform([req.platform])[0]
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid platform '{req.platform}'")

    st_enc = 0
    if railway_queue_station_encoder:
        try:
            st_enc = railway_queue_station_encoder.transform([req.station_code])[0]
        except ValueError:
            pass

    features = np.array([[req.hour, req.passenger_count, pf_enc, st_enc]])
    wait = float(railway_queue_model.predict(features)[0])
    wait = round(max(wait, 1.0), 1)
    return RailwayQueueResponse(wait_time=wait, station=st)


@router.post("/predict-delay-railway", response_model=RailwayDelayResponse)
def predict_railway_delay(req: RailwayDelayRequest):
    if railway_delay_model is None:
        raise HTTPException(status_code=503, detail="Railway delay model not loaded")

    st = get_station(req.station_code)
    if not st:
        raise HTTPException(status_code=400, detail=f"Invalid station '{req.station_code}'")

    try:
        w_enc = railway_delay_weather_encoder.transform([req.weather])[0]
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid weather '{req.weather}'")

    st_enc = 0
    if railway_delay_station_encoder:
        try:
            st_enc = railway_delay_station_encoder.transform([req.station_code])[0]
        except ValueError:
            pass

    features = np.array([[req.hour, w_enc, st_enc]])
    delay = float(railway_delay_model.predict(features)[0])
    delay = round(max(delay, 0.0), 1)
    return RailwayDelayResponse(delay_minutes=delay, station=st)


@router.get("/data/passengers")
def read_passengers(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    records = get_passengers(db, skip=skip, limit=limit)
    return [
        {
            "id": r.id,
            "timestamp": r.timestamp.isoformat(),
            "passenger_count": r.passenger_count,
            "terminal": r.terminal,
            "wait_time": r.wait_time,
            "created_at": r.created_at.isoformat() if r.created_at else None
        }
        for r in records
    ]


@router.get("/data/flights")
def read_flights(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    records = get_flights(db, skip=skip, limit=limit)
    return [
        {
            "id": r.id,
            "flight_id": r.flight_id,
            "airline": r.airline,
            "departure_time": r.departure_time.isoformat(),
            "weather": r.weather,
            "delay_minutes": r.delay_minutes,
            "created_at": r.created_at.isoformat() if r.created_at else None
        }
        for r in records
    ]
