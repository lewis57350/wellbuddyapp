// src/features/import/lib/parseInvoiceText.js
// Extracts well name, date, useful "General Well Info" from OCR'd invoice text.

function toISO(mdY) {
  // mm/dd/yyyy -> yyyy-mm-dd
  const m = mdY.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (!m) return null;
  const [, mm, dd, yyyy] = m;
  return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
}
const clean = (s) => (s || "").replace(/^[\s:.-]+|[\s.:_-]+$/g, "").trim();

export function parseInvoiceText(raw) {
  const text = (raw || "").replace(/\r/g, "");
  const lower = text.toLowerCase();
  const lines = lower.split(/\n+/).map((s) => s.trim()).filter(Boolean);

  const out = {
    wellName: null,
    date: null,
    notes: "",
    general: {
      engineSize: "",
      unitMakeModel: "",
      bridalCable: "",
      polishRods: "",
      linerSize: "",
      packing: "",
      rods: "",
      tubing: "",
      notes: ""
    }
  };

  // WELL name (your PDFs show "WELL" on its own line, value below)
  {
    const m1 = text.match(/\bWELL\b[:\s]*\n?\s*([^\n\r]+)/i);
    const m2 = text.match(/\bWELL\s*[:\-]\s*([^\n\r]+)/i);
    if (m1) out.wellName = clean(m1[1]);
    else if (m2) out.wellName = clean(m2[1]);
  }

  // Invoice DATE
  {
    const m = text.match(/\bDATE\b[:\s]*([0-9]{1,2}\/[0-9]{1,2}\/[0-9]{4})/i);
    if (m) out.date = toISO(m[1]);
  }

  // CONTRACT WORK DESCRIPTION -> PAYMENT block as concatenated notes
  {
    const m = text.match(/CONTRACT WORK DESCRIPTION([\s\S]*?)PAYMENT/i);
    if (m) {
      const items = m[1]
        .split(/\n+/)
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 12);
      out.notes = items.join(" * ");
      out.general.notes = out.notes;
    }
  }

  // === Heuristics for field extraction ===

  // Rods: "137 5/8's rods", "54 x 3/4\" rods"
  for (const ln of lines) {
    let m =
      ln.match(/(\d{1,4})\s*([0-9/.\-]+)\s*(?:['â€™]s)?\s*rods?\b/) ||
      ln.match(/(\d{1,4})\s*x\s*([0-9/.\-]+)"\s*rods?\b/);
    if (m) {
      out.general.rods = `${m[1]} x ${m[2]}"`;
      break;
    }
  }

  // Tubing: "109 joints 2\" tubing", "2-3/8\" tubing"
  for (const ln of lines) {
    let m = ln.match(/(\d{1,4})\s*joints?\s*([0-9/.\-]+)"\s*tub(?:e|ing)\b/);
    if (m) {
      out.general.tubing = `${m[1]} joints ${m[2]}"`;
      break;
    }
    m = ln.match(/\b([0-9/.\-]+)"\s*tub(?:e|ing)\b/);
    if (!out.general.tubing && m) {
      out.general.tubing = `${m[1]}"`;
    }
  }

  // Liner size: "8' x 1.75\" x 2.00\"" style
  for (const ln of lines) {
    const m = ln.match(/(\d+)\s*['â€™]\s*x\s*([0-9/.\-]+)"\s*x\s*([0-9/.\-]+)"/);
    if (m) {
      out.general.linerSize = `${m[1]}' x ${m[2]}" x ${m[3]}"`;
      break;
    }
  }

  // Polish rods: 'polish rod ... 1-1/8" x 24''
  for (const ln of lines) {
    const m = ln.match(/polish\s*rod[s]?[^\d]*([0-9/.\-]+)"\s*x\s*(\d+)\s*['â€™]/);
    if (m) {
      out.general.polishRods = `${m[1]}" x ${m[2]}'`;
      break;
    }
  }

  // Packing mentioned?
  if (lower.includes("packing")) {
    out.general.packing = out.general.packing || "Packing mentioned (see notes)";
  }

  // Engine size (rare): "208/346"
  {
    const m = text.match(/\b(\d{2,4})\/(\d{2,4})\b/);
    if (m) out.general.engineSize = `${m[1]}/${m[2]}`;
  }

  return out;
}

