// src/features/time/lib/timeStorage.js
const KEY = "wb_time_punches_v1";

export function getPunches() {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); }
  catch { return []; }
}

export function addPunch(punch) {
  const rows = getPunches();
  rows.unshift(punch);
  localStorage.setItem(KEY, JSON.stringify(rows));
  return punch;
}

export function clearPunches() {
  localStorage.removeItem(KEY);
}

export function exportCsv(rows = getPunches()) {
  const headers = [
    "timestamp","employeeId","employeeName","action","siteId",
    "lat","lon","accuracy","geoStatus","userAgent"
  ];
  const esc = (v="") => `"${String(v).replace(/"/g,'""')}"`;
  const lines = [headers.join(",")].concat(
    rows.map(r => [
      r.timestamp, r.employeeId, r.employeeName || "",
      r.action, r.siteId || "",
      r.coords?.lat ?? "", r.coords?.lon ?? "", r.coords?.accuracy ?? "",
      r.geoStatus || "", r.userAgent || "",
    ].map(esc).join(","))
  );
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `timebook_${new Date().toISOString().slice(0,10)}.csv`;
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}
