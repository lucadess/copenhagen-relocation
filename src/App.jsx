import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient.js";
import { storage, defaultData, STORAGE_KEY, TABLE, migrateLegacyTimeline } from "./lib/storage.js";
import { getStoredAuth, setStoredAuth, checkCredentials } from "./lib/auth.js";
import AppShell from "./components/AppShell.jsx";
import Toast from "./components/Toast.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Budget from "./pages/Budget.jsx";
import Decisions from "./pages/Decisions.jsx";
import Tasks from "./pages/Tasks.jsx";
import Faq from "./pages/Faq.jsx";

const PAGES = { dashboard: Dashboard, budget: Budget, decisions: Decisions, tasks: Tasks, faq: Faq };

export default function App() {
  const [data, setData] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState("dashboard");
  const [authed, setAuthed] = useState(getStoredAuth);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await storage.get(STORAGE_KEY);
        let merged = res && res.value ? { ...defaultData, ...JSON.parse(res.value) } : defaultData;
        const migrated = migrateLegacyTimeline(merged);
        if (migrated) {
          merged = migrated;
          storage.set(STORAGE_KEY, JSON.stringify(merged));
        }
        if (!cancelled) setData(merged);
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
      .channel(TABLE + "_" + STORAGE_KEY)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: TABLE, filter: "id=eq." + STORAGE_KEY },
        (payload) => {
          if (payload.new && payload.new.data) {
            setData({ ...defaultData, ...payload.new.data });
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  function update(patch) {
    if (!authed) {
      setToast({ id: Date.now(), message: "You should be part of the MILU household to make changes." });
      return false;
    }
    // Resolve against the freshest state via the functional updater, not the
    // `data` closure — a stale closure (e.g. a delayed undo callback, or two
    // edits racing the realtime sync) would otherwise silently clobber
    // whatever changed in between.
    setData((prev) => {
      const next = { ...prev, ...(typeof patch === "function" ? patch(prev) : patch) };
      storage.set(STORAGE_KEY, JSON.stringify(next)).catch((e) => console.error("storage error", e));
      return next;
    });
    return true;
  }

  function showUndo(message, onUndo) {
    setToast({ id: Date.now(), message, actionLabel: "Undo", onAction: onUndo });
  }

  function login(username, password) {
    if (!checkCredentials(username, password)) return false;
    setAuthed(true);
    setStoredAuth(true);
    return true;
  }
  function logout() {
    setAuthed(false);
    setStoredAuth(false);
  }

  if (!loaded || !data) {
    return <div className="mt-loading">Loading…</div>;
  }

  const Page = PAGES[tab];

  return (
    <>
      <AppShell tab={tab} setTab={setTab} synced={!!supabase} authed={authed} onLogin={login} onLogout={logout}>
        <Page data={data} update={update} onNavigate={setTab} authed={authed} showUndo={showUndo} />
      </AppShell>
      <Toast toast={toast} onDone={() => setToast(null)} />
    </>
  );
}
