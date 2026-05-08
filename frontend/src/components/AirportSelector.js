import React, { useState, useEffect, useRef } from "react";
import { fetchAirports, fetchNearbyAirports } from "../api/api";

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
  { code: "VNS", city: "Varanasi", name: "Lal Bahadur Shastri International", region: "North" },
  { code: "ATQ", city: "Amritsar", name: "Sri Guru Ram Dass Jee International", region: "North" },
  { code: "SXR", city: "Srinagar", name: "Sheikh ul-Alam International", region: "North" },
  { code: "IXE", city: "Mangaluru", name: "Mangalore International", region: "South" },
  { code: "NAG", city: "Nagpur", name: "Dr. Babasaheb Ambedkar International", region: "Central" },
  { code: "GOX", city: "Goa (Mopa)", name: "Manohar International", region: "West" },
  { code: "GOI", city: "Goa (Dabolim)", name: "Dabolim Airport", region: "West" },
  { code: "PAT", city: "Patna", name: "Jay Prakash Narayan International", region: "East" },
  { code: "VTZ", city: "Visakhapatnam", name: "Visakhapatnam International", region: "East" },
  { code: "IDR", city: "Indore", name: "Devi Ahilya Bai Holkar International", region: "Central" },
  { code: "IXC", city: "Chandigarh", name: "Chandigarh International", region: "North" },
  { code: "CJB", city: "Coimbatore", name: "Coimbatore International", region: "South" },
  { code: "IXR", city: "Ranchi", name: "Birsa Munda International", region: "East" },
  { code: "RPR", city: "Raipur", name: "Swami Vivekananda Airport", region: "Central" },
  { code: "TRZ", city: "Tiruchirappalli", name: "Tiruchirappalli International", region: "South" },
];

function AirportSelector({ selected, onSelect }) {
  const [airports, setAirports] = useState(FALLBACK_AIRPORTS);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locatedAirports, setLocatedAirports] = useState([]);
  const ref = useRef();
  const inputRef = useRef();

  useEffect(() => {
    fetchAirports().then(setAirports).catch(() => {});
  }, []);

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
          const nearbyAps = await fetchNearbyAirports(pos.coords.latitude, pos.coords.longitude, 150);
          setLocatedAirports(nearbyAps);
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
    ? airports.filter(
        (a) =>
          a.code.toLowerCase().includes(search.toLowerCase()) ||
          a.city.toLowerCase().includes(search.toLowerCase()) ||
          a.name.toLowerCase().includes(search.toLowerCase())
      )
    : airports;

  const selAirport = airports.find((a) => a.code === selected);

  return (
    <div className="airport-selector-wrapper" ref={ref}>
      <div className="airport-selector-header" onClick={() => setOpen(!open)}>
        <div className="airport-selector-info">
          {selAirport ? (
            <>
              <span className="airport-code-badge">{selAirport.code}</span>
              <div>
                <div className="airport-city-name">{selAirport.city}</div>
                <div className="airport-full-name">{selAirport.name}</div>
              </div>
            </>
          ) : (
            <span style={{ color: "#475569", fontSize: "0.82rem" }}>{selected || "Select airport"}</span>
          )}
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <button
            className={`location-btn${locatedAirports.length > 0 ? " has-location" : ""}`}
            onClick={(e) => { e.stopPropagation(); getLocation(); }}
            disabled={locating}
            title="Find nearest airport"
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
            placeholder="Search by code, city or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {locatedAirports.length > 0 && !search && (
            <>
              <div className="airport-group-label">Near You</div>
              {locatedAirports.map((ap) => (
                <div
                  key={ap.code}
                  className={`airport-option ${ap.code === selected ? "active" : ""}`}
                  onClick={() => { onSelect(ap.code); setOpen(false); setSearch(""); }}
                >
                  <span className="airport-opt-code">{ap.code}</span>
                  <span className="airport-opt-city">{ap.city}</span>
                  <span className="airport-opt-dist">{ap.distance_km} km</span>
                </div>
              ))}
              <div className="airport-divider" />
            </>
          )}

          <div className="airport-group-label">
            {search ? `Results (${filtered.length})` : "All Airports"}
          </div>
          <div className="airport-options-list">
            {filtered.length === 0 ? (
              <div style={{ padding: "1.5rem", color: "#334155", textAlign: "center", fontSize: "0.8rem" }}>
                No airports found
              </div>
            ) : (
              filtered.map((ap) => (
                <div
                  key={ap.code}
                  className={`airport-option ${ap.code === selected ? "active" : ""}`}
                  onClick={() => { onSelect(ap.code); setOpen(false); setSearch(""); }}
                >
                  <span className="airport-opt-code">{ap.code}</span>
                  <span className="airport-opt-city">{ap.city}</span>
                  <span className="airport-opt-region">{ap.region}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AirportSelector;
