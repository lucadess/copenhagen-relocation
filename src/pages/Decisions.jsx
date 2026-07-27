import { useState } from "react";
import { Plus, Trash2, Pencil, Check, Circle, CheckCircle2 } from "lucide-react";
import Card from "../components/Card.jsx";
import { uid, formatDate, DECISION_STATUS_OPTIONS, STATUS_STYLE } from "../lib/storage.js";

export default function Decisions({ data, update }) {
  const [editingId, setEditingId] = useState(null);

  function set(id, patch) {
    update({ decisions: data.decisions.map((d) => (d.id === id ? { ...d, ...patch } : d)) });
  }
  function add() {
    const newId = uid();
    update({
      decisions: [...data.decisions, {
        id: newId, title: "New decision", deadline: "", status: "Open",
        options: [{ id: uid(), text: "Option A" }, { id: uid(), text: "Option B" }], finalDecisionId: null, notes: "",
      }],
    });
    setEditingId(newId);
  }
  function remove(id) {
    update({ decisions: data.decisions.filter((d) => d.id !== id) });
    if (editingId === id) setEditingId(null);
  }
  function addOption(d) {
    set(d.id, { options: [...d.options, { id: uid(), text: "New option" }] });
  }
  function setOption(d, optId, text) {
    set(d.id, { options: d.options.map((o) => (o.id === optId ? { ...o, text } : o)) });
  }
  function removeOption(d, optId) {
    set(d.id, {
      options: d.options.filter((o) => o.id !== optId),
      finalDecisionId: d.finalDecisionId === optId ? null : d.finalDecisionId,
    });
  }

  return (
    <div className="mt-page" style={{ "--accent": "var(--accent-decisions)" }}>
      <h1 className="mt-page-title">Decisions</h1>
      <p className="mt-page-intro">Compare your options side by side, mark the final call once you make it.</p>

      <div className="mt-stack" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {data.decisions.map((d) => (
          <Card key={d.id} className="mt-decision-card">
            {editingId === d.id ? (
              <>
                <div className="mt-form-row">
                  <input className="mt-input mt-input-strong" value={d.title} onChange={(e) => set(d.id, { title: e.target.value })} />
                </div>
                <div className="mt-form-row">
                  <div>
                    <label className="mt-field-label">Deadline</label>
                    <input className="mt-input" type="date" value={d.deadline} onChange={(e) => set(d.id, { deadline: e.target.value })} />
                  </div>
                  <div>
                    <label className="mt-field-label">Status</label>
                    <select className="mt-input" value={d.status} onChange={(e) => set(d.id, { status: e.target.value })}>
                      {DECISION_STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="mt-field-label">Options, pick the final decision</label>
                  {d.options.map((o) => (
                    <div key={o.id} className="mt-option-row" style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <input type="radio" name={"decision-" + d.id} checked={d.finalDecisionId === o.id} onChange={() => set(d.id, { finalDecisionId: o.id })} />
                      <input className="mt-input" value={o.text} onChange={(e) => setOption(d, o.id, e.target.value)} />
                      <button className="mt-icon-btn" onClick={() => removeOption(d, o.id)}><Trash2 size={13} /></button>
                    </div>
                  ))}
                  <button className="mt-add-link" onClick={() => addOption(d)} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--muted)", background: "none", border: "none", cursor: "pointer", padding: "6px 0" }}><Plus size={13} /> Add option</button>
                </div>
                <div>
                  <label className="mt-field-label">Notes</label>
                  <textarea className="mt-input mt-textarea" value={d.notes} onChange={(e) => set(d.id, { notes: e.target.value })} />
                </div>
                <div className="mt-card-actions" style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 6 }}>
                  <button className="mt-icon-btn" onClick={() => setEditingId(null)}><Check size={15} /></button>
                  <button className="mt-icon-btn" onClick={() => remove(d.id)}><Trash2 size={15} /></button>
                </div>
              </>
            ) : (
              <>
                <div className="mt-decision-head">
                  <h2 className="mt-decision-title">{d.title}</h2>
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    <button className="mt-icon-btn" onClick={() => setEditingId(d.id)}><Pencil size={14} /></button>
                    <button className="mt-icon-btn" onClick={() => remove(d.id)}><Trash2 size={14} /></button>
                  </div>
                </div>
                <div className="mt-decision-badges">
                  <span className="mt-badge">{formatDate(d.deadline)}</span>
                  <span className="mt-badge" style={{ background: STATUS_STYLE[d.status].bg, color: STATUS_STYLE[d.status].fg }}>{d.status}</span>
                </div>
                <div className="mt-option-grid">
                  {d.options.map((o) => (
                    <button
                      type="button"
                      key={o.id}
                      className={"mt-option-chip" + (d.finalDecisionId === o.id ? " chosen" : "")}
                      onClick={() => set(d.id, { finalDecisionId: o.id })}
                    >
                      {d.finalDecisionId === o.id ? <CheckCircle2 size={15} color="var(--accent)" /> : <Circle size={15} color="#D8D3CC" />}
                      {o.text}
                    </button>
                  ))}
                </div>
                {d.notes && <div className="mt-decision-notes">{d.notes}</div>}
              </>
            )}
          </Card>
        ))}
      </div>
      <button className="mt-btn primary" onClick={add}><Plus size={14} /> Add decision</button>
    </div>
  );
}
