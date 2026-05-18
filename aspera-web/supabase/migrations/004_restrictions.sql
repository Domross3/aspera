-- Phase 8: Restrictions table.
--
-- User-configured screen-time restrictions enforced via the Family Controls
-- + ManagedSettings frameworks on iOS. Two `kind`s in v1:
--   - "time_window" → shield specific categories between window_start and
--     window_end on the chosen weekdays
--   - "daily_limit" → shield specific categories after daily_limit_min of
--     usage in a calendar day
--
-- Restrictions are first-class entities; experiments REFERENCE them via the
-- separate experiments.restriction_refs uuid[] column (no FK — soft-deletion
-- friendly so historical experiments don't break if a restriction is later
-- removed).

CREATE TABLE IF NOT EXISTS restrictions (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind              text NOT NULL CHECK (kind IN ('time_window', 'daily_limit')),
  -- Apple's system category names that this restriction targets. We map the
  -- 14 categories Apple emits down to our locked 5 (Social / Entertainment /
  -- Productivity / Communication / Other) on the JS side; the DB stores
  -- whatever the client sends.
  categories        text[] NOT NULL DEFAULT '{}',
  -- time_window: HH:MM as TEXT (we don't use postgres `time` because the JS
  -- layer already speaks "HH:MM" strings everywhere — keep one format).
  window_start      text,
  window_end        text,
  -- daily_limit: minutes per calendar day before the shield kicks in.
  daily_limit_min   integer,
  -- 0=Sun … 6=Sat. Empty array means "every day."
  weekdays          integer[] NOT NULL DEFAULT '{0,1,2,3,4,5,6}',
  active            boolean NOT NULL DEFAULT true,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS restrictions_user_active_idx
  ON restrictions (user_id, active);

-- Sanity-check the shape based on kind. CHECK constraints catch malformed
-- writes from a future client that forgets to populate the right columns.
ALTER TABLE restrictions
  DROP CONSTRAINT IF EXISTS restrictions_shape_check;
ALTER TABLE restrictions
  ADD CONSTRAINT restrictions_shape_check CHECK (
    (kind = 'time_window' AND window_start IS NOT NULL AND window_end IS NOT NULL)
    OR
    (kind = 'daily_limit' AND daily_limit_min IS NOT NULL AND daily_limit_min > 0)
  );

-- Reuse the touch_updated_at function from 001_init.sql for the row-update
-- timestamp.
DROP TRIGGER IF EXISTS restrictions_touch ON restrictions;
CREATE TRIGGER restrictions_touch
  BEFORE UPDATE ON restrictions
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE restrictions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "restrictions_owner" ON restrictions;
CREATE POLICY "restrictions_owner"
  ON restrictions
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Mirror the grant-tightening pattern from 003_tighten_grants_and_function_paths.sql
REVOKE ALL ON restrictions FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON restrictions TO authenticated;
