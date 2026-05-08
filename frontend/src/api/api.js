import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";
const api = axios.create({ baseURL: API_URL });

// ─── Airport ───
export const predictQueue = async (hour, pax, terminal, code) => {
  const r = await api.post("/predict-queue", { hour, passenger_count: pax, terminal, airport_code: code });
  return r.data;
};
export const predictDelay = async (hour, airline, weather, code) => {
  const r = await api.post("/predict-delay", { hour, airline, weather, airport_code: code });
  return r.data;
};
export const fetchLiveStatus = async (code) => {
  const r = await api.get("/live/status", { params: { airport_code: code } });
  return r.data;
};
export const fetchAirports = async () => {
  const r = await api.get("/airports");
  return r.data;
};
export const fetchNearbyAirports = async (lat, lon, radius = 100) => {
  const r = await api.get("/airports/nearby", { params: { lat, lon, radius } });
  return r.data;
};
export const fetchAirportsSummary = async () => {
  const r = await api.get("/airports/summary");
  return r.data;
};

// ─── Railway ───
export const predictRailwayQueue = async (hour, pax, platform, code) => {
  const r = await api.post("/predict-queue-railway", { hour, passenger_count: pax, platform, station_code: code });
  return r.data;
};
export const predictRailwayDelay = async (hour, weather, code) => {
  const r = await api.post("/predict-delay-railway", { hour, weather, station_code: code });
  return r.data;
};
export const fetchRailwayStatus = async (code) => {
  const r = await api.get("/live/status-railway", { params: { station_code: code } });
  return r.data;
};
export const fetchStations = async () => {
  const r = await api.get("/railways");
  return r.data;
};
export const fetchNearbyStations = async (lat, lon, radius = 100) => {
  const r = await api.get("/railways/nearby", { params: { lat, lon, radius } });
  return r.data;
};
export const fetchRailwaysSummary = async () => {
  const r = await api.get("/railways/summary");
  return r.data;
};

// ─── CCTV ───
export const fetchCCTV = async (code) => {
  const r = await api.get("/cctv", { params: { location_code: code } });
  return r.data;
};

export default api;
