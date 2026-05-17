-- Phase 5: Moments table.
--
-- Free-form, timestamped events that live alongside mood_entries on the
-- Mood tab timeline. Schema mirrors mood_entries' columnar pattern (one
-- row per occurrence) rather than the JSONB pattern daily_logs uses,
-- because moments are small enough to be cheap to index/query by user
-- and we want the promotion-nudge feature (Phase 7) to be able to
-- group by label efficiently.

CREATE TABLE IF NOT EXISTS moments (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  timestamp     timestamptz NOT NULL,
  label         text NOT NULL,
  duration_min  integer,
  note          text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS moments_user_ts_idx
  ON moments (user_id, timestamp DESC);

ALTER TABLE moments ENABLE ROW LEVEL SECURITY;

-- One unified policy: a user can SELECT / INSERT / UPDATE / DELETE only
-- their own rows. Mirrors mood_entries / daily_logs.
DROP POLICY IF EXISTS "moments_owner" ON moments;
CREATE POLICY "moments_owner"
  ON moments
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
