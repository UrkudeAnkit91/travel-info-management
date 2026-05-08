import React, { useState } from "react";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import ModeToggle from "./components/ModeToggle";
import LocationSelector from "./components/LocationSelector";
import "./App.css";

function App() {
  const [theme, setTheme] = useState("dark");
  const [activePage, setActivePage] = useState("dashboard");
  const [mode, setMode] = useState("airport");
  const [selectedCode, setSelectedCode] = useState("DEL");

  const toggleTheme = () => {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  };

  React.useEffect(() => {
    document.documentElement.className = theme;
  }, [theme]);

  const header = (
    <header className="app-header">
      <div className="app-header-inner">
        <div className="header-brand">
          <div>
            <h1>{mode === "airport" ? "Airport" : "Railway"} Management System</h1>
            <p>
              {mode === "airport"
                ? "Queue & Delay Prediction · Live Status · 49 Airports"
                : "Queue & Train Delay · Live Status · 40+ Stations"}
            </p>
          </div>
        </div>
        <div className="header-actions">
          <ModeToggle mode={mode} onToggle={setMode} onCodeChange={setSelectedCode} />
          <LocationSelector mode={mode} selected={selectedCode} onSelect={setSelectedCode} />
        </div>
      </div>
    </header>
  );

  return (
    <div className="app-layout">
      <Sidebar activePage={activePage} onNavigate={setActivePage} theme={theme} onToggleTheme={toggleTheme} />
      <main className="app-main">
        {header}
        <Dashboard activePage={activePage} mode={mode} locationCode={selectedCode} />
      </main>
    </div>
  );
}

export default App;
