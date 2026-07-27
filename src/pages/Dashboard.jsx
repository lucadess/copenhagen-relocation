import { motion, useReducedMotion } from "framer-motion";
import Card from "../components/Card.jsx";
import {
  MOVE_DAY, BASE_BUDGET, MONTHS, GANTT_CATEGORIES, GANTT_PHASES, formatDate,
} from "../lib/storage.js";

function daysUntil(date) {
  return Math.max(0, Math.ceil((date - new Date()) / 86400000));
}

function isOverdue(deadline) {
  if (!deadline) return false;
  return new Date(deadline + "T23:59:59") < new Date();
}

function currentMonthIndex() {
  const now = new Date();
  return MONTHS.findIndex((m) => m.yearNum === now.getFullYear() && m.monthIndex === now.getMonth());
}

function ProgressBar({ pct }) {
  const reduceMotion = useReducedMotion();
  return (
    <div className="mt-progress-track">
      <motion.div
        className="mt-progress-fill"
        initial={reduceMotion ? false : { width: 0 }}
        animate={{ width: pct + "%" }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      />
    </div>
  );
}

export default function Dashboard({ data }) {
  const daysLeft = daysUntil(MOVE_DAY);

  const totalCosts = data.budget.costs.reduce((s, c) => s + Number(c.amount || 0), 0);
  const totalExtras = data.budget.extras.reduce((s, e) => s + Number(e.amount || 0), 0);
  const remaining = BASE_BUDGET - totalCosts + totalExtras;
  const spentPct = Math.min(100, (totalCosts / (BASE_BUDGET + totalExtras || 1)) * 100);

  const decidedCount = data.decisions.filter((d) => d.status === "Decided").length;
  const doneTasks = data.tasks.filter((t) => t.status === "Done").length;
  const totalItems = data.decisions.length + data.tasks.length;
  const overallProgress = totalItems === 0 ? 0 : Math.round(((decidedCount + doneTasks) / totalItems) * 100);

  const openTasks = data.tasks
    .filter((t) => t.status !== "Done")
    .sort((a, b) => (a.deadline || "9999-99-99").localeCompare(b.deadline || "9999-99-99"));
  const todaysPriorities = openTasks.filter((t) => isOverdue(t.deadline)).slice(0, 3);
  const upcomingTasks = openTasks.slice(0, 3);

  const now = new Date();
  const weekEnd = new Date(now.getTime() + 7 * 86400000);
  const thisWeekTasks = data.tasks.filter((t) => {
    if (!t.deadline) return false;
    const d = new Date(t.deadline + "T00:00:00");
    return d >= now && d <= weekEnd;
  });
  const thisWeekDone = thisWeekTasks.filter((t) => t.status === "Done").length;
  const weekPct = thisWeekTasks.length === 0 ? 0 : Math.round((thisWeekDone / thisWeekTasks.length) * 100);

  const recentDecisions = [...data.decisions].slice(-3).reverse();

  const curMonthIdx = currentMonthIndex();
  const monthGroups = MONTHS.map((m, i) => ({
    month: m,
    isCurrent: i === curMonthIdx,
    phases: GANTT_PHASES.filter((p) => p.start === i),
  })).filter((g) => g.phases.length > 0);

  return (
    <div className="mt-page" style={{ "--accent": "var(--accent-dashboard)" }}>
      <h1 className="mt-page-title">Dashboard</h1>

      <div className="mt-stat-row">
        <Card className="mt-stat-card">
          <div className="mt-stat-num">{daysLeft}</div>
          <div className="mt-stat-label">days to move day</div>
        </Card>
        <Card className="mt-stat-card">
          <div className="mt-stat-num">€{remaining.toLocaleString()}</div>
          <div className="mt-stat-label">remaining of €{BASE_BUDGET.toLocaleString()}</div>
        </Card>
      </div>

      <Card>
        <h2 className="mt-card-title">Overall progress</h2>
        <ProgressBar pct={overallProgress} />
        <div className="mt-mini-card-sub" style={{ marginTop: 8 }}>
          {overallProgress}% of decisions and tasks resolved
        </div>
      </Card>

      <div className="mt-snapshot-grid">
        <Card className="mt-mini-card" style={{ "--mini-accent": "var(--accent-tasks)" }}>
          <div className="mt-mini-card-label">Today's priorities</div>
          {todaysPriorities.length === 0 && <div className="mt-empty">Nothing overdue — nice.</div>}
          {todaysPriorities.map((t) => (
            <div key={t.id} className="mt-priority-item" style={{ background: "none", padding: "4px 0" }}>
              <span className="dot" />
              <span className="title">{t.title}</span>
            </div>
          ))}
        </Card>

        <Card className="mt-mini-card" style={{ "--mini-accent": "var(--accent-budget)" }}>
          <div className="mt-mini-card-label">Budget snapshot</div>
          <div className="mt-mini-card-value">€{remaining.toLocaleString()}</div>
          <div className="mt-mini-card-sub">of €{(BASE_BUDGET + totalExtras).toLocaleString()} left</div>
          <div style={{ marginTop: 10 }}><ProgressBar pct={spentPct} /></div>
        </Card>

        <Card className="mt-mini-card" style={{ "--mini-accent": "var(--accent-decisions)" }}>
          <div className="mt-mini-card-label">Recent decisions</div>
          {recentDecisions.length === 0 && <div className="mt-empty">No decisions yet.</div>}
          {recentDecisions.map((d) => (
            <div key={d.id} className="mt-priority-item" style={{ background: "none", padding: "4px 0" }}>
              <span className="dot" />
              <span className="title">{d.title}</span>
              <span className="meta">{d.status}</span>
            </div>
          ))}
        </Card>
      </div>

      <div className="mt-snapshot-grid" style={{ gridTemplateColumns: "1fr" }}>
        <Card className="mt-mini-card" style={{ "--mini-accent": "var(--accent-tasks)" }}>
          <div className="mt-mini-card-label">Upcoming tasks</div>
          {upcomingTasks.length === 0 && <div className="mt-empty">No tasks yet — add one in Tasks.</div>}
          <div className="mt-priority-list" style={{ marginTop: 6 }}>
            {upcomingTasks.map((t) => (
              <div key={t.id} className="mt-priority-item">
                <span className="dot" />
                <span className="title">{t.title}</span>
                <span className="meta">{formatDate(t.deadline)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card style={{ "--accent": "var(--accent-dashboard)" }}>
        <h2 className="mt-card-title">This week</h2>
        {thisWeekTasks.length === 0 ? (
          <div className="mt-empty">No tasks due in the next 7 days.</div>
        ) : (
          <>
            <ProgressBar pct={weekPct} />
            <div className="mt-mini-card-sub" style={{ marginTop: 8 }}>
              {thisWeekDone} of {thisWeekTasks.length} tasks done this week
            </div>
          </>
        )}
      </Card>

      <Card>
        <h2 className="mt-card-title">Timeline</h2>
        <div className="mt-legend">
          {Object.entries(GANTT_CATEGORIES).map(([k, c]) => (
            <div key={k} className="mt-legend-item"><span className="mt-legend-dot" style={{ background: c.color }} />{c.label}</div>
          ))}
        </div>
        <div className="mt-roadmap">
          {monthGroups.map((g, gi) => (
            <div key={gi}>
              <div className="mt-roadmap-month">
                {g.month.label} '{g.month.year}{g.isCurrent && <span className="mt-roadmap-today"> · today</span>}
              </div>
              {g.phases.map((p) => {
                const cat = GANTT_CATEGORIES[p.cat];
                const isCurrent = curMonthIdx >= p.start && curMonthIdx <= p.end;
                return (
                  <div key={p.id} className={"mt-roadmap-phase" + (isCurrent ? " current" : "")}>
                    <div className="mt-roadmap-marker">
                      {p.milestone
                        ? <div className="mt-roadmap-diamond" style={{ background: cat.color }} />
                        : <div className="mt-roadmap-dot" style={{ background: cat.color }} />}
                    </div>
                    <div>
                      <div className="mt-roadmap-label">{p.label}</div>
                      <div className="mt-roadmap-cat">{cat.label}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
