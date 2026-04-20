-- Aspera initial schema
-- 001_init.sql — 2026-04-17
--
-- Tables:
--   users              (profile row mirroring auth.users)
--   daily_logs         (one row per user per date, DailyLog stored as JSONB)
--   mood_entries       (append-only mood check-ins)
--   browsing_sessions  (Chrome extension posts; user_id nullable until extension auth)
--   push_tokens        (Expo push tokens per user)
--   search_cache       (content-addressed cache for /api/search responses)
--   experiments        (N-of-1 experiment definitions)
--
-- RLS is NOT enabled in this migration. See DOM-20 for RLS rollout.

create extension if not exists "pgcrypto";

-- ── users ──────────────────────────────────────────────────────────────
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── daily_logs ─────────────────────────────────────────────────────────
create table if not exists public.daily_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, date)
);

create index if not exists daily_logs_user_date_idx
  on public.daily_logs (user_id, date desc);

-- ── mood_entries ───────────────────────────────────────────────────────
create table if not exists public.mood_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  timestamp timestamptz not null,
  mood smallint not null check (mood between 1 and 5),
  energy smallint not null check (energy between 1 and 5),
  stress smallint not null check (stress between 1 and 5),
  note text,
  created_at timestamptz not null default now()
);

create index if not exists mood_entries_user_ts_idx
  on public.mood_entries (user_id, timestamp desc);

-- ── browsing_sessions ──────────────────────────────────────────────────
-- user_id nullable: extension auth is a shared secret for now (see DOM-13).
-- Once extension links to a user, this becomes NOT NULL.
create table if not exists public.browsing_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  date date not null,
  tabs jsonb not null,
  received_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists browsing_sessions_user_date_idx
  on public.browsing_sessions (user_id, date desc);

-- ── push_tokens ────────────────────────────────────────────────────────
create table if not exists public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  expo_token text unique not null,
  platform text,
  registered_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists push_tokens_user_idx
  on public.push_tokens (user_id);

-- ── search_cache ───────────────────────────────────────────────────────
-- Content-addressed: hash inputs (user_id + query + date range + logs digest)
-- so identical queries hit cache. Server-role writes only.
create table if not exists public.search_cache (
  id uuid primary key default gen_random_uuid(),
  query_hash text unique not null,
  query text not null,
  response jsonb not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz
);

create index if not exists search_cache_expires_idx
  on public.search_cache (expires_at);

-- ── experiments ────────────────────────────────────────────────────────
create table if not exists public.experiments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  hypothesis text not null,
  target_variable text not null,
  control_days int not null,
  intervention_days int not null,
  started_at date,
  ended_at date,
  status text not null default 'planning'
    check (status in ('planning', 'active', 'completed', 'cancelled')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists experiments_user_status_idx
  on public.experiments (user_id, status);

-- ── updated_at trigger ─────────────────────────────────────────────────
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger users_touch_updated_at
  before update on public.users
  for each row execute function public.touch_updated_at();

create trigger daily_logs_touch_updated_at
  before update on public.daily_logs
  for each row execute function public.touch_updated_at();

create trigger push_tokens_touch_updated_at
  before update on public.push_tokens
  for each row execute function public.touch_updated_at();

create trigger experiments_touch_updated_at
  before update on public.experiments
  for each row execute function public.touch_updated_at();
