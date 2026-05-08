import React from "react";

function ModeToggle({ mode, onToggle, onCodeChange }) {
  return (
    <div className="mode-toggle">
      <button
        className={`mode-btn ${mode === "airport" ? "active" : ""}`}
        onClick={() => { onToggle("airport"); onCodeChange("DEL"); }}
      >
        Airports
      </button>
      <button
        className={`mode-btn ${mode === "railway" ? "active" : ""}`}
        onClick={() => { onToggle("railway"); onCodeChange("NDLS"); }}
      >
        Railways
      </button>
    </div>
  );
}

export default ModeToggle;
