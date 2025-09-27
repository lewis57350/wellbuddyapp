import React, { useEffect, useState } from "react";

// Tries Yahoo Finance for CL=F (WTI front month). If blocked by CORS/network,
// shows a simple fallback link so the widget never “breaks”.

export default function OilPriceWidget() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  async function fetchYahoo() {
    // Yahoo: public JSON; often CORS-friendly in dev.
    const url = "https://query1.finance.yahoo.com/v7/finance/quote?symbols=CL%3DF";
    const res = await fetch(url);
    if (!res.ok) throw new Error("HTTP " + res.status);
    const j = await res.json();
    const q = j?.quoteResponse?.result?.[0];
    if (!q) throw new Error("No quote");
    return {
      price: q.regularMarketPrice,
      changePct: q.regularMarketChangePercent,
      time: q.regularMarketTime ? new Date(q.regularMarketTime * 1000) : new Date(),
      symbol: "CL=F",
      source: "Yahoo Finance",
    };
  }

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const d = await fetchYahoo();
      setData(d);
    } catch (e) {
      setErr(String(e?.message || e));
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 5 * 60 * 1000); // refresh every 5 min
    return () => clearInterval(t);
  }, []);

  if (loading) return <div className="text-sm text-gray-600">Loading WTI…</div>;

  if (!data) {
    return (
      <div className="text-sm">
        <div className="text-gray-700 mb-2">Couldn’t load live price (likely CORS).</div>
        <a
          href="https://bipetro.com/oil-pricing"
          target="_blank"
          rel="noreferrer"
          className="btn btn-outline btn-xs"
        >
          Open live chart
        </a>
      </div>
    );
  }

  const up = (data.changePct ?? 0) >= 0;

  return (
    <div className="flex items-end justify-between">
      <div>
        <div className="text-xs uppercase opacity-70">WTI Crude (CL=F)</div>
        <div className="text-2xl font-extrabold">{Number(data.price).toFixed(2)}</div>
        <div className={`text-sm ${up ? "text-emerald-600" : "text-red-600"}`}>
          {up ? "▲" : "▼"} {Math.abs(Number(data.changePct || 0)).toFixed(2)}%
        </div>
        <div className="text-xs opacity-60 mt-1">
          {data.source} · {data.time.toLocaleString()}
        </div>
      </div>
      <button className="btn btn-outline btn-xs" onClick={load}>Refresh</button>
    </div>
  );
}