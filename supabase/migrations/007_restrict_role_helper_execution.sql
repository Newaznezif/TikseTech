begin;

-- SECURITY DEFINER helpers are only executable by authenticated application users.
-- The public certificate verification RPC remains intentionally callable without login.
revoke all on function public.current_profile_id() from public, anon;
revoke all on function public.user_has_role(text[]) from public, anon;
grant execute on function public.current_profile_id() to authenticated, service_role;
grant execute on function public.user_has_role(text[]) to authenticated, service_role;

commit;
