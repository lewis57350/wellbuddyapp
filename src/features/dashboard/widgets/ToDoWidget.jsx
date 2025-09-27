import React, { useEffect, useMemo, useState } from "react";

const KEY = "wb_todos";

export default function TodoWidget() {
  const [items, setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
  });
  const [text, setText] = useState("");

  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(items)); }, [items]);

  function addItem(e) {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    setItems((xs) => [{ id: "t-" + Date.now(), text: t, done: false }, ...xs]);
    setText("");
  }
  function toggle(id) {
    setItems((xs) => xs.map((x) => x.id === id ? { ...x, done: !x.done } : x));
  }
  function remove(id) {
    setItems((xs) => xs.filter((x) => x.id !== id));
  }
  function clearDone() {
    setItems((xs) => xs.filter((x) => !x.done));
  }

  const remaining = useMemo(() => items.filter(x => !x.done).length, [items]);

  return (
    <div>
      <form onSubmit={addItem} className="flex gap-2">
        <input
          className="border rounded-md px-3 py-2 flex-1"
          placeholder="New task…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button className="btn btn-primary">Add</button>
      </form>

      <ul className="mt-3 space-y-2">
        {items.map((x) => (
          <li key={x.id} className="flex items-center gap-2">
            <input type="checkbox" checked={x.done} onChange={() => toggle(x.id)} />
            <span className={`flex-1 ${x.done ? "line-through opacity-60" : ""}`}>{x.text}</span>
            <button className="btn btn-outline btn-xs" onClick={() => remove(x.id)}>Delete</button>
          </li>
        ))}
        {items.length === 0 && <li className="text-sm text-gray-600">No tasks yet.</li>}
      </ul>

      {items.some(x => x.done) && (
        <div className="mt-3">
          <button className="btn btn-outline btn-xs" onClick={clearDone}>Clear completed</button>
        </div>
      )}

      <div className="mt-2 text-xs opacity-70">{remaining} open</div>
    </div>
  );
}