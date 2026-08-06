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

export const DEFAULT_MOVE_DATE = "2027-01-15";
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

export const STATUS_STYLE = {
  "Open": { bg: "#F1EEE7", fg: "#6B6357" },
  "In progress": { bg: "#FBF0DC", fg: "#9A6B12" },
  "Decided": { bg: "#EEF1E4", fg: "#4A5527" },
  "Done": { bg: "#EEF1E4", fg: "#4A5527" },
};

export const DECISION_STATUS_OPTIONS = ["Open", "In progress", "Decided"];
export const TASK_STATUS_OPTIONS = ["Open", "In progress", "Done"];

export const TASK_CATEGORY_COLORS = {
  Housing: "#3A86FF",
  Career: "#63C174",
  Admin: "#A44CD3",
  Moving: "#FF7F3F",
  Travel: "#E8A93B",
  Miscellaneous: "#8A8378",
};
export const TASK_CATEGORIES = Object.keys(TASK_CATEGORY_COLORS);

export const TASK_ACTORS = ["Milu", "Luca", "Midori", "Other"];
// Hand-picked instead of auto-derived initials so Milu and Midori (both
// starting with "Mi") stay visually distinct in the actor badge.
export const TASK_ACTOR_INITIALS = { Milu: "ML", Luca: "LC", Midori: "MD", Other: "?" };

// Mapping used only to migrate the old (pre-unification) Timeline "phase"
// data, which had a different, smaller set of category keys.
const LEGACY_PHASE_CATEGORY = {
  housing: "Housing", career: "Career", admin: "Admin", logistics: "Moving", windDown: "Admin",
};

export const defaultData = {
  moveDate: DEFAULT_MOVE_DATE,
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
  tasks: [
    { id: "g1", title: "Research relocation options & DK rental market", description: "", actor: "", category: "Housing", status: "Open", startDate: "2026-08-01", deadline: "2026-09-30" },
    { id: "g2", title: "Decide: relocation service vs. DIY", description: "", actor: "", category: "Housing", status: "Open", startDate: "", deadline: "2026-09-30" },
    { id: "g3", title: "NL lease notice & DK contract talks", description: "", actor: "", category: "Admin", status: "Open", startDate: "2026-08-01", deadline: "2026-10-31" },
    { id: "g4", title: "Midori's Copenhagen job search", description: "", actor: "Midori", category: "Career", status: "Open", startDate: "2026-09-01", deadline: "2027-02-28" },
    { id: "g5", title: "Moving company quotes & booking", description: "", actor: "", category: "Moving", status: "Open", startDate: "2026-10-01", deadline: "2026-11-30" },
    { id: "g6", title: "Apartment hunting & applications", description: "", actor: "", category: "Housing", status: "Open", startDate: "2026-11-01", deadline: "2026-12-31" },
    { id: "g7", title: "Sign Copenhagen lease", description: "", actor: "", category: "Housing", status: "Open", startDate: "", deadline: "2026-12-31" },
    { id: "g8", title: "NL deregistration & utilities cancellation", description: "", actor: "", category: "Admin", status: "Open", startDate: "", deadline: "2026-12-31" },
    { id: "g9", title: "Packing", description: "", actor: "", category: "Moving", status: "Open", startDate: "", deadline: "2026-12-31" },
    { id: "g10", title: "Move + CPR / MitID / tax / bank", description: "", actor: "", category: "Admin", status: "Open", startDate: "", deadline: "2027-01-31" },
    { id: "g11", title: "Settle in & buffer", description: "", actor: "", category: "Admin", status: "Open", startDate: "", deadline: "2027-02-28" },
  ],
  faq: [
    { id: "f1", question: "How do we get a CPR number?", answer: "Register your address, then apply in person at Borgerservice / International Citizen Service.", url: "https://icitizen.dk" },
    { id: "f2", question: "Where do we search for apartments?", answer: "BoligPortal and Lejebolig are the main sites; Facebook expat groups also help.", url: "https://www.boligportal.dk" },
    { id: "f3", question: "EU registration deadline", answer: "Required within 3 months of arrival.", url: "" },
    { id: "f4", question: "CPR appointment timing", answer: "Book it as soon as the lease is signed, slots fill up.", url: "" },
  ],
};

// One-time cleanup for data saved by an earlier version of the app, which
// tracked roadmap "phases" separately from tasks. Folds any leftover phases
// into `tasks` (skipping ones already migrated) and drops the old field.
// Returns null when there's nothing to migrate.
export function migrateLegacyTimeline(data) {
  if (!("timeline" in data)) return null;
  const timeline = data.timeline || [];
  const existingIds = new Set(data.tasks.map((t) => t.id));
  const migrated = timeline
    .filter((p) => !existingIds.has(p.id))
    .map((p) => {
      const monthEntry = MONTHS[p.end] ?? MONTHS[p.start] ?? MONTHS[0];
      const lastDay = new Date(monthEntry.yearNum, monthEntry.monthIndex + 1, 0);
      const deadline = lastDay.getFullYear() + "-"
        + String(lastDay.getMonth() + 1).padStart(2, "0") + "-"
        + String(lastDay.getDate()).padStart(2, "0");
      return {
        id: p.id,
        title: p.label,
        description: "",
        actor: "",
        category: LEGACY_PHASE_CATEGORY[p.cat] || "Miscellaneous",
        status: "Open",
        deadline,
      };
    });
  const next = { ...data, tasks: [...data.tasks, ...migrated] };
  delete next.timeline;
  return next;
}

export function monthIndexForDate(dateStr) {
  if (!dateStr) return -1;
  const d = new Date(dateStr + "T00:00:00");
  if (Number.isNaN(d.getTime())) return -1;
  return MONTHS.findIndex((m) => m.yearNum === d.getFullYear() && m.monthIndex === d.getMonth());
}

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export function formatDate(str) {
  if (!str) return "No deadline";
  const d = new Date(str + "T00:00:00");
  if (Number.isNaN(d.getTime())) return str;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function formatDateRange(startStr, endStr) {
  if (!startStr) return formatDate(endStr);
  const start = new Date(startStr + "T00:00:00");
  const end = new Date(endStr + "T00:00:00");
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return formatDate(endStr);
  const sameYear = start.getFullYear() === end.getFullYear();
  const startFmt = start.toLocaleDateString(undefined, { month: "short", day: "numeric", year: sameYear ? undefined : "numeric" });
  const endFmt = end.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  return startFmt + " – " + endFmt;
}
