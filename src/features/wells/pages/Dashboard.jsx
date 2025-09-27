import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { seedIfEmpty } from "../lib/storage.js";
import {
  getDashboard,
  saveDashboard,
  resetDashboard,
  setTheme,
} from "../../dashboard/lib/dashStorage.js";
import { WIDGETS, WIDGET_MAP } from "../../dashboard/widgets/registry.js";

import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export default function Dashboard() {
  const [cfg, setCfg] = useState(() => getDashboard());
  const [editing, setEditing] = useState(false);

  // Ensure demo wells exist on first load (safe no-op if already present)
  useEffect(() => { seedIfEmpty(); }, []);

  // Apply dark mode class based on cfg.theme
  useEffect(() => {
    const root = document.documentElement;
    if (cfg?.theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
  }, [cfg?.theme]);

  const items = Array.isArray(cfg?.widgets) ? cfg.widgets : [];

  function onDragEnd(event) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.indexOf(active.id);
    const newIndex = items.indexOf(over.id);
    if (oldIndex === -1 || newIndex === -1) return; // safety guard

    const reordered = arrayMove(items, oldIndex, newIndex);
    const next = { ...cfg, widgets: reordered };
    setCfg(next);
    saveDashboard(next);
  }

  function removeWidget(id) {
    const next = { ...cfg, widgets: items.filter((w) => w !== id) };
    setCfg(next);
    saveDashboard(next);
  }

  function addWidget(id) {
    if (items.includes(id)) return;
    const next = { ...cfg, widgets: [...items, id] };
    setCfg(next);
    saveDashboard(next);
  }

  function reset() {
    const def = resetDashboard();
    setCfg(def);
  }

  const availableToAdd = WIDGETS.filter((w) => !items.includes(w.id));

  return (
    <div className="space-y-4">
      {/* Header actions */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          className="btn btn-outline"
          onClick={() => {
            const next = setTheme(cfg?.theme === "dark" ? "light" : "dark");
            setCfg(next);
          }}
        >
          Theme: {cfg?.theme === "dark" ? "Dark 🌙" : "Light ☀️"}
        </button>

        <button className="btn btn-outline" onClick={() => setEditing((v) => !v)}>
          {editing ? "Done" : "Customize"}
        </button>

        <Link to="/well/add" className="btn btn-primary">
          Add Well
        </Link>
      </div>

      {/* Widgets grid with drag & drop */}
      <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={items} strategy={verticalListSortingStrategy}>
          {items.length === 0 ? (
            <div className="card">
              <div className="font-medium mb-2">No widgets yet</div>
              <div className="text-sm text-gray-600">
                Click <b>Customize</b> below to add widgets to your dashboard.
              </div>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {items.map((id) => (
                <SortableItem key={id} id={id} disabled={!editing}>
                  {(attrs, listeners, style, isDragging) => (
                    <WidgetCard
                      id={id}
                      title={WIDGET_MAP[id]?.title || id}
                      editing={editing}
                      onRemove={() => removeWidget(id)}
                      dragAttrs={attrs}
                      dragListeners={listeners}
                      dragging={isDragging}
                      style={style}
                    >
                      {WIDGET_MAP[id]?.component ? (
                        React.createElement(WIDGET_MAP[id].component)
                      ) : (
                        <div className="text-sm text-gray-600">Unknown widget</div>
                      )}
                    </WidgetCard>
                  )}
                </SortableItem>
              ))}
            </div>
          )}
        </SortableContext>
      </DndContext>

      {/* Add widgets palette */}
      {editing && (
        <div className="card mt-2">
          <div className="font-medium mb-2">Add Widgets</div>
          {availableToAdd.length === 0 ? (
            <div className="text-sm text-gray-600">All widgets are on the board.</div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {availableToAdd.map((w) => (
                <button
                  key={w.id}
                  className="btn btn-outline text-sm"
                  onClick={() => addWidget(w.id)}
                >
                  + {w.title}
                </button>
              ))}
            </div>
          )}

          <div className="mt-3">
            <button className="btn btn-outline text-sm" onClick={reset}>
              Reset to default
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* === Sortable item wrapper === */
function SortableItem({ id, children, disabled }) {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } =
    useSortable({ id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style}>
      {children(attributes, listeners, style, isDragging)}
    </div>
  );
}

/* === Unified widget card shell === */
function WidgetCard({
  id,
  title,
  children,
  editing,
  onRemove,
  dragAttrs,
  dragListeners,
  dragging,
  style,
}) {
  return (
    <section className={`card ${dragging ? "ring-2 ring-blue-500" : ""}`} style={style}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {editing && (
            <button
              type="button"
              title="Drag to reorder"
              className="inline-flex h-7 w-7 items-center justify-center rounded-md border bg-white text-gray-500 hover:text-gray-700 cursor-grab active:cursor-grabbing"
              {...dragAttrs}
              {...dragListeners}
            >
              ☰
            </button>
          )}
          <div className="text-sm font-bold tracking-wide uppercase text-ink">{title}</div>
        </div>

        {editing && (
          <button type="button" className="btn btn-outline text-xs" onClick={onRemove}>
            Remove
          </button>
        )}
      </div>

      {children}
    </section>
  );
}
