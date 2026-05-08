# AI Airport Management System - Setup Instructions

## Prerequisites
- Python 3.9+
- Node.js 18+
- PostgreSQL 14+

## 1. PostgreSQL Setup

### Windows
1. Download PostgreSQL from https://www.postgresql.org/download/windows/
2. Install and remember the password for `postgres` user
3. Open **pgAdmin** or **SQL Shell (psql)** and run:

```sql
CREATE DATABASE airport_mgmt;
```

### macOS (Homebrew)
```bash
brew install postgresql@14
brew services start postgresql@14
psql postgres -c "CREATE DATABASE airport_mgmt;"
```

### Linux (Ubuntu/Debian)
```bash
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo -u postgres createdb airport_mgmt
```

## 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate it
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env if your PostgreSQL credentials differ

# Train ML models
python -m app.ml.train_models

# Start backend server
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`
Swagger docs at `http://localhost:8000/docs`

## 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env

# Start development server
npm start
```

The frontend will be available at `http://localhost:3000`

## 4. Usage

1. Open `http://localhost:3000` in your browser
2. Use **Queue Wait Prediction** to estimate wait times based on hour, passenger count, and terminal
3. Use **Flight Delay Prediction** to estimate delays based on hour, airline, and weather
4. View historical data charts that auto-refresh every 30 seconds
5. Alerts will appear when wait times > 30 min or delays > 60 min

## Project Structure

```
airport-mgmt/
├── backend/
│   ├── app/
│   │   ├── database/       # SQLAlchemy connection & CRUD
│   │   ├── models/         # DB schema models
│   │   ├── routes/         # FastAPI endpoints
│   │   ├── ml/             # ML training & saved models
│   │   └── main.py         # FastAPI entry point
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── api/            # API client
│   │   ├── App.js
│   │   └── index.js
│   ├── package.json
│   └── .env.example
└── SETUP.md
```
