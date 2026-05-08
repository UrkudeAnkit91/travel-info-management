import React, { useState, useEffect, useRef } from "react";
import { fetchAirports, fetchNearbyAirports, fetchStations, fetchNearbyStations } from "../api/api";

const FALLBACK_AIRPORTS = [
  { code: "DEL", city: "Delhi", name: "Indira Gandhi International", region: "North" },
  { code: "BOM", city: "Mumbai", name: "Chhatrapati Shivaji Maharaj International", region: "West" },
  { code: "BLR", city: "Bengaluru", name: "Kempegowda International", region: "South" },
  { code: "HYD", city: "Hyderabad", name: "Rajiv Gandhi International", region: "South" },
  { code: "MAA", city: "Chennai", name: "Chennai International", region: "South" },
  { code: "CCU", city: "Kolkata", name: "Netaji Subhas Chandra Bose International", region: "East" },
  { code: "AMD", city: "Ahmedabad", name: "Sardar Vallabhbhai Patel International", region: "West" },
  { code: "COK", city: "Kochi", name: "Cochin International", region: "South" },
  { code: "PNQ", city: "Pune", name: "Pune International", region: "West" },
  { code: "JAI", city: "Jaipur", name: "Jaipur International", region: "North" },
  { code: "LKO", city: "Lucknow", name: "Chaudhary Charan Singh International", region: "North" },
  { code: "TRV", city: "Thiruvananthapuram", name: "Trivandrum International", region: "South" },
  { code: "BBI", city: "Bhubaneswar", name: "Biju Patnaik International", region: "East" },
  { code: "GAU", city: "Guwahati", name: "Lokpriya Gopinath Bordoloi International", region: "East" },
  { code: "ATQ", city: "Amritsar", name: "Sri Guru Ram Dass Jee International", region: "North" },
  { code: "SXR", city: "Srinagar", name: "Sheikh ul-Alam International", region: "North" },
  { code: "NAG", city: "Nagpur", name: "Dr. Babasaheb Ambedkar International", region: "Central" },
  { code: "GOX", city: "Goa (Mopa)", name: "Manohar International", region: "West" },
  { code: "PAT", city: "Patna", name: "Jay Prakash Narayan International", region: "East" },
  { code: "VTZ", city: "Visakhapatnam", name: "Visakhapatnam International", region: "East" },
  { code: "IDR", city: "Indore", name: "Devi Ahilya Bai Holkar International", region: "Central" },
  { code: "IXC", city: "Chandigarh", name: "Chandigarh International", region: "North" },
  { code: "RPR", city: "Raipur", name: "Swami Vivekananda Airport", region: "Central" },
  { code: "UDR", city: "Udaipur", name: "Maharana Pratap Airport", region: "North" },
  { code: "IXR", city: "Ranchi", name: "Birsa Munda International", region: "East" },
];

const FALLBACK_STATIONS = [
  { code: "NDLS", city: "New Delhi", name: "New Delhi Railway Station", zone: "Northern" },
  { code: "CSMT", city: "Mumbai", name: "Chhatrapati Shivaji Maharaj Terminus", zone: "Central" },
  { code: "HWH", city: "Kolkata", name: "Howrah Junction", zone: "Eastern" },
  { code: "MAS", city: "Chennai", name: "Chennai Central", zone: "Southern" },
  { code: "SBC", city: "Bengaluru", name: "KSR Bengaluru City Junction", zone: "South Western" },
  { code: "ADI", city: "Ahmedabad", name: "Ahmedabad Junction", zone: "Western" },
  { code: "PNBE", city: "Patna", name: "Patna Junction", zone: "East Central" },
  { code: "LKO", city: "Lucknow", name: "Lucknow Charbagh", zone: "Northern" },
  { code: "BPL", city: "Bhopal", name: "Bhopal Junction", zone: "West Central" },
  { code: "PUNE", city: "Pune", name: "Pune Junction", zone: "Central" },
  { code: "JP", city: "Jaipur", name: "Jaipur Junction", zone: "North Western" },
  { code: "JAT", city: "Jammu", name: "Jammu Tawi", zone: "Northern" },
  { code: "NGP", city: "Nagpur", name: "Nagpur Junction", zone: "Central" },
  { code: "VSKP", city: "Visakhapatnam", name: "Visakhapatnam Junction", zone: "East Coast" },
  { code: "BRC", city: "Vadodara", name: "Vadodara Junction", zone: "Western" },
  { code: "GHY", city: "Guwahati", name: "Guwahati", zone: "Northeast Frontier" },
  { code: "RNC", city: "Ranchi", name: "Ranchi Junction", zone: "South Eastern" },
  { code: "TVC", city: "Thiruvananthapuram", name: "Thiruvananthapuram Central", zone: "Southern" },
  { code: "DDN", city: "Dehradun", name: "Dehradun", zone: "Northern" },
  { code: "PRYJ", city: "Prayagraj", name: "Prayagraj Junction", zone: "North Central" },
  { code: "MYS", city: "Mysuru", name: "Mysuru Junction", zone: "South Western" },
  { code: "SDAH", city: "Kolkata", name: "Sealdah", zone: "Eastern" },
  { code: "BJU", city: "Barauni", name: "Barauni Junction", zone: "East Central" },
  { code: "KOC", city: "Kochi", name: "Kochi Junction (Ernakulam)", zone: "Southern" },
  { code: "DLI", city: "Delhi", name: "Old Delhi Junction", zone: "Northern" },
  { code: "CNB", city: "Kanpur", name: "Kanpur Central", zone: "Northern" },
  { code: "UDR", city: "Udaipur", name: "Udaipur City", zone: "North Western" },
  { code: "GKP", city: "Gorakhpur", name: "Gorakhpur Junction", zone: "North Eastern" },
];

function LocationSelector({ mode, selected, onSelect }) {
  const [locations, setLocations] = useState(mode === "airport" ? FALLBACK_AIRPORTS : FALLBACK_STATIONS);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [locating, setLocating] = useState(false);
  const [nearby, setNearby] = useState([]);
  const ref = useRef();
  const inputRef = useRef();

  useEffect(() => {
    const fn = mode === "airport" ? fetchAirports : fetchStations;
    fn().then(setLocations).catch(() => {
      setLocations(mode === "airport" ? FALLBACK_AIRPORTS : FALLBACK_STATIONS);
    });
  }, [mode]);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  const getLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const fn = mode === "airport" ? fetchNearbyAirports : fetchNearbyStations;
          const nearbyAps = await fn(pos.coords.latitude, pos.coords.longitude, 150);
          setNearby(nearbyAps);
          if (nearbyAps.length > 0) onSelect(nearbyAps[0].code);
          setOpen(true);
        } catch {}
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const filtered = search
    ? locations.filter(
        (l) =>
          l.code.toLowerCase().includes(search.toLowerCase()) ||
          l.city.toLowerCase().includes(search.toLowerCase()) ||
          l.name.toLowerCase().includes(search.toLowerCase())
      )
    : locations;

  const sel = locations.find((l) => l.code === selected);
  const tag = mode === "airport" ? "region" : "zone";
  const label = mode === "airport" ? "Airport" : "Station";

  return (
    <div className="airport-selector-wrapper" ref={ref}>
      <div className="airport-selector-header" onClick={() => setOpen(!open)}>
        <div className="airport-selector-info">
          {sel ? (
            <>
              <span className="airport-code-badge">{sel.code}</span>
              <div>
                <div className="airport-city-name">{sel.city}</div>
                <div className="airport-full-name">{sel.name}</div>
              </div>
            </>
          ) : (
            <span style={{ color: "#475569", fontSize: "0.82rem" }}>Select {label}</span>
          )}
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <button
            className={`location-btn${nearby.length > 0 ? " has-location" : ""}`}
            onClick={(e) => { e.stopPropagation(); getLocation(); }}
            disabled={locating}
            title={`Nearest ${label}`}
          >
            {locating ? "\u23F3" : "\uD83D\uDCCD"}
            <span className="dot" />
          </button>
          <span className={`dropdown-arrow ${open ? "open" : ""}`}>\u25BC</span>
        </div>
      </div>

      {open && (
        <div className="airport-dropdown">
          <input
            ref={inputRef}
            className="airport-search"
            placeholder={`Search ${label.toLowerCase()} by code, city or name...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {nearby.length > 0 && !search && (
            <>
              <div className="airport-group-label">Near You</div>
              {nearby.map((l) => (
                <div
                  key={l.code}
                  className={`airport-option ${l.code === selected ? "active" : ""}`}
                  onClick={() => { onSelect(l.code); setOpen(false); setSearch(""); }}
                >
                  <span className="airport-opt-code">{l.code}</span>
                  <span className="airport-opt-city">{l.city}</span>
                  <span className="airport-opt-dist">{l.distance_km} km</span>
                </div>
              ))}
              <div className="airport-divider" />
            </>
          )}

          <div className="airport-group-label">
            {search ? `Results (${filtered.length})` : `All ${label}s`}
          </div>
          <div className="airport-options-list">
            {filtered.length === 0 ? (
              <div style={{ padding: "1.5rem", textAlign: "center", fontSize: "0.8rem", color: "#334155" }}>
                No {label.toLowerCase()}s found
              </div>
            ) : (
              filtered.map((l) => (
                <div
                  key={l.code}
                  className={`airport-option ${l.code === selected ? "active" : ""}`}
                  onClick={() => { onSelect(l.code); setOpen(false); setSearch(""); }}
                >
                  <span className="airport-opt-code">{l.code}</span>
                  <span className="airport-opt-city">{l.city}</span>
                  <span className="airport-opt-region">{l[tag]}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default LocationSelector;
