import React, { useMemo, useState } from "react";
import Tesseract from "tesseract.js";
import { parseInvoiceText } from "../lib/parseInvoice.js";
import { addWell, getWells, getWell, updateWell, addRecord } from "../../wells/lib/storage.js";

function slugify(s) {
  return (s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 24);
}

export default function InvoiceImport() {
  const [files, setFiles] = useState([]);
  const [items, setItems] = useState([]); // [{fileName, imgUrl, status, text, parsed:{well,record}}]
  const [busy, setBusy] = useState(false);

  function onPick(e) {
    const f = Array.from(e.target.files || []);
    setFiles(f);
    setItems(f.map(file => ({
      fileName: file.name,
      imgUrl: URL.createObjectURL(file),
      status: "pending",
      text: "",
      parsed: null,
    })));
  }

  async function runOcr() {
    setBusy(true);
    const next = [...items];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      next[i].status = "ocr…";
      setItems([...next]);

      try {
        const { data } = await Tesseract.recognize(file, "eng", {
          logger: (m) => {
            if (m.status === "recognizing text") {
              next[i].status = `ocr ${Math.round(m.progress * 100)}%`;
              setItems([...next]);
            }
          },
        });
        next[i].text = data.text || "";
        const parsed = parseInvoiceText(next[i].text);
        next[i].parsed = parsed;
        next[i].status = "parsed";
      } catch (err) {
        console.error(err);
        next[i].status = "error";
      }
      setItems([...next]);
    }
    setBusy(false);
  }

  function updateParsed(idx, patch) {
    const next = [...items];
    next[idx] = { ...next[idx], parsed: { ...next[idx].parsed, ...patch } };
    setItems(next);
  }

  function updateParsedWell(idx, patch) {
    const cur = items[idx].parsed || { well: {}, record: {} };
    const nextWell = { ...(cur.well || {}), ...patch };
    updateParsed(idx, { well: nextWell });
  }

  function updateParsedRecord(idx, patch) {
    const cur = items[idx].parsed || { well: {}, record: {} };
    const nextRec = { ...(cur.record || {}), ...patch };
    updateParsed(idx, { record: nextRec });
  }

  function findExistingWellIdByName(name) {
    if (!name) return null;
    const found = (getWells() || []).find(w => (w.name || "").toLowerCase() === name.toLowerCase());
    return found?.id || null;
  }

  function saveOne(idx) {
    const p = items[idx].parsed;
    if (!p) return;

    const { well, record } = p;
    const existingId = findExistingWellIdByName(well.name);

    let id = existingId;
    if (!existingId) {
      // create new well
      id = `well-${slugify(well.name) || Date.now()}-${Date.now().toString().slice(-4)}`;
      addWell({ id, name: well.name, location: well.location, pumpType: well.pumpType, general: well.general, records: [] });
    } else {
      // merge general / basics into existing
      const existing = getWell(existingId);
      updateWell(existingId, {
        name: well.name || existing.name,
        location: well.location || existing.location,
        pumpType: well.pumpType || existing.pumpType,
        general: { ...(existing.general || {}), ...(well.general || {}) },
      });
    }

    // attach record
    if (record && id) {
      addRecord(id, record);
    }

    // mark saved
    const next = [...items];
    next[idx].status = "saved";
    setItems(next);
  }

  function saveAll() {
    items.forEach((_, i) => saveOne(i));
    alert("Saved. Check Dashboard / Wells.");
  }

  const hasParsed = useMemo(() => items.some(it => it.parsed), [items]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Invoice Importer (OCR)</h2>
      </div>

      <div className="card space-y-3">
        <div className="text-sm text-gray-600">
          Drop or select invoice images (JPG/PNG). I’ll read them, extract well details, and let you save.
        </div>
        <input type="file" accept="image/*" multiple onChange={onPick} />
        <div className="flex gap-2">
          <button className="btn btn-primary" onClick={runOcr} disabled={!files.length || busy}>
            {busy ? "Working…" : "Run OCR"}
          </button>
          {hasParsed && (
            <button className="btn btn-outline" onClick={saveAll}>
              Save All
            </button>
          )}
        </div>
      </div>

      {items.length > 0 && (
        <ul className="space-y-4">
          {items.map((it, idx) => (
            <li key={idx} className="card">
              <div className="flex items-start gap-4">
                <img src={it.imgUrl} alt="" className="w-40 h-40 object-cover rounded-md border" />
                <div className="flex-1 space-y-3">
                  <div className="text-sm text-gray-500">Status: <span className="font-medium">{it.status}</span></div>

                  {it.parsed ? (
                    <>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <Field label="Well Name">
                          <input className="w-full border rounded-md px-3 py-2"
                            value={it.parsed.well.name}
                            onChange={(e) => updateParsedWell(idx, { name: e.target.value })} />
                        </Field>
                        <Field label="Location">
                          <input className="w-full border rounded-md px-3 py-2"
                            value={it.parsed.well.location}
                            onChange={(e) => updateParsedWell(idx, { location: e.target.value })} />
                        </Field>
                        <Field label="Pump Type">
                          <input className="w-full border rounded-md px-3 py-2"
                            value={it.parsed.well.pumpType}
                            onChange={(e) => updateParsedWell(idx, { pumpType: e.target.value })} />
                        </Field>

                        <Field label="ENGINE SIZE">
                          <input className="w-full border rounded-md px-3 py-2"
                            value={it.parsed.well.general.engineSize}
                            onChange={(e) => updateParsedWell(idx, { general: { ...it.parsed.well.general, engineSize: e.target.value } })} />
                        </Field>
                        <Field label="UNIT (MAKE/MODEL)">
                          <input className="w-full border rounded-md px-3 py-2"
                            value={it.parsed.well.general.unitMakeModel}
                            onChange={(e) => updateParsedWell(idx, { general: { ...it.parsed.well.general, unitMakeModel: e.target.value } })} />
                        </Field>
                        <Field label='BRIDAL CABLE SIZE (D" x L")'>
                          <input className="w-full border rounded-md px-3 py-2"
                            value={it.parsed.well.general.bridalCable}
                            onChange={(e) => updateParsedWell(idx, { general: { ...it.parsed.well.general, bridalCable: e.target.value } })} />
                        </Field>
                        <Field label='POLISH RODS SIZE (D" x L")'>
                          <input className="w-full border rounded-md px-3 py-2"
                            value={it.parsed.well.general.polishRods}
                            onChange={(e) => updateParsedWell(idx, { general: { ...it.parsed.well.general, polishRods: e.target.value } })} />
                        </Field>
                        <Field label='LINER SIZE (L\ x ID x OD )'>
                          <input className="w-full border rounded-md px-3 py-2"
                            value={it.parsed.well.general.linerSize}
                            onChange={(e) => updateParsedWell(idx, { general: { ...it.parsed.well.general, linerSize: e.target.value } })} />
                        </Field>
                        <Field label="PACKING (TYPE/SIZE)">
                          <input className="w-full border rounded-md px-3 py-2"
                            value={it.parsed.well.general.packing}
                            onChange={(e) => updateParsedWell(idx, { general: { ...it.parsed.well.general, packing: e.target.value } })} />
                        </Field>
                        <Field label="RODS (COUNT/SIZE)">
                          <input className="w-full border rounded-md px-3 py-2"
                            value={it.parsed.well.general.rods}
                            onChange={(e) => updateParsedWell(idx, { general: { ...it.parsed.well.general, rods: e.target.value } })} />
                        </Field>
                        <Field label="TUBING (COUNT/SIZE)">
                          <input className="w-full border rounded-md px-3 py-2"
                            value={it.parsed.well.general.tubing}
                            onChange={(e) => updateParsedWell(idx, { general: { ...it.parsed.well.general, tubing: e.target.value } })} />
                        </Field>

                        <div className="sm:col-span-2">
                          <label className="block text-sm font-medium">NOTES</label>
                          <textarea rows={3} className="w-full border rounded-md px-3 py-2"
                            value={it.parsed.well.general.notes}
                            onChange={(e) => updateParsedWell(idx, { general: { ...it.parsed.well.general, notes: e.target.value } })} />
                        </div>
                      </div>

                      <div className="border-t pt-3 mt-3">
                        <div className="font-medium mb-2">Attach as Record</div>
                        <div className="grid sm:grid-cols-3 gap-3">
                          <Field label="Type">
                            <select className="w-full border rounded-md px-3 py-2"
                              value={it.parsed.record.kind}
                              onChange={(e) => updateParsedRecord(idx, { kind: e.target.value })}>
                              <option value="service">Service</option>
                              <option value="maintenance">Maintenance</option>
                            </select>
                          </Field>
                          <Field label="Date">
                            <input className="w-full border rounded-md px-3 py-2" type="date"
                              value={it.parsed.record.date}
                              onChange={(e) => updateParsedRecord(idx, { date: e.target.value })} />
                          </Field>
                          <Field label="By">
                            <input className="w-full border rounded-md px-3 py-2"
                              value={it.parsed.record.by}
                              onChange={(e) => updateParsedRecord(idx, { by: e.target.value })} />
                          </Field>
                          <div className="sm:col-span-3">
                            <label className="block text-sm font-medium">Notes</label>
                            <input className="w-full border rounded-md px-3 py-2"
                              value={it.parsed.record.notes}
                              onChange={(e) => updateParsedRecord(idx, { notes: e.target.value })} />
                          </div>
                        </div>
                      </div>

                      <div className="mt-3">
                        <button className="btn btn-primary" onClick={() => saveOne(idx)}>Save This</button>
                      </div>
                    </>
                  ) : it.status === "error" ? (
                    <div className="text-sm text-red-600">OCR failed. You can try again.</div>
                  ) : (
                    <div className="text-sm text-gray-600">Awaiting OCR…</div>
                  )}
                </div>
              </div>

              {it.text && (
                <details className="mt-3">
                  <summary className="text-sm underline">Show OCR text</summary>
                  <pre className="mt-2 whitespace-pre-wrap text-xs bg-gray-50 p-3 rounded-md border max-h-48 overflow-auto">
{it.text}
                  </pre>
                </details>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
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