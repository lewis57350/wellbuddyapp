const trim = (s) => (s || "").replace(/\s+/g, " ").trim();

const pick = (re, text) => {
  const m = text.match(re);
  return m ? trim(m[2] || m[1]) : "";
};

export function parseInvoiceText(raw) {
  // Normalize some common OCR quirks
  const text = (raw || "")
    .replace(/\r/g, "")
    .replace(/[|]+/g, "")
    .replace(/\u2013|\u2014/g, "-");

  // Core well attributes
  const name =
    pick(/\b(?:well(?:\s*name)?|lease)[:\-]\s*([^\n]+)/i, text) ||
    pick(/\bname[:\-]\s*([^\n]+)/i, text);

  const location = pick(/\blocation[:\-]\s*([^\n]+)/i, text);
  const pumpType =
    pick(/\b(?:pump\s*type|lift|method)[:\-]\s*([^\n]+)/i, text) ||
    ""; // leave blank if unknown

  // General info block (optional)
  const engineSize = pick(/\bengine\s*size[:\-]\s*([^\n]+)/i, text);
  const unitMakeModel = pick(/\bunit(?:\s*\(make\/model\))?[:\-]\s*([^\n]+)/i, text);
  const bridalCable = pick(/\bbridal\s*cable(?:\s*size)?[:\-]\s*([^\n]+)/i, text);
  const polishRods = pick(/\bpolish\s*rods?(?:\s*size)?[:\-]\s*([^\n]+)/i, text);
  const linerSize = pick(/\bliner\s*size[:\-]\s*([^\n]+)/i, text);
  const packing = pick(/\bpacking(?:\s*\(type\/size\))?[:\-]\s*([^\n]+)/i, text);
  const rods = pick(/\brods(?:\s*\(count\/size\))?[:\-]\s*([^\n]+)/i, text);
  const tubing = pick(/\btubing(?:\s*\(count\/size\))?[:\-]\s*([^\n]+)/i, text);

  // Invoice meta (for attaching a record)
  const invoiceNo =
    pick(/\b(?:invoice\s*(?:no\.?|#)|inv\.)[:\-]\s*([A-Za-z0-9\-\/]+)/i, text) || "";
  const date =
    pick(/\bdate[:\-]\s*([0-9]{1,2}[\/\-][0-9]{1,2}[\/\-][0-9]{2,4})/i, text) || "";
  const amount =
    pick(/\b(?:total|amount\s*due|grand\s*total)[:\-]?\s*\$?\s*([\d,]+(?:\.\d{2})?)/i, text) || "";
  const vendor =
    pick(/\b(?:vendor|supplier|from)[:\-]\s*([^\n]+)/i, text) ||
    // as a fallback, try to grab the first uppercasey line
    (text.split("\n").map(trim).find(l => /^[A-Z0-9][A-Z0-9 &.,'-]{3,}$/.test(l)) || "");

  // Build well + record skeletons
  const well = {
    name: name || "",
    location: location || "",
    pumpType: pumpType || "",
    general: {
      engineSize,
      unitMakeModel,
      bridalCable,
      polishRods,
      linerSize,
      packing,
      rods,
      tubing,
      notes: "",
    },
  };

  const record = {
    kind: "service",
    date: date || new Date().toISOString().slice(0, 10),
    notes: [
      vendor && `Vendor: ${vendor}`,
      invoiceNo && `Invoice #: ${invoiceNo}`,
      amount && `Amount: ${amount}`,
    ].filter(Boolean).join(" | "),
    by: "Invoice Import",
  };

  return { well, record, raw: text };
}