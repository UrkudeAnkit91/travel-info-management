import React, { useState, useEffect, useRef } from "react";
import { fetchCCTV } from "../api/api";

function drawPeople(ctx, w, h, t) {
  ctx.fillStyle = "#141a24";
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = "rgba(255,255,255,0.03)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 10; i++) {
    const y = ((i * 26 + t * 30 + i * 5) % (h + 40)) - 20;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y + 6);
    ctx.stroke();
  }
  for (let i = 0; i < 14; i++) {
    const x = ((i * 23 + t * 22 + i * 11) % (w + 40)) - 20;
    const yy = 20 + ((i * 31 + t * 8) % (h - 50));
    const bob = Math.sin(t * 2 + i) * 2;
    ctx.fillStyle = `rgba(255,255,255,${0.04 + (i % 3) * 0.015})`;
    ctx.beginPath();
    ctx.arc(x, yy + bob, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(x - 1, yy + 3 + bob, 2, 8);
  }
}

function drawRunway(ctx, w, h, t) {
  ctx.fillStyle = "#0e141e";
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 8; i++) {
    const y = ((i * 38 + t * 35) % (h + 50)) - 25;
    ctx.fillStyle = "rgba(255,255,255,0.04)";
    ctx.fillRect(w * 0.35, y, w * 0.3, 2);
  }
  ctx.strokeStyle = "rgba(255,255,255,0.06)";
  ctx.lineWidth = 1;
  ctx.setLineDash([8, 12]);
  ctx.beginPath();
  ctx.moveTo(w * 0.5, 0);
  ctx.lineTo(w * 0.5, h);
  ctx.stroke();
  ctx.setLineDash([]);

  const planeX1 = ((t * 50) % (w + 80)) - 40;
  const planeX2 = (w - ((t * 35) % (w + 80))) + 40;
  ctx.fillStyle = "rgba(200,220,255,0.08)";
  ctx.beginPath();
  ctx.ellipse(planeX1, h * 0.3, 22, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(planeX2, h * 0.65, 22, 5, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawPlatform(ctx, w, h, t) {
  ctx.fillStyle = "#151515";
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 6; i++) {
    const y = 15 + i * (h / 6);
    ctx.fillStyle = "rgba(255,255,255,0.03)";
    ctx.fillRect(0, y, w, 2);
  }
  for (let i = 0; i < 10; i++) {
    const x = ((i * 28 + t * 18) % (w + 50)) - 25;
    const yy = 10 + ((i * 23) % (h - 30));
    ctx.fillStyle = "rgba(255,255,255,0.03)";
    ctx.fillRect(x, yy, 3, 5);
  }
  const trainX = ((t * 20) % (w + 120)) - 60;
  ctx.fillStyle = "rgba(100,150,220,0.06)";
  ctx.fillRect(trainX, h * 0.3, 50, 8);
  ctx.fillRect(trainX, h * 0.3 + 10, 50, 8);
}

function drawParking(ctx, w, h, t) {
  ctx.fillStyle = "#12120e";
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = "rgba(255,255,255,0.03)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 5; i++) {
    const y = 15 + i * (h / 5);
    ctx.beginPath();
    ctx.moveTo(5, y);
    ctx.lineTo(w - 5, y);
    ctx.stroke();
  }
  for (let i = 0; i < 6; i++) {
    const cx = 10 + i * (w / 6);
    const cy = 20 + ((i * 19) % (h - 40));
    ctx.fillStyle = ["rgba(150,150,150,0.04)", "rgba(180,180,180,0.03)", "rgba(120,120,120,0.04)", "rgba(160,160,160,0.03)"][i % 4];
    ctx.fillRect(cx, cy, 16, 8);
  }
  const carX = ((t * 12) % (w + 40)) - 20;
  ctx.fillStyle = "rgba(200,200,100,0.06)";
  ctx.fillRect(carX, h * 0.5, 18, 8);
}

function drawEntrance(ctx, w, h, t) {
  ctx.fillStyle = "#161c24";
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "rgba(255,255,255,0.02)";
  ctx.fillRect(w * 0.4, 0, w * 0.2, h);
  for (let i = 0; i < 16; i++) {
    const x = ((i * 17 + t * 20 + i * 7) % (w + 40)) - 20;
    const yy = 5 + ((i * 29) % (h - 20));
    const bob = Math.sin(t * 3 + i * 0.5) * 1.5;
    ctx.fillStyle = `rgba(255,255,255,${0.03 + (i % 4) * 0.01})`;
    ctx.beginPath();
    ctx.arc(x, yy + bob, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawDefault(ctx, w, h, t) {
  ctx.fillStyle = "#0e0e0e";
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 20; i++) {
    const x = ((i * 33 + t * 25) % (w + 50)) - 25;
    const y = ((i * 17 + t * 10) % (h + 50)) - 25;
    ctx.fillStyle = "rgba(255,255,255,0.015)";
    ctx.beginPath();
    ctx.arc(x, y, 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function AnimatedCanvas({ zone }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const startRef = useRef(Date.now());

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    const resize = () => {
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(parent);
    const animate = () => {
      const ctx = canvas.getContext("2d");
      const w = canvas.width;
      const h = canvas.height;
      if (w > 0 && h > 0) {
        const t = (Date.now() - startRef.current) / 1000;
        const z = (zone || "").toLowerCase();
        if (z.includes("runway")) drawRunway(ctx, w, h, t);
        else if (z.includes("parking")) drawParking(ctx, w, h, t);
        else if (z.includes("entrance")) drawEntrance(ctx, w, h, t);
        else if (z.includes("platform")) drawPlatform(ctx, w, h, t);
        else if (z.includes("concourse") || z.includes("terminal")) drawPeople(ctx, w, h, t);
        else drawDefault(ctx, w, h, t);
      }
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      ro.disconnect();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [zone]);

  return <canvas ref={canvasRef} className="cctv-canvas" />;
}

function FeedView({ cam }) {
  const [time, setTime] = useState(new Date());
  const isOffline = cam.status === "inactive";

  useEffect(() => {
    if (isOffline) return;
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, [isOffline]);

  const ts = time.toLocaleTimeString("en-IN", { hour12: false });

  if (isOffline) {
    return (
      <div className="cctv-feed-area" style={{ background: "#0a0a0a" }}>
        <div className="cctv-feed-scanlines" />
        <div className="cctv-feed-overlay">
          <div className="cctv-osd-top">
            <span className="cctv-osd-cam">{cam.id}</span>
            <span className="cctv-osd-time">{ts}</span>
          </div>
          <div className="cctv-osd-nosignal">
            <span className="cctv-osd-nosignal-text">NO SIGNAL</span>
          </div>
          <div className="cctv-osd-bottom">
            <span className="cctv-osd-name">{cam.name}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cctv-feed-area">
      <AnimatedCanvas zone={cam.zone} />
      <div className="cctv-feed-scanlines" />
      <div className="cctv-feed-grid" />
      <div className="cctv-feed-overlay">
        <div className="cctv-osd-top">
          <span className="cctv-osd-cam">{cam.id}</span>
          <span className="cctv-osd-rec" />
          <span className="cctv-osd-time">{ts}</span>
        </div>
        <div className="cctv-osd-center">
          <span className="cctv-osd-angle">{cam.angle.toUpperCase()}</span>
          <span className="cctv-osd-res">{cam.resolution}</span>
        </div>
        <div className="cctv-osd-bottom">
          <span className="cctv-osd-name">{cam.name}</span>
          <span className="cctv-osd-zone">{cam.zone}</span>
        </div>
      </div>
    </div>
  );
}

function CCTVFeed({ mode, locationCode }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    setData(null);
    if (!locationCode) return;
    fetchCCTV(locationCode)
      .then(setData)
      .catch(() => setData(null));
  }, [mode, locationCode]);

  return (
    <div className="card full-width cctv-card">
      <h2>CCTV Surveillance - {locationCode}</h2>
      {!data && (
        <div className="cctv-placeholder">
          <p style={{ color: "var(--text-tertiary)", fontSize: "0.82rem" }}>
            {locationCode ? "Loading cameras..." : "Select a location to view CCTV"}
          </p>
        </div>
      )}
      {data && (
        <>
          <div className="cctv-summary">
            <span className="cctv-summary-item">
              <strong>{data.summary.active}</strong> active
            </span>
            {data.summary.inactive > 0 && (
              <span className="cctv-summary-item inactive">
                <strong>{data.summary.inactive}</strong> offline
              </span>
            )}
            <span className="cctv-summary-item total">
              <strong>{data.summary.total}</strong> total
            </span>
          </div>
          <div className="cctv-grid">
            {data.cameras.map((cam) => (
              <div key={cam.id} className="cctv-card-item">
                <FeedView cam={cam} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default CCTVFeed;
