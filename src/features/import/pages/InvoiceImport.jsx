import React, { useMemo, useState } from "react";
import Tesseract from "tesseract.js";
import {
  getWells,
  getWell,
  addWell,
  updateWell,
  addRecord,
  seedIfEmpty,
} from "../../wells/lib/storage.js";

/* -------------------- utilities -------------------- */

function norm(s = "") {
  return s.toLowerCase().replace(/[^\w]+/g, "").trim();
}

function slugify(s = "") {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 24);
}

function first(a, b) {
  return a ?? b ?? "";
}

function trimMulti(s) {
  return s.replace(/[ \t]+/g, " ").replace(/\s+\n/g, "\n").trim();
}

/** Build a short record note from description lines */
function shortNotes(lines) {
  const t = lines.join(" • ");
  return t.length > 380 ? t.slice(0, 380) + "…" : t;
}

/* -------------------- OCR + parsing -------------------- */

/**
 * Try hard to pull a well name from the OCR text.
 * Prioritizes the "WELL" section, then falls back to a decent guess.
 */
function extractWellName(text) {
  // 1) explicit section
  const m1 = text.match(/^\s*WELL\s*\n+([^\n]+)$/im);
  if (m1?.[1]) return m1[1].trim();

  // 2) inline forms: "WELL: Name" or "WELL Name"
  const m2 = text.match(/WELL[:\s-]+([A-Za-z0-9 #"'&/.-]{2,60})/i);
  if (m2?.[1]) return m2[1].trim();

  // 3) A line that looks like a well label (very naive fallback)
  const line = (text.split("\n").map((s) => s.trim()).find((s) =>
    /(?:#?\d+|unit|well)/i.test(s) && s.length < 60
  )) || "";
  return line || "";
}

/**
 * Pull the invoice date if present: lines like "DATE 02/19/2024"
 */
function extractDate(text) {
  const m = text.match(/\bDATE[:\s]+(\d{1,2}\/\d{1,2}\/\d{4})\b/i);
  return m?.[1] || "";
}

/**
 * Extract the itemized block under "CONTRACT WORK DESCRIPTION".
 * If not found, return the top 8 non-empty lines as a fallback.
 */
function extractDescriptionLines(text) {
  const lines = text.split("\n");
  const idx = lines.findIndex((l) =>
    /CONTRACT\s+WORK\s+DESCRIPTION/i.test(l)
  );

  if (idx >= 0) {
    const out = [];
    for (let i = idx + 1; i < lines.length; i++) {
      const L = lines[i].trim();
      // Stop when we reach totals or payment area
      if (/^PAYMENT\b/i.test(L)) break;
      if (/^\s*(HOURS|RATE|AMOUNT)\s*$/i.test(L)) continue;
      if (/^\s*(BALANCE|TOTAL|SUBTOTAL|TAX)\b/i.test(L)) continue;
      if (L) out.push(L);
    }
    if (out.length) return out;
  }

  // fallback
  return lines
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 8);
}

/**
 * Heuristic parser for rod/tubing/polish/liner/packing & insert pump.
 * Returns a "general" patch and a "notes" fragment.
 */
function parseGeneralFromLines(lines) {
  const txt = lines.join("\n");

  // ---- rods: "137 5/8's rods" | "54 x 3/4\" rods"
  let rods;
  let m =
    txt.match(/(\d{1,4})\s*(?:x\s*)?([0-9]+(?:\/[0-9]+)?)["”']?\s*'?s?\s*rods?\b/i) ||
    txt.match(/(\d{1,4})\s*(?:[’']?s)?\s*([0-9]+\/[0-9]+)["”']?\s*rods?\b/i) ||
    txt.match(/(\d{1,4})\s*rods?\b/i);
  if (m) {
    const count = m[1];
    const size = m[2];
    rods = size ? `${count} x ${size}"` : `${count} rods`;
  }

  // ---- tubing: "109 joints 2\" tubing" | "120 joints 2-3/8\""
  let tubing;
  m =
    txt.match(/(\d{1,4})\s*joints?\s*([0-9]+(?:-[0-9]+\/[0-9]+|\/[0-9]+)?)["”']?\s*tubing\b/i) ||
    txt.match(/(\d{1,4})\s*joints?\s*([0-9.]+)["”']?\s*tubing\b/i);
  if (m) {
    tubing = `${m[1]} x ${m[2]}"`;
  }

  // ---- polish rods: "polish rod" with size and maybe length
  let polishRods;
  m =
    txt.match(/polish\s*rod(?:s)?[^0-9]{0,10}([0-9]+(?:\/[0-9]+)?)["”]?\s*x?\s*([0-9]{1,3})[’'′]?\b/i) ||
    txt.match(/([0-9]+(?:\/[0-9]+)?)["”]?\s*polish\s*rod/i);
  if (m) {
    const dia = m[1];
    const len = m[2];
    polishRods = dia && len ? `${dia}" x ${len}'` : `${dia}"`;
  }

  // ---- liner: "8' liner" or "8' x 1.75\" x 2.00\""
  let linerSize;
  m = txt.match(/(\d+)\s*[’'′]?\s*liner\b/i);
  if (m) linerSize = `${m[1]}'`;
  // fuller form
  const mFull = txt.match(
    /(\d+)\s*[’'′]?\s*x\s*([0-9.]+)["”]?\s*x\s*([0-9.]+)["”]?\s*liner/i
  );
  if (mFull) {
    linerSize = `${mFull[1]}' x ${mFull[2]}" x ${mFull[3]}"`;
  }

  // ---- insert pump note: "9\" insert pump"
  let extraNote = "";
  m = txt.match(/(\d{1,2})\s*["”]?\s*insert\s*pump\b/i);
  if (m) {
    extraNote = `Insert pump ${m[1]}"`;
    // If we have polishRods size only and no length, keep it
    if (!polishRods) polishRods = `${m[1]}" (insert)`;
  }

  // ---- packing mentioned?
  let packing = "";
  if (/\bpacking\b/i.test(txt)) {
    // find small phrase around first "packing"
    const idx = txt.toLowerCase().indexOf("packing");
    const window = txt.slice(Math.max(0, idx - 30), idx + 50);
    packing = window.replace(/\n/g, " ").trim();
    // keep it short
    if (packing.length > 60) packing = "Packing / fittings noted";
  }

  const general = {};
  if (rods) general.rods = rods;
  if (tubing) general.tubing = tubing;
  if (polishRods) general.polishRods = polishRods;
  if (linerSize) general.linerSize = linerSize;
  if (packing) general.packing = packing;

  return { general, extraNote };
}

async function ocrFile(file) {
  const { data } = await Tesseract.recognize(file, "eng", {
    // Slightly more robust to typographic quotes
    tessedit_char_whitelist:
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789#:/-.,()'\" \n",
  });
  return trimMulti(data.text || "");
}

/* -------------------- component -------------------- */

export default function InvoiceImport() {
  const [queue, setQueue] = useState([]); // [{file, text, status}]
  const [busy, setBusy] = useState(false);
  useMemo(() => seedIfEmpty(), []);

  async function onPick(e) {
    const files = [...(e.target.files || [])];
    if (!files.length) return;
    setBusy(true);
    const results = [];
    for (const f of files) {
      try {
        const text = await ocrFile(f);
        results.push({ file: f, text, status: "ok" });
      } catch (err) {
        console.error("OCR failed:", err);
        results.push({ file: f, text: "", status: "error" });
      }
    }
    setQueue(results);
    setBusy(false);
  }

  async function importAll() {
    setBusy(true);
    const wellsNow = getWells();

    for (const item of queue) {
      if (!item.text) continue;

      const text = item.text;
      const wellNameRaw = extractWellName(text);
      const wellName = wellNameRaw || "(Unknown Well)";
      const date = extractDate(text);
      const descLines = extractDescriptionLines(text);

      // Parse general info
      const { general, extraNote } = parseGeneralFromLines(descLines);

      // map/merge to a well
      const byKey = wellsNow.reduce((acc, w) => {
        acc[norm(w.name)] = w;
        return acc;
      }, {});
      let target = byKey[norm(wellName)];

      if (!target) {
        const id = `well-${slugify(wellName) || Date.now()}-${Date.now()
          .toString()
          .slice(-4)}`;
        target = addWell({
          id,
          name: wellName,
          location: "",
          pumpType: "Unknown",
          records: [],
        });
      }

      // merge general box (only fields we discovered)
      if (Object.keys(general).length) {
        updateWell(target.id, { general });
      }

      // add record
      const notesParts = [];
      if (date) notesParts.push(`Invoice date: ${date}`);
      if (extraNote) notesParts.push(extraNote);
      notesParts.push(shortNotes(descLines));

      addRecord(target.id, {
        kind: "service",
        date: date || new Date().toISOString().slice(0, 10),
        by: "Invoice OCR",
        notes: notesParts.filter(Boolean).join(" • "),
      });
    }

    alert("Import complete. Open each well to review and adjust.");
    setBusy(false);
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Invoice Import (OCR)</h2>
      <p className="text-sm text-gray-600">
        Drop PDF / PNG / JPG invoices. We’ll OCR, locate the WELL name, add a
        record, and auto-fill rods/tubing/polish/liner when it’s present in the
        description. You can always edit later in Well Details → General Info.
      </p>

      <input
        type="file"
        multiple
        accept=".pdf,.png,.jpg,.jpeg"
        onChange={onPick}
      />

      <div className="flex gap-2">
        <button
          className="btn btn-primary"
          onClick={importAll}
          disabled={!queue.length || busy}
        >
          {busy ? "Working…" : "Import"}
        </button>
        <button
          className="btn btn-outline"
          onClick={() => setQueue([])}
          disabled={!queue.length || busy}
        >
          Clear
        </button>
      </div>

      {queue.length > 0 && (
        <div className="grid sm:grid-cols-2 gap-3">
          {queue.map((q, i) => (
            <div key={i} className="card text-sm">
              <div className="font-medium">{q.file?.name}</div>
              <div className="text-xs opacity-60 mb-1">
                {q.status === "ok" ? "OCR ok" : "OCR failed"}
              </div>
              <pre className="whitespace-pre-wrap text-xs max-h-60 overflow-auto">
                {q.text.slice(0, 3000)}
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
