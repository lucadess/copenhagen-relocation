# Copenhagen Move Tracker

A small React app (Dashboard/Gantt, Budget, Decisions, FAQ) for planning the move
from the Netherlands to Copenhagen.

By default data is saved in the browser's `localStorage` (local to one device).
Set up Supabase (below) to make it a shared, synced tracker between you and
Midori instead — changes on one device show up live on the other.

## 1. Set up Supabase (optional but recommended)

1. Create a free project at https://supabase.com
2. In your project: **SQL Editor → New query**, paste the contents of
   `supabase/schema.sql` from this repo, and click **Run**. This creates the
   table the app reads/writes and turns on realtime sync for it.
3. Go to **Project Settings → API** and copy the **Project URL** and the
   **anon public** key.
4. Copy `.env.example` to `.env.local` and fill in those two values:
   ```
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-public-key
   ```
5. When you deploy to Netlify, add the same two variables under
   **Site configuration → Environment variables** (Vite bakes them in at
   build time, so they need to be set there too, not just locally).

If you skip this, the app still works fine — it just falls back to
`localStorage` and shows "Local only" in the header instead of "Synced".

**Security note:** this setup has no login. Anyone with your Supabase anon
key and URL could read or write this table. That's fine for a private
two-person planning tool, but don't reuse this Supabase project for anything
sensitive, and don't publish the URL/key anywhere public.

## 2. Run locally

```bash
npm install
npm run dev
```

Then open the URL it prints (usually http://localhost:5173).

## 3. Deploy to Netlify

You need a free Netlify account (https://app.netlify.com).

### Option A — drag and drop (fastest, no Git required)

1. `npm install`
2. `npm run build` — this creates a `dist/` folder
3. Go to https://app.netlify.com/drop
4. Drag the `dist` folder onto the page
5. Netlify gives you a live URL immediately

Note: with this method, redeploying after a change means repeating steps 1–4.

### Option B — connect a Git repo (recommended, auto-deploys on every push)

1. Push this folder to a new GitHub (or GitLab/Bitbucket) repository
2. In Netlify: **Add new site → Import an existing project**
3. Pick the repo
4. Build settings (Netlify should auto-detect these from `netlify.toml`, but in case it asks):
   - Build command: `npm run build`
   - Publish directory: `dist`
5. Click **Deploy** — Netlify builds it and gives you a live URL
6. From then on, every `git push` redeploys automatically

### Option C — Netlify CLI

```bash
npm install -g netlify-cli
npm run build
netlify deploy --prod
```

## Notes

- With Supabase configured, both of you see the same data, synced live via
  Supabase's realtime feature — no refresh needed.
- Without Supabase configured, data is per-browser/per-device only.
- If two edits happen at the exact same moment, the later write wins (no
  conflict merging) — fine for how this is actually used, but worth knowing.
