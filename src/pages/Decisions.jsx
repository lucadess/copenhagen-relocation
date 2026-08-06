import { useState } from "react";
import { Plus, Trash2, Pencil, Check, Circle, CheckCircle2 } from "lucide-react";
import Card from "../components/Card.jsx";
import { uid, formatDate, DECISION_STATUS_OPTIONS, STATUS_STYLE } from "../lib/storage.js";

function DecisionForm({ draft, onChange, onAddOption, onOptionText, onRemoveOption, onConfirm, onDelete }) {
  return (
    <>
      <div className="mt-form-row">
        <input className="mt-input mt-input-strong" value={draft.title} onChange={(e) => onChange({ title: e.target.value })} />
      </div>
      <div className="mt-form-row">
        <div>
          <label className="mt-field-label">Deadline</label>
          <input className="mt-input" type="date" value={draft.deadline} onChange={(e) => onChange({ deadline: e.target.value })} />
        </div>
        <div>
          <label className="mt-field-label">Status</label>
          <select className="mt-input" value={draft.status} onChange={(e) => onChange({ status: e.target.value })}>
            {DECISION_STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="mt-field-label">Options, pick the final decision</label>
        {draft.options.map((o) => (
          <div key={o.id} className="mt-option-row" style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <input type="radio" name={"decision-" + draft.id} checked={draft.finalDecisionId === o.id} onChange={() => onChange({ finalDecisionId: o.id })} />
            <input className="mt-input" value={o.text} onChange={(e) => onOptionText(o.id, e.target.value)} />
            <button className="mt-icon-btn" onClick={() => onRemoveOption(o.id)}><Trash2 size={13} /></button>
          </div>
        ))}
        <button className="mt-add-link" onClick={onAddOption} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--muted)", background: "none", border: "none", cursor: "pointer", padding: "6px 0" }}><Plus size={13} /> Add option</button>
      </div>
      <div>
        <label className="mt-field-label">Notes</label>
        <textarea className="mt-input mt-textarea" value={draft.notes} onChange={(e) => onChange({ notes: e.target.value })} />
      </div>
      <div className="mt-card-actions" style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 6 }}>
        <button className="mt-icon-btn" onClick={onConfirm}><Check size={15} /></button>
        <button className="mt-icon-btn" onClick={onDelete}><Trash2 size={15} /></button>
      </div>
    </>
  );
}

export default function Decisions({ data, update, authed, showUndo }) {
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState(null);
  const [isNew, setIsNew] = useState(false);

  function stopEditing() {
    setEditingId(null);
    setDraft(null);
    setIsNew(false);
  }

  function startEdit(d) {
    setEditingId(d.id);
    setDraft({ ...d, options: d.options.map((o) => ({ ...o })) });
    setIsNew(false);
  }
  function add() {
    const newId = uid();
    setEditingId(newId);
    setIsNew(true);
    setDraft({
      id: newId, title: "New decision", deadline: "", status: "Open",
      options: [{ id: uid(), text: "Option A" }, { id: uid(), text: "Option B" }], finalDecisionId: null, notes: "",
    });
  }
  function changeDraft(patch) {
    setDraft((d) => ({ ...d, ...patch }));
  }
  function addOptionDraft() {
    changeDraft({ options: [...draft.options, { id: uid(), text: "New option" }] });
  }
  function setOptionTextDraft(optId, text) {
    changeDraft({ options: draft.options.map((o) => (o.id === optId ? { ...o, text } : o)) });
  }
  function removeOptionDraft(optId) {
    changeDraft({
      options: draft.options.filter((o) => o.id !== optId),
      finalDecisionId: draft.finalDecisionId === optId ? null : draft.finalDecisionId,
    });
  }
  function confirmEdit() {
    const ok = isNew
      ? update({ decisions: [...data.decisions, draft] })
      : update({ decisions: data.decisions.map((d) => (d.id === editingId ? draft : d)) });
    if (ok) stopEditing();
  }
  function remove(id) {
    if (isNew && editingId === id) {
      stopEditing();
      return;
    }
    const removed = data.decisions.find((d) => d.id === id);
    const ok = update({ decisions: data.decisions.filter((d) => d.id !== id) });
    if (ok && removed) {
      showUndo?.(`"${removed.title}" deleted`, () => {
        update((current) => ({ decisions: [...current.decisions, removed] }));
      });
    }
    if (editingId === id) stopEditing();
  }
  function selectFinal(d, optId) {
    update({ decisions: data.decisions.map((x) => (x.id === d.id ? { ...x, finalDecisionId: optId } : x)) });
  }

  const sortedDecisions = [...data.decisions].sort(
    (a, b) => (a.deadline || "9999-99-99").localeCompare(b.deadline || "9999-99-99")
  );

  return (
    <div className="mt-page" style={{ "--accent": "var(--accent-decisions)" }}>
      <h1 className="mt-page-title">Decisions</h1>
      <p className="mt-page-intro">Compare your options side by side, mark the final call once you make it.</p>

      {authed && <button className="mt-btn primary" onClick={add}><Plus size={14} /> Add decision</button>}

      <div className="mt-stack" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {isNew && draft && (
          <Card className="mt-decision-card">
            <DecisionForm
              draft={draft}
              onChange={changeDraft}
              onAddOption={addOptionDraft}
              onOptionText={setOptionTextDraft}
              onRemoveOption={removeOptionDraft}
              onConfirm={confirmEdit}
              onDelete={() => remove(draft.id)}
            />
          </Card>
        )}

        {sortedDecisions.map((d) => {
          const isEditingThis = editingId === d.id && !isNew;
          return (
            <Card key={d.id} className="mt-decision-card">
              {isEditingThis ? (
                <DecisionForm
                  draft={draft}
                  onChange={changeDraft}
                  onAddOption={addOptionDraft}
                  onOptionText={setOptionTextDraft}
                  onRemoveOption={removeOptionDraft}
                  onConfirm={confirmEdit}
                  onDelete={() => remove(d.id)}
                />
              ) : (
                <>
                  <div className="mt-decision-head">
                    <h2 className="mt-decision-title">{d.title}</h2>
                    {authed && (
                      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                        <button className="mt-icon-btn" onClick={() => startEdit(d)}><Pencil size={14} /></button>
                        <button className="mt-icon-btn" onClick={() => remove(d.id)}><Trash2 size={14} /></button>
                      </div>
                    )}
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
                        onClick={() => selectFinal(d, o.id)}
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
          );
        })}
      </div>
    </div>
  );
}
