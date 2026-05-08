import os
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
import joblib

MODEL_DIR = os.path.dirname(os.path.abspath(__file__))

AIRPORTS = ["DEL", "BOM", "BLR", "HYD", "MAA", "CCU", "AMD", "COK", "PNQ",
            "JAI", "LKO", "TRV", "BBI", "GAU", "VNS", "ATQ", "NAG", "GOI", "PAT", "VTZ"]
TERMINALS = ["T1", "T2", "T3", "T4"]
AIRLINES = ["IndiGo", "Air India", "SpiceJet", "Vistara", "GoFirst", "Akasa Air"]
WEATHERS = ["Clear", "Cloudy", "Rain", "Snow", "Fog"]


def generate_queue_data(n=3000):
    np.random.seed(42)
    data = []
    for _ in range(n):
        hour = np.random.randint(0, 24)
        passenger_count = np.random.randint(10, 500)
        terminal = np.random.choice(TERMINALS)
        airport = np.random.choice(AIRPORTS)

        base_wait = 2.0
        peak_factor = 1.0
        if 7 <= hour <= 10:
            peak_factor = 3.0
        elif 16 <= hour <= 19:
            peak_factor = 2.5

        region_factor = {"DEL": 1.3, "BOM": 1.2, "BLR": 1.1, "HYD": 1.0,
                         "MAA": 1.0, "CCU": 0.9}.get(airport, 1.0)

        count_factor = passenger_count / 100
        noise = np.random.normal(0, 2)
        wait_time = base_wait * peak_factor * count_factor * region_factor + noise
        wait_time = np.clip(wait_time, 1, 60)

        data.append([hour, passenger_count, terminal, airport, round(wait_time, 1)])

    df = pd.DataFrame(data, columns=["hour", "passenger_count", "terminal", "airport_code", "wait_time"])
    return df


def generate_flight_data(n=3000):
    np.random.seed(42)
    data = []
    for _ in range(n):
        hour = np.random.randint(0, 24)
        airline = np.random.choice(AIRLINES)
        weather = np.random.choice(WEATHERS)
        airport = np.random.choice(AIRPORTS)

        weather_penalty = {"Clear": 0, "Cloudy": 10, "Rain": 20, "Snow": 40, "Fog": 25}
        peak_delay = 15 if 6 <= hour <= 10 else (10 if 16 <= hour <= 20 else 0)

        airport_busy = {"DEL": 15, "BOM": 12, "BLR": 10, "HYD": 8}.get(airport, 5)
        airline_factor = {"IndiGo": 2, "Air India": 5, "SpiceJet": 8,
                          "Vistara": 3, "GoFirst": 10, "Akasa Air": 4}.get(airline, 5)

        noise = np.random.normal(0, 5)
        delay = 5 + weather_penalty[weather] + peak_delay + airport_busy + airline_factor + noise
        delay = np.clip(delay, 0, 180)

        data.append([hour, airline, weather, airport, round(delay, 1)])

    df = pd.DataFrame(data, columns=["hour", "airline", "weather", "airport_code", "delay_minutes"])
    return df


def train_queue_model():
    df = generate_queue_data()
    le_terminal = LabelEncoder()
    le_airport = LabelEncoder()
    df["terminal_enc"] = le_terminal.fit_transform(df["terminal"])
    df["airport_enc"] = le_airport.fit_transform(df["airport_code"])

    X = df[["hour", "passenger_count", "terminal_enc", "airport_enc"]]
    y = df["wait_time"]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)
    score = model.score(X_test, y_test)
    print(f"Queue Model R² score: {score:.4f}")

    joblib.dump(model, os.path.join(MODEL_DIR, "queue_model.pkl"))
    joblib.dump(le_terminal, os.path.join(MODEL_DIR, "queue_label_encoder.pkl"))
    joblib.dump(le_airport, os.path.join(MODEL_DIR, "queue_airport_encoder.pkl"))
    return model


def train_delay_model():
    df = generate_flight_data()
    le_airline = LabelEncoder()
    le_weather = LabelEncoder()
    le_airport = LabelEncoder()
    df["airline_enc"] = le_airline.fit_transform(df["airline"])
    df["weather_enc"] = le_weather.fit_transform(df["weather"])
    df["airport_enc"] = le_airport.fit_transform(df["airport_code"])

    X = df[["hour", "airline_enc", "weather_enc", "airport_enc"]]
    y = df["delay_minutes"]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)
    score = model.score(X_test, y_test)
    print(f"Delay Model R² score: {score:.4f}")

    joblib.dump(model, os.path.join(MODEL_DIR, "delay_model.pkl"))
    joblib.dump(le_airline, os.path.join(MODEL_DIR, "delay_airline_encoder.pkl"))
    joblib.dump(le_weather, os.path.join(MODEL_DIR, "delay_weather_encoder.pkl"))
    joblib.dump(le_airport, os.path.join(MODEL_DIR, "delay_airport_encoder.pkl"))
    return model


if __name__ == "__main__":
    print("Training queue prediction model...")
    train_queue_model()
    print("Training delay prediction model...")
    train_delay_model()
    print("Models trained and saved successfully!")
