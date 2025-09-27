import React, { useMemo } from "react";
import { getWells } from "../../wells/lib/storage.js";

export default function StatsWidget() {
  const stats = useMemo(() => {
    const wells = getWells();
    const total = wells.length;
    let records = 0;
    const byType = {};
    for (const w of wells) {
      records += (w.records || []).length;
      byType[w.pumpType || "Other"] = (byType[w.pumpType || "Other"] || 0) + 1;
    }
    return { total, records,};
  }, []);

  return (
    <div className="grid sm:grid-cols-3 gap-3">
      <Stat label="Total Wells" value={stats.total} />
      <Stat label="Total Records" value={stats.records} />
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="card">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-xl font-semibold mt-1">{value}</div>
    </div>
  );
}