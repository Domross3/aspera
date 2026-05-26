-- Phase 8: Native Screen Controls restriction metadata.
--
-- Enforcement tokens from FamilyActivityPicker are device-local and live in
-- the iOS App Group. Supabase stores only display/debug metadata so
-- restrictions can sync without leaking selected app identities.

ALTER TABLE restrictions
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS selected_app_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS selected_category_count integer NOT NULL DEFAULT 0;

COMMENT ON COLUMN restrictions.name IS
  'User-facing restriction label. Does not reveal selected app identities.';

COMMENT ON COLUMN restrictions.selected_app_count IS
  'Count of selected FamilyActivityPicker application tokens stored device-local in the App Group.';

COMMENT ON COLUMN restrictions.selected_category_count IS
  'Count of selected FamilyActivityPicker category tokens stored device-local in the App Group.';

COMMENT ON COLUMN restrictions.categories IS
  'Coarse optional Aspera taxonomy summary. Not used as the native enforcement target; opaque Apple tokens remain device-local.';
