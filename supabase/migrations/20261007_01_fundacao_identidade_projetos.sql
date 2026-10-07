-- Aplicada no Supabase em 07/10/2026 (fundacao_identidade_projetos).
-- Tabelas: organizations, profiles, projects, network_segments, audit_log + RLS.
-- As funções auxiliares foram movidas para o schema "private" na migração 02.

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  nome text not null check (length(trim(nome)) > 0),
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null default '',
  email text,
  organization_id uuid references public.organizations(id),
  role text check (role in ('projetista', 'estudante', 'admin', 'curador')),
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index profiles_org_idx on public.profiles(organization_id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email, nome)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1)));
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.app_org()
returns uuid language sql stable security definer set search_path = '' as $$
  select organization_id from public.profiles where id = auth.uid() and ativo
$$;

create or replace function public.app_role()
returns text language sql stable security definer set search_path = '' as $$
  select role from public.profiles where id = auth.uid() and ativo
$$;

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  nome text not null check (length(trim(nome)) > 0),
  estado text not null check (estado in ('TO', 'GO', 'SP', 'RJ')),
  municipio text not null default '',
  uso text not null check (uso in ('residencial', 'comercial')),
  tipo_uso text not null,
  tipologia text not null check (tipologia in ('terrea', 'vertical')),
  gas text not null check (gas in ('GLP', 'GN')),
  material_id text not null,
  pressao_operacao numeric not null check (pressao_operacao > 0 and pressao_operacao <= 400),
  status text not null default 'rascunho' check (status in ('rascunho', 'emitido', 'arquivado')),
  revisao text,
  versao integer not null default 1,
  created_by uuid references auth.users(id) default auth.uid(),
  updated_by uuid references auth.users(id) default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Tocantins não tem GN canalizado (NT 23)
  constraint projects_gn_to check (not (estado = 'TO' and gas = 'GN')),
  -- GLP comercial e residencial limitados a 150 kPa (NBR 15358 6.1; NBR 15526 6.2)
  constraint projects_pressao_max check (gas = 'GN' and uso = 'comercial' or pressao_operacao <= 150)
);
create index projects_org_status_idx on public.projects(organization_id, status);

create table public.network_segments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  organization_id uuid not null references public.organizations(id),
  ordem integer not null default 0,
  nome text not null default '',
  montante_id uuid references public.network_segments(id) on delete set null,
  lh numeric not null default 0 check (lh >= 0),
  lasc numeric not null default 0 check (lasc >= 0),
  ldesc numeric not null default 0 check (ldesc >= 0),
  conexoes jsonb not null default '{}'::jsonb,
  aparelhos jsonb not null default '[]'::jsonb,
  dentro_unidade boolean not null default false,
  regulador_saida numeric check (regulador_saida is null or regulador_saida > 0),
  dn_forcado text,
  ignorar boolean not null default false,
  justificativa text not null default '',
  f_informado numeric check (f_informado is null or (f_informado > 0 and f_informado <= 100)),
  f_justificativa text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint segments_ignorar_justificado check (not ignorar or length(trim(justificativa)) > 0)
);
create index segments_project_idx on public.network_segments(project_id, ordem);
create index segments_org_idx on public.network_segments(organization_id);
create index segments_montante_idx on public.network_segments(montante_id);

-- organization_id do trecho sempre vem do projeto (nunca do navegador)
create or replace function public.segment_set_org()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  select organization_id into new.organization_id from public.projects where id = new.project_id;
  new.updated_at := now();
  return new;
end $$;
create trigger segments_set_org before insert or update on public.network_segments
  for each row execute function public.segment_set_org();

create or replace function public.touch_project()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  new.updated_by := auth.uid();
  new.versao := old.versao + 1;
  new.organization_id := old.organization_id;
  return new;
end $$;
create trigger projects_touch before update on public.projects
  for each row execute function public.touch_project();

create table public.audit_log (
  id bigint generated always as identity primary key,
  organization_id uuid,
  user_id uuid default auth.uid(),
  tabela text not null,
  registro_id uuid,
  acao text not null,
  dados jsonb,
  created_at timestamptz not null default now()
);
create index audit_org_idx on public.audit_log(organization_id, created_at desc);

create or replace function public.audit_trigger()
returns trigger language plpgsql security definer set search_path = '' as $$
declare r jsonb;
begin
  r := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
  insert into public.audit_log (organization_id, tabela, registro_id, acao, dados)
  values ((r->>'organization_id')::uuid, tg_table_name, (r->>'id')::uuid, tg_op, r);
  return null;
end $$;
create trigger projects_audit after insert or update or delete on public.projects
  for each row execute function public.audit_trigger();
create trigger profiles_audit after update on public.profiles
  for each row execute function public.audit_trigger();

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.network_segments enable row level security;
alter table public.audit_log enable row level security;

create policy org_select on public.organizations for select to authenticated
  using (id = public.app_org() or public.app_role() = 'curador');
create policy org_curador_write on public.organizations for all to authenticated
  using (public.app_role() = 'curador') with check (public.app_role() = 'curador');

create policy profiles_select on public.profiles for select to authenticated
  using (id = auth.uid() or organization_id = public.app_org() or public.app_role() = 'curador');
create policy profiles_admin_update on public.profiles for update to authenticated
  using (public.app_role() = 'admin' and organization_id = public.app_org() and id <> auth.uid())
  with check (organization_id = public.app_org() and role in ('projetista', 'estudante', 'admin'));
create policy profiles_curador_update on public.profiles for update to authenticated
  using (public.app_role() = 'curador') with check (public.app_role() = 'curador');

create policy projects_select on public.projects for select to authenticated
  using (organization_id = public.app_org() and public.app_role() is not null);
create policy projects_insert on public.projects for insert to authenticated
  with check (organization_id = public.app_org() and public.app_role() in ('projetista', 'estudante', 'admin'));
create policy projects_update on public.projects for update to authenticated
  using (organization_id = public.app_org() and public.app_role() in ('projetista', 'estudante', 'admin'))
  with check (organization_id = public.app_org());

create policy segments_select on public.network_segments for select to authenticated
  using (organization_id = public.app_org() and public.app_role() is not null);
create policy segments_write on public.network_segments for all to authenticated
  using (organization_id = public.app_org() and public.app_role() in ('projetista', 'estudante', 'admin')
    and exists (select 1 from public.projects p where p.id = project_id and p.status = 'rascunho'))
  with check (exists (select 1 from public.projects p where p.id = project_id
    and p.organization_id = public.app_org() and p.status = 'rascunho'));

create policy audit_select on public.audit_log for select to authenticated
  using (organization_id = public.app_org() and public.app_role() = 'admin' or public.app_role() = 'curador');
