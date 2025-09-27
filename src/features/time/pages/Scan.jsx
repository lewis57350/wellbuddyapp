// src/features/time/pages/Scan.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Scanner as QrScanner } from "@yudiel/react-qr-scanner";
import { parsePayload } from "../lib/punchFormat.js";

export default function Scan() {
  const nav = useNavigate();
  const [error, setError] = useState("");

  function onDecode(text) {
    const parsed = parsePayload(text);
    if (!parsed) {
      setError("Unrecognized QR. Expected WellBuddy punch code.");
      return;
    }
    // Navigate into punch route with direct params
    const p = new URLSearchParams({
      e: parsed.employeeId,
      a: parsed.action,
      site: parsed.siteId || "",
      n: parsed.employeeName || ""
    });
    nav(`/punch?${p.toString()}`);
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Scan Time In/Out</h2>
      <div className="card">
        <QrScanner
          onDecode={onDecode}
          onError={(err) => setError(err?.message || "Camera error")}
          constraints={{ facingMode: "environment" }}
        />
      </div>
      {error && <div className="text-sm text-red-600">{error}</div>}
      <p className="text-xs opacity-70">Tip: You can also scan with your phone camera if your QR opens a link like <code>#/punch?e=EMP1&a=in&site=well-1</code>.</p>
    </div>
  );
}
