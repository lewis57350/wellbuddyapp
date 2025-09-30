import React from "react";
import { useParams, Link } from "react-router-dom";
import { getWell } from "../lib/storage.js";
import { QRCodeCanvas } from "qrcode.react";
import { makeWellUrl } from "../lib/safeQrValue.js";

export default function WellSheet() {
  const { id } = useParams();
  const well = getWell(id);

  if (!well) {
    return (
      <div className="space-y-3">
        <p>Well not found.</p>
        <Link to="/dashboard" className="text-blue-600">Back to Dashboard</Link>
      </div>
    );
  }

  const routeUrl = makeWellUrl(id);
  const records = well.records || [];
  const g = well.general || {};

  function printNow() {
    window.print();
  }

  return (
    <div className="max-w-3xl mx-auto p-4">
      {/* Toolbar (hidden on print) */}
      <div className="no-print mb-3 flex items-center justify-between">
        <Link to={`/well/${id}`} className="btn btn-outline text-sm">â† Back to Well</Link>
        <button onClick={printNow} className="btn btn-primary text-sm">Print</button>
      </div>

      {/* Sheet */}
      <div className="sheet border bg-white rounded-xl shadow p-6">
        <header className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <img src="/favicon.svg" alt="" className="h-8 w-8" />
            <div>
              <div className="text-lg font-semibold">WellBuddyApp â€" Well Sheet</div>
              <div className="text-xs text-gray-500">{new Date().toLocaleString()}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium">{well.name}</div>
            <div className="text-xs text-gray-500">ID: {id}</div>
          </div>
        </header>

        {/* Summary + QR */}
        <section className="grid sm:grid-cols-3 gap-4 mb-6">
          <div className="sm:col-span-2 space-y-2">
            <Row label="Location" value={well.location} />
            <Row label="Pump Type" value={well.pumpType} />
            <Row label="Total Records" value={(records.length).toString()} />
            <Row label="Well URL" value={routeUrl} wrap />
          </div>
          <div className="flex flex-col items-center">
            <QRCodeCanvas value={routeUrl} size={160} includeMargin />
            <div className="text-xs text-gray-600 mt-2 break-all text-center">{routeUrl}</div>
          </div>
        </section>

        {/* NEW: General Well Info box */}
        <section className="mb-6">
          <div className="font-medium mb-2">General Well Info</div>
          <div className="grid sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
            <Row label="ENGINE SIZE" value={orDash(g.engineSize)} />
            <Row label="UNIT (MAKE/MODEL)" value={orDash(g.unitMakeModel)} />
            <Row label={'BRIDAL CABLE SIZE (D" x L\')'} value={orDash(g.bridalCable)} />
            <Row label={'POLISH RODS SIZE (D" x L\')'} value={orDash(g.polishRods)} />
            <Row label={'LINER SIZE (L\' x I.D" x O.D")'} value={orDash(g.linerSize)} />
            <Row label="PACKING (TYPE/SIZE)" value={orDash(g.packing)} />
            <Row label="RODS (COUNT/SIZE)" value={orDash(g.rods)} />
            <Row label="TUBING (COUNT/SIZE)" value={orDash(g.tubing)} />
            <div className="sm:col-span-2">
              <div className="text-gray-500">NOTES</div>
              <div className="border rounded-md p-3 min-h-[100px] whitespace-pre-wrap">
                {orDash(g.notes)}
              </div>
            </div>
          </div>
        </section>

        {/* Recent records */}
        <section>
          <div className="font-medium mb-2">Recent Records</div>
          {records.length === 0 ? (
            <p className="text-sm text-gray-600">No records yet.</p>
          ) : (
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b">
                  <Th>Date</Th><Th>Type</Th><Th>By</Th><Th>Notes</Th>
                </tr>
              </thead>
              <tbody>
                {records.slice(0, 12).map(r => (
                  <tr key={r.id} className="border-b align-top">
                    <Td>{r.date}</Td>
                    <Td className="capitalize">{r.kind}</Td>
                    <Td>{r.by}</Td>
                    <Td>{r.notes || ""}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="mt-8 grid sm:grid-cols-2 gap-8">
          <SignLine label="Operator / Pumper" />
          <SignLine label="Technician" />
        </section>
      </div>
    </div>
  );
}

function orDash(v) { return v && String(v).trim() ? v : "-"; }

function Row({ label, value, wrap }) {
  return (
    <div className="text-sm">
      <span className="text-gray-500">{label}:</span>{" "}
      <span className={wrap ? "break-all" : ""}>{value}</span>
    </div>
  );
}

function Th({ children }) { return <th className="text-left py-2 pr-3">{children}</th>; }
function Td({ children, className = "" }) { return <td className={`py-2 pr-3 ${className}`}>{children}</td>; }

function SignLine({ label }) {
  return (
    <div className="text-sm">
      <div className="border-b h-8" />
      <div className="text-gray-500 mt-1">{label}</div>
    </div>
  );
}


