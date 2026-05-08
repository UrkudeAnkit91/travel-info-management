import os
import random
import requests
from datetime import datetime, timedelta
from fastapi import APIRouter, Query

from app.data.railways import STATIONS, get_station
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

# Reuse weather API keys from airport module
OPENWEATHER_KEY = os.getenv("OPENWEATHER_API_KEY", "")


def fetch_weather(city):
    if not OPENWEATHER_KEY:
        return mock_weather(city)
    try:
        url = f"https://api.openweathermap.org/data/2.5/weather?q={city}&appid={OPENWEATHER_KEY}&units=metric"
        res = requests.get(url, timeout=10)
        res.raise_for_status()
        data = res.json()
        return {
            "condition": data["weather"][0]["main"],
            "description": data["weather"][0]["description"],
            "temperature_c": round(data["main"]["temp"], 1),
            "humidity": data["main"]["humidity"],
            "wind_speed": data["wind"]["speed"],
            "source": "OpenWeatherMap"
        }
    except Exception as e:
        return {**mock_weather(city), "error": str(e)}


def mock_weather(city=None):
    conditions = ["Clear", "Cloudy", "Rain", "Fog"]
    weights = [0.4, 0.35, 0.15, 0.1]
    cond = random.choices(conditions, weights=weights, k=1)[0]
    temp_map = {"Clear": 28, "Cloudy": 24, "Rain": 18, "Fog": 14}
    return {
        "condition": cond, "description": cond.lower(),
        "temperature_c": round(random.gauss(temp_map.get(cond, 25), 4), 1),
        "humidity": random.randint(40, 90),
        "wind_speed": round(random.uniform(0, 20), 1),
        "source": "mock"
    }


def mock_trains(station_code="NDLS"):
    train_names = [
        ("12301", "Howrah Rajdhani"), ("12302", "New Delhi Rajdhani"),
        ("12001", "Bhopal Shatabdi"), ("12951", "Mumbai Rajdhani"),
        ("22691", "KSR Bengaluru Rajdhani"), ("12431", "Trivandrum Rajdhani"),
        ("12839", "Howrah-Chennai Mail"), ("12627", "Karnataka Express"),
        ("12309", "Rajdhani Express"), ("12259", "Sealdah Duronto"),
        ("22405", "Vande Bharat Exp"), ("12049", "Gatimaan Express"),
        ("12245", "Howrah-NDLS Shatabdi"), ("12801", "Purushottam Express"),
        ("12621", "Tamil Nadu Express"), ("12555", "Gorakhdham Express"),
    ]
    statuses = ["on_time", "delayed", "arrived", "cancelled"]
    now = datetime.now()

    trains = []
    selected = random.sample(train_names, min(random.randint(8, 14), len(train_names)))
    for tid, tname in selected:
        dep = now + timedelta(minutes=random.randint(-20, 240))
        status = random.choices(statuses, weights=[0.45, 0.25, 0.2, 0.1], k=1)[0]
        delay = random.randint(5, 120) if status == "delayed" else 0
        dest_codes = [s["code"] for s in STATIONS if s["code"] != station_code]
        dest = random.choice(dest_codes) if dest_codes else "NDLS"
        trains.append({
            "train_id": tid,
            "train_name": tname,
            "destination": dest,
            "scheduled_departure": dep.isoformat(),
            "status": status,
            "delay_minutes": delay,
            "platform": random.randint(1, 16),
            "source": "mock"
        })
    return sorted(trains, key=lambda x: x["scheduled_departure"])


def estimate_queue(station_code):
    hour = datetime.now().hour
    s = get_station(station_code)
    platforms = s["platforms"] if s else 8

    base = int(platforms * 40)
    peak = 1.0
    if 7 <= hour <= 10:
        peak = 2.5
    elif 17 <= hour <= 20:
        peak = 2.0
    elif 22 <= hour or hour <= 5:
        peak = 0.3

    count = int(base * peak * random.uniform(0.7, 1.3))
    wait = round(peak * random.uniform(2, 6) + random.gauss(0, 1), 1)

    queue_data = {}
    pf_count = min(platforms, 8)
    for i in range(pf_count):
        pf_label = f"PF{i+1}"
        queue_data[pf_label] = max(1, int(count * random.uniform(0.08, 0.2)))

    return {
        "estimated_passengers": count,
        "estimated_wait_minutes": max(1, wait),
        "peak_hour": peak > 1.5,
        "platforms": queue_data
    }


@router.get("/live/status-railway")
def live_status_railway(station_code: str = Query(default="NDLS", description="Station code")):
    s = get_station(station_code)
    if not s:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail=f"Station {station_code} not found")

    weather = fetch_weather(s["city"].split("(")[0].strip())
    trains = mock_trains(station_code)
    queue = estimate_queue(station_code)

    delayed_count = sum(1 for t in trains if t["status"] == "delayed")
    delayed_trains = [t for t in trains if t["delay_minutes"] > 0]
    avg_delay = round(sum(t["delay_minutes"] for t in delayed_trains) / len(delayed_trains), 1) if delayed_trains else 0

    alerts = []
    if weather["condition"] in ("Rain", "Fog"):
        alerts.append(f"Weather alert: {weather['description']} may affect train schedules")
    if delayed_count > 3:
        alerts.append(f"{delayed_count} trains delayed at {station_code}")
    if queue["estimated_wait_minutes"] > 15:
        alerts.append(f"Crowd alert: ~{queue['estimated_wait_minutes']} min wait at {station_code}")

    return {
        "timestamp": datetime.now().isoformat(),
        "station": s,
        "weather": weather,
        "trains": {
            "total": len(trains),
            "delayed": delayed_count,
            "on_time": sum(1 for t in trains if t["status"] == "on_time"),
            "average_delay_minutes": avg_delay,
            "list": trains[:20]
        },
        "queue": queue,
        "alerts": alerts
    }


@router.get("/railways/summary")
def railways_summary():
    results = []
    for s in STATIONS:
        try:
            status = live_status_railway(s["code"])
            results.append({
                "code": s["code"], "city": s["city"], "zone": s["zone"],
                "delayed_trains": status["trains"]["delayed"],
                "total_trains": status["trains"]["total"],
                "avg_delay": status["trains"]["average_delay_minutes"],
                "queue_wait": status["queue"]["estimated_wait_minutes"],
                "passengers": status["queue"]["estimated_passengers"],
                "weather": status["weather"]["condition"],
                "temp": status["weather"]["temperature_c"],
                "alerts": status["alerts"]
            })
        except Exception:
            continue
    return results
