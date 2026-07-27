import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Plus, Trash2, Pencil, Check, ExternalLink, Search, ChevronDown } from "lucide-react";
import Card from "../components/Card.jsx";
import { uid } from "../lib/storage.js";

export default function Faq({ data, update }) {
  const [editingId, setEditingId] = useState(null);
  const [openId, setOpenId] = useState(null);
  const [query, setQuery] = useState("");
  const reduceMotion = useReducedMotion();

  function set(id, patch) {
    update({ faq: data.faq.map((f) => (f.id === id ? { ...f, ...patch } : f)) });
  }
  function add() {
    const newId = uid();
    update({ faq: [...data.faq, { id: newId, question: "New question", answer: "", url: "" }] });
    setEditingId(newId);
    setOpenId(newId);
  }
  function remove(id) {
    update({ faq: data.faq.filter((f) => f.id !== id) });
    if (editingId === id) setEditingId(null);
  }

  const q = query.trim().toLowerCase();
  const filtered = q
    ? data.faq.filter((f) => f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q))
    : data.faq;

  return (
    <div className="mt-page" style={{ "--accent": "var(--accent-faq)", "--on-accent": "var(--ink)" }}>
      <h1 className="mt-page-title">FAQ</h1>
      <p className="mt-page-intro">Your personal relocation knowledge base — search it, or add what you learn along the way.</p>

      <div className="mt-faq-search">
        <Search size={16} />
        <input placeholder="Search the FAQ…" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {filtered.map((f) => {
          const isOpen = openId === f.id;
          return (
            <Card key={f.id} className="mt-faq-item" onClick={() => editingId !== f.id && setOpenId(isOpen ? null : f.id)}>
              {editingId === f.id ? (
                <div onClick={(e) => e.stopPropagation()}>
                  <div className="mt-form-row">
                    <input className="mt-input mt-input-strong" value={f.question} onChange={(e) => set(f.id, { question: e.target.value })} />
                  </div>
                  <textarea className="mt-input mt-textarea" placeholder="Answer / note" value={f.answer} onChange={(e) => set(f.id, { answer: e.target.value })} style={{ marginBottom: 8, marginTop: 8 }} />
                  <input className="mt-input" placeholder="Link (optional)" value={f.url} onChange={(e) => set(f.id, { url: e.target.value })} />
                  <div className="mt-card-actions" style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 10 }}>
                    <button className="mt-icon-btn" onClick={() => setEditingId(null)}><Check size={15} /></button>
                    <button className="mt-icon-btn" onClick={() => remove(f.id)}><Trash2 size={15} /></button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mt-faq-question">
                    <span>{f.question}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                      <button className="mt-icon-btn" onClick={() => setEditingId(f.id)}><Pencil size={14} /></button>
                      <button className="mt-icon-btn" onClick={() => remove(f.id)}><Trash2 size={14} /></button>
                      <motion.span
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        transition={{ duration: 0.15 }}
                        style={{ display: "inline-flex", color: "var(--muted)" }}
                      >
                        <ChevronDown size={18} />
                      </motion.span>
                    </div>
                  </div>
                  <AnimatePresence initial={false}>
                    {isOpen && (f.answer || f.url) && (
                      <motion.div
                        key="content"
                        initial={reduceMotion ? false : { height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={reduceMotion ? undefined : { height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        style={{ overflow: "hidden" }}
                      >
                        <div className="mt-faq-answer-inner">
                          {f.answer}
                          {f.url && (
                            <div>
                              <a className="mt-link" href={f.url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "var(--ink)", textDecoration: "underline", fontWeight: 600, marginTop: 8 }}>
                                <ExternalLink size={12} /> {f.url}
                              </a>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}
            </Card>
          );
        })}
        {filtered.length === 0 && <div className="mt-empty">No matching entries.</div>}
      </div>
      <button className="mt-btn primary" onClick={add}><Plus size={14} /> Add entry</button>
    </div>
  );
}
