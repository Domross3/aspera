-- Phase B-2 baseline: lock down access via RLS + accommodate continuous mood values.
-- See aspera/src/components/common/ContinuousSlider.tsx — mood/energy now arrive
-- as 0.1-step floats. The original smallint columns would reject them.

-- 1. Mood precision: float-capable (numeric(2,1) allows 1.0 .. 9.9)
ALTER TABLE public.mood_entries
  DROP CONSTRAINT IF EXISTS mood_entries_mood_check,
  DROP CONSTRAINT IF EXISTS mood_entries_energy_check,
  DROP CONSTRAINT IF EXISTS mood_entries_stress_check;

ALTER TABLE public.mood_entries
  ALTER COLUMN mood TYPE numeric(2,1) USING mood::numeric(2,1),
  ALTER COLUMN energy TYPE numeric(2,1) USING energy::numeric(2,1),
  ALTER COLUMN stress TYPE numeric(2,1) USING stress::numeric(2,1);

ALTER TABLE public.mood_entries
  ADD CONSTRAINT mood_entries_mood_check CHECK (mood >= 1.0 AND mood <= 5.0),
  ADD CONSTRAINT mood_entries_energy_check CHECK (energy >= 1.0 AND energy <= 5.0),
  ADD CONSTRAINT mood_entries_stress_check CHECK (stress >= 1.0 AND stress <= 5.0);

-- 2. Source column on mood_entries — distinguish quick captures from full captures.
-- Mirrors MoodCheckIn.source in src/types/index.ts. Nullable for backward compat.
ALTER TABLE public.mood_entries
  ADD COLUMN IF NOT EXISTS source text
    CHECK (source IS NULL OR source IN ('quick', 'full'));

-- 3. Enable RLS on every public table.
ALTER TABLE public.users             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_logs        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mood_entries      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.browsing_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_tokens       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_cache      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiments       ENABLE ROW LEVEL SECURITY;

-- 4. Policies. Service-role bypasses RLS, so /api/* server routes still work.
--    Authenticated users see only their own rows.

-- users — read/update own profile row
CREATE POLICY users_select_own ON public.users
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY users_update_own ON public.users
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- daily_logs — full CRUD scoped to owner
CREATE POLICY daily_logs_select_own ON public.daily_logs
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY daily_logs_insert_own ON public.daily_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY daily_logs_update_own ON public.daily_logs
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY daily_logs_delete_own ON public.daily_logs
  FOR DELETE USING (auth.uid() = user_id);

-- mood_entries — full CRUD scoped to owner
CREATE POLICY mood_entries_select_own ON public.mood_entries
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY mood_entries_insert_own ON public.mood_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY mood_entries_update_own ON public.mood_entries
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY mood_entries_delete_own ON public.mood_entries
  FOR DELETE USING (auth.uid() = user_id);

-- push_tokens — owner CRUD
CREATE POLICY push_tokens_select_own ON public.push_tokens
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY push_tokens_insert_own ON public.push_tokens
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY push_tokens_update_own ON public.push_tokens
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY push_tokens_delete_own ON public.push_tokens
  FOR DELETE USING (auth.uid() = user_id);

-- experiments — owner CRUD
CREATE POLICY experiments_select_own ON public.experiments
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY experiments_insert_own ON public.experiments
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY experiments_update_own ON public.experiments
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY experiments_delete_own ON public.experiments
  FOR DELETE USING (auth.uid() = user_id);

-- browsing_sessions — read-only for owner; writes happen via service-role
-- (Chrome extension relay at /api/browsing uses supabaseAdmin which bypasses RLS).
CREATE POLICY browsing_sessions_select_own ON public.browsing_sessions
  FOR SELECT USING (auth.uid() = user_id);

-- search_cache: no policies at all. RLS on + no policies = no access for
-- anon or authenticated. Service role still works (bypasses RLS).

-- 5. Auto-create the public.users mirror row when a new auth.users row appears.
-- Triggered on Apple Sign In (or any future auth provider) so foreign-key
-- references from daily_logs/mood_entries/etc. resolve immediately.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
