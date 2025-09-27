import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { db, auth, ensureAnonSignIn } from "../../../shared/firebase.js";
import { getProfile } from "../../profile/lib/profile.js";
import { getWells } from "../../wells/lib/storage.js";
import {
  collection, addDoc, serverTimestamp, onSnapshot,
  query, where, orderBy, limit, updateDoc, deleteDoc, doc
} from "firebase/firestore";

function orgSlug(name) {
  const s = (name || "public").toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return s.replace(/(^-|-$)/g, "") || "public";
}
function makeChannelId(kind, wellId) {
  return kind === "well" && wellId ? `well:${wellId}` : "org";
}

export default function Board() {
  const profile = getProfile();
  const orgId = orgSlug(profile.companyName);
  const loc = useLocation();

  const wells = useMemo(() => getWells(), []);
  const [user, setUser] = useState(null);
  const [name, setName] = useState(localStorage.getItem("wb_board_name") || "");
  const [text, setText] = useState("");

  // channel selection
  const urlWell = new URLSearchParams(loc.search).get("well") || "";
  const [mode, setMode] = useState(urlWell ? "well" : "org");   // "org" | "well"
  const [wellId, setWellId] = useState(urlWell || (wells[0]?.id || ""));
  const channelId = makeChannelId(mode, wellId);


  // subscribe last 100 for this org (client-filter by channel)
  const [rows, setRows] = useState([]);
  useEffect(() => {
    const qy = query(
      collection(db, "messages"),
      where("orgId", "==", orgId),
      orderBy("createdAt", "desc"),
      limit(100)
    );
    const unsub = onSnapshot(qy, snap => {
      const arr = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setRows(arr);
    });
    return unsub;
  }, [orgId]);

  // filter & sort (pinned first, then newest)
  const msgs = useMemo(() => {
    const filtered = rows.filter(m => (m.channelId || "org") === channelId);
    const withTime = filtered.map(m => ({
      ...m,
      _ts: m.createdAt?.toDate ? m.createdAt.toDate().getTime() : 0
    }));
    withTime.sort((a, b) => {
      const ap = !!a.pinned, bp = !!b.pinned;
      if (ap !== bp) return ap ? -1 : 1;
      return b._ts - a._ts;
    });
    return withTime;
  }, [rows, channelId]);

  async function post(e) {
    e.preventDefault();
    const body = text.trim();
    const display = (name || "").trim() || "Anon";
    if (!body) return;
    localStorage.setItem("wb_board_name", display);
    const u = auth.currentUser || await ensureAnonSignIn();
    await addDoc(collection(db, "messages"), {
      orgId,
      channelId,          // "org" or "well:<id>"
      wellId: mode === "well" ? wellId : "",
      body,
      authorId: u.uid,
      authorName: display,
      createdAt: serverTimestamp(),
      pinned: false
    });
    setText("");
  }

  async function pinToggle(m) {
    const u = auth.currentUser || await ensureAnonSignIn();
    if (!u) return;
    await updateDoc(doc(db, "messages", m.id), { pinned: !m.pinned });
  }

  async function remove(m) {
    const u = auth.currentUser;
    if (!u || u.uid !== m.authorId) return alert("You can only delete your own message.");
    if (!confirm("Delete this message?")) return;
    await deleteDoc(doc(db, "messages", m.id));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Message Board</h2>
        <div className="text-xs opacity-70">
          Org: <b>{orgId}</b> · Channel: <b>{channelId}</b> (last 100)
        </div>
      </div>

      {/* Channel picker */}
      <div className="card flex flex-col gap-2 sm:flex-row sm:items-center">
        <label className="flex items-center gap-2">
          <input type="radio" name="mode" value="org"
            checked={mode === "org"} onChange={() => setMode("org")} />
          Company-wide
        </label>
        <label className="flex items-center gap-2">
          <input type="radio" name="mode" value="well"
            checked={mode === "well"} onChange={() => setMode("well")} />
          Per Well
        </label>
        {mode === "well" && (
          <select className="border rounded-md px-2 py-1"
            value={wellId} onChange={(e)=>setWellId(e.target.value)}>
            {wells.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        )}
      </div>

      {/* Composer */}
      <form onSubmit={post} className="card flex flex-col sm:flex-row gap-2">
        <input className="border rounded-md px-3 py-2 w-full sm:w-56"
          placeholder="Your name" maxLength={40}
          value={name} onChange={(e)=>setName(e.target.value)} />
        <input className="border rounded-md px-3 py-2 flex-1"
          placeholder="Ask a question or leave a note… (max 500 chars)" maxLength={500}
          value={text} onChange={(e)=>setText(e.target.value)} />
        <button className="btn btn-primary">Post</button>
      </form>

      {/* Messages */}
      <div className="space-y-2">
        {msgs.map(m => (
          <div key={m.id} className={`card ${m.pinned ? "ring-2 ring-amber-400" : ""}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-semibold truncate">
                  {m.authorName || "Anon"}
                </div>
                <div className="text-xs opacity-70">
                  {m.createdAt?.toDate ? m.createdAt.toDate().toLocaleString() : "…"}
                  {m.wellId ? <> · Well: <b>{m.wellId}</b></> : null}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button className="btn btn-outline btn-xs" onClick={() => pinToggle(m)}>
                  {m.pinned ? "Unpin" : "Pin"}
                </button>
                {auth.currentUser?.uid === m.authorId && (
                  <button className="btn btn-outline btn-xs" onClick={() => remove(m)}>
                    Delete
                  </button>
                )}
              </div>
            </div>
            <div className="mt-2 whitespace-pre-wrap break-words">{m.body}</div>
          </div>
        ))}
        {!msgs.length && <div className="card opacity-70">No messages yet.</div>}
      </div>
    </div>
  );
}