import React, { useState } from "react";
import ModeToggle from "./ModeToggle";
import LocationSelector from "./LocationSelector";
import LiveStatus from "./LiveStatus";
import CCTVFeed from "./CCTVFeed";
import QueuePredictor from "./QueuePredictor";
import DelayPredictor from "./DelayPredictor";
import Charts from "./Charts";

function DashboardPage({ mode, locationCode }) {
  return (
    <div className="page-content page-dashboard">
      <div className="dashboard-grid">
        <LiveStatus mode={mode} locationCode={locationCode} />
        <CCTVFeed mode={mode} locationCode={locationCode} />
      </div>
    </div>
  );
}

function PredictionsPage({ mode, locationCode }) {
  return (
    <div className="page-content page-predictions">
      <div className="pred-grid">
        <QueuePredictor mode={mode} locationCode={locationCode} />
        <DelayPredictor mode={mode} locationCode={locationCode} />
      </div>
    </div>
  );
}

function AnalyticsPage({ mode }) {
  return (
    <div className="page-content page-analytics">
      <Charts mode={mode} />
    </div>
  );
}

function Dashboard({ activePage, mode, locationCode }) {
  if (activePage === "predictions") return <PredictionsPage mode={mode} locationCode={locationCode} />;
  if (activePage === "analytics") return <AnalyticsPage mode={mode} />;
  return <DashboardPage mode={mode} locationCode={locationCode} />;
}

export default Dashboard;
