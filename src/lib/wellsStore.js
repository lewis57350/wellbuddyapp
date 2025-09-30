import { db } from "./firebase";
import { writeBatch, doc, getDoc } from "firebase/firestore";

export async function upsertWellsWithHistory(wells) {
  const chunks = [];
  for (let i = 0; i < wells.length; i += 450) chunks.push(wells.slice(i, i + 450));

  let total = 0;
  for (const ch of chunks) {
    const batch = writeBatch(db);
    for (const w of ch) {
      const id = (w.info?.apiNumber || w.id).replaceAll("/", "-");
      const wellRef = doc(db, "wells", id);
      const histRef = doc(db, "wells", id, "history", "summary");

      batch.set(
        wellRef,
        {
          name: w.name || w.info?.apiNumber || "Untitled Well",
          company: w.company || "",
          location: w.location || "",
          county: w.county || "",
          info: w.info || {},
          updatedAt: Date.now(),
        },
        { merge: true }
      );

      batch.set(
        histRef,
        {
          permitNumber: w.history?.permitNumber || "",
          permitDate: w.history?.permitDate || null,
          completionDate: w.history?.completionDate || null,
          producingHorizons: w.history?.producingHorizons || [],
          dataSummary: w.history?.dataSummary || "",
          logsAvailable: w.history?.logsAvailable || "",
          flags: w.history?.flags || {},
          updatedAt: Date.now(),
        },
        { merge: true }
      );

      total++;
    }
    await batch.commit();
  }
  return total;
}

export async function getWellHistoryDoc(api) {
  const id = api.replaceAll("/", "-");
  const ref = doc(db, "wells", id, "history", "summary");
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}
