import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { addWell } from "../lib/storage.js";

/* ---- constants / helpers (keep above component) ---- */

const GENERAL_DEFAULT = {
  engineSize: "",        // 208/346
  unitMakeModel: "",     // MAKE/MODEL
  bridalCable: "",       // D" x L'
  polishRods: "",        // D" x L'
  linerSize: "",         // L' x I.D" x O.D"
  packing: "",           // TYPE/SIZE
  rods: "",              // COUNT/SIZE
  tubing: "",            // COUNT/SIZE
  notes: "",             // free text
};

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 24);
}

/* ---- component ---- */

export default function AddWell() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [pumpType, setPumpType] = useState("Rod Pump");
  const [general, setGeneral] = useState({ ...GENERAL_DEFAULT });

  function onSubmit(e) {
    e.preventDefault();
    const idSuffix = Date.now().toString().slice(-4);
    const idBase = slugify(name) || Date.now();
    const id = `well-${idBase}-${idSuffix}`;

    const well = {
      id,
      name: name.trim(),
      location: location.trim(),
      pumpType: (pumpType || "").trim(),
      general: { ...GENERAL_DEFAULT, ...general },
      records: [],
    };

    addWell(well);
    navigate(`/well/${id}`);
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-2xl space-y-6">
      <h2 className="text-xl font-semibold">Add Well</h2>

      {/* Basic Info */}
      <div className="grid sm:grid-cols-3 gap-3">
        <div className="space-y-2 sm:col-span-3">
          <label className="block text-sm font-medium">Well Name</label>
          <input
            className="w-full border rounded-md px-3 py-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <label className="block text-sm font-medium">Location</label>
          <input
            className="w-full border rounded-md px-3 py-2"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Pump Type</label>
          <select
            className="w-full border rounded-md px-3 py-2"
            value={pumpType}
            onChange={(e) => setPumpType(e.target.value)}
          >
            <option>Rod Pump</option>
            <option>Tubing Pump</option>
            <option>Injection</option>
            <option>Producer</option>
            <option>Source</option>
            <option>ESP</option>
            <option>Unknown</option>
          </select>
        </div>
      </div>

      {/* General Well Info */}
      <div className="card space-y-3">
        <div className="font-medium">General Well Info (optional)</div>

        <div className="grid sm:grid-cols-2 gap-3">
          <Field label='ENGINE SIZE (e.g., 208/346)'>
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
              placeholder={'7/8" x 18\''}
              value={general.bridalCable}
              onChange={(e) => setGeneral((g) => ({ ...g, bridalCable: e.target.value }))}
            />
          </Field>

          <Field label={'POLISH RODS SIZE (D" x L\')'}>
            <input
              className="w-full border rounded-md px-3 py-2"
              placeholder={'1-1/8" x 24\''}
              value={general.polishRods}
              onChange={(e) => setGeneral((g) => ({ ...g, polishRods: e.target.value }))}
            />
          </Field>

          <Field label={'LINER SIZE (L\' x I.D" x O.D")'}>
            <input
              className="w-full border rounded-md px-3 py-2"
              placeholder={'8\' x 1.75" x 2.00"'}
              value={general.linerSize}
              onChange={(e) => setGeneral((g) => ({ ...g, linerSize: e.target.value }))}
            />
          </Field>

          <Field label="PACKING (TYPE/SIZE)">
            <input
              className="w-full border rounded-md px-3 py-2"
              placeholder={'Graphite 1.75"'}
              value={general.packing}
              onChange={(e) => setGeneral((g) => ({ ...g, packing: e.target.value }))}
            />
          </Field>

          <Field label="RODS (COUNT/SIZE)">
            <input
              className="w-full border rounded-md px-3 py-2"
              placeholder={'54 x 3/4"'}
              value={general.rods}
              onChange={(e) => setGeneral((g) => ({ ...g, rods: e.target.value }))}
            />
          </Field>

          <Field label="TUBING (COUNT/SIZE)">
            <input
              className="w-full border rounded-md px-3 py-2"
              placeholder={'120 x 2-3/8"'}
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
        </div>
      </div>

      <div className="flex gap-2">
        <button className="btn btn-primary">Save Well</button>
        <button type="button" className="btn btn-outline" onClick={() => navigate(-1)}>
          Cancel
        </button>
      </div>
    </form>
  );
}

function Field({ label, children }) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}
