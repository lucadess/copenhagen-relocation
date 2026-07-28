import { useState } from "react";
import { Plus, Trash2, Pencil, Check } from "lucide-react";
import Card from "../components/Card.jsx";
import { uid, formatDate, TASK_STATUS_OPTIONS, TASK_CATEGORIES, TASK_CATEGORY_COLORS, STATUS_STYLE } from "../lib/storage.js";

function initials(name) {
  if (!name) return "?";
  return name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

function isOverdue(t) {
  if (!t.deadline || t.status === "Done") return false;
  return new Date(t.deadline + "T23:59:59") < new Date();
}

export default function Tasks({ data, update }) {
  const [editingId, setEditingId] = useState(null);
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");

  function addTask() {
    const newId = uid();
    update({
      tasks: [...data.tasks, {
        id: newId, title: "New task", description: "", deadline: "", actor: "",
        category: TASK_CATEGORIES[0], status: "Open",
      }],
    });
    setStatusFilter("All");
    setCategoryFilter("All");
    setEditingId(newId);
  }
  function setTask(id, patch) {
    update({ tasks: data.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)) });
  }
  function removeTask(id) {
    update({ tasks: data.tasks.filter((t) => t.id !== id) });
    if (editingId === id) setEditingId(null);
  }

  const filtered = data.tasks
    .filter((t) => statusFilter === "All" || t.status === statusFilter)
    .filter((t) => categoryFilter === "All" || t.category === categoryFilter)
    .slice()
    .sort((a, b) => (a.deadline || "9999-99-99").localeCompare(b.deadline || "9999-99-99"));

  return (
    <div className="mt-page" style={{ "--accent": "var(--accent-tasks)" }}>
      <h1 className="mt-page-title">Tasks</h1>
      <p className="mt-page-intro">Keep the move organized — who's doing what, and by when.</p>

      <Card>
        <div className="mt-task-filters">
          <select className="mt-input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="All">All statuses</option>
            {TASK_STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className="mt-input" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="All">All categories</option>
            {TASK_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div style={{ marginTop: 12 }}>
          {filtered.map((t) => (
            <div
              key={t.id}
              className="mt-task-row"
              style={{ borderLeftColor: editingId === t.id ? "transparent" : TASK_CATEGORY_COLORS[t.category] }}
            >
              {editingId === t.id ? (
                <div style={{ width: "100%" }}>
                  <div className="mt-form-row">
                    <input className="mt-input" value={t.title} onChange={(e) => setTask(t.id, { title: e.target.value })} placeholder="Title" />
                    <input className="mt-input" value={t.actor} onChange={(e) => setTask(t.id, { actor: e.target.value })} placeholder="Actor" />
                  </div>
                  <div className="mt-form-row">
                    <textarea className="mt-input mt-textarea" value={t.description} onChange={(e) => setTask(t.id, { description: e.target.value })} placeholder="Description (optional)" />
                  </div>
                  <div className="mt-form-row">
                    <input className="mt-input" type="date" value={t.deadline} onChange={(e) => setTask(t.id, { deadline: e.target.value })} />
                    <select className="mt-input" value={t.category} onChange={(e) => setTask(t.id, { category: e.target.value })}>
                      {TASK_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <select className="mt-input" value={t.status} onChange={(e) => setTask(t.id, { status: e.target.value })}>
                      {TASK_STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="mt-card-actions" style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                    <button className="mt-icon-btn" onClick={() => setEditingId(null)}><Check size={15} /></button>
                    <button className="mt-icon-btn" onClick={() => removeTask(t.id)}><Trash2 size={15} /></button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mt-task-header">
                    <span className="mt-actor-badge" style={{ background: TASK_CATEGORY_COLORS[t.category] }}>{initials(t.actor)}</span>
                    <div className="mt-task-main">
                      <div className="mt-task-title">{t.title}</div>
                      {t.description && <div className="mt-task-desc">{t.description}</div>}
                    </div>
                  </div>
                  <div className="mt-task-meta">
                    <span
                      className="mt-badge"
                      style={{ background: `color-mix(in srgb, ${TASK_CATEGORY_COLORS[t.category]} 18%, white)`, color: TASK_CATEGORY_COLORS[t.category] }}
                    >
                      {t.category}
                    </span>
                    <span className="mt-badge" style={{ background: STATUS_STYLE[t.status].bg, color: STATUS_STYLE[t.status].fg }}>{t.status}</span>
                    <span className={"mt-task-deadline" + (isOverdue(t) ? " overdue" : "")}>{formatDate(t.deadline)}</span>
                    <div className="mt-task-actions">
                      <button className="mt-icon-btn" onClick={() => setEditingId(t.id)}><Pencil size={14} /></button>
                      <button className="mt-icon-btn" onClick={() => removeTask(t.id)}><Trash2 size={14} /></button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
          {filtered.length === 0 && <div className="mt-empty">No tasks match these filters.</div>}
        </div>
      </Card>
      <button className="mt-btn primary" onClick={addTask}><Plus size={14} /> Add task</button>
    </div>
  );
}
