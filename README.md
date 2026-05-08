# Airport & Railway Management System

A full-stack AI-powered management dashboard for airports and railway stations with queue wait-time prediction, delay prediction, live status monitoring, and CCTV surveillance.

## Features

- **Dual Mode**: Switch between Airport and Railway management
- **Live Status**: Real-time weather, flight/train schedules, passenger queues, and alerts
- **CCTV Surveillance**: Multi-camera grid with zone-based feeds, live timestamps, OSD overlays
- **Queue Prediction**: ML-based estimated wait times (RandomForest, R² 0.90 airport / 0.89 railway)
- **Delay Prediction**: AI-powered delay predictions (RandomForest)
- **Analytics**: Charts for busiest locations, average delays by region/zone
- **Dark/Light Theme**: Toggle between dark and light UI modes
- **Multi-page Layout**: Sidebar navigation (Dashboard, Predictions, Analytics)
- **Geolocation**: "Near Me" search for nearby airports/stations
- **49 Indian Airports** + **41 Indian Railway Stations** with regional data

## Tech Stack

**Backend**: FastAPI, SQLAlchemy, SQLite/PostgreSQL, scikit-learn, joblib
**Frontend**: React 18, Recharts, Axios
**ML**: RandomForest regression models (4 models)

## Quick Start

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate   # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm start
```

Open http://localhost:3000

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /live/status` | Airport live status (weather, flights, queue) |
| `GET /live/status-railway` | Railway live status |
| `POST /predict-queue` | Airport queue wait time prediction |
| `POST /predict-delay` | Airport delay prediction |
| `POST /predict-queue-railway` | Railway queue prediction |
| `POST /predict-delay-railway` | Railway delay prediction |
| `GET /cctv` | CCTV camera list per location |
| `GET /airports` | All airports |
| `GET /railways` | All railway stations |
| `GET /airports/nearby` | Nearby airports by lat/lon |
| `GET /railways/nearby` | Nearby stations by lat/lon |
