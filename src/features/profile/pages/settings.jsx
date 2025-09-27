import React, { useState } from "react";
import { saveProfile, getProfile } from "../lib/profile.js";

export default function Settings() {
  const [form, setForm] = useState(getProfile());

  function onSubmit(e) {
    e.preventDefault();
    saveProfile(form);
    alert("Saved.");
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-xl space-y-4">
      <h2 className="text-xl font-semibold">Settings</h2>

      <div className="space-y-1">
        <label className="text-sm font-medium">Company Name</label>
        <input
          className="w-full border rounded-md px-3 py-2"
          value={form.companyName}
          onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))}
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Logo URL</label>
        <input
          className="w-full border rounded-md px-3 py-2"
          value={form.logoUrl}
          onChange={e => setForm(f => ({ ...f, logoUrl: e.target.value }))}
          placeholder="https://example.com/logo.png"
        />
        {form.logoUrl && (
          <div className="mt-2">
            <img src={form.logoUrl} alt="logo preview" className="h-12 rounded border" />
          </div>
        )}
      </div>

      <button className="btn btn-primary">Save</button>
    </form>
  );
}