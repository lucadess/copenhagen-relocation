import { useState } from "react";
import { Plus, Trash2, Pencil, Check } from "lucide-react";
import Card from "../components/Card.jsx";
import { BUCKETS, BASE_BUDGET, uid } from "../lib/storage.js";

export default function Budget({ data, update, authed }) {
  const [costForm, setCostForm] = useState({ description: "", amount: "", category: "moveIn" });
  const [extraForm, setExtraForm] = useState({ description: "", amount: "" });
  const [editingCostId, setEditingCostId] = useState(null);
  const [costDraft, setCostDraft] = useState(null);
  const [editingExtraId, setEditingExtraId] = useState(null);
  const [extraDraft, setExtraDraft] = useState(null);

  const totalCosts = data.budget.costs.reduce((s, c) => s + Number(c.amount || 0), 0);
  const totalExtras = data.budget.extras.reduce((s, e) => s + Number(e.amount || 0), 0);
  const remaining = BASE_BUDGET - totalCosts + totalExtras;
  const spentPct = Math.min(100, (totalCosts / (BASE_BUDGET + totalExtras || 1)) * 100);

  function addCost() {
    if (!costForm.description || !costForm.amount) return;
    const ok = update({ budget: { ...data.budget, costs: [{ id: uid(), ...costForm }, ...data.budget.costs] } });
    if (ok) setCostForm({ description: "", amount: "", category: "moveIn" });
  }
  function startEditCost(c) {
    setEditingCostId(c.id);
    setCostDraft({ ...c });
  }
  function changeCostDraft(patch) {
    setCostDraft((d) => ({ ...d, ...patch }));
  }
  function confirmCost() {
    const ok = update({ budget: { ...data.budget, costs: data.budget.costs.map((c) => (c.id === editingCostId ? costDraft : c)) } });
    if (ok) {
      setEditingCostId(null);
      setCostDraft(null);
    }
  }
  function removeCost(id) {
    update({ budget: { ...data.budget, costs: data.budget.costs.filter((c) => c.id !== id) } });
    if (editingCostId === id) {
      setEditingCostId(null);
      setCostDraft(null);
    }
  }

  function addExtra() {
    if (!extraForm.description || !extraForm.amount) return;
    const ok = update({ budget: { ...data.budget, extras: [{ id: uid(), ...extraForm }, ...data.budget.extras] } });
    if (ok) setExtraForm({ description: "", amount: "" });
  }
  function startEditExtra(e) {
    setEditingExtraId(e.id);
    setExtraDraft({ ...e });
  }
  function changeExtraDraft(patch) {
    setExtraDraft((d) => ({ ...d, ...patch }));
  }
  function confirmExtra() {
    const ok = update({ budget: { ...data.budget, extras: data.budget.extras.map((e) => (e.id === editingExtraId ? extraDraft : e)) } });
    if (ok) {
      setEditingExtraId(null);
      setExtraDraft(null);
    }
  }
  function removeExtra(id) {
    update({ budget: { ...data.budget, extras: data.budget.extras.filter((e) => e.id !== id) } });
    if (editingExtraId === id) {
      setEditingExtraId(null);
      setExtraDraft(null);
    }
  }

  return (
    <div className="mt-page" style={{ "--accent": "var(--accent-budget)" }}>
      <h1 className="mt-page-title">Budget</h1>
      <p className="mt-page-intro">
        Total budget: <strong>€{BASE_BUDGET.toLocaleString()}</strong>, split into{" "}
        {BUCKETS.map((b, i) => (
          <span key={b.key}>
            {i > 0 && (i === BUCKETS.length - 1 ? ", and " : ", ")}
            <strong>{b.label} (€{b.amount.toLocaleString()})</strong> — {b.desc}
          </span>
        ))}. Log real costs as they come up, and any extra money added to the pool, both adjust the running
        total below.
      </p>

      <Card className="mt-remaining-card">
        <div className="mt-remaining-top">
          <span>Remaining</span>
          <span className="mt-remaining-num">€{remaining.toLocaleString()}</span>
        </div>
        <div className="mt-progress-track"><div className="mt-progress-fill" style={{ width: spentPct + "%" }} /></div>
        <div className="mt-mini-card-sub">€{totalCosts.toLocaleString()} in costs, €{totalExtras.toLocaleString()} added extra</div>
      </Card>

      <div className="mt-two-col">
        <Card>
          <h2 className="mt-card-title">Costs</h2>
          {authed && (
            <>
              <div className="mt-form-row">
                <input className="mt-input" placeholder="Description" value={costForm.description} onChange={(e) => setCostForm({ ...costForm, description: e.target.value })} />
                <input className="mt-input mt-input-num" type="number" placeholder="Amount" value={costForm.amount} onChange={(e) => setCostForm({ ...costForm, amount: e.target.value })} />
              </div>
              <div className="mt-form-row">
                <select className="mt-input" value={costForm.category} onChange={(e) => setCostForm({ ...costForm, category: e.target.value })}>
                  {BUCKETS.map((b) => <option key={b.key} value={b.key}>{b.label}</option>)}
                  <option value="other">Other</option>
                </select>
                <button className="mt-btn primary" onClick={addCost}><Plus size={14} /> Add</button>
              </div>
            </>
          )}

          <div className="mt-list">
            {data.budget.costs.map((c) => (
              <div key={c.id} className="mt-item">
                {editingCostId === c.id ? (
                  <>
                    <div className="mt-form-row">
                      <input className="mt-input" value={costDraft.description} onChange={(e) => changeCostDraft({ description: e.target.value })} />
                      <input className="mt-input mt-input-num" type="number" value={costDraft.amount} onChange={(e) => changeCostDraft({ amount: e.target.value })} />
                    </div>
                    <div className="mt-form-row">
                      <select className="mt-input" value={costDraft.category} onChange={(e) => changeCostDraft({ category: e.target.value })}>
                        {BUCKETS.map((b) => <option key={b.key} value={b.key}>{b.label}</option>)}
                        <option value="other">Other</option>
                      </select>
                      <button className="mt-icon-btn" onClick={confirmCost}><Check size={14} /></button>
                      <button className="mt-icon-btn" onClick={() => removeCost(c.id)}><Trash2 size={14} /></button>
                    </div>
                  </>
                ) : (
                  <div className="mt-item-row">
                    <div className="mt-item-main">
                      <div>{c.description}</div>
                      <div className="mt-muted">{BUCKETS.find((b) => b.key === c.category)?.label || "Other"}</div>
                    </div>
                    <div className="mt-item-amount negative">-€{Number(c.amount).toLocaleString()}</div>
                    {authed && (
                      <>
                        <button className="mt-icon-btn" onClick={() => startEditCost(c)}><Pencil size={14} /></button>
                        <button className="mt-icon-btn" onClick={() => removeCost(c.id)}><Trash2 size={14} /></button>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
            {data.budget.costs.length === 0 && <div className="mt-empty">No costs logged yet.</div>}
          </div>
        </Card>

        <Card>
          <h2 className="mt-card-title">Extra budget</h2>
          {authed && (
            <>
              <div className="mt-form-row">
                <input className="mt-input" placeholder="Description" value={extraForm.description} onChange={(e) => setExtraForm({ ...extraForm, description: e.target.value })} />
                <input className="mt-input mt-input-num" type="number" placeholder="Amount" value={extraForm.amount} onChange={(e) => setExtraForm({ ...extraForm, amount: e.target.value })} />
              </div>
              <button className="mt-btn primary" onClick={addExtra}><Plus size={14} /> Add</button>
            </>
          )}

          <div className="mt-list">
            {data.budget.extras.map((e) => (
              <div key={e.id} className="mt-item">
                {editingExtraId === e.id ? (
                  <div className="mt-form-row">
                    <input className="mt-input" value={extraDraft.description} onChange={(ev) => changeExtraDraft({ description: ev.target.value })} />
                    <input className="mt-input mt-input-num" type="number" value={extraDraft.amount} onChange={(ev) => changeExtraDraft({ amount: ev.target.value })} />
                    <button className="mt-icon-btn" onClick={confirmExtra}><Check size={14} /></button>
                    <button className="mt-icon-btn" onClick={() => removeExtra(e.id)}><Trash2 size={14} /></button>
                  </div>
                ) : (
                  <div className="mt-item-row">
                    <div className="mt-item-main">{e.description}</div>
                    <div className="mt-item-amount positive">+€{Number(e.amount).toLocaleString()}</div>
                    {authed && (
                      <>
                        <button className="mt-icon-btn" onClick={() => startEditExtra(e)}><Pencil size={14} /></button>
                        <button className="mt-icon-btn" onClick={() => removeExtra(e.id)}><Trash2 size={14} /></button>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
            {data.budget.extras.length === 0 && <div className="mt-empty">No extras added yet.</div>}
          </div>
        </Card>
      </div>
    </div>
  );
}
