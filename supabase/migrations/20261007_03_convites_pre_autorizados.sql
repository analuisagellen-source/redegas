-- E-mails pré-autorizados: ao criar a conta, a pessoa já entra no escritório com o papel definido.
create table private.convites (
  email text primary key check (email = lower(email)),
  organization_id uuid not null references public.organizations(id),
  role text not null check (role in ('projetista', 'estudante', 'admin', 'curador')),
  created_at timestamptz not null default now(),
  usado_em timestamptz
);

create or replace function private.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare c private.convites%rowtype;
begin
  select * into c from private.convites where email = lower(new.email) and usado_em is null;
  insert into public.profiles (id, email, nome, organization_id, role)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1)),
          c.organization_id, c.role);
  if c.email is not null then
    update private.convites set usado_em = now() where email = c.email;
  end if;
  return new;
end $$;
revoke execute on function private.handle_new_user() from public, anon, authenticated;
