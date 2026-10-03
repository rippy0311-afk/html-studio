-- Applied to bbgahsmqhijjsvnbfchi through the Supabase SQL editor.
create table public.studio_projects (
 id uuid primary key,
 owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 name text not null check (char_length(name) between 1 and 200),
 project jsonb not null,
 html text not null,
 revision bigint not null default 1,
 updated_at timestamptz not null default now()
);
alter table public.studio_projects enable row level security;
revoke all on public.studio_projects from anon, authenticated;
grant select, insert, update on public.studio_projects to authenticated;
create policy own_read on public.studio_projects for select to authenticated using ((select auth.uid()) = owner_id);
create policy own_insert on public.studio_projects for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy own_update on public.studio_projects for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create index studio_projects_owner_updated on public.studio_projects(owner_id,updated_at desc);
create function public.studio_project_version() returns trigger language plpgsql set search_path = '' as $$ begin new.updated_at = now(); new.revision = old.revision + 1; return new; end $$;
create trigger studio_project_version before update on public.studio_projects for each row execute function public.studio_project_version();
