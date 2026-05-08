import React from "react";

const PAGES = [
  { key: "dashboard", label: "Dashboard" },
  { key: "predictions", label: "Predictions" },
  { key: "analytics", label: "Analytics" },
];

function Sidebar({ activePage, onNavigate, theme, onToggleTheme }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-logo">AM</div>
        <span className="sidebar-brand-text">Airport Mgmt</span>
      </div>
      <nav className="sidebar-nav">
        {PAGES.map((p) => (
          <button
            key={p.key}
            className={`sidebar-link${activePage === p.key ? " active" : ""}`}
            onClick={() => onNavigate(p.key)}
          >
            <span className="sidebar-link-icon">{p.key === "dashboard" ? "D" : p.key === "predictions" ? "P" : "A"}</span>
            {p.label}
          </button>
        ))}
      </nav>
      <div className="sidebar-footer">
        <button className="theme-toggle" onClick={onToggleTheme} style={{ width: "100%" }}>
          {theme === "dark" ? "Light Mode" : "Dark Mode"}
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
