// src/features/time/lib/punchFormat.js

// We support either a direct route like:
//   #/punch?e=EMP1&a=in&site=well-1&n=Alice
// or a QR payload string like:
//   WB:PUNCH?e=EMP1&a=out&site=well-1&n=Alice

export function parsePunchFromUrl(search) {
  const q = new URLSearchParams(search);
  const payload = q.get("payload");
  if (payload) return parsePayload(payload);

  // direct params
  const e = q.get("e");
  const a = q.get("a");
  const site = q.get("site") || "";
  const n = q.get("n") || "";
  if (!e || !a) return null;
  return { employeeId: e, action: normAction(a), siteId: site, employeeName: n };
}

export function parsePayload(str) {
  try {
    // try WB:PUNCH?… format
    if (str.startsWith("WB:PUNCH?")) {
      const params = new URLSearchParams(str.split("?")[1] || "");
      const e = params.get("e");
      const a = params.get("a");
      const site = params.get("site") || "";
      const n = params.get("n") || "";
      if (!e || !a) return null;
      return { employeeId: e, action: normAction(a), siteId: site, employeeName: n };
    }
    // try JSON
    const obj = JSON.parse(str);
    if (obj?.e && obj?.a) {
      return { employeeId: obj.e, action: normAction(obj.a), siteId: obj.site || "", employeeName: obj.n || "" };
    }
  } catch {}
  return null;
}

export function buildPunchQr({ employeeId, action="in", siteId="", employeeName="" }) {
  // WB:PUNCH… keeps the QR short and human-readable
  const p = new URLSearchParams({ e: employeeId, a: action, site: siteId, n: employeeName });
  return `WB:PUNCH?${p.toString()}`;
}

function normAction(a) {
  const x = String(a).toLowerCase();
  return (x === "in" || x === "out") ? x : "in";
}
