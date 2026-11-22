-- One-shot repair migration for hackathon moderation and managed study resources.

alter table public.profiles
  add column if not exists role text not null default 'student',
  add column if not exists is_active boolean not null default true;

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check
  check (role in ('student', 'admin', 'super_admin'));

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((
    select role in ('admin', 'super_admin') and is_active
    from public.profiles where id = auth.uid()
  ), false);
$$;

alter table public.hackathon_submissions enable row level security;
grant select, insert, update, delete on public.hackathon_submissions to authenticated;
grant select on public.hackathon_submissions to anon;

drop policy if exists "submission student create" on public.hackathon_submissions;
create policy "submission student create" on public.hackathon_submissions
  for insert with check (
    submitted_by = auth.uid()
    and status = 'pending'
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and is_active
    )
  );

drop policy if exists "submission admin manage" on public.hackathon_submissions;
create policy "submission admin manage" on public.hackathon_submissions
  for all using (public.is_admin()) with check (public.is_admin());

create table if not exists public.managed_resources (
  id uuid primary key default gen_random_uuid(),
  branch text not null,
  semester smallint not null check (semester between 1 and 8),
  subject_title text not null,
  title text not null,
  description text,
  file_url text not null,
  preview_url text,
  resource_type text not null default 'notes',
  category text not null default 'notes',
  tags text[] not null default '{}',
  is_essential boolean not null default false,
  sort_order integer not null default 0,
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.managed_resources
  add column if not exists preview_url text,
  add column if not exists resource_type text not null default 'notes',
  add column if not exists category text not null default 'notes',
  add column if not exists tags text[] not null default '{}',
  add column if not exists is_essential boolean not null default false,
  add column if not exists sort_order integer not null default 0,
  add column if not exists status text not null default 'draft',
  add column if not exists created_by uuid references auth.users(id) on delete set null,
  add column if not exists updated_at timestamptz not null default now();

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists managed_resources_set_updated_at on public.managed_resources;
create trigger managed_resources_set_updated_at
  before update on public.managed_resources
  for each row execute procedure public.set_updated_at();

create index if not exists managed_resources_subject_idx
  on public.managed_resources(branch, semester, subject_title, status);

alter table public.managed_resources enable row level security;
grant select, insert, update, delete on public.managed_resources to authenticated;
grant select on public.managed_resources to anon;

drop policy if exists "managed resources public published read" on public.managed_resources;
create policy "managed resources public published read" on public.managed_resources
  for select using (status = 'published' or public.is_admin());

drop policy if exists "managed resources admin manage" on public.managed_resources;
create policy "managed resources admin manage" on public.managed_resources
  for all using (public.is_admin()) with check (public.is_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('academic-documents', 'academic-documents', true, 52428800, array['application/pdf']),
  ('previous-year-papers', 'previous-year-papers', true, 52428800, array['application/pdf'])
on conflict (id) do nothing;

drop policy if exists "admin dashboard resource insert" on storage.objects;
create policy "admin dashboard resource insert" on storage.objects
  for insert with check (
    bucket_id in ('academic-documents', 'previous-year-papers')
    and public.is_admin()
  );

drop policy if exists "admin dashboard resource update" on storage.objects;
create policy "admin dashboard resource update" on storage.objects
  for update using (
    bucket_id in ('academic-documents', 'previous-year-papers')
    and public.is_admin()
  );

drop policy if exists "admin dashboard resource delete" on storage.objects;
create policy "admin dashboard resource delete" on storage.objects
  for delete using (
    bucket_id in ('academic-documents', 'previous-year-papers')
    and public.is_admin()
  );
