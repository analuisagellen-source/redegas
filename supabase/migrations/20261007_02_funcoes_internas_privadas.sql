-- Funções auxiliares fora da API pública (alerta de segurança do Supabase).
create schema if not exists private;
grant usage on schema private to authenticated;

alter function public.app_org() set schema private;
alter function public.app_role() set schema private;
alter function public.handle_new_user() set schema private;
alter function public.segment_set_org() set schema private;
alter function public.audit_trigger() set schema private;
alter function public.touch_project() set schema private;

revoke execute on all functions in schema private from public, anon;
grant execute on function private.app_org() to authenticated;
grant execute on function private.app_role() to authenticated;
