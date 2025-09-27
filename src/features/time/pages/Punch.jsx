// src/features/time/pages/Punch.jsx
import React, { useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { parsePunchFromUrl } from "../lib/punchFormat.js";
import { addPunch } from "../lib/timestorage.js";

export default function Punch() {
  const loc = useLocation();
  const [result, setResult] = useState({ state: "loading" }); // loading|ok|error

  useEffect(() => {
    const meta = parsePunchFromUrl(loc.search);
    if (!meta) {
      setResult({ state: "error", message: "Missing or invalid punch parameters." });
      return;
    }

    // Get GPS (best effort)
    const start = Date.now();
    const geoOk = (pos) => {
      const { latitude, longitude, accuracy } = pos.coords || {};
      finalize(meta, { lat: latitude, lon: longitude, accuracy }, "ok");
    };
    const geoErr = (err) => {
      finalize(meta, null, err?.code === 1 ? "denied" : "unavailable"); // 1: permission denied
    };

    if (!navigator.geolocation) geoErr();

    navigator.geolocation.getCurrentPosition(
      geoOk,
      geoErr,
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );

    function finalize(meta, coords, geoStatus="ok") {
      const punch = {
        timestamp: new Date().toISOString(),
        employeeId: meta.employeeId,
        employeeName: meta.employeeName || "",
        action: meta.action,          // "in" | "out"
        siteId: meta.siteId || "",
        coords: coords ? { ...coords } : null,
        geoStatus,                    // "ok" | "denied" | "unavailable"
        userAgent: navigator.userAgent,
        rttMs: Date.now() - start
      };
      addPunch(punch);
      setResult({ state: "ok", punch });
    }
  }, [loc.search]);

  if (result.state === "loading") {
    return <div className="card">Recording punch… requesting location…</div>;
  }
  if (result.state === "error") {
    return <div className="card text-red-600">{result.message}</div>;
  }
  const p = result.punch;
  return (
    <div className="card">
      <h2 className="text-xl font-semibold mb-2">
        {p.employeeName || p.employeeId} clocked <span className="uppercase">{p.action}</span>
      </h2>
      <div className="text-sm opacity-80 mb-2">{new Date(p.timestamp).toLocaleString()}</div>
      <div className="text-sm">
        Site: <b>{p.siteId || "—"}</b><br/>
        GPS: {" "}
        {p.coords
          ? <>Lat {p.coords.lat?.toFixed(5)}, Lon {p.coords.lon?.toFixed(5)} (±{Math.round(p.coords.accuracy||0)}m)</>
          : <span className="text-amber-600">not captured ({p.geoStatus})</span>}
      </div>

      <div className="mt-4 flex gap-2">
        <Link className="btn btn-primary" to="/scan">Scan another</Link>
        <Link className="btn btn-outline" to="/timebook">View Timebook</Link>
      </div>
      <p className="text-xs opacity-60 mt-2">
        Location is saved locally with this punch entry. Grant location permission for best accuracy.
      </p>
    </div>
  );
}
