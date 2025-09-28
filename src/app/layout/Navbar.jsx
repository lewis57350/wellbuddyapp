import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { getProfile } from "../../features/profile/lib/profile.js";
import { getDashboard, setTheme } from "../../features/dashboard/lib/dashStorage.js";

export default function Navbar() {
  const loc = useLocation();
  const [profile, setProfile] = useState(getProfile());
  const [cfg, setCfg] = useState(getDashboard());

  // Reflect theme on <html> class
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("dark", "oilfield-light", "oilfield-dark");
    if (cfg.theme === "dark") root.classList.add("dark");
    if (cfg.theme === "oilfield-light") root.classList.add("oilfield-light");
    if (cfg.theme === "oilfield-dark") root.classList.add("oilfield-dark");
  }, [cfg.theme]);

  // Refresh profile when route changes (in case Settings updated it)
  useEffect(() => setProfile(getProfile()), [loc.pathname]);

  function changeTheme(e) {
    const next = setTheme(e.target.value);
    setCfg(next);
  }

  return (
    <header className="border-b bg-white">
      <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          {profile.logoUrl
            ? <img src={profile.logoUrl} alt="" className="h-7 w-7 rounded" />
            : <img src="/favicon.svg" alt="" className="h-7 w-7" />}
          <span>{profile.companyName || "WellBuddyApp"}</span>
        </Link>

        <nav className="flex items-center gap-4 text-sm">
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/import">Import</Link>
          <Link to="/board">Board</Link>
          <Link to="/viewer">Viewer</Link>
          <Link to="/scan">Scan</Link>
          <Link to="/timebook">Timebook</Link>
          <Link to="/settings" className="font-medium">Settings</Link>

          <select
            className="border rounded-md px-2 py-1 text-sm"
            value={cfg.theme}
            onChange={changeTheme}
            title="Theme"
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="oilfield-light">Oilfield Lt</option>
            <option value="oilfield-dark">Oilfield Dk</option>
          </select>
        </nav>
      </div>
    </header>
  );
}