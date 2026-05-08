import React, { useState } from "react";
import { predictQueue, predictRailwayQueue } from "../api/api";

const TERMINALS = ["T1", "T2", "T3", "T4"];
const PLATFORMS = ["PF1", "PF2", "PF3", "PF4", "PF5", "PF6", "PF7", "PF8"];

function QueuePredictor({ mode, locationCode }) {
  const [hour, setHour] = useState(new Date().getHours());
  const [count, setCount] = useState(150);
  const [locationPart, setLocationPart] = useState(mode === "airport" ? "T1" : "PF1");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (mode === "airport") {
        const data = await predictQueue(hour, count, locationPart, locationCode);
        setResult({ ...data, type: "airport" });
      } else {
        const data = await predictRailwayQueue(hour, count, locationPart, locationCode);
        setResult({ ...data, type: "railway" });
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Prediction failed");
    } finally {
      setLoading(false);
    }
  };

  const title = mode === "airport" ? "Queue Wait Time" : "Platform Queue Time";

  return (
    <div className="card">
      <h2>{title}</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label>Hour (0-23)</label>
            <input type="number" min={0} max={23} value={hour} onChange={(e) => setHour(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Passengers</label>
            <input type="number" min={1} max={2000} value={count} onChange={(e) => setCount(Number(e.target.value))} />
          </div>
        </div>
        <div className="form-group">
          <label>{mode === "airport" ? "Terminal" : "Platform"}</label>
          <select value={locationPart} onChange={(e) => setLocationPart(e.target.value)}>
            {(mode === "airport" ? TERMINALS : PLATFORMS).map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? "Predicting..." : mode === "airport" ? "Predict Wait Time" : "Predict Queue Time"}
        </button>
      </form>
      {error && <div className="result-box"><p style={{ color: "#ef4444" }}>{error}</p></div>}
      {result && (
        <div className="result-box">
          <div className="value">{result.wait_time} <span className="unit">min</span></div>
          <div className="label-text">Estimated {mode === "airport" ? "queue wait" : "platform queue"} time</div>
          <div style={{ marginTop: "0.5rem", display: "flex", gap: "0.4rem", justifyContent: "center" }}>
            <span className="mini-badge">{locationCode}</span>
            <span className="mini-badge">{locationPart}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default QueuePredictor;
