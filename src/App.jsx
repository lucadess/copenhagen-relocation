import { useState, useEffect } from "react";
import {
  LayoutDashboard, Wallet, ListChecks, HelpCircle, Plus, Trash2, ExternalLink,
  Pencil, Check, Circle, CheckCircle2,
} from "lucide-react";

import { supabase } from "./supabaseClient.js";

/* ============================================================== */
/* Storage                                                          */
/* Uses Supabase (shared, synced across devices) when              */
/* VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are configured.       */
/* Otherwise falls back to this browser's localStorage only.        */
/* ============================================================== */

const TABLE = "move_tracker";

const storage = {
  async get(key) {
    if (supabase) {
      const { data, error } = await supabase.from(TABLE).select("data").eq("id", key).maybeSingle();
      if (error) {
        console.error("Supabase read error", error);
        return null;
      }
      return data ? { key, value: JSON.stringify(data.data) } : null;
    }
    try {
      const value = localStorage.getItem(key);
      return value !== null ? { key, value } : null;
    } catch (e) {
      return null;
    }
  },
  async set(key, value) {
    if (supabase) {
      const { error } = await supabase
        .from(TABLE)
        .upsert({ id: key, data: JSON.parse(value), updated_at: new Date().toISOString() });
      if (error) {
        console.error("Supabase write error", error);
        return null;
      }
      return { key, value };
    }
    try {
      localStorage.setItem(key, value);
      return { key, value };
    } catch (e) {
      return null;
    }
  },
};

/* ============================================================== */
/* Constants                                                       */
/* ============================================================== */

const STORAGE_KEY = "cph-move-tracker-v4";
const MOVE_DAY = new Date(2027, 0, 15);
const BASE_BUDGET = 25000;

const BUCKETS = [
  { key: "moveIn", label: "Move-in fees", amount: 10000, desc: "Deposit, prepaid rent, agency fees" },
  { key: "moving", label: "Moving costs", amount: 5000, desc: "Movers or relocation service, transport" },
  { key: "buffer", label: "Buffer", amount: 10000, desc: "Safety net while Midori job-hunts" },
];

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "budget", label: "Budget", icon: Wallet },
  { id: "decisions", label: "Decisions", icon: ListChecks },
  { id: "faq", label: "FAQ", icon: HelpCircle },
];

const MONTHS = [
  { label: "Aug", year: "26" }, { label: "Sep", year: "26" }, { label: "Oct", year: "26" },
  { label: "Nov", year: "26" }, { label: "Dec", year: "26" }, { label: "Jan", year: "27" }, { label: "Feb", year: "27" },
];

const GANTT_CATEGORIES = {
  housing: { label: "Housing", color: "#FF4B23" },
  career: { label: "Career", color: "#6F7D3C" },
  admin: { label: "Admin", color: "#4F5A63" },
  logistics: { label: "Moving", color: "#D9A441" },
  windDown: { label: "NL wind-down", color: "#A69C8E" },
};

const GANTT_PHASES = [
  { id: "g1", label: "Research relocation options & DK rental market", cat: "housing", start: 0, end: 1 },
  { id: "g2", label: "Decide: relocation service vs. DIY", cat: "housing", start: 1, end: 1, milestone: true },
  { id: "g3", label: "NL lease notice & DK contract talks", cat: "admin", start: 0, end: 2 },
  { id: "g4", label: "Midori's Copenhagen job search", cat: "career", start: 1, end: 6 },
  { id: "g5", label: "Moving company quotes & booking", cat: "logistics", start: 2, end: 3 },
  { id: "g6", label: "Apartment hunting & applications", cat: "housing", start: 3, end: 4 },
  { id: "g7", label: "Sign Copenhagen lease", cat: "housing", start: 4, end: 4, milestone: true },
  { id: "g8", label: "NL deregistration & utilities cancellation", cat: "windDown", start: 4, end: 4 },
  { id: "g9", label: "Packing", cat: "logistics", start: 4, end: 4 },
  { id: "g10", label: "Move + CPR / MitID / tax / bank", cat: "admin", start: 5, end: 5, milestone: true },
  { id: "g11", label: "Settle in & buffer", cat: "admin", start: 6, end: 6 },
];

const STATUS_OPTIONS = ["Open", "In progress", "Decided"];
const STATUS_STYLE = {
  "Open": { bg: "#F1EEE7", fg: "#6B6357" },
  "In progress": { bg: "#FBF0DC", fg: "#9A6B12" },
  "Decided": { bg: "#EEF1E4", fg: "#4A5527" },
};

const defaultData = {
  decisions: [
    {
      id: "d1", title: "Relocation service or DIY apartment search?", deadline: "2026-09-30", status: "Open",
      options: [{ id: "o1", text: "Relocation service" }, { id: "o2", text: "DIY" }], finalDecisionId: null,
      notes: "Determines whether we need an Airbnb + storage for Jan–Feb.",
    },
    {
      id: "d2", title: "Neighborhood priority", deadline: "2026-11-01", status: "Open",
      options: [{ id: "o1", text: "Centre (Nørrebro / Østerbro / Vesterbro / Frederiksberg)" }, { id: "o2", text: "Outer (Valby, etc.)" }],
      finalDecisionId: null, notes: "",
    },
    {
      id: "d3", title: "Raise timing", deadline: "", status: "Open",
      options: [{ id: "o1", text: "January 2027" }, { id: "o2", text: "May 2027" }, { id: "o3", text: "Uncertain" }],
      finalDecisionId: null, notes: "Depends on the employer, affects the rent we can safely commit to.",
    },
    {
      id: "d4", title: "Book Airbnb + storage for Jan–Feb?", deadline: "2026-11-15", status: "Open",
      options: [{ id: "o1", text: "Yes" }, { id: "o2", text: "No" }], finalDecisionId: null,
      notes: "Only relevant if we go the DIY route.",
    },
  ],
  budget: { costs: [], extras: [] },
  faq: [
    { id: "f1", question: "How do we get a CPR number?", answer: "Register your address, then apply in person at Borgerservice / International Citizen Service.", url: "https://icitizen.dk" },
    { id: "f2", question: "Where do we search for apartments?", answer: "BoligPortal and Lejebolig are the main sites; Facebook expat groups also help.", url: "https://www.boligportal.dk" },
    { id: "f3", question: "EU registration deadline", answer: "Required within 3 months of arrival.", url: "" },
    { id: "f4", question: "CPR appointment timing", answer: "Book it as soon as the lease is signed, slots fill up.", url: "" },
  ],
};

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function formatDate(str) {
  if (!str) return "No deadline";
  const d = new Date(str + "T00:00:00");
  if (Number.isNaN(d.getTime())) return str;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

/* ============================================================== */
/* App                                                              */
/* ============================================================== */

export default function MoveTracker() {
  const [data, setData] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState("dashboard");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await storage.get(STORAGE_KEY);
        if (!cancelled) setData(res && res.value ? { ...defaultData, ...JSON.parse(res.value) } : defaultData);
      } catch (e) {
        if (!cancelled) setData(defaultData);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Live sync: when Supabase is configured, pick up changes made from any
  // other device/tab without needing a refresh.
  useEffect(() => {
    if (!supabase) return;
    const channel = supabase
      .channel("move_tracker_" + STORAGE_KEY)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "move_tracker", filter: "id=eq." + STORAGE_KEY },
        (payload) => {
          if (payload.new && payload.new.data) {
            setData({ ...defaultData, ...payload.new.data });
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  async function persist(next) {
    setData(next);
    try {
      await storage.set(STORAGE_KEY, JSON.stringify(next));
    } catch (e) {
      console.error("storage error", e);
    }
  }
  function update(patch) {
    persist({ ...data, ...(typeof patch === "function" ? patch(data) : patch) });
  }

  if (!loaded || !data) {
    return <div className="mt-loading">Loading…</div>;
  }

  const totalCosts = data.budget.costs.reduce((s, c) => s + Number(c.amount || 0), 0);
  const totalExtras = data.budget.extras.reduce((s, e) => s + Number(e.amount || 0), 0);
  const remaining = BASE_BUDGET - totalCosts + totalExtras;
  const daysLeft = Math.max(0, Math.ceil((MOVE_DAY - new Date()) / 86400000));

  return (
    <div className="mt-app">
      <GlobalStyle />

      <div className="mt-topbar">
        <div className="mt-brand-row">
          <div className="mt-brand">Copenhagen Move</div>
          <span className={"mt-sync-badge" + (supabase ? " on" : "")}>
            <span className="mt-sync-dot" /> {supabase ? "Synced" : "Local only"}
          </span>
        </div>
        <nav className="mt-nav">
          {NAV.map((n) => (
            <button key={n.id} className={"mt-nav-item" + (tab === n.id ? " active" : "")} onClick={() => setTab(n.id)}>
              <n.icon size={16} /> {n.label}
            </button>
          ))}
        </nav>
      </div>

      <main className="mt-main">
        {tab === "dashboard" && <Dashboard daysLeft={daysLeft} remaining={remaining} />}
        {tab === "budget" && <Budget data={data} update={update} totalCosts={totalCosts} totalExtras={totalExtras} remaining={remaining} />}
        {tab === "decisions" && <Decisions data={data} update={update} />}
        {tab === "faq" && <Faq data={data} update={update} />}
      </main>
    </div>
  );
}

/* ============================================================== */
/* Dashboard                                                        */
/* ============================================================== */

function Dashboard({ daysLeft, remaining }) {
  const todayFraction = (() => {
    const start = new Date(2026, 7, 1);
    const end = new Date(2027, 2, 1);
    const f = (new Date() - start) / (end - start);
    return Math.min(1, Math.max(0, f));
  })();

  return (
    <div className="mt-page">
      <div className="mt-stat-row">
        <div className="mt-stat-card">
          <div className="mt-stat-num">{daysLeft}</div>
          <div className="mt-stat-label">days to move day</div>
        </div>
        <div className="mt-stat-card">
          <div className="mt-stat-num">€{remaining.toLocaleString()}</div>
          <div className="mt-stat-label">remaining of €{BASE_BUDGET.toLocaleString()}</div>
        </div>
      </div>

      <div className="mt-card">
        <h2 className="mt-title">Timeline</h2>
        <div className="mt-legend">
          {Object.entries(GANTT_CATEGORIES).map(([k, c]) => (
            <div key={k} className="mt-legend-item"><span className="mt-legend-dot" style={{ background: c.color }} />{c.label}</div>
          ))}
        </div>
        <div className="mt-gantt-scroll">
          <div className="mt-gantt">
            <div />
            {MONTHS.map((m, i) => <div key={i} className="mt-gantt-head">{m.label} '{m.year}</div>)}
            {GANTT_PHASES.map((p) => <GanttRow key={p.id} phase={p} />)}
            {todayFraction > 0 && todayFraction < 1 && (
              <div className="mt-today-line" style={{ left: "calc(190px + " + (todayFraction * 100) + "%)", height: ((GANTT_PHASES.length + 1) * 36) + "px" }}>
                <div className="mt-today-label">Today</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function GanttRow({ phase }) {
  const color = GANTT_CATEGORIES[phase.cat].color;
  const span = phase.end - phase.start + 1;
  return (
    <>
      <div className="mt-gantt-row-label">{phase.label}</div>
      {MONTHS.map((_, i) => (
        <div className="mt-gantt-cell" key={i}>
          {i === phase.start && !phase.milestone && (
            <div className="mt-gantt-bar" style={{ width: "calc(" + (span * 100) + "% - 6px)", background: color }} />
          )}
          {i === phase.start && phase.milestone && (
            <div className="mt-gantt-diamond" style={{ background: color }} />
          )}
        </div>
      ))}
    </>
  );
}

/* ============================================================== */
/* Budget                                                           */
/* ============================================================== */

function Budget({ data, update, totalCosts, totalExtras, remaining }) {
  const [costForm, setCostForm] = useState({ description: "", amount: "", category: "moveIn" });
  const [extraForm, setExtraForm] = useState({ description: "", amount: "" });
  const [editingCostId, setEditingCostId] = useState(null);
  const [editingExtraId, setEditingExtraId] = useState(null);

  function addCost() {
    if (!costForm.description || !costForm.amount) return;
    update({ budget: { ...data.budget, costs: [{ id: uid(), ...costForm }, ...data.budget.costs] } });
    setCostForm({ description: "", amount: "", category: "moveIn" });
  }
  function setCost(id, patch) {
    update({ budget: { ...data.budget, costs: data.budget.costs.map((c) => (c.id === id ? { ...c, ...patch } : c)) } });
  }
  function removeCost(id) {
    update({ budget: { ...data.budget, costs: data.budget.costs.filter((c) => c.id !== id) } });
  }

  function addExtra() {
    if (!extraForm.description || !extraForm.amount) return;
    update({ budget: { ...data.budget, extras: [{ id: uid(), ...extraForm }, ...data.budget.extras] } });
    setExtraForm({ description: "", amount: "" });
  }
  function setExtra(id, patch) {
    update({ budget: { ...data.budget, extras: data.budget.extras.map((e) => (e.id === id ? { ...e, ...patch } : e)) } });
  }
  function removeExtra(id) {
    update({ budget: { ...data.budget, extras: data.budget.extras.filter((e) => e.id !== id) } });
  }

  const spentPct = Math.min(100, (totalCosts / (BASE_BUDGET + totalExtras || 1)) * 100);

  return (
    <div className="mt-page">
      <h1 className="mt-page-title">Budget</h1>
      <p className="mt-page-intro">
        Total budget: <strong>€{BASE_BUDGET.toLocaleString()}</strong>, split across three buckets. Log real costs
        as they come up, and any extra money added to the pool, both adjust the running total below.
      </p>

      <div className="mt-bucket-row">
        {BUCKETS.map((b) => {
          const spent = data.budget.costs.filter((c) => c.category === b.key).reduce((s, c) => s + Number(c.amount || 0), 0);
          return (
            <div key={b.key} className="mt-card mt-bucket-card">
              <div className="mt-bucket-label">{b.label}</div>
              <div className="mt-bucket-amount">€{b.amount.toLocaleString()}</div>
              <div className="mt-bucket-desc">{b.desc}</div>
              {spent > 0 && <div className="mt-bucket-spent">€{spent.toLocaleString()} logged</div>}
            </div>
          );
        })}
      </div>

      <div className="mt-card mt-remaining-card">
        <div className="mt-remaining-top">
          <span>Remaining</span>
          <span className="mt-remaining-num">€{remaining.toLocaleString()}</span>
        </div>
        <div className="mt-bar-track"><div className="mt-bar-fill" style={{ width: spentPct + "%" }} /></div>
        <div className="mt-remaining-sub">€{totalCosts.toLocaleString()} in costs, €{totalExtras.toLocaleString()} added extra</div>
      </div>

      <div className="mt-two-col">
        <div className="mt-card">
          <h2 className="mt-title">Costs</h2>
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
                    <button className="mt-icon-btn" onClick={() => setEditingCostId(c.id)}><Pencil size={14} /></button>
                    <button className="mt-icon-btn" onClick={() => removeCost(c.id)}><Trash2 size={14} /></button>
                  </div>
                )}
              </div>
            ))}
            {data.budget.costs.length === 0 && <div className="mt-empty">No costs logged yet.</div>}
          </div>
        </div>

        <div className="mt-card">
          <h2 className="mt-title">Extra budget</h2>
          <div className="mt-form-row">
            <input className="mt-input" placeholder="Description" value={extraForm.description} onChange={(e) => setExtraForm({ ...extraForm, description: e.target.value })} />
            <input className="mt-input mt-input-num" type="number" placeholder="Amount" value={extraForm.amount} onChange={(e) => setExtraForm({ ...extraForm, amount: e.target.value })} />
          </div>
          <button className="mt-btn primary" onClick={addExtra}><Plus size={14} /> Add</button>

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
                    <button className="mt-icon-btn" onClick={() => setEditingExtraId(e.id)}><Pencil size={14} /></button>
                    <button className="mt-icon-btn" onClick={() => removeExtra(e.id)}><Trash2 size={14} /></button>
                  </div>
                )}
              </div>
            ))}
            {data.budget.extras.length === 0 && <div className="mt-empty">No extras added yet.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================== */
/* Decisions                                                        */
/* ============================================================== */

function Decisions({ data, update }) {
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
    <div className="mt-page">
      <h1 className="mt-page-title">Decisions</h1>
      <div className="mt-stack">
        {data.decisions.map((d) => (
          <div key={d.id} className="mt-card">
            {editingId === d.id ? (
              <>
                <div className="mt-form-row">
                  <input className="mt-input mt-input-strong" value={d.title} onChange={(e) => set(d.id, { title: e.target.value })} />
                </div>
                <div className="mt-form-row">
                  <div className="mt-field">
                    <label className="mt-field-label">Deadline</label>
                    <input className="mt-input" type="date" value={d.deadline} onChange={(e) => set(d.id, { deadline: e.target.value })} />
                  </div>
                  <div className="mt-field">
                    <label className="mt-field-label">Status</label>
                    <select className="mt-input" value={d.status} onChange={(e) => set(d.id, { status: e.target.value })}>
                      {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div className="mt-field">
                  <label className="mt-field-label">Options, pick the final decision</label>
                  {d.options.map((o) => (
                    <div key={o.id} className="mt-option-row">
                      <input type="radio" name={"decision-" + d.id} checked={d.finalDecisionId === o.id} onChange={() => set(d.id, { finalDecisionId: o.id })} />
                      <input className="mt-input soft" value={o.text} onChange={(e) => setOption(d, o.id, e.target.value)} />
                      <button className="mt-icon-btn" onClick={() => removeOption(d, o.id)}><Trash2 size={13} /></button>
                    </div>
                  ))}
                  <button className="mt-add-link" onClick={() => addOption(d)}><Plus size={13} /> Add option</button>
                </div>
                <div className="mt-field">
                  <label className="mt-field-label">Notes</label>
                  <textarea className="mt-input soft mt-textarea" value={d.notes} onChange={(e) => set(d.id, { notes: e.target.value })} />
                </div>
                <div className="mt-card-actions">
                  <button className="mt-icon-btn" onClick={() => setEditingId(null)}><Check size={15} /></button>
                  <button className="mt-icon-btn" onClick={() => remove(d.id)}><Trash2 size={15} /></button>
                </div>
              </>
            ) : (
              <>
                <div className="mt-item-row">
                  <div className="mt-item-title">{d.title}</div>
                  <button className="mt-icon-btn" onClick={() => setEditingId(d.id)}><Pencil size={14} /></button>
                  <button className="mt-icon-btn" onClick={() => remove(d.id)}><Trash2 size={14} /></button>
                </div>
                <div className="mt-badge-row">
                  <span className="mt-badge">{formatDate(d.deadline)}</span>
                  <span className="mt-badge" style={{ background: STATUS_STYLE[d.status].bg, color: STATUS_STYLE[d.status].fg }}>{d.status}</span>
                </div>
                <div className="mt-option-display-list">
                  {d.options.map((o) => (
                    <div key={o.id} className={"mt-option-display" + (d.finalDecisionId === o.id ? " chosen" : "")}>
                      {d.finalDecisionId === o.id ? <CheckCircle2 size={15} color="var(--olive)" /> : <Circle size={15} color="#D8D3CC" />}
                      {o.text}
                    </div>
                  ))}
                </div>
                {d.notes && <div className="mt-notes-display">{d.notes}</div>}
              </>
            )}
          </div>
        ))}
      </div>
      <button className="mt-btn primary mt-add-decision" onClick={add}><Plus size={14} /> Add decision</button>
    </div>
  );
}

/* ============================================================== */
/* FAQ                                                              */
/* ============================================================== */

function Faq({ data, update }) {
  const [editingId, setEditingId] = useState(null);

  function set(id, patch) {
    update({ faq: data.faq.map((f) => (f.id === id ? { ...f, ...patch } : f)) });
  }
  function add() {
    const newId = uid();
    update({ faq: [...data.faq, { id: newId, question: "New question", answer: "", url: "" }] });
    setEditingId(newId);
  }
  function remove(id) {
    update({ faq: data.faq.filter((f) => f.id !== id) });
    if (editingId === id) setEditingId(null);
  }

  return (
    <div className="mt-page">
      <h1 className="mt-page-title">FAQ</h1>
      <div className="mt-stack">
        {data.faq.map((f) => (
          <div key={f.id} className="mt-card">
            {editingId === f.id ? (
              <>
                <div className="mt-form-row">
                  <input className="mt-input mt-input-strong" value={f.question} onChange={(e) => set(f.id, { question: e.target.value })} />
                </div>
                <textarea className="mt-input soft mt-textarea" placeholder="Answer / note" value={f.answer} onChange={(e) => set(f.id, { answer: e.target.value })} />
                <input className="mt-input soft" placeholder="Link (optional)" value={f.url} onChange={(e) => set(f.id, { url: e.target.value })} />
                <div className="mt-card-actions">
                  <button className="mt-icon-btn" onClick={() => setEditingId(null)}><Check size={15} /></button>
                  <button className="mt-icon-btn" onClick={() => remove(f.id)}><Trash2 size={15} /></button>
                </div>
              </>
            ) : (
              <>
                <div className="mt-item-row">
                  <div className="mt-item-title">{f.question}</div>
                  <button className="mt-icon-btn" onClick={() => setEditingId(f.id)}><Pencil size={14} /></button>
                  <button className="mt-icon-btn" onClick={() => remove(f.id)}><Trash2 size={14} /></button>
                </div>
                {f.answer && <div className="mt-notes-display">{f.answer}</div>}
                {f.url && <a className="mt-link" href={f.url} target="_blank" rel="noreferrer"><ExternalLink size={12} /> {f.url}</a>}
              </>
            )}
          </div>
        ))}
      </div>
      <button className="mt-btn primary mt-add-decision" onClick={add}><Plus size={14} /> Add entry</button>
    </div>
  );
}

/* ============================================================== */
/* Style (mobile-first: base = phone, then scale up)                */
/* ============================================================== */

function GlobalStyle() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@600;700&family=DM+Sans:wght@400;500;600;700&display=swap');

      .mt-app {
        --bg: #FAF8F4;
        --card: #FFFFFF;
        --ink: #1C1B19;
        --muted: #8A8378;
        --line: rgba(28,27,25,0.10);
        --tomato: #FF4B23;
        --tomato-tint: #FDEDE8;
        --olive: #6F7D3C;
        --olive-tint: #EEF1E4;
        --sunny: #E8A93B;
        font-family: 'DM Sans', sans-serif;
        background: var(--bg);
        color: var(--ink);
        border-radius: 14px;
        overflow: hidden;
        max-width: 980px;
        margin: 0 auto;
        border: 1px solid var(--line);
        font-size: 15px;
      }
      .mt-app * { box-sizing: border-box; }
      .mt-loading { padding: 48px 20px; text-align: center; font-family: sans-serif; color: var(--muted); }

      /* --- top bar: mobile base --- */
      .mt-topbar {
        display: flex; flex-direction: column; gap: 10px;
        padding: 14px 14px 10px; background: var(--card); border-bottom: 1px solid var(--line);
      }
      .mt-brand-row { display: flex; align-items: center; gap: 8px; }
      .mt-brand { font-family: 'Fredoka', sans-serif; font-weight: 700; font-size: 16px; }
      .mt-sync-badge {
        display: inline-flex; align-items: center; gap: 5px; font-size: 10px; font-weight: 600;
        color: var(--muted); background: var(--bg); border-radius: 999px; padding: 3px 9px;
      }
      .mt-sync-badge.on { color: var(--olive); background: var(--olive-tint); }
      .mt-sync-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
      .mt-nav { display: flex; gap: 6px; overflow-x: auto; padding-bottom: 2px; -webkit-overflow-scrolling: touch; }
      .mt-nav-item {
        display: flex; align-items: center; gap: 6px; white-space: nowrap;
        font-size: 13px; font-weight: 500; color: var(--muted);
        background: var(--bg); border: none; padding: 9px 13px; border-radius: 10px; cursor: pointer;
        min-height: 40px; flex-shrink: 0;
        transition: background 0.15s ease, color 0.15s ease;
      }
      .mt-nav-item.active { background: var(--tomato-tint); color: var(--tomato); font-weight: 600; }

      .mt-main { padding: 16px 14px 32px; }
      .mt-page { display: flex; flex-direction: column; gap: 14px; }
      .mt-page-title { font-family: 'Fredoka', sans-serif; font-size: 21px; font-weight: 700; margin: 0; }
      .mt-page-intro { font-size: 13px; color: var(--muted); line-height: 1.6; margin: -4px 0 2px; }

      .mt-card {
        background: var(--card); border: 1px solid var(--line); border-radius: 14px;
        padding: 14px 15px; box-shadow: 0 1px 2px rgba(28,27,25,0.03);
      }
      .mt-title { font-family: 'Fredoka', sans-serif; font-size: 15px; font-weight: 600; margin: 0 0 10px; }

      .mt-stat-row { display: flex; flex-direction: column; gap: 10px; }
      .mt-stat-card { background: var(--card); border: 1px solid var(--line); border-radius: 14px; padding: 14px 16px; }
      .mt-stat-num { font-family: 'Fredoka', sans-serif; font-size: 24px; font-weight: 700; color: var(--tomato); word-break: break-word; }
      .mt-stat-label { font-size: 12px; color: var(--muted); margin-top: 2px; }

      .mt-legend { display: flex; gap: 10px; margin-bottom: 10px; flex-wrap: wrap; font-size: 10px; color: var(--muted); }
      .mt-legend-item { display: flex; align-items: center; gap: 4px; }
      .mt-legend-dot { width: 7px; height: 7px; border-radius: 2px; flex-shrink: 0; }

      .mt-gantt-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; margin: 0 -15px; padding: 0 15px; }
      .mt-gantt { display: grid; grid-template-columns: 190px repeat(7, 90px); position: relative; min-width: 820px; }
      .mt-gantt-head { font-size: 10px; color: var(--muted); text-align: center; padding-bottom: 6px; border-bottom: 1px solid var(--line); }
      .mt-gantt-row-label { font-size: 11px; padding: 7px 6px 7px 0; border-bottom: 1px solid var(--line); display: flex; align-items: center; }
      .mt-gantt-cell { border-bottom: 1px solid var(--line); border-left: 1px solid #F1EEE7; min-height: 32px; position: relative; }
      .mt-gantt-bar { position: absolute; top: 6px; bottom: 6px; left: 3px; border-radius: 5px; }
      .mt-gantt-diamond { width: 10px; height: 10px; border-radius: 3px; position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%) rotate(45deg); }
      .mt-today-line { position: absolute; top: 0; width: 2px; background: var(--tomato); }
      .mt-today-label { position: absolute; top: -16px; transform: translateX(-50%); font-size: 10px; color: var(--tomato); font-weight: 600; white-space: nowrap; }

      .mt-bucket-row { display: flex; flex-direction: column; gap: 10px; }
      .mt-bucket-card { display: flex; flex-direction: column; gap: 3px; }
      .mt-bucket-label { font-size: 11px; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: 0.03em; }
      .mt-bucket-amount { font-family: 'Fredoka', sans-serif; font-size: 20px; font-weight: 700; }
      .mt-bucket-desc { font-size: 12px; color: var(--muted); margin-top: 2px; }
      .mt-bucket-spent { font-size: 11px; color: var(--tomato); margin-top: 6px; }

      .mt-remaining-card { display: flex; flex-direction: column; gap: 8px; }
      .mt-remaining-top { display: flex; justify-content: space-between; align-items: baseline; font-size: 13px; color: var(--muted); flex-wrap: wrap; gap: 4px; }
      .mt-remaining-num { font-family: 'Fredoka', sans-serif; font-size: 22px; font-weight: 700; color: var(--ink); }
      .mt-bar-track { height: 8px; background: var(--bg); border-radius: 999px; overflow: hidden; }
      .mt-bar-fill { height: 100%; background: var(--olive); transition: width 0.5s ease; }
      .mt-remaining-sub { font-size: 12px; color: var(--muted); }

      .mt-two-col { display: flex; flex-direction: column; gap: 14px; }

      .mt-form-row { display: flex; flex-direction: column; gap: 8px; margin-bottom: 8px; }
      .mt-input {
        font-family: 'DM Sans', sans-serif; font-size: 14px; padding: 9px 11px;
        border: 1px solid var(--line); border-radius: 9px; background: var(--bg); color: var(--ink);
        width: 100%; min-width: 0; min-height: 40px;
      }
      .mt-input.soft { background: #FCFBF8; }
      .mt-input-strong { font-family: 'Fredoka', sans-serif; font-weight: 600; font-size: 15px; }
      .mt-textarea { min-height: 60px; resize: vertical; margin-bottom: 8px; }

      .mt-btn {
        display: inline-flex; align-items: center; justify-content: center; gap: 6px; font-size: 13px; font-weight: 600;
        border: 1px solid var(--line); background: var(--card); border-radius: 9px; padding: 9px 14px; cursor: pointer;
        color: var(--ink); min-height: 40px; width: 100%;
      }
      .mt-btn.primary { background: var(--ink); color: white; border-color: var(--ink); }
      .mt-add-decision { margin-top: 2px; }
      .mt-add-link { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; color: var(--muted); background: none; border: none; cursor: pointer; padding: 6px 0; }
      .mt-add-link:hover { color: var(--ink); }

      .mt-icon-btn {
        border: 1px solid var(--line); background: var(--card); border-radius: 8px; padding: 8px;
        cursor: pointer; color: var(--muted); flex-shrink: 0; min-width: 36px; min-height: 36px;
        display: inline-flex; align-items: center; justify-content: center;
      }
      .mt-icon-btn:hover { color: var(--tomato); border-color: var(--tomato-tint); }

      .mt-list { display: flex; flex-direction: column; gap: 8px; margin-top: 10px; }
      .mt-item { border-top: 1px solid var(--line); padding-top: 8px; }
      .mt-item-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
      .mt-item-main { flex: 1; min-width: 100px; font-size: 13px; }
      .mt-item-amount { font-weight: 600; font-size: 13px; white-space: nowrap; }
      .mt-item-amount.negative { color: var(--tomato); }
      .mt-item-amount.positive { color: var(--olive); }
      .mt-item-title { flex: 1; font-family: 'Fredoka', sans-serif; font-weight: 600; font-size: 15px; min-width: 140px; }
      .mt-empty { font-size: 12px; color: var(--muted); padding: 4px 0; }
      .mt-muted { color: var(--muted); font-size: 11px; }

      .mt-stack { display: flex; flex-direction: column; gap: 12px; }
      .mt-field { margin-bottom: 8px; }
      .mt-field-label { font-size: 11px; color: var(--muted); display: block; margin-bottom: 4px; }
      .mt-option-row { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
      .mt-option-row input[type="radio"] { accent-color: var(--tomato); width: 17px; height: 17px; flex-shrink: 0; }

      .mt-card-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 6px; }

      .mt-badge-row { display: flex; gap: 6px; margin: 6px 0 10px; flex-wrap: wrap; }
      .mt-badge { font-size: 11px; font-weight: 600; background: var(--bg); color: var(--muted); padding: 4px 9px; border-radius: 999px; }

      .mt-option-display-list { display: flex; flex-direction: column; gap: 6px; margin-bottom: 6px; }
      .mt-option-display { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--muted); }
      .mt-option-display.chosen { color: var(--ink); font-weight: 600; }

      .mt-notes-display { font-size: 12px; color: var(--muted); line-height: 1.5; margin-top: 4px; }
      .mt-link { font-size: 12px; display: inline-flex; align-items: center; gap: 4px; color: var(--olive); text-decoration: none; font-weight: 600; margin-top: 6px; word-break: break-all; }

      /* --- scale up for tablet / desktop --- */
      @media (min-width: 640px) {
        .mt-app { border-radius: 18px; }
        .mt-topbar { flex-direction: row; align-items: center; justify-content: space-between; padding: 14px 22px; }
        .mt-brand { font-size: 17px; }
        .mt-nav { overflow-x: visible; }
        .mt-nav-item { padding: 7px 12px; min-height: auto; }
        .mt-main { padding: 26px 26px 40px; }
        .mt-page-title { font-size: 24px; }
        .mt-card { padding: 18px 20px; }
        .mt-stat-row { flex-direction: row; flex-wrap: wrap; }
        .mt-stat-card { min-width: 160px; }
        .mt-bucket-row { flex-direction: row; }
        .mt-bucket-row > * { flex: 1; }
        .mt-two-col { flex-direction: row; }
        .mt-two-col > * { flex: 1; }
        .mt-form-row { flex-direction: row; align-items: center; }
        .mt-input-num { flex: 0 0 110px; }
        .mt-btn { width: auto; }
        .mt-gantt-scroll { margin: 0; padding: 0; }
      }
    `}</style>
  );
}
