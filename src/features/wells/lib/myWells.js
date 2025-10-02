import { db } from "../../../lib/firebase";
import { ensureSignedIn } from "../../../lib/firebase";
import { collection, doc, serverTimestamp, writeBatch } from "firebase/firestore";

function* chunk(arr, size) { for (let i=0;i<arr.length;i+=size) yield arr.slice(i,i+size); }

/**
 * wells: array of mapped wells (what mapIsgsToWell returns)
 * Creates/updates /profiles/{uid}/myWells/{wellId} docs for quick listing.
 */
export async function addWellsToMyList(wells) {
  const user = await ensureSignedIn();
  const uid = user.uid;
  let total = 0;

  for (const group of chunk(wells, 400)) {
    const b = writeBatch(db);
    for (const w of group) {
      const ref = doc(collection(db, "profiles", uid, "myWells"), w.id);
      b.set(ref, {
        wellId: w.id,
        name: w.name || w.info?.apiNumber || w.id,
        company: w.company || "",
        apiNumber: w.info?.apiNumber || "",
        source: w.source || "imported",
        addedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });
    }
    await b.commit();
    total += group.length;
  }
  return total;
}
