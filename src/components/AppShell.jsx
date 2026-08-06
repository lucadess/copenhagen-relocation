import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { LayoutDashboard, Wallet, ListChecks, ListTodo, HelpCircle, LogOut } from "lucide-react";
import Modal from "./Modal.jsx";

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

function AuthControl({ authed, onLogin, onLogout }) {
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function closeModal() {
    setOpen(false);
    setUsername("");
    setPassword("");
    setError("");
  }

  function submit(e) {
    e.preventDefault();
    if (onLogin(username, password)) {
      closeModal();
    } else {
      setError("Incorrect username or password.");
    }
  }

  if (authed) {
    return (
      <button className="mt-auth-badge on" onClick={onLogout} title="Log out">
        MILU <LogOut size={12} />
      </button>
    );
  }

  return (
    <>
      <button className="mt-auth-badge" onClick={() => setOpen(true)}>Log in</button>
      <Modal open={open} onClose={closeModal} title="MILU household login" accent="var(--accent-dashboard)">
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input
            className="mt-input" placeholder="Username" value={username} autoFocus
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            className="mt-input" type="password" placeholder="Password" value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <div style={{ color: "#D14343", fontSize: 12.5 }}>{error}</div>}
          <button className="mt-btn primary" type="submit">Log in</button>
        </form>
      </Modal>
    </>
  );
}

export default function AppShell({ tab, setTab, synced, authed, onLogin, onLogout, children }) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="mt-shell">
      <header className="mt-topbar">
        <div className="mt-brand">Copenhagen Move</div>

        <nav className="mt-topnav">
          {NAV.map((n) => (
            <button
              key={n.id}
              className={"mt-topnav-item" + (tab === n.id ? " active" : "")}
              style={{ "--item-accent": n.accent }}
              onClick={() => setTab(n.id)}
            >
              <n.icon size={16} /> {n.label}
            </button>
          ))}
        </nav>

        <div className="mt-topbar-actions">
          <SyncBadge synced={synced} />
          <AuthControl authed={authed} onLogin={onLogin} onLogout={onLogout} />
        </div>
      </header>

      <div className="mt-content-area">
        <motion.div
          key={tab}
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
        >
          {children}
        </motion.div>

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
