-- Run this once in your Supabase project's SQL editor
-- (Dashboard -> SQL Editor -> New query -> paste -> Run)

create table if not exists move_tracker (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table move_tracker enable row level security;

-- This app has no login system — it's meant for you and Midori to share via
-- a private link + the anon key, not for public access. These policies allow
-- anyone with your Supabase anon key to read/write this one table. Don't
-- reuse this Supabase project for anything sensitive.
create policy "Allow anon read" on move_tracker
  for select using (true);

create policy "Allow anon insert" on move_tracker
  for insert with check (true);

create policy "Allow anon update" on move_tracker
  for update using (true);

-- Enable realtime updates for this table (safe to run even if already set)
alter publication supabase_realtime add table move_tracker;
