import React, { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { decodeShare } from "../../../shared/share.js";
import ReadOnlyWellCard from "../../wells/components/ReadOnlyWellCard.jsx";

export default function ReadOnlyDashboard() {
  const loc = useLocation();
  const params = new URLSearchParams(loc.search);
  const data = useMemo(() => decodeShare(params.get("s") || ""), [loc.search]);

  if (!data) return <div className="card">Invalid or missing link.</div>;

  const { companyName, wells = [] } = data;
  return (
    <div className="space-y-4">
      <div className="card">
        <h1 className="text-2xl font-bold">{companyName || "WellBuddy — Read-only"}</h1>
        <p className="text-sm opacity-70">View-only snapshot (no edits).</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {wells.map(w => <ReadOnlyWellCard key={w.id} well={w} />)}
      </div>
    </div>
  );
}
