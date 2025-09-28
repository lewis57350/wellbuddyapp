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

import Settings from "../features/profile/pages/settings.jsx";
import ReadOnlyDashboard from "../features/dashboard/pages/ReadOnlyDashboard.jsx";
import Board from "../features/board/pages/Board.jsx";

import InvoiceImport from "../features/import/pages/InvoiceImport.jsx";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        <div className="mx-auto max-w-5xl p-4">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />

            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/well/add" element={<AddWell />} />
            <Route path="/well/:id" element={<WellDetails />} />
            <Route path="/well/:id/sheet" element={<WellSheet />} />

            <Route path="/scan" element={<Scan />} />
            <Route path="/punch" element={<Punch />} />
            <Route path="/timebook" element={<Timebook />} />
            <Route path="/punch-codes" element={<PunchCodes />} />

            <Route path="/board" element={<Board />} />
            <Route path="/viewer" element={<ReadOnlyDashboard />} />
            <Route path="/settings" element={<Settings />} />

            <Route path="/import" element={<InvoiceImport />} />

            {/* fallback */}
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

function Home() {
  return (
    <div className="text-center py-24">
      <h1 className="text-3xl font-bold mb-3">Welcome to WellBuddyApp</h1>
      <p className="text-gray-600 mb-6">
        Track wells, service & maintenance records. QR-ready. Now with invoice OCR import.
      </p>
      <div className="flex items-center justify-center gap-3">
        <a href="#/login" className="btn btn-primary">Go to Login</a>
        <a href="#/dashboard" className="btn btn-outline">Skip to Dashboard</a>
      </div>
    </div>
  );
}