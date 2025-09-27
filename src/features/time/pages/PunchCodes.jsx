import React, { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { buildPunchQr } from "../../time/lib/punchFormat.js";

export default function PunchCodes() {
  const [form, setForm] = useState({ employeeId:"EMP1", employeeName:"", siteId:"", action:"in" });

  const payload = buildPunchQr({
    employeeId: form.employeeId.trim(),
    employeeName: form.employeeName.trim(),
    siteId: form.siteId.trim(),
    action: form.action
  });

  const directLink =
    `#/punch?e=${encodeURIComponent(form.employeeId)}&a=${form.action}` +
    `&site=${encodeURIComponent(form.siteId)}&n=${encodeURIComponent(form.employeeName)}`;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="card space-y-3">
        <h2 className="text-xl font-semibold">Punch Code Generator</h2>

        <label className="block">
          <div className="text-sm mb-1">Employee ID</div>
          <input className="w-full border rounded-md px-3 py-2"
                 value={form.employeeId}
                 onChange={e => setForm(f => ({ ...f, employeeId: e.target.value }))} />
        </label>

        <label className="block">
          <div className="text-sm mb-1">Employee Name (optional)</div>
          <input className="w-full border rounded-md px-3 py-2"
                 value={form.employeeName}
                 onChange={e => setForm(f => ({ ...f, employeeName: e.target.value }))} />
        </label>

        <label className="block">
          <div className="text-sm mb-1">Site / Well ID (optional)</div>
          <input className="w-full border rounded-md px-3 py-2"
                 value={form.siteId}
                 onChange={e => setForm(f => ({ ...f, siteId: e.target.value }))} />
        </label>

        <label className="block">
          <div className="text-sm mb-1">Action</div>
          <select className="w-full border rounded-md px-3 py-2"
                  value={form.action}
                  onChange={e => setForm(f => ({ ...f, action: e.target.value }))}>
            <option value="in">IN</option>
            <option value="out">OUT</option>
          </select>
        </label>
      </div>

      <div className="card flex flex-col items-center justify-center">
        <QRCodeSVG value={payload} size={180}/>
        <div className="text-xs mt-3 break-all opacity-70">{payload}</div>
        <div className="text-xs mt-2">
          Direct link: <code>{directLink}</code>
        </div>
      </div>
    </div>
  );
}