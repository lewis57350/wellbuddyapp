import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { getWells } from "../../wells/lib/storage.js";

export default function RecentRecordsWidget({ limit = 8 }) {
  const rows = useMemo(() => {
    const wells = getWells();
    const items = [];
    for (const w of wells) {
      for (const r of (w.records || [])) {
        items.push({ wellId: w.id, wellName: w.name, ...r });
      }
    }
    return items
      .sort((a,b) => (b.date || "").localeCompare(a.date || ""))
      .slice(0, limit);
  }, []);

  if (!rows.length) return <p className="text-sm text-gray-600">No records yet.</p>;

  return (
    <ul className="space-y-2">
      {rows.map(r => (
        <li key={r.id} className="border rounded-md p-3 text-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="font-medium">{r.date} <span className="text-gray-500">* {r.kind}</span></div>
            <Link to={`/well/${r.wellId}`} className="text-blue-600 hover:underline">{r.wellName}</Link>
          </div>
          {r.notes && <div className="text-gray-700 mt-1">{r.notes}</div>}
          <div className="text-xs text-gray-500 mt-1">By: {r.by}</div>
        </li>
      ))}
    </ul>
  );
}
