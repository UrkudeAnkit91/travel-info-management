from fastapi import APIRouter, Query
from app.data.airports import AIRPORTS, get_airport, get_nearby_airports
from app.routes.real_time import live_status

router = APIRouter()


@router.get("/airports")
def list_airports(region: str = None):
    if region:
        return [a for a in AIRPORTS if a["region"].lower() == region.lower()]
    return AIRPORTS


@router.get("/airports/regions")
def list_regions():
    return sorted(set(a["region"] for a in AIRPORTS))


@router.get("/airports/nearby")
def nearby_airports(
    lat: float = Query(...),
    lon: float = Query(...),
    radius: float = Query(100, ge=1, le=500)
):
    return get_nearby_airports(lat, lon, radius)


@router.get("/airports/summary")
def airports_summary():
    results = []
    for ap in AIRPORTS:
        try:
            status = live_status(ap["code"])
            results.append({
                "code": ap["code"], "city": ap["city"], "region": ap["region"],
                "delayed_flights": status["flights"]["delayed"],
                "total_flights": status["flights"]["total"],
                "avg_delay": status["flights"]["average_delay_minutes"],
                "queue_wait": status["queue"]["estimated_wait_minutes"],
                "passengers": status["queue"]["estimated_passengers"],
                "weather": status["weather"]["condition"],
                "temp": status["weather"]["temperature_c"],
                "alerts": status["alerts"]
            })
        except Exception:
            continue
    return results


@router.get("/airports/{code}")
def airport_detail(code: str):
    ap = get_airport(code)
    if not ap:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail=f"Airport {code} not found")
    return ap
