// src/features/time/pages/Timebook.jsx
import React, { useMemo, useState } from "react";
import { getPunches, exportCsv, clearPunches } from "../lib/timestorage.js";

export default function Timebook() {
  const [rows, setRows] = useState(getPunches());
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter(r =>
      [r.employeeId, r.employeeName, r.action, r.siteId]
        .filter(Boolean).join(" ").toLowerCase().includes(needle)
    );
  }, [rows, q]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Timebook</h2>
        <div className="flex gap-2">
          <input className="border rounded-md px-3 py-2 text-sm" placeholder="Searchâ€¦"
                 value={q} onChange={(e)=>setQ(e.target.value)} />
          <button className="btn btn-outline" onClick={()=>exportCsv(filtered)}>Export CSV</button>
          <button className="btn btn-outline" onClick={() => { if (confirm("Clear all punches?")) { clearPunches(); setRows([]); } }}>
            Clear
          </button>
        </div>
      </div>

      <div className="card overflow-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left opacity-70">
              <th className="py-2 pr-4">Time</th>
              <th className="py-2 pr-4">Employee</th>
              <th className="py-2 pr-4">Action</th>
              <th className="py-2 pr-4">Site</th>
              <th className="py-2 pr-4">Location</th>
              <th className="py-2 pr-4">Accuracy</th>
              <th className="py-2 pr-4">GPS</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => (
              <tr key={i} className="border-t">
                <td className="py-2 pr-4 whitespace-nowrap">{new Date(r.timestamp).toLocaleString()}</td>
                <td className="py-2 pr-4">{r.employeeName || r.employeeId}</td>
                <td className="py-2 pr-4 uppercase">{r.action}</td>
                <td className="py-2 pr-4">{r.siteId || "-"}</td>
                <td className="py-2 pr-4">
                  {r.coords ? `${r.coords.lat.toFixed(5)}, ${r.coords.lon.toFixed(5)}` : "-"}
                </td>
                <td className="py-2 pr-4">{r.coords?.accuracy ? `+/-${Math.round(r.coords.accuracy)}m` : "-"}</td>
                <td className="py-2 pr-4">{r.geoStatus}</td>
              </tr>
            ))}
            {!filtered.length && (
              <tr><td className="py-4 text-center opacity-60" colSpan={7}>No entries.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}



