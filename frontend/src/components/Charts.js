import React, { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { fetchAirportsSummary, fetchRailwaysSummary } from "../api/api";

function Charts({ mode }) {
  const [summary, setSummary] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const fn = mode === "airport" ? fetchAirportsSummary : fetchRailwaysSummary;
        const res = await fn();
        setSummary(res);
      } catch {}
    };
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [mode]);

  if (summary.length === 0) {
    return (
      <div className="card full-width">
        <h2>{mode === "airport" ? "India Airport" : "Indian Railway"} Analytics</h2>
        <p style={{ color: "#475569", fontSize: "0.82rem" }}>Loading...</p>
      </div>
    );
  }

  const delayedKey = mode === "airport" ? "delayed_flights" : "delayed_trains";
  const totalKey = mode === "airport" ? "total_flights" : "total_trains";
  const totalDelayed = summary.reduce((s, a) => s + a[delayedKey], 0);
  const totalEntities = summary.reduce((s, a) => s + a[totalKey], 0);
  const avgDelayAll = summary.reduce((s, a) => s + a.avg_delay, 0) / summary.length;
  const totalPax = summary.reduce((s, a) => s + a.passengers, 0);

  const topBusy = [...summary].sort((a, b) => b.passengers - a.passengers).slice(0, 8);

  const regionKey = mode === "airport" ? "region" : "zone";
  const regionData = summary.reduce((acc, a) => {
    const existing = acc.find((d) => d.name === a[regionKey]);
    if (existing) { existing.avgDelay = (existing.avgDelay + a.avg_delay) / 2; }
    else { acc.push({ name: a[regionKey], avgDelay: a.avg_delay }); }
    return acc;
  }, []);

  return (
    <div className="card full-width">
      <h2>{mode === "airport" ? "India Airport" : "Indian Railway"} Analytics</h2>

      <div className="stats-bar">
        <div className="stat-item">
          <div className="stat-value">{totalEntities}</div>
          <div className="stat-label">{mode === "airport" ? "Flights" : "Trains"}</div>
        </div>
        <div className="stat-item">
          <div className="stat-value" style={{ color: "#ef4444" }}>{totalDelayed}</div>
          <div className="stat-label">Delayed</div>
        </div>
        <div className="stat-item">
          <div className="stat-value" style={{ color: "#f59e0b" }}>{avgDelayAll.toFixed(0)}m</div>
          <div className="stat-label">Avg Delay</div>
        </div>
        <div className="stat-item">
          <div className="stat-value" style={{ color: "#22c55e" }}>{(totalPax / 1000).toFixed(0)}K</div>
          <div className="stat-label">Passengers</div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-box">
          <div className="chart-title">Busiest by Passenger Volume</div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={topBusy} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1f2e" />
              <XAxis type="number" stroke="#334155" tick={{ fontSize: 10 }} />
              <YAxis dataKey="code" type="category" stroke="#334155" width={36} tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ background: "#0f1420", border: "1px solid #1e293b", borderRadius: 6, fontSize: 11 }} />
              <Bar dataKey="passengers" fill="#3b82f6" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-box">
          <div className="chart-title">Avg Delay by {mode === "airport" ? "Region" : "Zone"}</div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={regionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1f2e" />
              <XAxis dataKey="name" stroke="#334155" tick={{ fontSize: 10 }} />
              <YAxis stroke="#334155" tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ background: "#0f1420", border: "1px solid #1e293b", borderRadius: 6, fontSize: 11 }} />
              <Bar dataKey="avgDelay" fill="#818cf8" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <details className="flights-details">
        <summary>All {mode === "airport" ? "Airports" : "Stations"} ({summary.length})</summary>
        <div className="flights-table-wrap">
          <table className="flights-table">
            <thead>
              <tr>
                <th>Code</th><th>City</th><th>{mode === "airport" ? "Region" : "Zone"}</th>
                <th>{mode === "airport" ? "Flights" : "Trains"}</th><th>Delayed</th><th>Delay</th><th>Queue</th><th>Temp</th>
              </tr>
            </thead>
            <tbody>
              {summary.map((a) => (
                <tr key={a.code}>
                  <td className="td-flight">{a.code}</td>
                  <td className="td-airline">{a.city}</td>
                  <td><span className="region-tag">{a[mode === "airport" ? "region" : "zone"]}</span></td>
                  <td>{a[totalKey]}</td>
                  <td style={{ color: a[delayedKey] > 0 ? "#ef4444" : "#22c55e" }}>{a[delayedKey]}</td>
                  <td>{a.avg_delay}m</td>
                  <td>~{a.queue_wait}m</td>
                  <td>{a.temp}\u00B0</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}

export default Charts;
