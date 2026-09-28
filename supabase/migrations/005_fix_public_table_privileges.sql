BEGIN;

-- Least-privilege PostgreSQL grants for the actual TIKSE TECH application flow.
-- This does not change the schema, disable RLS, or alter existing policies.
-- RLS remains the row-level restriction layer; GRANT only controls table access.

-- Schema access for all legitimate roles.
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- Public catalog access used by visitors to browse published programs.
GRANT SELECT ON TABLE public.program_categories TO anon;
GRANT SELECT ON TABLE public.programs TO anon;

-- Authenticated participant access required by the current app.
-- profiles: participant can read/update their own profile and register.
GRANT SELECT, INSERT, UPDATE ON TABLE public.profiles TO authenticated;

-- applications: participant can create and read their own application.
-- No participant UPDATE grant: application status transitions are admin/server controlled.
GRANT SELECT, INSERT ON TABLE public.applications TO authenticated;

-- enrollments: participant can read their own enrollment only.
GRANT SELECT ON TABLE public.enrollments TO authenticated;

-- completion_records: participant can read their own completion record only.
GRANT SELECT ON TABLE public.completion_records TO authenticated;

-- certificates: participant may read their own certificate record only.
-- No participant INSERT/UPDATE/DELETE: issuance/revocation is admin/server-side.
GRANT SELECT ON TABLE public.certificates TO authenticated;

-- The current app does not perform authenticated announcements/admin note/audit log
-- writes or reads through the user session path, so these remain restricted.

-- Trusted server-side credentials for admin/data operations.
-- These grants are intentionally explicit and limited to service_role, which is never exposed
-- to browser bundles or the public client.
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.program_categories TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.programs TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.profiles TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.applications TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.cohorts TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.enrollments TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.completion_records TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.certificates TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.announcements TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.admin_notes TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.audit_logs TO service_role;

COMMIT;
