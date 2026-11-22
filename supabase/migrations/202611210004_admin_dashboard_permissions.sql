-- Makes the dashboard operational for older projects that did not receive the
-- original platform RLS policies. Run after 202611210003_profiles_admin_compatibility.sql.

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((
    select role in ('admin', 'super_admin') and is_active
    from public.profiles where id = auth.uid()
  ), false);
$$;

alter table public.hackathon_submissions enable row level security;
grant select, update, delete on public.hackathon_submissions to authenticated;

drop policy if exists "submission admin manage" on public.hackathon_submissions;
create policy "submission admin manage" on public.hackathon_submissions
  for all using (public.is_admin()) with check (public.is_admin());

-- Storage used by the Resources section. The bucket is public for student
-- downloads; only active administrators can upload or alter PDFs.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('academic-documents', 'academic-documents', true, 52428800, array['application/pdf']),
  ('previous-year-papers', 'previous-year-papers', true, 52428800, array['application/pdf'])
on conflict (id) do nothing;

drop policy if exists "admin dashboard resource insert" on storage.objects;
create policy "admin dashboard resource insert" on storage.objects
  for insert with check (bucket_id in ('academic-documents', 'previous-year-papers') and public.is_admin());
drop policy if exists "admin dashboard resource update" on storage.objects;
create policy "admin dashboard resource update" on storage.objects
  for update using (bucket_id in ('academic-documents', 'previous-year-papers') and public.is_admin());
drop policy if exists "admin dashboard resource delete" on storage.objects;
create policy "admin dashboard resource delete" on storage.objects
  for delete using (bucket_id in ('academic-documents', 'previous-year-papers') and public.is_admin());
