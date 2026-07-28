import { useState } from "react";
import { Plus, Trash2, Pencil, Check } from "lucide-react";
import Card from "../components/Card.jsx";
import { BUCKETS, BASE_BUDGET, uid } from "../lib/storage.js";

export default function Budget({ data, update, authed }) {
  const [costForm, setCostForm] = useState({ description: "", amount: "", category: "moveIn" });
  const [extraForm, setExtraForm] = useState({ description: "", amount: "" });
  const [editingCostId, setEditingCostId] = useState(null);
  const [editingExtraId, setEditingExtraId] = useState(null);

  const totalCosts = data.budget.costs.reduce((s, c) => s + Number(c.amount || 0), 0);
  const totalExtras = data.budget.extras.reduce((s, e) => s + Number(e.amount || 0), 0);
  const remaining = BASE_BUDGET - totalCosts + totalExtras;
  const spentPct = Math.min(100, (totalCosts / (BASE_BUDGET + totalExtras || 1)) * 100);

  function addCost() {
    if (!costForm.description || !costForm.amount) return;
    const ok = update({ budget: { ...data.budget, costs: [{ id: uid(), ...costForm }, ...data.budget.costs] } });
    if (ok) setCostForm({ description: "", amount: "", category: "moveIn" });
  }
  function setCost(id, patch) {
    update({ budget: { ...data.budget, costs: data.budget.costs.map((c) => (c.id === id ? { ...c, ...patch } : c)) } });
  }
  function removeCost(id) {
    update({ budget: { ...data.budget, costs: data.budget.costs.filter((c) => c.id !== id) } });
  }

  function addExtra() {
    if (!extraForm.description || !extraForm.amount) return;
    const ok = update({ budget: { ...data.budget, extras: [{ id: uid(), ...extraForm }, ...data.budget.extras] } });
    if (ok) setExtraForm({ description: "", amount: "" });
  }
  function setExtra(id, patch) {
    update({ budget: { ...data.budget, extras: data.budget.extras.map((e) => (e.id === id ? { ...e, ...patch } : e)) } });
  }
  function removeExtra(id) {
    update({ budget: { ...data.budget, extras: data.budget.extras.filter((e) => e.id !== id) } });
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
                      <input className="mt-input" value={c.description} onChange={(e) => setCost(c.id, { description: e.target.value })} />
                      <input className="mt-input mt-input-num" type="number" value={c.amount} onChange={(e) => setCost(c.id, { amount: e.target.value })} />
                    </div>
                    <div className="mt-form-row">
                      <select className="mt-input" value={c.category} onChange={(e) => setCost(c.id, { category: e.target.value })}>
                        {BUCKETS.map((b) => <option key={b.key} value={b.key}>{b.label}</option>)}
                        <option value="other">Other</option>
                      </select>
                      <button className="mt-icon-btn" onClick={() => setEditingCostId(null)}><Check size={14} /></button>
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
                        <button className="mt-icon-btn" onClick={() => setEditingCostId(c.id)}><Pencil size={14} /></button>
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
                    <input className="mt-input" value={e.description} onChange={(ev) => setExtra(e.id, { description: ev.target.value })} />
                    <input className="mt-input mt-input-num" type="number" value={e.amount} onChange={(ev) => setExtra(e.id, { amount: ev.target.value })} />
                    <button className="mt-icon-btn" onClick={() => setEditingExtraId(null)}><Check size={14} /></button>
                    <button className="mt-icon-btn" onClick={() => removeExtra(e.id)}><Trash2 size={14} /></button>
                  </div>
                ) : (
                  <div className="mt-item-row">
                    <div className="mt-item-main">{e.description}</div>
                    <div className="mt-item-amount positive">+€{Number(e.amount).toLocaleString()}</div>
                    {authed && (
                      <>
                        <button className="mt-icon-btn" onClick={() => setEditingExtraId(e.id)}><Pencil size={14} /></button>
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
