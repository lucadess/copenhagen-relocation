import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { LayoutDashboard, Wallet, ListChecks, ListTodo, HelpCircle } from "lucide-react";

export const NAV = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, accent: "var(--accent-dashboard)" },
  { id: "budget", label: "Budget", icon: Wallet, accent: "var(--accent-budget)" },
  { id: "decisions", label: "Decisions", icon: ListChecks, accent: "var(--accent-decisions)" },
  { id: "tasks", label: "Tasks", icon: ListTodo, accent: "var(--accent-tasks)" },
  { id: "faq", label: "FAQ", icon: HelpCircle, accent: "var(--accent-faq)" },
];

function SyncBadge({ synced }) {
  return (
    <span className={"mt-sync-badge" + (synced ? " on" : "")}>
      <span className="mt-sync-dot" /> {synced ? "Synced" : "Local only"}
    </span>
  );
}

export default function AppShell({ tab, setTab, synced, children }) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="mt-shell">
      <aside className="mt-sidebar">
        <div className="mt-brand">Copenhagen Move</div>
        <nav className="mt-sidebar-nav">
          {NAV.map((n) => (
            <button
              key={n.id}
              className={"mt-sidebar-item" + (tab === n.id ? " active" : "")}
              style={{ "--item-accent": n.accent }}
              onClick={() => setTab(n.id)}
            >
              <n.icon size={17} /> {n.label}
            </button>
          ))}
        </nav>
        <div className="mt-sidebar-footer">
          <SyncBadge synced={synced} />
        </div>
      </aside>

      <div className="mt-content-area">
        <div className="mt-topbar">
          <div className="mt-brand">Copenhagen Move</div>
          <SyncBadge synced={synced} />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            {children}
          </motion.div>
        </AnimatePresence>

        <nav className="mt-bottom-nav">
          {NAV.map((n) => (
            <button
              key={n.id}
              className={"mt-bottom-nav-item" + (tab === n.id ? " active" : "")}
              style={{ "--item-accent": n.accent }}
              onClick={() => setTab(n.id)}
            >
              <n.icon size={19} /> {n.label}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
