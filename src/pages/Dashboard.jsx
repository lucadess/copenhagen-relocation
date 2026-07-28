import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ListChecks, Circle, CheckCircle2 } from "lucide-react";
import Card from "../components/Card.jsx";
import Modal from "../components/Modal.jsx";
import {
  MOVE_DAY, BASE_BUDGET, MONTHS, TASK_CATEGORY_COLORS, formatDate, formatDateRange, monthIndexForDate,
  STATUS_STYLE,
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

// Gantt geometry: the whole 7-month window expressed as a day count, so bars
// can be positioned with day-level precision instead of snapping to months.
const TIMELINE_START = new Date(MONTHS[0].yearNum, MONTHS[0].monthIndex, 1);
const LAST_MONTH = MONTHS[MONTHS.length - 1];
const TIMELINE_END = new Date(LAST_MONTH.yearNum, LAST_MONTH.monthIndex + 1, 0);
const TIMELINE_DAYS = Math.round((TIMELINE_END - TIMELINE_START) / 86400000) + 1;

function dateToOffset(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return Math.round((d - TIMELINE_START) / 86400000);
}
function offsetToPct(offset) {
  return (offset / TIMELINE_DAYS) * 100;
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

export default function Dashboard({ data, onNavigate }) {
  const [modal, setModal] = useState(null);

  const daysLeft = daysUntil(MOVE_DAY);

  const totalCosts = data.budget.costs.reduce((s, c) => s + Number(c.amount || 0), 0);
  const totalExtras = data.budget.extras.reduce((s, e) => s + Number(e.amount || 0), 0);
  const remaining = BASE_BUDGET - totalCosts + totalExtras;
  const spentPct = Math.min(100, (totalCosts / (BASE_BUDGET + totalExtras || 1)) * 100);

  const decidedCount = data.decisions.filter((d) => d.status === "Decided").length;
  const doneTasks = data.tasks.filter((t) => t.status === "Done").length;
  const totalItems = data.decisions.length + data.tasks.length;
  const overallProgress = totalItems === 0 ? 0 : Math.round(((decidedCount + doneTasks) / totalItems) * 100);

  const upcomingTasks = data.tasks
    .filter((t) => t.status !== "Done")
    .sort((a, b) => (a.deadline || "9999-99-99").localeCompare(b.deadline || "9999-99-99"))
    .slice(0, 3);

  const recentDecisions = [...data.decisions].slice(-3).reverse();

  const curMonthIdx = currentMonthIndex();

  const relevantDecisions = data.decisions.filter((d) => monthIndexForDate(d.deadline) !== -1);
  const relevantTasks = data.tasks.filter((t) => monthIndexForDate(t.deadline) !== -1);
  const hasTimelineItems = relevantDecisions.length > 0 || relevantTasks.length > 0;

  const monthGroups = MONTHS.map((m, i) => ({
    month: m,
    idx: i,
    isCurrent: i === curMonthIdx,
    decisionsHere: relevantDecisions.filter((d) => monthIndexForDate(d.deadline) === i),
    tasksHere: relevantTasks.filter((t) => monthIndexForDate(t.deadline) === i),
  })).filter((g) => g.decisionsHere.length > 0 || g.tasksHere.length > 0);

  const todayOffset = dateToOffset(new Date().toISOString().slice(0, 10));
  const todayPct = todayOffset >= 0 && todayOffset < TIMELINE_DAYS ? offsetToPct(todayOffset) : null;

  const ganttItems = [
    ...relevantDecisions.map((d) => {
      const offset = dateToOffset(d.deadline);
      return { key: "d" + d.id, type: "decision", item: d, milestone: true, startOffset: offset, endOffset: offset, color: "var(--accent-decisions)" };
    }),
    ...relevantTasks.map((t) => {
      const endOffset = dateToOffset(t.deadline);
      const hasStart = !!t.startDate;
      const startOffset = hasStart ? Math.min(dateToOffset(t.startDate), endOffset) : endOffset;
      return { key: "t" + t.id, type: "task", item: t, milestone: !hasStart, startOffset, endOffset, color: TASK_CATEGORY_COLORS[t.category] };
    }),
  ].sort((a, b) => a.startOffset - b.startOffset || a.endOffset - b.endOffset);

  function openInPage(page) {
    setModal(null);
    onNavigate?.(page);
  }

  return (
    <div className="mt-page" style={{ "--accent": "var(--accent-dashboard)" }}>
      <h1 className="mt-page-title">Dashboard</h1>

      <div className="mt-top-row">
        <div className="mt-stat-row">
          <Card className="mt-stat-card">
            <div className="mt-stat-num">{daysLeft}</div>
            <div className="mt-stat-label">days to move day</div>
          </Card>
        </div>

        <Card className="mt-progress-card">
          <h2 className="mt-card-title">Overall progress</h2>
          <ProgressBar pct={overallProgress} />
          <div className="mt-mini-card-sub" style={{ marginTop: 8 }}>
            {overallProgress}% of decisions and tasks resolved
          </div>
        </Card>
      </div>

      <div className="mt-snapshot-grid">
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

        <Card className="mt-mini-card" style={{ "--mini-accent": "var(--accent-tasks)" }}>
          <div className="mt-mini-card-label">Upcoming tasks</div>
          {upcomingTasks.length === 0 && <div className="mt-empty">No tasks yet — add one in Tasks.</div>}
          {upcomingTasks.map((t) => (
            <div key={t.id} className="mt-priority-item" style={{ background: "none", padding: "4px 0" }}>
              <span className="dot" style={{ background: isOverdue(t.deadline) ? "#D14343" : TASK_CATEGORY_COLORS[t.category] }} />
              <span className="title">{t.title}</span>
              <span className="meta">{isOverdue(t.deadline) ? "Overdue" : formatDate(t.deadline)}</span>
            </div>
          ))}
        </Card>
      </div>

      <Card>
        <h2 className="mt-card-title">Timeline</h2>
        <p className="mt-page-intro" style={{ margin: "-6px 0 0" }}>
          Every decision and task with a deadline, laid out across the move. Click one to see details or jump to it.
        </p>
        <div className="mt-legend">
          {Object.entries(TASK_CATEGORY_COLORS).map(([label, color]) => (
            <div key={label} className="mt-legend-item"><span className="mt-legend-dot" style={{ background: color }} />{label}</div>
          ))}
          <div className="mt-legend-item"><span className="mt-legend-dot" style={{ background: "var(--accent-decisions)" }} />Decisions</div>
        </div>

        {!hasTimelineItems && <div className="mt-empty">No decisions or tasks with dates yet.</div>}

        {hasTimelineItems && (
          <>
            {/* Mobile / narrow screens: vertical roadmap grouped by month */}
            <div className="mt-roadmap">
              {monthGroups.map((g) => (
                <div key={g.idx}>
                  <div className="mt-roadmap-month">
                    {g.month.label} '{g.month.year}{g.isCurrent && <span className="mt-roadmap-today"> · today</span>}
                  </div>

                  {g.decisionsHere.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      className="mt-roadmap-entry"
                      style={{ "--entry-accent": "var(--accent-decisions)" }}
                      onClick={() => setModal({ type: "decision", item: d })}
                    >
                      <ListChecks size={15} className="mt-roadmap-marker" />
                      <div>
                        <div className="mt-roadmap-label">{d.title}</div>
                        <div className="mt-roadmap-entry-tag">Decision · {d.status}</div>
                      </div>
                    </button>
                  ))}

                  {g.tasksHere.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      className="mt-roadmap-entry"
                      style={{ "--entry-accent": TASK_CATEGORY_COLORS[t.category] }}
                      onClick={() => setModal({ type: "task", item: t })}
                    >
                      <div className="mt-roadmap-marker"><div className="mt-roadmap-dot" style={{ background: TASK_CATEGORY_COLORS[t.category] }} /></div>
                      <div>
                        <div className="mt-roadmap-label">{t.title}</div>
                        <div className="mt-roadmap-entry-tag">{t.category} · {t.status}</div>
                      </div>
                    </button>
                  ))}
                </div>
              ))}
            </div>

            {/* Wider screens: Gantt-style timeline with real day-level positioning */}
            <div className="mt-gantt-wrap">
              <div className="mt-gantt">
                <div className="mt-gantt-corner" />
                <div className="mt-gantt-header">
                  {MONTHS.map((m, i) => (
                    <div key={i} className={"mt-gantt-month-label" + (i === curMonthIdx ? " current" : "")}>{m.label} '{m.year}</div>
                  ))}
                </div>

                {ganttItems.map((g) => {
                  const clampedStart = Math.max(0, g.startOffset);
                  const clampedEnd = Math.min(TIMELINE_DAYS - 1, g.endOffset);
                  const leftPct = offsetToPct(clampedStart);
                  const widthPct = Math.max(offsetToPct(clampedEnd - clampedStart + 1), 1.4);
                  const pointPct = offsetToPct(clampedEnd);
                  const onClick = () => setModal({ type: g.type, item: g.item });

                  return (
                    <div className="mt-gantt-row" key={g.key}>
                      <button type="button" className="mt-gantt-row-label" onClick={onClick} title={g.item.title}>
                        {g.item.title}
                      </button>
                      <div className="mt-gantt-row-track">
                        {MONTHS.map((_, mi) => <div key={mi} className="mt-gantt-cell" />)}
                        {g.milestone ? (
                          <button
                            type="button"
                            className={"mt-gantt-milestone" + (g.type === "task" ? " square" : "")}
                            style={{ left: pointPct + "%", background: g.color }}
                            onClick={onClick}
                            title={g.item.title}
                          />
                        ) : (
                          <button
                            type="button"
                            className="mt-gantt-bar"
                            style={{ left: leftPct + "%", width: widthPct + "%", background: g.color }}
                            onClick={onClick}
                          >
                            {g.item.title}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {todayPct !== null && (
                  <div
                    className="mt-gantt-today-line"
                    style={{ left: `calc(var(--gantt-label-w) + (100% - var(--gantt-label-w)) * ${todayPct / 100})` }}
                  />
                )}
              </div>
            </div>
          </>
        )}
      </Card>

      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal?.item.title}
        accent={modal?.type === "decision" ? "var(--accent-decisions)" : TASK_CATEGORY_COLORS[modal?.item.category]}
      >
        {modal?.type === "decision" && (
          <>
            <div className="mt-decision-badges">
              <span className="mt-badge">{formatDate(modal.item.deadline)}</span>
              <span className="mt-badge" style={{ background: STATUS_STYLE[modal.item.status].bg, color: STATUS_STYLE[modal.item.status].fg }}>{modal.item.status}</span>
            </div>
            <div className="mt-option-grid">
              {modal.item.options.map((o) => (
                <div key={o.id} className={"mt-option-chip" + (modal.item.finalDecisionId === o.id ? " chosen" : "")} style={{ cursor: "default" }}>
                  {modal.item.finalDecisionId === o.id ? <CheckCircle2 size={15} color="var(--accent-decisions)" /> : <Circle size={15} color="#D8D3CC" />}
                  {o.text}
                </div>
              ))}
            </div>
            {modal.item.notes && <div className="mt-decision-notes">{modal.item.notes}</div>}
            <div className="mt-modal-actions">
              <button className="mt-btn primary" style={{ background: "var(--accent-decisions)", borderColor: "var(--accent-decisions)" }} onClick={() => openInPage("decisions")}>
                Open in Decisions →
              </button>
            </div>
          </>
        )}
        {modal?.type === "task" && (
          <>
            {modal.item.description && <div className="mt-modal-sub">{modal.item.description}</div>}
            <div className="mt-decision-badges" style={{ marginTop: 10 }}>
              <span className="mt-badge" style={{ background: `color-mix(in srgb, ${TASK_CATEGORY_COLORS[modal.item.category]} 18%, white)`, color: TASK_CATEGORY_COLORS[modal.item.category] }}>{modal.item.category}</span>
              <span className="mt-badge" style={{ background: STATUS_STYLE[modal.item.status].bg, color: STATUS_STYLE[modal.item.status].fg }}>{modal.item.status}</span>
              <span className="mt-badge">{formatDateRange(modal.item.startDate, modal.item.deadline)}</span>
            </div>
            {modal.item.actor && <div className="mt-modal-sub" style={{ marginTop: 8 }}>Assigned to <strong>{modal.item.actor}</strong></div>}
            <div className="mt-modal-actions">
              <button className="mt-btn primary" style={{ background: TASK_CATEGORY_COLORS[modal.item.category], borderColor: TASK_CATEGORY_COLORS[modal.item.category] }} onClick={() => openInPage("tasks")}>
                Open in Tasks →
              </button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
