-- 007_waitlist — beta email capture for the public landing page.
-- Written only by the server-side service-role route (/api/waitlist), which
-- bypasses RLS. RLS on + no policies + revoked grants = locked to anon/auth
-- (mirrors search_cache and the browsing-writes pattern in migrations 002 + 003).
create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (char_length(email) <= 320),
  source text,
  created_at timestamptz not null default now()
);

alter table public.waitlist enable row level security;
revoke all on public.waitlist from anon, authenticated;
