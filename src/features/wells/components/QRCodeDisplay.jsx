import React, { useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { makeWellUrl } from "../lib/safeQrValue.js";

export default function QRCodeDisplay({ wellId, size = 160, showLink = true }) {
  const holderRef = useRef(null);
  const value = makeWellUrl(wellId);

  function copyLink() {
    (async () => {
      try {
        await navigator.clipboard.writeText(value);
        alert("QR link copied to clipboard.");
      } catch {
        // Fallback
        const ta = document.createElement("textarea");
        ta.value = value;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        alert("QR link copied to clipboard.");
      }
    })();
  }

  function downloadPng() {
    const canvas = holderRef.current?.querySelector("canvas");
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `well-${wellId}-qr.png`;
    a.click();
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-2">
        <div className="font-medium">QR Code</div>
        <div className="flex gap-2">
          <button type="button" className="btn btn-outline text-xs" onClick={copyLink}>
            Copy Link
          </button>
          <button type="button" className="btn btn-outline text-xs" onClick={downloadPng}>
            Download PNG
          </button>
        </div>
      </div>

      <div ref={holderRef} className="flex flex-col items-center gap-2">
        <QRCodeCanvas value={value} size={size} includeMargin />
        {showLink && (
          <div className="text-xs text-gray-600 break-all text-center">{value}</div>
        )}
      </div>
    </div>
  );
}