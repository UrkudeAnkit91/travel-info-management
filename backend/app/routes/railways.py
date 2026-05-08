from fastapi import APIRouter, Query
from app.data.railways import STATIONS, get_station, get_nearby_stations

router = APIRouter()


@router.get("/railways")
def list_stations(zone: str = None):
    if zone:
        return [s for s in STATIONS if s["zone"].lower() == zone.lower()]
    return STATIONS


@router.get("/railways/zones")
def list_zones():
    return sorted(set(s["zone"] for s in STATIONS))


@router.get("/railways/nearby")
def nearby_stations(
    lat: float = Query(...), lon: float = Query(...), radius: float = Query(100, ge=1, le=500)
):
    return get_nearby_stations(lat, lon, radius)


@router.get("/railways/{code}")
def station_detail(code: str):
    s = get_station(code)
    if not s:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail=f"Station {code} not found")
    return s
