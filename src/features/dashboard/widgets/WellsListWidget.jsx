import React, { useEffect, useState } from "react";
import {
  getWells, seedIfEmpty, updateWell, deleteWell, getWell, compareByUrgency
} from "../../wells/lib/storage.js";
import InlineWellCard from "../../wells/components/InlineWellCard.jsx";

export default function WellsListWidget() {
  const [wells, setWells] = useState([]);

  useEffect(() => {
    // seed once, then show sorted
    const seeded = seedIfEmpty();
    setWells(seeded.slice().sort(compareByUrgency));
  }, []);

  function refresh() {
    setWells(getWells().slice().sort(compareByUrgency));
  }

  function handleSave(id, patch) {
    updateWell(id, patch);
    // pull the updated well to avoid stale state
    const updated = getWell(id);
    setWells(prev =>
      prev.map(w => (w.id === id ? updated : w)).sort(compareByUrgency)
    );
  }

  function handleDelete(id) {
    if (!confirm("Delete this well? This cannot be undone.")) return;
    deleteWell(id);
    refresh();
  }

  if (!wells.length) {
    return <p className="text-sm text-gray-600">No wells yet.</p>;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {wells.map(w => (
        <InlineWellCard
          key={w.id}
          well={w}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      ))}
    </div>
  );
}
