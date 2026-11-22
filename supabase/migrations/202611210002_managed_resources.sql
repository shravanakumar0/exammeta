-- Editable study resources for the admin dashboard.
-- The bundled JS catalogue stays available as a fallback; published rows here
-- are appended to the matching subject immediately, without requiring a deploy.

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

create index if not exists managed_resources_subject_idx
  on public.managed_resources(branch, semester, subject_title, status);

drop trigger if exists managed_resources_set_updated_at on public.managed_resources;
create trigger managed_resources_set_updated_at
  before update on public.managed_resources
  for each row execute procedure public.set_updated_at();

alter table public.managed_resources enable row level security;

create policy "managed resources public published read" on public.managed_resources
  for select using (status = 'published' or public.is_admin());

create policy "managed resources admin manage" on public.managed_resources
  for all using (public.is_admin()) with check (public.is_admin());
