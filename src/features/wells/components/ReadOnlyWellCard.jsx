import React from "react";
import { getPullingPriority, isWellDown } from "../lib/storage.js";

export default function ReadOnlyWellCard({ well }) {
  const status = well.status || {};
  const pulling = !!status.pulling;
  const workover = !!status.workover;
  const priority = getPullingPriority(well);

  const toneByPriority = {
    low:  "border-yellow-500 ring-2 ring-yellow-500/60 bg-yellow-50 dark:bg-yellow-950/30 dark:border-yellow-600",
    med:  "border-orange-500 ring-2 ring-orange-500/60 bg-orange-50 dark:bg-orange-950/30 dark:border-orange-600",
    high: "border-purple-500 ring-2 ring-purple-500/60 bg-purple-50 dark:bg-purple-950/30 dark:border-purple-600",
    asap: "border-red-500 ring-2 ring-red-500/60 bg-red-50 dark:bg-red-950/40 dark:border-red-700",
  };
  const tone = pulling
    ? toneByPriority[priority] || toneByPriority.low
    : workover
      ? "border-red-500 ring-2 ring-red-500/60 bg-red-50 dark:bg-red-950/40 dark:border-red-700"
      : "border-green-500 ring-1 ring-green-500/50 bg-green-50 dark:bg-emerald-950/40 dark:border-emerald-700";

  const chip = pulling ? (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
      priority === "asap" ? "bg-red-600 text-white" :
      priority === "high" ? "bg-purple-600 text-white" :
      priority === "med"  ? "bg-orange-500 text-black" :
                            "bg-yellow-400 text-black"
    }`}>
      Pulling · {priority.toUpperCase()}
    </span>
  ) : workover ? (
    <span className="inline-flex items-center rounded-md bg-amber-500 text-black px-2 py-0.5 text-xs font-medium">
      Spudder / Workover
    </span>
  ) : (
    <span className="inline-flex items-center rounded-md bg-emerald-500 text-white px-2 py-0.5 text-xs font-medium">
      Good
    </span>
  );

  return (
    <div className={`card card-strong ${tone}`}>
      <div className="text-base truncate">{well.name}</div>
      <div className="mt-0.5 text-sm">{well.location} · {well.pumpType}</div>
      <div className="mt-2">{chip}</div>
      {/* No actions / toggles / details links in read-only */}
    </div>
  );
}
