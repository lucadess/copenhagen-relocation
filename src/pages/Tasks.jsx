import { useState } from "react";
import { Plus, Trash2, Pencil, Check } from "lucide-react";
import Card from "../components/Card.jsx";
import { uid, formatDateRange, TASK_STATUS_OPTIONS, TASK_CATEGORIES, TASK_CATEGORY_COLORS, TASK_ACTORS, TASK_ACTOR_INITIALS, STATUS_STYLE } from "../lib/storage.js";

function initials(name) {
  if (!name) return "?";
  if (TASK_ACTOR_INITIALS[name]) return TASK_ACTOR_INITIALS[name];
  return name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

function isOverdue(t) {
  if (!t.deadline || t.status === "Done") return false;
  return new Date(t.deadline + "T23:59:59") < new Date();
}

function TaskForm({ draft, onChange, onConfirm, onDelete }) {
  return (
    <div style={{ width: "100%" }}>
      <div className="mt-form-row">
        <input className="mt-input" value={draft.title} onChange={(e) => onChange({ title: e.target.value })} placeholder="Title" />
        <select className="mt-input" value={draft.actor} onChange={(e) => onChange({ actor: e.target.value })}>
          <option value="">Unassigned</option>
          {TASK_ACTORS.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>
      <div className="mt-form-row">
        <textarea className="mt-input mt-textarea" value={draft.description} onChange={(e) => onChange({ description: e.target.value })} placeholder="Description (optional)" />
      </div>
      <div className="mt-form-row">
        <div style={{ flex: 1 }}>
          <label className="mt-field-label">Start date (optional)</label>
          <input className="mt-input" type="date" value={draft.startDate || ""} onChange={(e) => onChange({ startDate: e.target.value })} />
        </div>
        <div style={{ flex: 1 }}>
          <label className="mt-field-label">Deadline</label>
          <input className="mt-input" type="date" value={draft.deadline} onChange={(e) => onChange({ deadline: e.target.value })} />
        </div>
      </div>
      <div className="mt-form-row">
        <select className="mt-input" value={draft.category} onChange={(e) => onChange({ category: e.target.value })}>
          {TASK_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="mt-input" value={draft.status} onChange={(e) => onChange({ status: e.target.value })}>
          {TASK_STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div className="mt-card-actions" style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button className="mt-icon-btn" onClick={onConfirm}><Check size={15} /></button>
        <button className="mt-icon-btn" onClick={onDelete}><Trash2 size={15} /></button>
      </div>
    </div>
  );
}

export default function Tasks({ data, update, authed, showUndo }) {
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState(null);
  const [isNew, setIsNew] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");

  function stopEditing() {
    setEditingId(null);
    setDraft(null);
    setIsNew(false);
  }

  function startEdit(t) {
    setEditingId(t.id);
    setDraft({ ...t });
    setIsNew(false);
  }
  function addTask() {
    const newId = uid();
    setEditingId(newId);
    setIsNew(true);
    setDraft({
      id: newId, title: "New task", description: "", startDate: "", deadline: "", actor: "",
      category: TASK_CATEGORIES[0], status: "Open",
    });
    setStatusFilter("All");
    setCategoryFilter("All");
  }
  function changeDraft(patch) {
    setDraft((d) => ({ ...d, ...patch }));
  }
  function confirmEdit() {
    const ok = isNew
      ? update({ tasks: [...data.tasks, draft] })
      : update({ tasks: data.tasks.map((t) => (t.id === editingId ? draft : t)) });
    if (ok) stopEditing();
  }
  function removeTask(id) {
    if (isNew && editingId === id) {
      stopEditing();
      return;
    }
    const removed = data.tasks.find((t) => t.id === id);
    const ok = update({ tasks: data.tasks.filter((t) => t.id !== id) });
    if (ok && removed) {
      showUndo?.(`"${removed.title}" deleted`, () => {
        update((current) => ({ tasks: [...current.tasks, removed] }));
      });
    }
    if (editingId === id) stopEditing();
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

      {authed && <button className="mt-btn primary" onClick={addTask}><Plus size={14} /> Add task</button>}

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
          {isNew && draft && (
            <div className="mt-task-row" style={{ borderLeftColor: "transparent" }}>
              <TaskForm draft={draft} onChange={changeDraft} onConfirm={confirmEdit} onDelete={() => removeTask(draft.id)} />
            </div>
          )}

          {filtered.map((t) => {
            const isEditingThis = editingId === t.id && !isNew;
            return (
              <div
                key={t.id}
                className="mt-task-row"
                style={{ borderLeftColor: isEditingThis ? "transparent" : TASK_CATEGORY_COLORS[t.category] }}
              >
                {isEditingThis ? (
                  <TaskForm draft={draft} onChange={changeDraft} onConfirm={confirmEdit} onDelete={() => removeTask(t.id)} />
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
                      <span className={"mt-task-deadline" + (isOverdue(t) ? " overdue" : "")}>{formatDateRange(t.startDate, t.deadline)}</span>
                      {authed && (
                        <div className="mt-task-actions">
                          <button className="mt-icon-btn" onClick={() => startEdit(t)}><Pencil size={14} /></button>
                          <button className="mt-icon-btn" onClick={() => removeTask(t.id)}><Trash2 size={14} /></button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
          {filtered.length === 0 && !isNew && <div className="mt-empty">No tasks match these filters.</div>}
        </div>
      </Card>
    </div>
  );
}
