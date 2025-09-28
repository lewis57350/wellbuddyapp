import React, { useMemo, useState } from "react";
import { addWell, addRecord, getWells } from "../../wells/lib/storage.js";

/**
 * You need tesseract.js in your project:
 *   npm i tesseract.js
 */

function slug(s = "") {
  return (s || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/["“”‘’]/g, "")    // quotes
    .replace(/[\u2013\u2014]/g, "-") // en/em dash
    .replace(/[^a-z0-9#\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function normalizeLine(s = "") {
  return s.replace(/\s+/g, " ").trim();
}

function toIsoDate(mdy) {
  // 02/19/2024 -> 2024-02-19
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(mdy);
  if (!m) return "";
  const [_, mm, dd, yyyy] = m;
  return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
}

function findExistingWellIdByName(name) {
  const target = slug(name);
  const wells = getWells();
  // Try exact slug match first
  let found = wells.find(w => slug(w.name) === target);
  if (found) return found.id;

  // Try looser “contains” on words (handles e.g., Montgomery #3 "Highway Well")
  const targetWords = target.split("-").filter(Boolean);
  found = wells.find(w => {
    const s = slug(w.name);
    return targetWords.every(t => s.includes(t));
  });
  return found?.id || null;
}

function splitLines(text) {
  return text
    .split(/\r?\n/)
    .map(normalizeLine)
    .filter(Boolean);
}

/** Parse OCR text tailored to your invoice format */
function parseInvoiceText(text) {
  const lines = splitLines(text);
  const joined = lines.join("\n");

  // Invoice date
  let date = "";
  {
    const m = /DATE\s+(\d{1,2}\/\d{1,2}\/\d{4})/i.exec(joined);
    if (m) date = toIsoDate(m[1]);
  }

  // Well name: line after a line that equals "WELL" (OCR sometimes makes it “WELL.” or “WELL I”)
  let wellName = "";
  const iW = lines.findIndex(l => /^well\b\.?$/i.test(l) || /^well\b/i.test(l) && l.toLowerCase() === "well");
  if (iW >= 0) {
    // next non-empty line
    for (let j = iW + 1; j < lines.length; j++) {
      if (lines[j].trim()) {
        wellName = lines[j].replace(/^well[:\-]\s*/i, "").replace(/^well\b/i, "").trim();
        break;
      }
    }
  }
  if (!wellName) {
    // fallback: header sometimes embeds it like "WELL Cur d"; try a simple pattern
    const m = /\bWELL\b\s*([^\n]+)/i.exec(joined);
    if (m) wellName = normalizeLine(m[1]);
  }
  // Clean quotes like Montgomery #3 “Highway Well”
  wellName = wellName.replace(/[“”"]/g, '"').replace(/\s+"/g, ' "').replace(/"+\s*$/g, "").trim();

  // Table section: between CONTRACT WORK DESCRIPTION and PAYMENT|BALANCE DUE|Thank you...
  const startIdx = lines.findIndex(l => /CONTRACT WORK DESCRIPTION/i.test(l));
  let endIdx = -1;
  if (startIdx >= 0) {
    endIdx = lines.findIndex((l, idx) =>
      idx > startIdx &&
      (/\bPAYMENT\b/i.test(l) || /\bBALANCE DUE\b/i.test(l) || /Thank you/i.test(l))
    );
    if (endIdx < 0) endIdx = lines.length;
  }

  const tableLines = startIdx >= 0 ? lines.slice(startIdx + 1, endIdx) : [];

  // Build items (description may wrap; hours/rate/amount often at end)
  const items = [];
  let cur = null;

  function flush() {
    if (cur) {
      cur.desc = cur.desc.trim();
      items.push(cur);
      cur = null;
    }
  }

  const moneyRe = /(\$?\d{1,3}(?:,\d{3})*(?:\.\d{2})?)$/; // capture last money-like token
  for (const raw of tableLines) {
    const line = raw.trim();

    // skip separators
    if (/^[-._\s]{3,}$/.test(line)) continue;

    // If line ends with amount, start/close an item
    const mAmt = moneyRe.exec(line);
    if (mAmt) {
      const amountText = mAmt[1].replace(/^\$/, "");
      const amount = parseFloat(amountText.replace(/,/g, "")) || 0;

      // Try to pull HOURS and RATE columns if present (simple heuristics)
      // We’ll strip the amount and then look for two numeric columns before it.
      const left = line.slice(0, mAmt.index).trim();
      // Split on two+ spaces – columns are spaced out
      const cols = left.split(/\s{2,}/).map(s => s.trim()).filter(Boolean);

      let hours = null, rate = null, desc = "";
      if (cols.length >= 3) {
        // Usually: [desc, hours, rate]
        desc = cols.slice(0, cols.length - 2).join(" ");
        hours = parseFloat(cols[cols.length - 2].replace(/,/g, "")) || null;
        rate = parseFloat(cols[cols.length - 1].replace(/[$,]/g, "")) || null;
      } else {
        // Could be only desc, or desc + hours
        desc = cols[0] || "";
        if (cols.length === 2) {
          const maybe = parseFloat(cols[1].replace(/,/g, ""));
          if (!Number.isNaN(maybe)) hours = maybe;
        }
      }

      flush();
      cur = { desc, hours, rate, amount };
      flush();
      continue;
    }

    // Otherwise, it’s a wrapped description line—append to current desc
    if (!cur) cur = { desc: line, hours: null, rate: null, amount: null };
    else cur.desc += ` ${line}`;
  }
  flush();

  // Pick up “Well record” block if present
  let wellRecordLines = [];
  {
    const idx = lines.findIndex(l => /^well\s+record\b/i.test(l));
    if (idx >= 0) {
      for (let k = idx; k < Math.min(idx + 10, lines.length); k++) {
        const s = lines[k].trim();
        if (!s) break;
        // stop at obvious next section lines
        if (/^Fuel Surcharge/i.test(s) || /\bPAYMENT\b/i.test(s)) break;
        if (k === idx) continue; // skip the title line itself
        wellRecordLines.push(s);
      }
    }
  }

  const total = items.reduce((acc, it) => acc + (it.amount || 0), 0);

  return {
    wellName,
    date,
    items,
    wellRecord: wellRecordLines.join("; "),
    total
  };
}

export default function InvoiceImport() {
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState([]); // [{fileName, parsed, text}]

  async function runOcr(file) {
    const url = URL.createObjectURL(file);
    try {
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("eng", 1, { logger: () => {} });
      const { data } = await worker.recognize(url);
      await worker.terminate();
      URL.revokeObjectURL(url);
      return data.text || "";
    } catch (e) {
      URL.revokeObjectURL(url);
      throw e;
    }
  }

  async function onSelect(e) {
    const chosen = Array.from(e.target.files || []);
    setFiles(chosen);
    setResults([]);
  }

  async function process() {
    if (!files.length) return;
    setBusy(true);
    const out = [];
    for (const f of files) {
      try {
        const text = await runOcr(f);
        const parsed = parseInvoiceText(text);
        out.push({ fileName: f.name, parsed, text });
      } catch (err) {
        out.push({ fileName: f.name, error: String(err) });
      }
    }
    setResults(out);
    setBusy(false);
  }

  function commitOne(parsed) {
    const { wellName, date, items, total, wellRecord } = parsed;
    if (!wellName) {
      alert("No WELL found in OCR. Open preview, confirm text, and try again.");
      return;
    }

    // Find or create well
    let wellId = findExistingWellIdByName(wellName);
    if (!wellId) {
      const id = `well-${slug(wellName)}-${Date.now().toString().slice(-4)}`;
      addWell({ id, name: wellName, location: "", pumpType: "Unknown", records: [] });
      wellId = id;
    }

    // Build a compact service note
    const lines = [];
    if (items.length) {
      for (const it of items) {
        const h = (it.hours != null) ? ` • ${it.hours}h` : "";
        const r = (it.rate != null) ? ` @ ${it.rate.toFixed(2)}` : "";
        const a = (it.amount != null) ? ` = $${it.amount.toFixed(2)}` : "";
        lines.push(`- ${it.desc}${h}${r}${a}`);
      }
    }
    if (total) lines.push(`TOTAL: $${total.toFixed(2)}`);
    if (wellRecord) lines.push(`Well record: ${wellRecord}`);

    const note = lines.join("\n");
    addRecord(wellId, {
      kind: "service",
      date: date || new Date().toISOString().slice(0, 10),
      notes: note,
      by: "Invoice OCR",
    });

    alert(`Saved record to "${wellName}".`);
  }

  function commitAll() {
    for (const r of results) {
      if (!r?.parsed || r.error) continue;
      commitOne(r.parsed);
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Invoice Import (OCR)</h2>

      <div className="card space-y-3">
        <div className="text-sm">
          Upload clear **JPG/PNG** invoices. This importer looks for <b>WELL</b> (line after it is
          treated as the well name), the <b>DATE</b>, and the work description table. It will add a
          single <i>Service</i> record to the matching well (or create a new well if none matches).
        </div>
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={onSelect}
          className="block w-full"
        />
        <div className="flex gap-2">
          <button className="btn btn-outline" disabled={!files.length || busy} onClick={process}>
            {busy ? "Processing…" : "Run OCR"}
          </button>
          <button className="btn btn-primary" disabled={!results.length || busy} onClick={commitAll}>
            Save all to wells
          </button>
        </div>
      </div>

      {!!results.length && (
        <div className="space-y-3">
          {results.map((r, i) => (
            <div key={i} className="card">
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium">{r.fileName}</div>
                {!r.error && (
                  <button className="btn btn-outline btn-xs" onClick={() => commitOne(r.parsed)}>
                    Save this one
                  </button>
                )}
              </div>

              {r.error ? (
                <div className="text-sm text-red-600">{r.error}</div>
              ) : (
                <>
                  <div className="text-sm">
                    <div><b>WELL:</b> {r.parsed.wellName || "—"}</div>
                    <div><b>Date:</b> {r.parsed.date || "—"}</div>
                    <div><b>Items:</b> {r.parsed.items.length}</div>
                    <div><b>Total:</b> {r.parsed.total ? `$${r.parsed.total.toFixed(2)}` : "—"}</div>
                    {r.parsed.wellRecord && <div className="mt-1"><b>Well record:</b> {r.parsed.wellRecord}</div>}
                  </div>

                  {r.parsed.items.length > 0 && (
                    <div className="mt-3">
                      <div className="font-medium mb-1">Parsed line items</div>
                      <ul className="space-y-1 text-sm">
                        {r.parsed.items.map((it, k) => (
                          <li key={k} className="border rounded-md p-2">
                            <div className="font-medium">{it.desc}</div>
                            <div className="text-xs text-gray-600">
                              {it.hours != null && <>Hours: {it.hours} • </>}
                              {it.rate != null && <>Rate: ${it.rate.toFixed(2)} • </>}
                              {it.amount != null && <>Amount: ${it.amount.toFixed(2)}</>}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <details className="mt-3">
                    <summary className="cursor-pointer text-sm text-gray-600">Show raw OCR text</summary>
                    <pre className="mt-2 text-xs whitespace-pre-wrap">{r.text}</pre>
                  </details>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
