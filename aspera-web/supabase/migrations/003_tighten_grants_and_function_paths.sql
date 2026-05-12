-- Anon role (pre-sign-in) should never touch user data. RLS already blocks
-- row access, but revoking SELECT removes the table from the public REST
-- surface entirely.
REVOKE SELECT ON public.users             FROM anon;
REVOKE SELECT ON public.daily_logs        FROM anon;
REVOKE SELECT ON public.mood_entries      FROM anon;
REVOKE SELECT ON public.browsing_sessions FROM anon;
REVOKE SELECT ON public.push_tokens       FROM anon;
REVOKE SELECT ON public.experiments       FROM anon;

-- handle_new_user is trigger-only. No one should call it via /rest/v1/rpc.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- Pin the search_path on the existing touch_updated_at function so it
-- can't be hijacked by a malicious schema in the search path.
ALTER FUNCTION public.touch_updated_at() SET search_path = public, pg_catalog;
