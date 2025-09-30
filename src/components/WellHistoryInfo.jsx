import React from "react";

export default function WellHistoryInfo({ history }) {
  if (!history) return null;
  const d = history;

  return (
    <div className="rounded-2xl border p-4 bg-white/70 dark:bg-zinc-900/50">
      <h3 className="text-lg font-semibold mb-2">Well History info</h3>

      <div className="grid md:grid-cols-2 gap-x-6 gap-y-2 text-sm">
        <Info label="Permit #">{d.permitNumber}</Info>
        <Info label="Permit Date">{d.permitDate ? new Date(d.permitDate).toLocaleDateString() : ""}</Info>
        <Info label="Completion Date">{d.completionDate ? new Date(d.completionDate).toLocaleDateString() : ""}</Info>

        <div className="md:col-span-2">
          <div className="font-medium mb-1">Producing Horizons (proxy for perforated zones)</div>
          {d.producingHorizons?.length ? (
            <ul className="list-disc ml-5">
              {d.producingHorizons.map((p, i) => (
                <li key={i}>{[p.name || p.code, p.field].filter(Boolean).join(" – ")}</li>
              ))}
            </ul>
          ) : <div className="opacity-60">None listed</div>}
        </div>

        <Info label="Data Summary">{d.dataSummary}</Info>
        <Flags flags={d.flags} />
      </div>
    </div>
  );
}

function Info({ label, children }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="opacity-70">{label}</div>
      <div className="font-medium text-right">{children || <span className="opacity-50">—</span>}</div>
    </div>
  );
}

function Flags({ flags }) {
  if (!flags) return null;
  const entries = [
    ["Digitized LAS", flags.las],
    ["Scanned Log", flags.scannedLog],
    ["Core", flags.core],
    ["Core Analysis", flags.coreAnalysis],
    ["Samples", flags.samples],
  ];
  return (
    <div className="md:col-span-2">
      <div className="font-medium mb-1">Records/Logs</div>
      <ul className="flex flex-wrap gap-2">
        {entries.map(([k, v]) => (
          <li key={k}
              className={`px-2 py-1 rounded border text-xs ${v ? "bg-emerald-50 border-emerald-300" : "opacity-50"}`}>
            {k}{v ? "" : " (no)"}
          </li>
        ))}
      </ul>
    </div>
  );
}
