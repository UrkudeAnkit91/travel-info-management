import os
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
import joblib

MODEL_DIR = os.path.dirname(os.path.abspath(__file__))

STATIONS = ["NDLS", "CSMT", "HWH", "MAS", "SBC", "ADI", "PNBE", "LKO", "BPL", "PUNE",
            "JP", "JAT", "NGP", "VSKP", "BRC", "GHY", "RNC", "TVC", "DDN", "PRYJ"]
PLATFORMS = ["PF1", "PF2", "PF3", "PF4", "PF5", "PF6", "PF7", "PF8"]


def gen_queue_data(n=2000):
    np.random.seed(42)
    data = []
    for _ in range(n):
        hour = np.random.randint(0, 24)
        pax = np.random.randint(20, 800)
        platform = np.random.choice(PLATFORMS)
        station = np.random.choice(STATIONS)

        pf = 1.0
        if 7 <= hour <= 10:
            pf = 2.5
        elif 17 <= hour <= 20:
            pf = 2.0
        elif 22 <= hour or hour <= 5:
            pf = 0.3

        busy = {"NDLS": 1.3, "CSMT": 1.2, "HWH": 1.15, "MAS": 1.0, "SBC": 1.0}.get(station, 0.9)
        noise = np.random.normal(0, 1.5)
        wait = 1.5 * pf * (pax / 150) * busy + noise
        wait = np.clip(wait, 1, 45)
        data.append([hour, pax, platform, station, round(wait, 1)])

    return pd.DataFrame(data, columns=["hour", "passenger_count", "platform", "station_code", "wait_time"])


def gen_delay_data(n=2000):
    np.random.seed(42)
    data = []
    for _ in range(n):
        hour = np.random.randint(0, 24)
        weather = np.random.choice(["Clear", "Cloudy", "Rain", "Fog"])
        station = np.random.choice(STATIONS)

        wp = {"Clear": 0, "Cloudy": 5, "Rain": 20, "Fog": 15}
        peak = 10 if 6 <= hour <= 10 else (8 if 16 <= hour <= 20 else 0)
        busy = {"NDLS": 12, "CSMT": 10, "HWH": 8}.get(station, 4)
        noise = np.random.normal(0, 6)
        delay = 3 + wp[weather] + peak + busy + noise
        delay = np.clip(delay, 0, 150)
        data.append([hour, weather, station, round(delay, 1)])

    return pd.DataFrame(data, columns=["hour", "weather", "station_code", "delay_minutes"])


def train_queue_model():
    df = gen_queue_data()
    le_pf = LabelEncoder()
    le_st = LabelEncoder()
    df["pf_enc"] = le_pf.fit_transform(df["platform"])
    df["st_enc"] = le_st.fit_transform(df["station_code"])
    X = df[["hour", "passenger_count", "pf_enc", "st_enc"]]
    y = df["wait_time"]
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)
    score = model.score(X_test, y_test)
    print(f"Railway Queue Model R\u00b2: {score:.4f}")
    joblib.dump(model, os.path.join(MODEL_DIR, "railway_queue_model.pkl"))
    joblib.dump(le_pf, os.path.join(MODEL_DIR, "railway_queue_platform_encoder.pkl"))
    joblib.dump(le_st, os.path.join(MODEL_DIR, "railway_queue_station_encoder.pkl"))


def train_delay_model():
    df = gen_delay_data()
    le_w = LabelEncoder()
    le_st = LabelEncoder()
    df["w_enc"] = le_w.fit_transform(df["weather"])
    df["st_enc"] = le_st.fit_transform(df["station_code"])
    X = df[["hour", "w_enc", "st_enc"]]
    y = df["delay_minutes"]
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)
    score = model.score(X_test, y_test)
    print(f"Railway Delay Model R\u00b2: {score:.4f}")
    joblib.dump(model, os.path.join(MODEL_DIR, "railway_delay_model.pkl"))
    joblib.dump(le_w, os.path.join(MODEL_DIR, "railway_delay_weather_encoder.pkl"))
    joblib.dump(le_st, os.path.join(MODEL_DIR, "railway_delay_station_encoder.pkl"))


if __name__ == "__main__":
    print("Training railway models...")
    train_queue_model()
    train_delay_model()
    print("Railway models saved!")
