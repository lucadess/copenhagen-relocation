import { supabase } from "../supabaseClient.js";

/* ============================================================== */
/* Storage                                                          */
/* Uses Supabase (shared, synced across devices) when              */
/* VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are configured.       */
/* Otherwise falls back to this browser's localStorage only.        */
/* ============================================================== */

export const TABLE = "move_tracker";
export const STORAGE_KEY = "cph-move-tracker-v4";

export const storage = {
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

export const MOVE_DAY = new Date(2027, 0, 15);
export const BASE_BUDGET = 25000;

export const BUCKETS = [
  { key: "moveIn", label: "Move-in fees", amount: 10000, desc: "Deposit, prepaid rent, agency fees" },
  { key: "moving", label: "Moving costs", amount: 5000, desc: "Movers or relocation service, transport" },
  { key: "buffer", label: "Buffer", amount: 10000, desc: "Safety net while Midori job-hunts" },
];

export const MONTHS = [
  { label: "Aug", year: "26", monthIndex: 7, yearNum: 2026 },
  { label: "Sep", year: "26", monthIndex: 8, yearNum: 2026 },
  { label: "Oct", year: "26", monthIndex: 9, yearNum: 2026 },
  { label: "Nov", year: "26", monthIndex: 10, yearNum: 2026 },
  { label: "Dec", year: "26", monthIndex: 11, yearNum: 2026 },
  { label: "Jan", year: "27", monthIndex: 0, yearNum: 2027 },
  { label: "Feb", year: "27", monthIndex: 1, yearNum: 2027 },
];

export const GANTT_CATEGORIES = {
  housing: { label: "Housing", color: "#3A86FF" },
  career: { label: "Career", color: "#63C174" },
  admin: { label: "Admin", color: "#A44CD3" },
  logistics: { label: "Moving", color: "#FF7F3F" },
  windDown: { label: "NL wind-down", color: "#B8AFA2" },
};

export const GANTT_PHASES = [
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

export const STATUS_STYLE = {
  "Open": { bg: "#F1EEE7", fg: "#6B6357" },
  "In progress": { bg: "#FBF0DC", fg: "#9A6B12" },
  "Decided": { bg: "#EEF1E4", fg: "#4A5527" },
  "Done": { bg: "#EEF1E4", fg: "#4A5527" },
};

export const DECISION_STATUS_OPTIONS = ["Open", "In progress", "Decided"];
export const TASK_STATUS_OPTIONS = ["Open", "In progress", "Done"];
export const TASK_CATEGORIES = ["Housing", "Administration", "Budget", "Packing", "Travel", "Miscellaneous"];

export const defaultData = {
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
  tasks: [],
  faq: [
    { id: "f1", question: "How do we get a CPR number?", answer: "Register your address, then apply in person at Borgerservice / International Citizen Service.", url: "https://icitizen.dk" },
    { id: "f2", question: "Where do we search for apartments?", answer: "BoligPortal and Lejebolig are the main sites; Facebook expat groups also help.", url: "https://www.boligportal.dk" },
    { id: "f3", question: "EU registration deadline", answer: "Required within 3 months of arrival.", url: "" },
    { id: "f4", question: "CPR appointment timing", answer: "Book it as soon as the lease is signed, slots fill up.", url: "" },
  ],
};

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export function formatDate(str) {
  if (!str) return "No deadline";
  const d = new Date(str + "T00:00:00");
  if (Number.isNaN(d.getTime())) return str;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}
