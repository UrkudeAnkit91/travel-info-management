from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database.connection import engine, Base
from app.routes.predictions import router as prediction_router
from app.routes.real_time import router as realtime_router
from app.routes.airports import router as airports_router
from app.routes.railways import router as railways_router
from app.routes.railway_realtime import router as railway_realtime_router
from app.routes.cctv import router as cctv_router

app = FastAPI(title="Airport & Railway Management System API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

app.include_router(prediction_router)
app.include_router(realtime_router)
app.include_router(airports_router)
app.include_router(railway_realtime_router)
app.include_router(railways_router)
app.include_router(cctv_router)


@app.get("/")
def root():
    return {
        "message": "Airport & Railway Management System API",
        "version": "2.0.0",
        "airports": "/airports",
        "railways": "/railways"
    }
