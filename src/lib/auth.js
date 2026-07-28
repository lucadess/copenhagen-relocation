// Soft client-side gate, not real security — this is a private two-person
// planning app with an already-public Supabase anon key (see supabase/schema.sql).
// This just keeps casual visitors from accidentally editing shared data.
const AUTH_KEY = "cph-move-tracker-auth";
const AUTH_USER = "milu";
const AUTH_PASS = "5822";

export function getStoredAuth() {
  try {
    return localStorage.getItem(AUTH_KEY) === "true";
  } catch (e) {
    return false;
  }
}

export function setStoredAuth(value) {
  try {
    if (value) localStorage.setItem(AUTH_KEY, "true");
    else localStorage.removeItem(AUTH_KEY);
  } catch (e) {
    // ignore
  }
}

export function checkCredentials(username, password) {
  return username === AUTH_USER && password === AUTH_PASS;
}
