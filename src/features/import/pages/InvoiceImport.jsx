import React, { useState } from "react";
import Tesseract from "tesseract.js";
import { parseInvoiceText } from "../lib/parseInvoiceText.js";
import {
  getWells,
  getWell,
  addWell,
  updateWell,
  seedIfEmpty,
} from "../../wells/lib/storage.js";

export default function InvoiceImport() {
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState([]); // [{name,date,general,notes, matchId?}]

  function onPick(e) {
    setFiles([...e.target.files]);
  }

  async function runOCR() {
    setBusy(true);
    seedIfEmpty();
    const out = [];
    for (const f of files) {
      const { data } = await Tesseract.recognize(f, "eng", { logger: () => {} });
      const parsed = parseInvoiceText(data.text || "");
      const match = findWellByName(parsed.wellName);
      out.push({
        file: f.name,
        ...parsed,
        matchedId: match?.id || null,
        matchedName: match?.name || null,
      });
    }
    setResults(out);
    setBusy(false);
  }

  function applyAll() {
    const applied = [];
    for (const r of results) {
      const well =
        r.matchedId ? getWell(r.matchedId) :
        r.wellName   ? findWellByName(r.wellName) : null;

      if (well) {
        // merge general: fill missing or append if empty
        const general = { ...(well.general || {}) };
        for (const k of Object.keys(r.general || {})) {
          const v = (r.general || {})[k];
          if (!v) continue;
          if (!general[k]) general[k] = v;
        }
        updateWell(well.id, { general });
        // add a service record with the extracted summary
        import("../../wells/lib/storage.js").then(({ addRecord }) => {
          addRecord(well.id, {
            kind: "service",
            date: r.date || undefined,
            notes: r.notes || `Imported from ${r.file}`,
            by: "Invoice OCR",
          });
        });
        applied.push({ file: r.file, action: `Updated ${well.name}` });
      } else if (r.wellName) {
        // create a new well with what we know
        const id = `well-${slug(r.wellName)}-${Date.now().toString().slice(-4)}`;
        addWell({
          id,
          name: r.wellName,
          location: "",
          pumpType: "",
          general: r.general || {},
          records: [],
        });
        import("../../wells/lib/storage.js").then(({ addRecord }) => {
          addRecord(id, {
            kind: "service",
            date: r.date || undefined,
            notes: r.notes || `Imported from ${r.file}`,
            by: "Invoice OCR",
          });
        });
        applied.push({ file: r.file, action: `Created ${r.wellName}` });
      } else {
        applied.push({ file: r.file, action: "Skipped (no well name)" });
      }
    }
    alert("Import complete:\n" + applied.map(a => `* ${a.file}: ${a.action}`).join("\n"));
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Invoice Import (OCR)</h2>

      <div className="card space-y-3">
        <input type="file" multiple accept="image/*,.pdf" onChange={onPick} />
        <button className="btn btn-primary" disabled={!files.length || busy} onClick={runOCR}>
          {busy ? "Readingâ€¦" : "Read invoices"}
        </button>
      </div>

      {!!results.length && (
        <div className="card">
          <div className="font-medium mb-2">Preview & matches</div>
          <ul className="space-y-3">
            {results.map((r, i) => (
              <li key={i} className="border rounded-md p-3 text-sm">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{r.file}</div>
                  <div>{r.date || "-"}</div>
                </div>
                <div className="mt-1">
                  <div><span className="text-gray-500">Well:</span> {r.wellName || "-"}</div>
                  <div className="grid sm:grid-cols-2 gap-2 mt-1">
                    <Info k="Rods" v={r.general.rods} />
                    <Info k="Tubing" v={r.general.tubing} />
                    <Info k="Liner" v={r.general.linerSize} />
                    <Info k="Polish Rods" v={r.general.polishRods} />
                    <Info k="Packing" v={r.general.packing} />
                    <Info k="Engine" v={r.general.engineSize} />
                  </div>
                  <div className="mt-1 line-clamp-3"><span className="text-gray-500">Notes:</span> {r.notes || "-"}</div>
                  <div className="mt-2 text-xs">
                    Match: {r.matchedName ? <b>{r.matchedName}</b> : <em>none</em>}
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-3">
            <button className="btn btn-primary" onClick={applyAll}>Apply to wells</button>
          </div>
        </div>
      )}
    </div>
  );
}

function Info({ k, v }) {
  return (
    <div>
      <span className="text-gray-500">{k}:</span> {v || "-"}
    </div>
  );
}

function slug(s) {
  return (s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 30);
}

function norm(s) {
  return (s || "").toLowerCase().replace(/\s+/g, " ").trim();
}

function findWellByName(name) {
  if (!name) return null;
  const target = norm(name);
  const wells = getWells();
  // try exact, then loose contains
  let hit = wells.find((w) => norm(w.name) === target);
  if (hit) return hit;
  hit = wells.find((w) => target.includes(norm(w.name)) || norm(w.name).includes(target));
  return hit || null;
}


