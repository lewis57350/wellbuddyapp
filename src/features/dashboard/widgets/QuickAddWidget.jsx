import React, { useState } from "react";
import { addWell } from "../../wells/lib/storage.js";
import { useNavigate } from "react-router-dom";

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 24);
}

export default function QuickAddWidget() {
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [pumpType, setPumpType] = useState("Pump"); // keep current setup
  const navigate = useNavigate();

  function submit(e) {
    e.preventDefault();
    if (!name.trim() || !location.trim()) return;

    const id = `well-${slugify(name) || Date.now()}-${Date.now().toString().slice(-4)}`;
    addWell({ id, name: name.trim(), location: location.trim(), pumpType, records: [] });
    setName(""); setLocation("");
    navigate(`/well/${id}`);
  }

  return (
    <form onSubmit={submit} className="grid sm:grid-cols-3 gap-2">
      <input className="border rounded-md px-3 py-2" placeholder="Well name" value={name} onChange={e=>setName(e.target.value)} required />
      <input className="border rounded-md px-3 py-2" placeholder="Location" value={location} onChange={e=>setLocation(e.target.value)} required />
      <select className="border rounded-md px-3 py-2" value={pumpType} onChange={e=>setPumpType(e.target.value)}>
        <option>Tubing Pump</option><option>ESP</option><option>Injection</option>
        <option>Rod Pump</option><option>Unknown</option>
      </select>
      <div className="sm:col-span-3">
        <button className="btn btn-primary w-full">Add Well</button>
      </div>
    </form>
  );
}