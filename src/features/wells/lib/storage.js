const KEY = "wb_wells";

/* ===== Public constants ===== */
export const PRIORITY_LEVELS = ["none", "low", "medium", "high", "asap"];
export const PRIORITY_DEFAULT = "none";

/* ===== Defaults ===== */
const GENERAL_DEFAULT = {
  engineSize: "",
  unitMakeModel: "",
  bridalCable: "",
  polishRods: "",
  linerSize: "",
  packing: "",
  rods: "",
  tubing: "",
  notes: "",
};
const STATUS_DEFAULT = { pulling: false, workover: false };

/* ===== Helpers ===== */
function sanitizeCoords(c) {
  if (!c || typeof c !== "object") return undefined;
  const lat = Number(c.lat);
  const lng = Number(c.lng);
  if (!isFinite(lat) || !isFinite(lng)) return undefined;
  return { lat, lng };
}

function normalizePriority(p) {
  const v = String(p || "").toLowerCase();
  const alias = v === "med" ? "medium" : v; // support legacy "med"
  return PRIORITY_LEVELS.includes(alias) ? alias : PRIORITY_DEFAULT;
}

function migrate(wells) {
  return (wells || []).map((w) => {
    const legacy = w?.status?.pullingPriority; // older field
    const mergedPriority = normalizePriority(w.priority ?? legacy);
    return {
      id: w.id,
      name: w.name || "",
      location: w.location || "",
      pumpType: w.pumpType || "Unknown",
      records: Array.isArray(w.records) ? w.records : [],
      general: { ...GENERAL_DEFAULT, ...(w.general || {}) },
      status: { ...STATUS_DEFAULT, ...(w.status || {}) },
      priority: mergedPriority,
      coords: sanitizeCoords(w.coords),
    };
  });
}

function read() {
  try {
    const arr = JSON.parse(localStorage.getItem(KEY) || "[]");
    return migrate(arr);
  } catch {
    return [];
  }
}

function write(wells) {
  localStorage.setItem(KEY, JSON.stringify(wells));
  return wells;
}

/* ===== Public API ===== */
export function getWells() { return read(); }
export function saveWells(wells) { return write(migrate(wells)); }
export function getWell(id) { return read().find((w) => w.id === id) || null; }

export function addWell(well) {
  const wells = read();
  const [withDefaults] = migrate([well]);
  wells.push(withDefaults);
  return write(wells);
}

export function updateWell(id, patch) {
  const wells = read(); // or getWells()
  const i = wells.findIndex((w) => w.id === id);
  if (i === -1) return;

  const prev = wells[i];
  const next = {
    ...prev,
    ...patch,
  };
  if (patch?.general) {
    const GENERAL_DEFAULT = {
      engineSize: "",
      unitMakeModel: "",
      bridalCable: "",
      polishRods: "",
      linerSize: "",
      packing: "",
      rods: "",
      tubing: "",
      notes: "",
    };
    next.general = { ...GENERAL_DEFAULT, ...(prev.general || {}), ...patch.general };
  }
  wells[i] = next;
  write(wells); // or saveWells(wells)
  return next;
}


export function deleteWell(id) {
  write(read().filter((w) => w.id !== id));
}

export function addRecord(wellId, rec) {
  const wells = read();
  const i = wells.findIndex((w) => w.id === wellId);
  if (i === -1) return null;

  const r = {
    id: "rec-" + Date.now(),
    kind: rec?.kind || "service",
    date: rec?.date || new Date().toISOString().slice(0, 10),
    notes: rec?.notes || "",
    by: rec?.by || "Operator",
  };

  wells[i].records = wells[i].records || [];
  wells[i].records.unshift(r);
  write(wells);
  return r;
}

export function deleteRecord(wellId, recordId) {
  const wells = read();
  const i = wells.findIndex((w) => w.id === wellId);
  if (i === -1) return;
  wells[i].records = (wells[i].records || []).filter((r) => r.id !== recordId);
  write(wells);
}

/* ---- Convenience ---- */
export function setWellCoords(id, lat, lng) {
  return updateWell(id, { coords: { lat: Number(lat), lng: Number(lng) } });
}
export function setWellPriority(id, level) {
  return updateWell(id, { priority: normalizePriority(level) });
}
export function isWellDown(well) {
  const s = well?.status || {};
  return !!(s.pulling || s.workover);
}

/* ---- Compatibility shim for older components ---- */
export function getPullingPriority(well) {
  const source = well?.priority ?? well?.status?.pullingPriority ?? "none";
  return normalizePriority(source);
}

/* ---- NEW: scoring + sorter (for lists/widgets) ---- */
export function priorityScore(input) {
  // Accept either a string level OR a well object
  const scoreMap = { none: 0, low: 1, medium: 2, high: 3, asap: 4 };
  if (typeof input === "string") return scoreMap[normalizePriority(input)] ?? 0;

  const p = getPullingPriority(input); // normalized level
  let s = scoreMap[p] ?? 0;

  // If well is down, bump urgency a bit so down wells sort first
  const down = input?.status?.pulling || input?.status?.workover;
  if (down) s += 10;

  return s;
}

export function compareByUrgency(a, b) {
  // higher score first
  return priorityScore(b) - priorityScore(a);
}

/* ---- Seeder ---- */
export function seedIfEmpty() {
  const current = read();
  if (current.length) return current;
  const seed = migrate([
    {
      id: "well-1",
      name: "North 12A",
      location: "Section 4",
      pumpType: "Pumpjack",
      priority: "none",
      coords: { lat: 31.80, lng: -100.00 },
      records: [],
    },
    {
      id: "well-2",
      name: "East 8B",
      location: "Section 2",
      pumpType: "ESP",
      priority: "none",
      coords: { lat: 31.65, lng: -99.75 },
      records: [],
    },
  ]);
  write(seed);
  return seed;
}