import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Navbar from "./layout/Navbar.jsx";

import Scan from "../features/time/pages/Scan.jsx";
import Punch from "../features/time/pages/Punch.jsx";
import Timebook from "../features/time/pages/Timebook.jsx";
import PunchCodes from "../features/time/pages/PunchCodes.jsx";

import Login from "../features/auth/pages/Login.jsx";

import Dashboard from "../features/wells/pages/Dashboard.jsx";
import AddWell from "../features/wells/pages/AddWell.jsx";
import WellDetails from "../features/wells/pages/WellDetails.jsx";
import WellSheet from "../features/wells/pages/WellSheet.jsx";

import Board from "../features/board/pages/Board.jsx";
import ReadOnlyDashboard from "../features/dashboard/pages/ReadOnlyDashboard.jsx";

// If your file is actually "settings.jsx", keep the lowercase import.
// If you named it "Settings.jsx", change the path to match.
import Settings from "../features/profile/pages/settings.jsx";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        <div className="mx-auto max-w-5xl p-4">
          <Routes>
            {/* Home (hero or simple landing) */}
            <Route path="/" element={<Home />} />

            {/* Auth */}
            <Route path="/login" element={<Login />} />

            {/* Wells */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/well/add" element={<AddWell />} />
            <Route path="/well/:id" element={<WellDetails />} />
            <Route path="/well/:id/sheet" element={<WellSheet />} />

            {/* Time & QR */}
            <Route path="/scan" element={<Scan />} />
            <Route path="/punch" element={<Punch />} />
            <Route path="/timebook" element={<Timebook />} />
            <Route path="/punch-codes" element={<PunchCodes />} />

            {/* Company settings & Board */}
            <Route path="/settings" element={<Settings />} />
            <Route path="/board" element={<Board />} />

            {/* Read-only dashboard share */}
            <Route path="/viewer" element={<ReadOnlyDashboard />} />

            {/* Fallback → Dashboard (or change to "/" if you prefer Home) */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </main>

      <footer className="border-t bg-white">
        <div className="mx-auto max-w-5xl px-4 py-3 text-xs text-gray-500">
          {new Date().getFullYear()} WellBuddyApp
        </div>
      </footer>
    </div>
  );
}

/* Inline Home so this file is self-contained.
   Replace with your Hero component if you want. */
function Home() {
  return (
    <div className="text-center py-24">
      <h1 className="text-3xl font-bold mb-3">Welcome to WellBuddyApp</h1>
      <p className="text-gray-600 mb-6">
        Track wells, priorities, records, time punches, and more.
      </p>
      <div className="flex items-center justify-center gap-3">
        <a href="#/login" className="btn btn-primary">Login</a>
        <a href="#/dashboard" className="btn btn-outline">Open Dashboard</a>
      </div>
    </div>
  );
}
