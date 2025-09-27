import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { getWell, updateWell, addRecord, deleteRecord } from "../lib/storage.js";
import QRCodeDisplay from "../components/QRCodeDisplay.jsx";

const EMPTY_GENERAL = {
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

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function csvEscape(v) {
  if (v == null) return "";
  const s = String(v);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export default function WellDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [well, setWell] = useState(null);
  const [loading, setLoading] = useState(true);

  // basics edit
  const [editingBasics, setEditingBasics] = useState(false);
  const [form, setForm] = useState({ name: "", location: "", pumpType: "Pumpjack" });

  // general well info
  const [editGeneral, setEditGeneral] = useState(false);
  const [general, setGeneral] = useState(EMPTY_GENERAL);

  // add record
  const [newRec, setNewRec] = useState({
    kind: "service", // "service" | "maintenance" | "other"
    date: todayISO(),
    notes: "",
    by: "Operator/Pumper",
  });

  // records filter
  const [filter, setFilter] = useState("all"); // all | service | maintenance | other

  function refresh() {
    const w = getWell(id);
    setWell(w || null);
    setLoading(false);
    if (w) {
      setForm({
        name: w.name || "",
        location: w.location || "",
        pumpType: w.pumpType || "Pumpjack",
      });
      setGeneral({ ...EMPTY_GENERAL, ...(w.general || {}) });
    }
  }

  useEffect(() => {
    setLoading(true);
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const records = useMemo(() => well?.records || [], [well?.records]);
  const filtered = useMemo(
    () => records.filter((r) => (filter === "all" ? true : r.kind === filter)),
    [records, filter]
  );

  if (loading) return <div>Loading…</div>;

  if (!well) {
    return (
      <div className="space-y-3">
        <p>Well not found.</p>
        <Link className="text-blue-600 hover:underline" to="/dashboard">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  async function saveBasics(e) {
    e?.preventDefault?.();
    updateWell(well.id, {
      name: form.name.trim(),
      location: form.location.trim(),
      pumpType: form.pumpType.trim(),
    });
    setEditingBasics(false);
    refresh();
  }

  function onAddRecord(e) {
    e.preventDefault();
    const payload = {
      kind: newRec.kind,
      date: newRec.date || todayISO(),
      notes: (newRec.notes || "").trim(),
      by: (newRec.by || "Operator/Pumper").trim(),
    };
    addRecord(well.id, payload);
    // keep type/date/by for efficiency and clear notes
    setNewRec((r) => ({ ...r, notes: "" }));
    refresh();
  }

  function onDeleteRecord(rid) {
    if (!confirm("Delete this record? This cannot be undone.")) return;
    deleteRecord(well.id, rid);
    refresh();
  }

  function exportCsv() {
    const header = ["id", "type", "date", "by", "notes"];
    const rows = (well.records || []).map((r) => ({
      id: r.id,
      type: r.kind,
      date: r.date,
      by: r.by,
      notes: r.notes || "",
    }));
    const csv =
      [header.join(","), ...rows.map((row) => header.map((k) => csvEscape(row[k])).join(","))].join(
        "\r\n"
      );
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const safeName = (well.name || id).replace(/[^\w\-]+/g, "_");
    a.download = `${safeName}_records.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function saveGeneral(e) {
    e?.preventDefault?.();
    updateWell(well.id, { general });
    setEditGeneral(false);
    refresh();
  }

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3">
        <Link to="/dashboard" className="text-sm text-blue-600 hover:underline">
          ← Back
        </Link>
        <div className="flex items-center gap-2">
          <Link to={`/well/${well.id}/sheet`} className="btn btn-outline btn-sm">
            Well Sheet / Print
          </Link>
        </div>
      </div>

      {/* Header + QR */}
      <div className="flex items-start justify-between gap-4 card">
        {!editingBasics ? (
          <>
            <div className="min-w-0">
              <h2 className="text-2xl font-semibold truncate">{well.name}</h2>
              <div className="text-gray-600 dark:text-gray-300">
                {well.location || "—"} • {well.pumpType || "Unknown"}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="btn btn-outline" onClick={() => setEditingBasics(true)}>
                Edit
              </button>
              <QRCodeDisplay wellId={well.id} size={112} showLink />
            </div>
          </>
        ) : (
          <form onSubmit={saveBasics} className="grid sm:grid-cols-3 gap-3 w-full">
            <Field label="Name">
              <input
                className="w-full border rounded-md px-3 py-2"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
            </Field>
            <Field label="Location">
              <input
                className="w-full border rounded-md px-3 py-2"
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                required
              />
            </Field>
            <Field label="Pump Type">
              <select
                className="w-full border rounded-md px-3 py-2"
                value={form.pumpType}
                onChange={(e) => setForm((f) => ({ ...f, pumpType: e.target.value }))}
              >
                <option>ESP</option>
                <option>Gas Lift</option>
                <option>Rod Pump</option>
                <option>Plunger Lift</option>
                <option>Injection</option>
                <option>Unknown</option>
              </select>
            </Field>
            <div className="sm:col-span-3 flex gap-2">
              <button className="btn btn-primary">Save</button>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => {
                  setEditingBasics(false);
                  setForm({
                    name: well.name || "",
                    location: well.location || "",
                    pumpType: well.pumpType || "",
                  });
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Coordinates editor */}
      <CoordsEditor well={well} onSaved={refresh} />

      {/* General Well Info */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <div className="font-medium">General Well Info</div>
          {!editGeneral && (
            <button className="btn btn-outline btn-sm" onClick={() => setEditGeneral(true)}>
              Edit Info
            </button>
          )}
        </div>

        {!editGeneral ? (
          <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <DisplayRow label="ENGINE SIZE" value={well.general?.engineSize || "—"} />
            <DisplayRow label="UNIT (MAKE/MODEL)" value={well.general?.unitMakeModel || "—"} />
            <DisplayRow label="BRIDAL CABLE SIZE (Length)"  value={well.general?.bridalCable || "—"} />
            <DisplayRow label="POLISH RODS SIZE (length)" value={well.general?.polishRods || "—"} />
            <DisplayRow label={'LINER SIZE (L\' x I.D" x O.D")'} value={well.general?.linerSize || "—"} />
            <DisplayRow label="PACKING (TYPE/SIZE)" value={well.general?.packing || "—"} />
            <DisplayRow label="RODS (COUNT/SIZE)" value={well.general?.rods || "—"} />
            <DisplayRow label="TUBING (COUNT/SIZE)" value={well.general?.tubing || "—"} />
            <div className="sm:col-span-2">
              <div className="text-gray-500">NOTES</div>
              <div className="border rounded-md p-3 min-h-[80px] whitespace-pre-wrap">
                {well.general?.notes || "—"}
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={saveGeneral} className="grid sm:grid-cols-2 gap-3">
            <Field label="ENGINE SIZE (e.g., 208/346)">
              <input
                className="w-full border rounded-md px-3 py-2"
                value={general.engineSize}
                onChange={(e) => setGeneral((g) => ({ ...g, engineSize: e.target.value }))}
              />
            </Field>
            <Field label="UNIT (MAKE/MODEL)">
              <input
                className="w-full border rounded-md px-3 py-2"
                value={general.unitMakeModel}
                onChange={(e) => setGeneral((g) => ({ ...g, unitMakeModel: e.target.value }))}
              />
            </Field>
            <Field label={'BRIDAL CABLE SIZE (D" x L\')'}>
              <input
                className="w-full border rounded-md px-3 py-2"
                value={general.bridalCable}
                onChange={(e) => setGeneral((g) => ({ ...g, bridalCable: e.target.value }))}
              />
            </Field>
            <Field label={'POLISH RODS SIZE (D" x L\')'}>
              <input
                className="w-full border rounded-md px-3 py-2"
                value={general.polishRods}
                onChange={(e) => setGeneral((g) => ({ ...g, polishRods: e.target.value }))}
              />
            </Field>
            <Field label={'LINER SIZE (L\' x I.D" x O.D")'}>
              <input
                className="w-full border rounded-md px-3 py-2"
                value={general.linerSize}
                onChange={(e) => setGeneral((g) => ({ ...g, linerSize: e.target.value }))}
              />
            </Field>
            <Field label="PACKING (TYPE/SIZE)">
              <input
                className="w-full border rounded-md px-3 py-2"
                value={general.packing}
                onChange={(e) => setGeneral((g) => ({ ...g, packing: e.target.value }))}
              />
            </Field>
            <Field label="RODS (COUNT/SIZE)">
              <input
                className="w-full border rounded-md px-3 py-2"
                value={general.rods}
                onChange={(e) => setGeneral((g) => ({ ...g, rods: e.target.value }))}
              />
            </Field>
            <Field label="TUBING (COUNT/SIZE)">
              <input
                className="w-full border rounded-md px-3 py-2"
                value={general.tubing}
                onChange={(e) => setGeneral((g) => ({ ...g, tubing: e.target.value }))}
              />
            </Field>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium">NOTES</label>
              <textarea
                rows={4}
                className="w-full border rounded-md px-3 py-2"
                value={general.notes}
                onChange={(e) => setGeneral((g) => ({ ...g, notes: e.target.value }))}
              />
            </div>
            <div className="sm:col-span-2 flex gap-2">
              <button className="btn btn-primary">Save Info</button>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => {
                  setEditGeneral(false);
                  setGeneral({ ...EMPTY_GENERAL, ...(getWell(id)?.general || {}) });
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Add Record */}
      <form onSubmit={onAddRecord} className="card space-y-3">
        <div className="font-medium">Add Service / Maintenance Record</div>
        <div className="grid sm:grid-cols-4 gap-3">
          <Field label="Type">
            <select
              className="w-full border rounded-md px-3 py-2"
              value={newRec.kind}
              onChange={(e) => setNewRec((r) => ({ ...r, kind: e.target.value }))}
            >
              <option value="service">Service</option>
              <option value="maintenance">Maintenance</option>
              <option value="other">Other</option>
            </select>
          </Field>
          <Field label="Date">
            <input
              type="date"
              className="w-full border rounded-md px-3 py-2"
              value={newRec.date}
              onChange={(e) => setNewRec((r) => ({ ...r, date: e.target.value }))}
            />
          </Field>
          <Field label="Performed By">
            <input
              className="w-full border rounded-md px-3 py-2"
              value={newRec.by}
              onChange={(e) => setNewRec((r) => ({ ...r, by: e.target.value }))}
              placeholder="Operator / Pumper"
            />
          </Field>
          <div className="sm:col-span-4">
            <label className="block text-sm font-medium">Notes</label>
            <textarea
              rows={3}
              className="w-full border rounded-md px-3 py-2"
              placeholder="Work performed, observations, parts, pressures, etc."
              value={newRec.notes}
              onChange={(e) => setNewRec((r) => ({ ...r, notes: e.target.value }))}
            />
          </div>
        </div>
        <button className="btn btn-primary">Add Record</button>
      </form>

      {/* Records toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Filter:</label>
          <select
            className="border rounded-md px-2 py-1 text-sm"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All</option>
            <option value="service">Service</option>
            <option value="maintenance">Maintenance</option>
            <option value="other">Other</option>
          </select>
        </div>
        <button className="btn btn-outline text-sm" onClick={exportCsv}>
          Export CSV
        </button>
      </div>

      {/* Records list */}
      <div className="card">
        <div className="font-medium mb-2">Records</div>
        {filtered.length === 0 ? (
          <p className="text-sm text-gray-600">No records yet.</p>
        ) : (
          <ul className="space-y-2">
            {filtered.map((r) => (
              <li key={r.id} className="flex items-start justify-between gap-3 border rounded-md p-3">
                <div>
                  <div className="text-sm">
                    <span className="inline-block rounded-full border px-2 py-0.5 text-xs mr-2">
                      {r.kind}
                    </span>
                    <span className="font-medium">{r.date}</span>
                    <span className="text-gray-500"> • {r.by}</span>
                  </div>
                  {r.notes && <div className="text-sm text-gray-700 mt-1">{r.notes}</div>}
                </div>
                <button onClick={() => onDeleteRecord(r.id)} className="btn btn-outline text-xs">
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ---------------- helpers ---------------- */

function Field({ label, children }) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}

function DisplayRow({ label, value }) {
  return (
    <div className="flex items-start gap-2">
      <div className="text-gray-500 min-w-[12rem]">{label}:</div>
      <div className="flex-1">{value}</div>
    </div>
  );
}

function CoordsEditor({ well, onSaved }) {
  const [lat, setLat] = useState(well?.coords?.lat ?? "");
  const [lng, setLng] = useState(well?.coords?.lng ?? "");

  function save() {
    if (lat === "" || lng === "") return;
    updateWell(well.id, { coords: { lat: Number(lat), lng: Number(lng) } });
    onSaved?.();
  }

  const has = lat !== "" && lng !== "";
  const gmaps = has
    ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`
    : null;
  const amaps = has ? `https://maps.apple.com/?daddr=${lat},${lng}` : null;

  return (
    <div className="card">
      <div className="font-medium mb-2">Coordinates</div>
      <div className="flex flex-wrap items-center gap-2">
        <input
          className="border rounded-md px-3 py-2 w-36"
          placeholder="Lat"
          value={lat}
          onChange={(e) => setLat(e.target.value)}
          type="number"
          step="0.0001"
        />
        <input
          className="border rounded-md px-3 py-2 w-36"
          placeholder="Lng"
          value={lng}
          onChange={(e) => setLng(e.target.value)}
          type="number"
          step="0.0001"
        />
        <button className="btn btn-outline" onClick={save}>
          Save
        </button>
        {has && (
          <div className="flex gap-2 ml-2">
            <a className="btn btn-outline btn-xs" target="_blank" rel="noreferrer" href={gmaps}>
              Google Maps
            </a>
            <a className="btn btn-outline btn-xs" target="_blank" rel="noreferrer" href={amaps}>
              Apple Maps
            </a>
          </div>
        )}
      </div>
      <div className="text-xs opacity-60 mt-1">
        Paste lat/lng from a map app. Saving will plot this well in the Dashboard Map widget.
      </div>
    </div>
  );
}