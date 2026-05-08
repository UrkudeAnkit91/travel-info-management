import React, { useState, useEffect, useRef } from "react";
import { fetchLiveStatus, fetchRailwayStatus } from "../api/api";

function LiveStatus({ mode, locationCode }) {
  const [data, setData] = useState(null);
  const modeRef = useRef(mode);

  useEffect(() => {
    modeRef.current = mode;
    setData(null);
    if (!locationCode) return;
    const load = async () => {
      try {
        const fn = mode === "airport" ? fetchLiveStatus : fetchRailwayStatus;
        const res = await fn(locationCode);
        if (modeRef.current === mode) setData(res);
      } catch {}
    };
    load();
    const interval = setInterval(load, 20000);
    return () => clearInterval(interval);
  }, [mode, locationCode]);

  if (!data) {
    return (
      <div className="card full-width">
        <h2>Live Status</h2>
        <p style={{ color: "#475569", fontSize: "0.82rem" }}>Loading...</p>
      </div>
    );
  }

  const entity = mode === "airport" ? data.airport : data.station;
  if (!entity) {
    return (
      <div className="card full-width">
        <h2>Live Status</h2>
        <p style={{ color: "#475569", fontSize: "0.82rem" }}>Loading...</p>
      </div>
    );
  }

  const weather = data.weather;
  const schedule = mode === "airport" ? data.flights : data.trains;
  const queue = data.queue;
  const alerts = data.alerts || [];

  if (!weather || !schedule || !queue) {
    return (
      <div className="card full-width">
        <h2>Live Status</h2>
        <p style={{ color: "#475569", fontSize: "0.82rem" }}>Loading...</p>
      </div>
    );
  }

  return (
    <div className="card full-width">
      <div className="live-status-header">
        <div>
          <h2>{entity.name} ({entity.code})</h2>
          <span style={{ color: "#475569", fontSize: "0.75rem" }}>
            {entity.city}
            {entity.region ? ` \u00B7 ${entity.region} \u00B7 ${entity.terminals} terminals` : ""}
            {entity.zone ? ` \u00B7 ${entity.zone} \u00B7 ${entity.platforms} platforms` : ""}
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
          <span className="live-indicator">Live</span>
          <span style={{ fontSize: "0.65rem", color: "#334155" }}>
            {new Date(data.timestamp).toLocaleTimeString()}
          </span>
        </div>
      </div>

      {alerts.map((alert, i) => (
        <div key={i} className="alert-banner">{alert}</div>
      ))}

      <div className="live-cards-grid">
        <div className="live-card">
          <div className="live-card-value">{weather.temperature_c}&deg;</div>
          <div className="live-card-label">{weather.condition}</div>
          <div className="live-card-sub">{weather.wind_speed} m/s &middot; {weather.humidity}% humidity</div>
        </div>

        <div className="live-card">
          <div className="live-card-value" style={{ color: "#818cf8" }}>{schedule.total}</div>
          <div className="live-card-label">{mode === "airport" ? "Flights" : "Trains"}</div>
          <div className="live-card-stats">
            <span style={{ color: schedule.delayed > 0 ? "#ef4444" : "#22c55e" }}>
              {schedule.delayed} delayed
            </span>
            <span style={{ color: "#f59e0b" }}>{schedule.average_delay_minutes}m avg</span>
          </div>
        </div>

        <div className="live-card">
          <div className="live-card-value" style={{ color: "#22c55e" }}>{queue.estimated_passengers}</div>
          <div className="live-card-label">Passengers</div>
          <div className="live-card-stats">
            {Object.entries(queue.terminals || queue.platforms || {}).slice(0, 3).map(([k, v]) => (
              <span key={k} style={{ color: "#475569" }}>{k}: {v}</span>
            ))}
          </div>
          <div style={{ fontSize: "0.85rem", fontWeight: 500, color: queue.estimated_wait_minutes > 20 ? "#ef4444" : "#22c55e", marginTop: 2 }}>
            ~{queue.estimated_wait_minutes} min wait
          </div>
        </div>
      </div>

      {schedule.list && schedule.list.length > 0 && (
        <details className="flights-details">
          <summary>{mode === "airport" ? "Flight" : "Train"} Schedule ({schedule.list.length})</summary>
          <div className="flights-table-wrap">
            <table className="flights-table">
              <thead>
                <tr>
                  <th>ID</th>
                  {mode === "airport" && <th>Airline</th>}
                  {mode === "railway" && <th>Name</th>}
                  <th>Destination</th><th>Status</th><th>Delay</th>
                  {mode === "railway" && <th>PF</th>}
                </tr>
              </thead>
              <tbody>
                {schedule.list.map((item, i) => (
                  <tr key={i}>
                    <td className="td-flight">
                      {mode === "airport" ? item.flight_id : item.train_id}
                    </td>
                    <td className="td-airline">
                      {mode === "airport" ? item.airline : item.train_name}
                    </td>
                    <td className="td-dest">{item.arrival_airport || item.destination}</td>
                    <td><span className={`status-tag ${item.status}`}>{item.status}</span></td>
                    <td className="td-delay">{item.delay_minutes > 0 ? `${item.delay_minutes}m` : "\u2014"}</td>
                    {mode === "railway" && <td style={{ color: "#475569", fontSize: "0.7rem" }}>PF {item.platform}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </div>
  );
}

export default LiveStatus;
