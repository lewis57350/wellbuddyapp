import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./layout/Navbar.jsx";

import Login from "../features/auth/pages/Login.jsx";
import Dashboard from "../features/wells/pages/Dashboard.jsx";
import AddWell from "../features/wells/pages/AddWell.jsx";
import WellDetails from "../features/wells/pages/WellDetails.jsx";
import WellSheet from "../features/wells/pages/WellSheet.jsx";

import Scan from "../features/time/pages/Scan.jsx";
import Punch from "../features/time/pages/Punch.jsx";
import Timebook from "../features/time/pages/Timebook.jsx";
import PunchCodes from "../features/time/pages/PunchCodes.jsx";

import Settings from "../features/profile/pages/settings.jsx";
import ReadOnlyDashboard from "../features/dashboard/pages/ReadOnlyDashboard.jsx";
import Board from "../features/board/pages/Board.jsx";

import InvoiceImport from "../features/import/pages/InvoiceImport.jsx";
import WellsImporter from "../features/import/WellsImporter.jsx";
import { useAuth } from "../shared/auth.jsx"; // named import, file name/case matters on Netlify

function RequireAuth({ children }) {
  const { user, ready } = useAuth();
  if (!ready) return <div className="p-4">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function Home() {
  return (
    <div className="text-center py-24">
      <h1 className="text-3xl font-bold mb-3">Welcome to WellBuddyApp</h1>
      <p className="text-gray-600 mb-6">
        Track wells, service &amp; maintenance records. QR-ready. Now with invoice OCR import.
      </p>
      <div className="flex items-center justify-center gap-3">
        <a href="#/login" className="btn btn-primary">Sign in</a>
        <a href="#/viewer" className="btn btn-outline">View (read-only)</a>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        <div className="mx-auto max-w-5xl p-4">
          <Routes>
            {/* Public */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/viewer" element={<ReadOnlyDashboard />} />

            {/* Protected */}
            <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
            <Route path="/well/add" element={<RequireAuth><AddWell /></RequireAuth>} />
            <Route path="/well/:id" element={<RequireAuth><WellDetails /></RequireAuth>} />
            <Route path="/well/:id/sheet" element={<RequireAuth><WellSheet /></RequireAuth>} />

            <Route path="/scan" element={<RequireAuth><Scan /></RequireAuth>} />
            <Route path="/punch" element={<RequireAuth><Punch /></RequireAuth>} />
            <Route path="/timebook" element={<RequireAuth><Timebook /></RequireAuth>} />
            <Route path="/punch-codes" element={<RequireAuth><PunchCodes /></RequireAuth>} />
            <Route path="/import/isgs" element={<WellsImporter />} />

            <Route path="/board" element={<RequireAuth><Board /></RequireAuth>} />
            <Route path="/settings" element={<RequireAuth><Settings /></RequireAuth>} />
            <Route path="/import" element={<RequireAuth><InvoiceImport /></RequireAuth>} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
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