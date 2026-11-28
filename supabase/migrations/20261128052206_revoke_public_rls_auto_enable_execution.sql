-- Keep the RLS auto-enable event trigger operational while removing
-- unnecessary direct execution privileges from API roles.
-- The event trigger remains attached to ensure_rls; this only removes
-- the default PUBLIC EXECUTE grant on its SECURITY DEFINER function.
REVOKE ALL ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;
