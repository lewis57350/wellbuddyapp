import React, { useMemo, useState, useEffect } from "react";
import { upsertWellsWithHistory } from "../../lib/wellsStore";
import {
  fetchWellsPage,
  fetchPayStratsByAPI,
  mapIsgsToWell,
  fetchCountyExtent,
  fetchFieldExtent,
} from "../../lib/isgs";
import { ensureSignedIn } from "../../lib/firebase";

export default function WellsImporter() {
  const [county, setCounty] = useState("");
  const [apiLike, setApiLike] = useState("");
  const [fieldLike, setFieldLike] = useState("");
  const [page, setPage] = useState(0);
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState([]);
  const [exceeded, setExceeded] = useState(false);

  // Auto-import progress
  const [autoBusy, setAutoBusy] = useState(false);
  const [autoCount, setAutoCount] = useState(0);
  const [autoPages, setAutoPages] = useState(0);

  // API is attribute; county/field are spatial
  const where = useMemo(() => {
    const parts = ["1=1"];
    if (apiLike) parts.push(`API_NUMBER LIKE '%${apiLike.replaceAll("'", "''")}%'`);
    return parts.join(" AND ");
  }, [apiLike]);

  async function resolveExtent() {
    if (fieldLike.trim()) return await fetchFieldExtent(fieldLike);
    if (county.trim()) return await fetchCountyExtent(county);
    return null;
  }

  async function runSearch(goToPage = 0) {
    setBusy(true);
    try {
      const extent = await resolveExtent();
      const { features, exceeded: ex } = await fetchWellsPage({
        where,
        limit: 2000,
        offset: goToPage * 2000,
        geometry: extent,
      });
      setResults(features);
      setExceeded(ex);
      setPage(goToPage);
    } catch (e) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function importAllOnPage() {
    if (!results.length) return;
    setBusy(true);
    try {
      await ensureSignedIn();
      const packaged = [];
      for (const r of results) {
        const ps = await fetchPayStratsByAPI(r.API_NUMBER);
        packaged.push(mapIsgsToWell(r, ps));
      }
      const count = await upsertWellsWithHistory(packaged);
      alert(`Imported/updated ${count} wells into Firestore. ("Wells" + "Well History info").`);
    } catch (e) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  }

  // NEW: import ENTIRE selection (auto-paginate all pages)
  async function importEntireSelection() {
    setAutoBusy(true);
    setAutoCount(0);
    setAutoPages(0);
    try {
      await ensureSignedIn();
      const extent = await resolveExtent();

      let total = 0;
      let pageIndex = 0;

      // Loop pages until the server no longer reports exceededTransferLimit
      // or we receive an empty page.
      while (true) {
        const { features, exceeded: ex } = await fetchWellsPage({
          where,
          limit: 2000,
          offset: pageIndex * 2000,
          geometry: extent,
        });

        if (!features.length) break;

        const packaged = [];
        for (const r of features) {
          const ps = await fetchPayStratsByAPI(r.API_NUMBER);
          packaged.push(mapIsgsToWell(r, ps));
        }

        const count = await upsertWellsWithHistory(packaged);
        total += count;
        pageIndex += 1;
        setAutoCount(total);
        setAutoPages(pageIndex);

        if (!ex) break; // last page
        // brief pause to be nice to APIs
        await new Promise((res) => setTimeout(res, 150));
      }

      alert(`Imported/updated ${total} wells across ${pageIndex} page(s).`);
    } catch (e) {
      console.error(e);
      alert(`Import failed: ${e.message || e}`);
    } finally {
      setAutoBusy(false);
    }
  }

  useEffect(() => {
    // optional auto-search on mount
    // if (county && !apiLike && !fieldLike) runSearch(0);
  }, []);

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">ISGS -&gt; WellBuddy Importer</h1>
      <p className="text-sm opacity-80 mb-4">
        Search by County or Field (spatial) and/or API contains (attribute). Empty = statewide first page.
      </p>

      <div className="grid md:grid-cols-4 gap-3 mb-3">
        <input className="border rounded p-2" placeholder="County (e.g., WHITE)"
               value={county} onChange={e => setCounty(e.target.value)} />
        <input className="border rounded p-2" placeholder="API contains"
               value={apiLike} onChange={e => setApiLike(e.target.value)} />
        <input className="border rounded p-2" placeholder="Field contains"
               value={fieldLike} onChange={e => setFieldLike(e.target.value)} />
        <button className="rounded p-2 bg-black text-white"
                disabled={busy || autoBusy} onClick={() => runSearch(0)}>
          {busy ? "Searching..." : "Search"}
        </button>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <button className="rounded p-2 border" disabled={busy || page===0} onClick={() => runSearch(page-1)}>Prev</button>
        <span className="text-sm">Page {page+1}</span>
        <button className="rounded p-2 border" disabled={busy || !exceeded} onClick={() => runSearch(page+1)}>Next</button>
        <div className="ml-auto text-xs opacity-70">
          Up to 2,000 per page. Use filters to narrow results.
        </div>
      </div>

      <div className="rounded border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left p-2">API</th>
              <th className="text-left p-2">Status</th>
              <th className="text-left p-2">TD (ft)</th>
              <th className="text-left p-2">TD Formation</th>
              <th className="text-left p-2">Permit</th>
              <th className="text-left p-2">Completion</th>
              <th className="text-left p-2">Farm / No.</th>
              <th className="text-left p-2">Location</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r, i) => (
              <tr key={r.OBJECTID ?? (r.API_NUMBER ? `API_${r.API_NUMBER}` : `row_${page}_${i}`)} className="border-t">
                <td className="p-2">{r.API_NUMBER}</td>
                <td className="p-2">{r.STATUS_TEXT}</td>
                <td className="p-2">{r.TOTAL_DEPTH ?? ""}</td>
                <td className="p-2">{r.TDFMTEXT || r.TDFORMATION || ""}</td>
                <td className="p-2">{r.PERMIT_DATE ? new Date(r.PERMIT_DATE).toLocaleDateString() : "-"}</td>
                <td className="p-2">{r.COMP_DATE ? new Date(r.COMP_DATE).toLocaleDateString() : "-"}</td>
                <td className="p-2">{[r.FARM_NAME, r.FARM_NUM].filter(Boolean).join(" ")}</td>
                <td className="p-2">{r.LOCATION || "-"}</td>
              </tr>
            ))}
            {!results.length && (
              <tr><td className="p-4 text-center opacity-60" colSpan={8}>No results yet — run a search.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap gap-2 mt-3 items-center">
        <button className="rounded p-2 bg-emerald-600 text-white"
                disabled={busy || !results.length} onClick={importAllOnPage}>
          {busy ? "Importing..." : "Import THIS PAGE → Firestore"}
        </button>

        <button className="rounded p-2 bg-indigo-600 text-white"
                disabled={busy || autoBusy}
                onClick={importEntireSelection}>
          {autoBusy ? `Importing ALL… (${autoPages} page${autoPages===1?"":"s"}, ${autoCount} wells)` : "Import ENTIRE SELECTION (all pages)"}
        </button>

        <a className="text-xs underline opacity-70"
           href="https://maps.isgs.illinois.edu/arcgis/rest/services/ILOIL/Wells/MapServer/8"
           target="_blank" rel="noreferrer">Wells layer docs</a>
      </div>
    </div>
  );
}