import React, { useState } from "react";
import { predictDelay, predictRailwayDelay } from "../api/api";

const AIRLINES = ["IndiGo", "Air India", "SpiceJet", "Vistara", "GoFirst", "Akasa Air"];
const WEATHERS = ["Clear", "Cloudy", "Rain", "Snow", "Fog"];

function DelayPredictor({ mode, locationCode }) {
  const [hour, setHour] = useState(new Date().getHours());
  const [secondary, setSecondary] = useState(mode === "airport" ? "IndiGo" : "Clear");
  const [weather, setWeather] = useState("Clear");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (mode === "airport") {
        const data = await predictDelay(hour, secondary, weather, locationCode);
        setResult({ ...data, type: "airport", secondary, weather });
      } else {
        const data = await predictRailwayDelay(hour, weather, locationCode);
        setResult({ ...data, type: "railway", weather });
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Prediction failed");
    } finally {
      setLoading(false);
    }
  };

  const title = mode === "airport" ? "Flight Delay" : "Train Delay";

  return (
    <div className="card">
      <h2>{title} Prediction</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Hour (0-23)</label>
          <input type="number" min={0} max={23} value={hour} onChange={(e) => setHour(Number(e.target.value))} />
        </div>
        <div className="form-row">
          {mode === "airport" ? (
            <div className="form-group">
              <label>Airline</label>
              <select value={secondary} onChange={(e) => setSecondary(e.target.value)}>
                {AIRLINES.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          ) : (
            <div className="form-group">
              <label>Station</label>
              <input type="text" value={locationCode} disabled style={{ opacity: 0.6 }} />
            </div>
          )}
          <div className="form-group">
            <label>Weather</label>
            <select value={weather} onChange={(e) => setWeather(e.target.value)}>
              {WEATHERS.map((w) => <option key={w} value={w}>{w}</option>)}
            </select>
          </div>
        </div>
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? "Predicting..." : `Predict ${title}`}
        </button>
      </form>
      {error && <div className="result-box"><p style={{ color: "#ef4444" }}>{error}</p></div>}
      {result && (
        <div className="result-box">
          <div className="value">{result.delay_minutes} <span className="unit">min</span></div>
          <div className="label-text">Estimated delay</div>
          <div style={{ marginTop: "0.5rem", display: "flex", gap: "0.4rem", justifyContent: "center" }}>
            <span className="mini-badge">{locationCode}</span>
            {result.secondary && <span className="mini-badge">{result.secondary}</span>}
          </div>
        </div>
      )}
    </div>
  );
}

export default DelayPredictor;
