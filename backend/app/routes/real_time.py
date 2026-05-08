import os
import random
import requests
from datetime import datetime, timedelta
from fastapi import APIRouter, Query

from app.data.airports import AIRPORTS, get_airport
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

AVIATIONSTACK_KEY = os.getenv("AVIATIONSTACK_API_KEY", "")
OPENWEATHER_KEY = os.getenv("OPENWEATHER_API_KEY", "")


def fetch_weather(city):
    if not OPENWEATHER_KEY:
        return mock_weather(city)
    try:
        url = f"https://api.openweathermap.org/data/2.5/weather?q={city}&appid={OPENWEATHER_KEY}&units=metric"
        res = requests.get(url, timeout=10)
        res.raise_for_status()
        data = res.json()
        main = data["weather"][0]["main"]
        desc = data["weather"][0]["description"]
        temp = data["main"]["temp"]
        return {
            "condition": main, "description": desc,
            "temperature_c": round(temp, 1),
            "humidity": data["main"]["humidity"],
            "wind_speed": data["wind"]["speed"],
            "source": "OpenWeatherMap"
        }
    except Exception as e:
        return {**mock_weather(city), "error": str(e)}


def mock_weather(city=None):
    conditions = ["Clear", "Cloudy", "Rain", "Snow", "Fog"]
    weights = [0.4, 0.3, 0.15, 0.05, 0.1]
    cond = random.choices(conditions, weights=weights, k=1)[0]
    temp_map = {"Clear": 28, "Cloudy": 24, "Rain": 18, "Snow": 2, "Fog": 14}
    return {
        "condition": cond, "description": cond.lower(),
        "temperature_c": round(random.gauss(temp_map.get(cond, 25), 5), 1),
        "humidity": random.randint(40, 95),
        "wind_speed": round(random.uniform(0, 30), 1),
        "source": "mock"
    }


def fetch_flights(airport_code):
    if not AVIATIONSTACK_KEY:
        return mock_flights(airport_code)
    try:
        url = f"https://api.aviationstack.com/v1/flights?access_key={AVIATIONSTACK_KEY}&limit=30"
        if airport_code:
            url += f"&dep_iata={airport_code}"
        res = requests.get(url, timeout=10)
        res.raise_for_status()
        data = res.json()
        flights = []
        for f in data.get("data", []):
            dep = f.get("departure", {})
            arr = f.get("arrival", {})
            status = f.get("flight_status", "unknown")
            delay = dep.get("delay") or 0
            flights.append({
                "flight_id": f.get("flight", {}).get("iata", "N/A"),
                "airline": f.get("airline", {}).get("name", "N/A"),
                "departure_airport": dep.get("airport", "N/A"),
                "arrival_airport": arr.get("airport", "N/A"),
                "scheduled_departure": dep.get("scheduled", ""),
                "status": status,
                "delay_minutes": max(0, delay // 60) if delay else 0,
                "source": "AviationStack"
            })
        return flights
    except Exception as e:
        return [{"source": "error", "error": str(e)}]


def mock_flights(airport_code="DEL"):
    airlines = ["IndiGo", "Air India", "SpiceJet", "Vistara", "GoFirst", "Akasa Air"]
    statuses = ["scheduled", "active", "landed", "cancelled", "delayed"]
    destinations = ["BOM", "BLR", "HYD", "MAA", "CCU", "AMD", "COK", "DEL", "PNQ", "GOI"]
    now = datetime.now()
    flights = []
    for i in range(random.randint(8, 16)):
        dep_time = now + timedelta(minutes=random.randint(-30, 360))
        status = random.choices(statuses, weights=[0.35, 0.2, 0.2, 0.05, 0.2], k=1)[0]
        delay = random.randint(0, 90) if status == "delayed" else 0
        dest = random.choice([d for d in destinations if d != airport_code])
        flights.append({
            "flight_id": f"6E{random.randint(100,999)}",
            "airline": random.choice(airlines),
            "departure_airport": airport_code,
            "arrival_airport": dest,
            "scheduled_departure": dep_time.isoformat(),
            "status": status,
            "delay_minutes": delay,
            "source": "mock"
        })
    return flights


def estimate_queue(airport_code, terminals):
    hour = datetime.now().hour
    ap = get_airport(airport_code)
    if not ap:
        ap = {"terminals": 2}

    size_factor = {"North": 1.2, "South": 1.1, "West": 1.0, "East": 0.8, "Central": 0.7}
    region = ap.get("region", "North")
    factor = size_factor.get(region, 1.0)

    base = int(80 * factor)
    peak = 1.0
    if 7 <= hour <= 10:
        peak = 2.5
    elif 16 <= hour <= 19:
        peak = 2.0
    elif 22 <= hour or hour <= 5:
        peak = 0.3

    count = int(base * peak * random.uniform(0.7, 1.3))
    wait = round(peak * random.uniform(2, 8) + random.gauss(0, 1.5), 1)

    term_data = {}
    num_terms = ap.get("terminals", 2)
    for t in [f"T{i+1}" for i in range(num_terms)]:
        term_data[t] = max(1, int(count * random.uniform(0.2, 0.5)))

    return {
        "estimated_passengers": count,
        "estimated_wait_minutes": max(1, wait),
        "peak_hour": peak > 1.5,
        "terminals": term_data
    }


@router.get("/live/status")
def live_status(airport_code: str = Query(default="DEL", description="Airport IATA code")):
    ap = get_airport(airport_code)
    if not ap:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail=f"Airport {airport_code} not found")

    city = ap["city"].split("(")[0].strip()
    weather = fetch_weather(city)
    flights = fetch_flights(airport_code)
    queue = estimate_queue(airport_code, ap.get("terminals", 2))

    delayed_count = sum(1 for f in flights if isinstance(f.get("delay_minutes"), (int, float)) and f["delay_minutes"] > 15)
    delayed_flights = [f for f in flights if isinstance(f.get("delay_minutes"), (int, float)) and f["delay_minutes"] > 0]
    avg_delay = round(sum(f["delay_minutes"] for f in delayed_flights) / len(delayed_flights), 1) if delayed_flights else 0

    alerts = []
    if weather["condition"] in ("Snow", "Storm", "Thunderstorm"):
        alerts.append(f"Weather alert: {weather['description']} in {city}")
    if delayed_count > 2:
        alerts.append(f"{delayed_count} flights delayed over 15 min at {airport_code}")
    if queue["estimated_wait_minutes"] > 20:
        alerts.append(f"Queue alert: ~{queue['estimated_wait_minutes']} min wait at {airport_code}")

    return {
        "timestamp": datetime.now().isoformat(),
        "airport": ap,
        "weather": weather,
        "flights": {
            "total": len(flights),
            "delayed": delayed_count,
            "average_delay_minutes": avg_delay,
            "list": flights[:20]
        },
        "queue": queue,
        "alerts": alerts
    }



