// src/features/board/pages/Board.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { db, auth } from "../../../shared/firebase.js";
import { signInAnonymously } from "firebase/auth";
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
  updateDoc,
  deleteDoc,
  doc,
  limit as qLimit,
} from "firebase/firestore";
import { getProfile } from "../../profile/lib/profile.js";
import { getWells } from "../../wells/lib/storage.js";

function useQueryParam() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

async function ensureAnon() {
  try {
    if (auth.currentUser) return auth.currentUser;
    const cred = await signInAnonymously(auth);
    return cred.user ?? null;
  } catch (e) {
    console.warn("Anonymous sign-in failed:", e);
    return null;
  }
}

export default function Board() {
  const wells = useMemo(() => getWells(), []);
  const qp = useQueryParam();
  const initialChannel = qp.get("channel") || "general";

  const [channel, setChannel] = useState(initialChannel);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);

  const myProfile = getProfile(); // {companyName, displayName, logoUrl, ...}

  // Live subscription (download latest 200; we filter channel on client to avoid Firestore index requirement)
  useEffect(() => {
    const q = query(
      collection(db, "boardMessages"),
      orderBy("createdAt", "desc"),
      qLimit(200)
    );
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  // Sign in (anonymous) once so we can write
  useEffect(() => {
    ensureAnon();
  }, []);

  const visible = useMemo(() => {
    const list = messages.filter((m) => (m.channel || "general") === channel);
    const pinned = list.filter((m) => !!m.pinned);
    const regular = list.filter((m) => !m.pinned);
    return [...pinned, ...regular];
  }, [messages, channel]);

  async function postMessage(e) {
    e?.preventDefault?.();
    if (!text.trim()) return;
    setPosting(true);
    try {
      await ensureAnon();
      const user = auth.currentUser;
      await addDoc(collection(db, "boardMessages"), {
        text: text.trim(),
        channel,
        pinned: false,
        createdAt: serverTimestamp(),
        byUid: user?.uid || null,
        byName:
          myProfile?.displayName ||
          myProfile?.companyName ||
          "Anonymous",
        company: myProfile?.companyName || null,
        wellId: channel.startsWith("well:") ? channel.slice(5) : null,
      });
      setText("");
    } catch (err) {
      alert("Failed to post message. Check console.");
      console.error(err);
    } finally {
      setPosting(false);
    }
  }

  async function togglePin(m) {
    try {
      await updateDoc(doc(db, "boardMessages", m.id), { pinned: !m.pinned });
    } catch (e) {
      console.error(e);
      alert("Could not toggle pin.");
    }
  }

  async function remove(m) {
    if (!confirm("Delete this message?")) return;
    try {
      await deleteDoc(doc(db, "boardMessages", m.id));
    } catch (e) {
      console.error(e);
      alert("Could not delete.");
    }
  }

  const allChannels = useMemo(() => {
    const base = [{ id: "general", label: "General (Company-wide)" }];
    const wellCh = wells.map((w) => ({
      id: `well:${w.id}`,
      label: `Well • ${w.name}`,
    }));
    return [...base, ...wellCh];
  }, [wells]);

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex items-center gap-2">
          <div className="font-semibold">Message Board</div>
          {myProfile?.companyName && (
            <div className="text-sm text-gray-600">
              · {myProfile.companyName}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm">Channel:</label>
          <select
            className="border rounded-md px-2 py-1 text-sm"
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
          >
            {allChannels.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </header>

      <form onSubmit={postMessage} className="card space-y-2">
        <div className="font-medium">Ask a question / Leave a message</div>
        <textarea
          rows={3}
          className="w-full border rounded-md px-3 py-2"
          placeholder="Type your message…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500">
            Posting as:{" "}
            {myProfile?.displayName ||
              myProfile?.companyName ||
              "Anonymous"}
          </div>
          <button className="btn btn-primary" disabled={posting}>
            {posting ? "Posting…" : "Post"}
          </button>
        </div>
      </form>

      <section className="card">
        <div className="font-medium mb-2">Messages</div>
        {visible.length === 0 ? (
          <div className="text-sm text-gray-600">No messages yet.</div>
        ) : (
          <ul className="space-y-2">
            {visible.map((m) => (
              <li
                key={m.id}
                className={`border rounded-md p-3 text-sm ${
                  m.pinned ? "bg-yellow-50 dark:bg-yellow-900/20" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium break-words whitespace-pre-wrap">
                      {m.text}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {m.byName || "Anonymous"} ·{" "}
                      {m.createdAt?.toDate
                        ? m.createdAt.toDate().toLocaleString()
                        : "pending…"}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      className="btn btn-outline btn-xs"
                      onClick={() => togglePin(m)}
                      title={m.pinned ? "Unpin" : "Pin"}
                    >
                      {m.pinned ? "Unpin" : "Pin"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline btn-xs"
                      onClick={() => remove(m)}
                      title="Delete"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
