-- Phase 8: experiments table redesign.
--
-- The original `experiments` table from 001_init.sql (with hypothesis,
-- target_variable, control_days, intervention_days, status) predated the
-- self-experimentation framework design. It has zero rows and no application
-- code reads from it (only the auto-generated database.types.ts references
-- it). Safe to drop + recreate with the Phase 8 shape.
--
-- The new shape:
--   - `restriction_refs uuid[]`   — references restrictions.id (NO FK; soft
--                                   deletion of a restriction shouldn't
--                                   blow up a historical experiment).
--   - `outcome_metric jsonb`      — { kind: 'daily_log_field' | 'event_type_field' | 'mood_avg' | 'sleep_hours', field?: string, eventTypeId?: string, fieldId?: string }
--   - `duration_days int`         — fixed window: 7 / 14 / 30
--   - `baseline_window_days int`  — how many days prior to start to use as
--                                   the control group (defaults to
--                                   duration_days, matched window)
--   - `result_payload jsonb`      — final ComparisonResult written on
--                                   completion. Shape: { effect, range:
--                                   {low, high}, confidenceLabel,
--                                   probabilityPositive, sampleSize,
--                                   computedAt }

DROP TABLE IF EXISTS public.experiments CASCADE;

CREATE TABLE public.experiments (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name                   text NOT NULL,
  hypothesis             text,
  restriction_refs       uuid[] NOT NULL DEFAULT '{}',
  outcome_metric         jsonb NOT NULL,
  duration_days          integer NOT NULL CHECK (duration_days >= 7),
  baseline_window_days   integer NOT NULL CHECK (baseline_window_days >= 1),
  started_at             timestamptz,
  ends_at                timestamptz,
  status                 text NOT NULL DEFAULT 'planning'
                           CHECK (status IN ('planning', 'active', 'completed', 'cancelled')),
  result_payload         jsonb,
  notes                  text,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS experiments_user_status_idx
  ON public.experiments (user_id, status);

CREATE INDEX IF NOT EXISTS experiments_user_started_idx
  ON public.experiments (user_id, started_at DESC);

-- Reuse the touch_updated_at trigger from 001_init.sql
DROP TRIGGER IF EXISTS experiments_touch ON public.experiments;
CREATE TRIGGER experiments_touch
  BEFORE UPDATE ON public.experiments
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.experiments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "experiments_owner" ON public.experiments;
CREATE POLICY "experiments_owner"
  ON public.experiments
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

REVOKE ALL ON public.experiments FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.experiments TO authenticated;
