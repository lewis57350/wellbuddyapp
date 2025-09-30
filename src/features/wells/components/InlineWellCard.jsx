import React, { useEffect, useState, useId, useMemo } from "react";
import { Link } from "react-router-dom";
import { getPullingPriority, PRIORITY_LEVELS } from "../lib/storage.js";

export default function InlineWellCard({ well, onSave, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const [form, setForm] = useState(well);
  useEffect(() => setForm(well), [well?.id]);

  const status = well.status || {};
  const pulling = !!status.pulling;
  const workover = !!status.workover;

  const priority = getPullingPriority(well); // "none" | "low" | "medium" | "high" | "asap"

  const toneByPriority = {
    low:     "border-yellow-500 ring-2 ring-yellow-500/60 bg-yellow-50 dark:bg-yellow-950/30 dark:border-yellow-600",
    medium:  "border-orange-500 ring-2 ring-orange-500/60 bg-orange-50 dark:bg-orange-950/30 dark:border-orange-600",
    high:    "border-purple-500 ring-2 ring-purple-500/60 bg-purple-50 dark:bg-purple-950/30 dark:border-purple-600",
    asap:    "border-red-500 ring-2 ring-red-500/60 bg-red-50 dark:bg-red-950/40 dark:border-red-700",
  };

  const tone = pulling
    ? (toneByPriority[priority] || toneByPriority.low)
    : workover
      ? "border-red-500 ring-2 ring-red-500/60 bg-red-50 dark:bg-red-950/40 dark:border-red-700"
      : "border-green-500 ring-1 ring-green-500/50 bg-green-50 dark:bg-emerald-950/40 dark:border-emerald-700";

  function toggle(name) {
    const next = { ...status, [name]: !status[name] };
    onSave?.(well.id, { status: next });
  }

  function changePriority(level) {
    onSave?.(well.id, { priority: level }); // save to canonical top-level field
  }

  function saveBasics() {
    setEditing(false);
    onSave?.(well.id, {
      name: form.name,
      location: form.location,
      pumpType: form.pumpType,
    });
  }

  const prioId = useId();
  const pullingId = useId();
  const workoverId = useId();

  const summaryChip = useMemo(() => {
    if (pulling) {
      const txt =
        priority === "asap" ? "ASAP" :
        priority === "high" ? "HIGH" :
        priority === "medium" ? "MEDIUM" :
        priority === "low" ? "LOW" : "LOW";
      const cls =
        priority === "asap" ? "bg-red-600 text-white" :
        priority === "high" ? "bg-purple-600 text-white" :
        priority === "medium" ? "bg-orange-500 text-black" :
        "bg-yellow-400 text-black";
      return <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${cls}`}>Pulling * {txt}</span>;
    }
    if (workover) {
      return <span className="inline-flex items-center rounded-md bg-amber-500 text-black px-2 py-0.5 text-xs font-semibold">Spudder / Workover</span>;
    }
    return <span className="inline-flex items-center rounded-md bg-emerald-600 text-white px-2 py-0.5 text-xs font-semibold">Good</span>;
  }, [pulling, workover, priority]);

  // Fallbacks so info never looks â€œmissingâ€
  const nameDisplay = well.name || well.id;
  const locationDisplay = well.location || "-";
  const typeDisplay = well.pumpType || "Unknown";

  return (
    <article className={`card ${tone}`}>
      {/* Header */}
      <div className="min-w-0">
        <div className="text-base font-bold text-slate-900 dark:text-slate-100 truncate">
          {nameDisplay}
        </div>
        <div className="mt-0.5 text-sm font-semibold text-slate-700 dark:text-slate-200">
          {locationDisplay} Â· {typeDisplay}
        </div>
        <div className="mt-2">{summaryChip}</div>
      </div>

      {/* Status / Priority */}
      {showStatus && (
        <div className="mt-3 grid sm:grid-cols-2 gap-2">
          <label htmlFor={pullingId} className="flex items-center gap-2 text-sm font-medium">
            <input id={pullingId} type="checkbox" className="h-4 w-4"
              checked={pulling} onChange={() => toggle("pulling")} />
            Needs Pulling Unit
          </label>
          <label htmlFor={workoverId} className="flex items-center gap-2 text-sm font-medium">
            <input id={workoverId} type="checkbox" className="h-4 w-4"
              checked={workover} onChange={() => toggle("workover")} />
            Needs Spudder / Workover
          </label>

          {pulling && (
            <label htmlFor={prioId} className="sm:col-span-2 flex items-center gap-2 text-sm font-medium">
              Priority:
              <select
                id={prioId}
                className="border rounded-md px-2 py-1"
                value={priority}
                onChange={(e) => changePriority(e.target.value)}
              >
                {PRIORITY_LEVELS.map(p => (
                  <option key={p} value={p}>{p.toUpperCase()}</option>
                ))}
              </select>
            </label>
          )}
        </div>
      )}

      {/* Inline edit */}
      {editing && (
        <div className="mt-3 space-y-2">
          <input
            className="w-full border rounded-md px-3 py-2"
            value={form.name ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Well name"
          />
          <input
            className="w-full border rounded-md px-3 py-2"
            value={form.location ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
            placeholder="Location"
          />
          <select
            className="w-full border rounded-md px-3 py-2"
            value={form.pumpType ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, pumpType: e.target.value }))}
          >
            <option value="Pumpjack">Pumpjack</option>
            <option value="ESP">ESP</option>
            <option value="Gas Lift">Gas Lift</option>
            <option value="Rod Pump">Rod Pump</option>
            <option value="Plunger Lift">Plunger Lift</option>
            <option value="Unknown">Unknown</option>
          </select>
          <div className="flex gap-2">
            <button className="btn btn-primary text-sm" onClick={saveBasics}>Save</button>
            <button className="btn btn-outline text-sm" onClick={() => setEditing(false)}>Cancel</button>
            <button className="btn btn-outline text-sm ml-auto" onClick={() => onDelete?.(well.id)}>Delete</button>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-3 pt-2 border-t flex items-center justify-between">
        <button
          className="underline text-blue-600 dark:text-blue-400 text-xs"
          onClick={() => setShowStatus((s) => !s)}
        >
          {showStatus ? "Hide status" : "Status & priority"}
        </button>

        <div className="flex gap-2">
          <Link to={`/well/${well.id}`} className="btn btn-outline btn-xs text-xs px-2 py-1">
            Details
          </Link>
          {!editing && (
            <button className="btn btn-outline btn-xs text-xs px-2 py-1" onClick={() => setEditing(true)}>
              Edit
            </button>
          )}
        </div>
      </div>
    </article>
  );
}




