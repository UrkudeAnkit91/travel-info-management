import random
from fastapi import APIRouter, Query
from app.data.airports import get_airport, AIRPORTS
from app.data.railways import get_station

router = APIRouter()

TERMINAL_CAMERAS = {
    "DEL": [
        ("T1 - Entry Gate A", "Terminal 1", "active"),
        ("T1 - Check-in Area", "Terminal 1", "active"),
        ("T1 - Security Hold", "Terminal 1", "active"),
        ("T1 - Gate 12", "Terminal 1", "active"),
        ("T2 - Entry Gate B", "Terminal 2", "active"),
        ("T2 - Check-in Area", "Terminal 2", "active"),
        ("T2 - Security Hold", "Terminal 2", "active"),
        ("T2 - Boarding Gate 23", "Terminal 2", "active"),
        ("T3 - Entry Gate C", "Terminal 3", "active"),
        ("T3 - Lounge Area", "Terminal 3", "active"),
        ("T3 - Baggage Claim", "Terminal 3", "active"),
        ("T3 - Gate 45", "Terminal 3", "active"),
        ("Parking - Car Park P1", "Parking", "active"),
        ("Parking - Car Park P2", "Parking", "inactive"),
        ("Runway 28 - Approach", "Runway", "active"),
        ("Runway 29 - Departure", "Runway", "active"),
    ],
    "BOM": [
        ("T1 - Entry Gate", "Terminal 1", "active"),
        ("T1 - Check-in Area", "Terminal 1", "active"),
        ("T1 - Security Hold", "Terminal 1", "active"),
        ("T1 - Gate 8", "Terminal 1", "active"),
        ("T2 - Entry Gate", "Terminal 2", "active"),
        ("T2 - Check-in Area", "Terminal 2", "active"),
        ("T2 - Security Hold", "Terminal 2", "active"),
        ("T2 - Boarding Gate 15", "Terminal 2", "active"),
        ("Parking - Arrival Forecourt", "Parking", "active"),
        ("Runway 09 - Approach", "Runway", "active"),
        ("Runway 27 - Departure", "Runway", "active"),
    ],
    "BLR": [
        ("T1 - Entry Gate", "Terminal 1", "active"),
        ("T1 - Check-in Area", "Terminal 1", "active"),
        ("T1 - Security Hold", "Terminal 1", "active"),
        ("T1 - Gate 6", "Terminal 1", "active"),
        ("T2 - Entry Gate", "Terminal 2", "active"),
        ("T2 - Check-in Area", "Terminal 2", "active"),
        ("T2 - Security Hold", "Terminal 2", "active"),
        ("T2 - Boarding Gate 18", "Terminal 2", "active"),
        ("Parking - Multi-level", "Parking", "active"),
        ("Runway 09 - Approach", "Runway", "active"),
        ("Runway 27 - Departure", "Runway", "active"),
    ],
    "HYD": [
        ("T1 - Entry Gate", "Terminal 1", "active"),
        ("T1 - Check-in Area", "Terminal 1", "active"),
        ("T1 - Security Hold", "Terminal 1", "active"),
        ("T1 - Gate 3", "Terminal 1", "active"),
        ("Parking - Forecourt", "Parking", "active"),
        ("Runway 09 - Approach", "Runway", "inactive"),
        ("Runway 27 - Departure", "Runway", "active"),
    ],
    "MAA": [
        ("T1 - Entry Gate", "Terminal 1", "active"),
        ("T1 - Check-in Area", "Terminal 1", "active"),
        ("T1 - Security Hold", "Terminal 1", "inactive"),
        ("T1 - Gate 5", "Terminal 1", "active"),
        ("T2 - Entry Gate", "Terminal 2", "active"),
        ("T2 - Check-in Area", "Terminal 2", "active"),
        ("T2 - Boarding Gate 11", "Terminal 2", "active"),
        ("Parking - Car Park", "Parking", "active"),
        ("Runway 07 - Approach", "Runway", "active"),
        ("Runway 25 - Departure", "Runway", "active"),
    ],
    "CCU": [
        ("T1 - Entry Gate", "Terminal 1", "active"),
        ("T1 - Check-in Area", "Terminal 1", "active"),
        ("T1 - Security Hold", "Terminal 1", "active"),
        ("T1 - Gate 4", "Terminal 1", "active"),
        ("T2 - Entry Gate", "Terminal 2", "active"),
        ("T2 - Security Hold", "Terminal 2", "inactive"),
        ("Parking - Forecourt", "Parking", "active"),
        ("Runway 01 - Approach", "Runway", "active"),
        ("Runway 19 - Departure", "Runway", "active"),
    ],
}

STATION_CAMERAS = {
    "NDLS": [
        ("Main Entrance - Gate 1", "Entrance", "active"),
        ("Main Entrance - Gate 2", "Entrance", "active"),
        ("Main Concourse - West", "Concourse", "active"),
        ("Main Concourse - East", "Concourse", "active"),
        ("PF 1 - Waiting Area", "Platform 1", "active"),
        ("PF 2 - Waiting Area", "Platform 2", "active"),
        ("PF 3 - Waiting Area", "Platform 3", "active"),
        ("PF 4 - Waiting Area", "Platform 4", "active"),
        ("PF 5 - Waiting Area", "Platform 5", "active"),
        ("PF 6 - Waiting Area", "Platform 6", "active"),
        ("PF 7 - Waiting Area", "Platform 7", "inactive"),
        ("PF 8 - Waiting Area", "Platform 8", "active"),
        ("PF 9 - Waiting Area", "Platform 9", "active"),
        ("PF 10 - Waiting Area", "Platform 10", "active"),
        ("PF 11 - Waiting Area", "Platform 11", "active"),
        ("PF 12 - Waiting Area", "Platform 12", "active"),
        ("PF 13 - Waiting Area", "Platform 13", "active"),
        ("PF 14 - Waiting Area", "Platform 14", "inactive"),
        ("PF 15 - Waiting Area", "Platform 15", "active"),
        ("PF 16 - Waiting Area", "Platform 16", "active"),
        ("Parking - Drop-off Zone", "Parking", "active"),
        ("Parking - Multi-level", "Parking", "active"),
    ],
    "CSMT": [
        ("Main Entrance - Heritage Gate", "Entrance", "active"),
        ("Main Concourse", "Concourse", "active"),
        ("PF 1 - Waiting Area", "Platform 1", "active"),
        ("PF 2 - Waiting Area", "Platform 2", "active"),
        ("PF 3 - Waiting Area", "Platform 3", "active"),
        ("PF 4 - Waiting Area", "Platform 4", "active"),
        ("PF 5 - Waiting Area", "Platform 5", "inactive"),
        ("PF 6 - Waiting Area", "Platform 6", "active"),
        ("PF 7 - Waiting Area", "Platform 7", "active"),
        ("PF 8 - Waiting Area", "Platform 8", "active"),
        ("Parking - Forecourt", "Parking", "active"),
    ],
    "HWH": [
        ("Main Entrance - Howrah Side", "Entrance", "active"),
        ("Main Entrance - Kolkata Side", "Entrance", "active"),
        ("Main Concourse", "Concourse", "active"),
        ("PF 1 - Waiting Area", "Platform 1", "active"),
        ("PF 2 - Waiting Area", "Platform 2", "active"),
        ("PF 3 - Waiting Area", "Platform 3", "inactive"),
        ("PF 4 - Waiting Area", "Platform 4", "active"),
        ("PF 5 - Waiting Area", "Platform 5", "active"),
        ("PF 6 - Waiting Area", "Platform 6", "active"),
        ("PF 7 - Waiting Area", "Platform 7", "active"),
        ("Parking - Car Park", "Parking", "active"),
    ],
    "MAS": [
        ("Main Entrance", "Entrance", "active"),
        ("Main Concourse", "Concourse", "active"),
        ("PF 1 - Waiting Area", "Platform 1", "active"),
        ("PF 2 - Waiting Area", "Platform 2", "active"),
        ("PF 3 - Waiting Area", "Platform 3", "active"),
        ("PF 4 - Waiting Area", "Platform 4", "inactive"),
        ("PF 5 - Waiting Area", "Platform 5", "active"),
        ("PF 6 - Waiting Area", "Platform 6", "active"),
        ("Parking - Forecourt", "Parking", "active"),
    ],
    "SBC": [
        ("Main Entrance", "Entrance", "active"),
        ("Main Concourse", "Concourse", "active"),
        ("PF 1 - Waiting Area", "Platform 1", "active"),
        ("PF 2 - Waiting Area", "Platform 2", "active"),
        ("PF 3 - Waiting Area", "Platform 3", "active"),
        ("PF 4 - Waiting Area", "Platform 4", "active"),
        ("PF 5 - Waiting Area", "Platform 5", "inactive"),
        ("PF 6 - Waiting Area", "Platform 6", "active"),
        ("PF 7 - Waiting Area", "Platform 7", "active"),
        ("PF 8 - Waiting Area", "Platform 8", "active"),
        ("Parking - Multi-level", "Parking", "active"),
    ],
}

def mock_cameras_for(code, camera_map, default_count=8):
    if code in camera_map:
        cameras = camera_map[code]
    else:
        zones = ["Entrance", "Concourse", "PF 1", "PF 2", "PF 3", "PF 4", "Parking"]
        cameras = [(f"{z} - Camera", z, "active" if random.random() > 0.15 else "inactive") for z in zones]
    random.seed(code + str(len(cameras)))
    result = []
    for name, zone, status in cameras:
        idx = hash(name + code) % 1000
        result.append({
            "id": f"cam-{code}-{idx}",
            "name": name,
            "zone": zone,
            "status": status,
            "angle": random.choice(["wide", "narrow", "tilted", "panoramic"]),
            "resolution": "1920x1080",
        })
    return result


@router.get("/cctv")
def get_cctv(location_code: str = Query(default="DEL", description="Airport/Station code")):
    airport = get_airport(location_code)
    station = get_station(location_code)

    if not airport and not station:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail=f"Location {location_code} not found")

    is_airport = bool(airport)
    cameras = mock_cameras_for(location_code, TERMINAL_CAMERAS if is_airport else STATION_CAMERAS)

    summary = {
        "total": len(cameras),
        "active": sum(1 for c in cameras if c["status"] == "active"),
        "inactive": sum(1 for c in cameras if c["status"] == "inactive"),
    }

    return {
        "location_code": location_code,
        "location_name": (airport or station)["name"],
        "type": "airport" if is_airport else "railway",
        "summary": summary,
        "cameras": cameras,
    }
