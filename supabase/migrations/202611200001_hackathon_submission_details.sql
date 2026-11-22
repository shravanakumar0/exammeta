alter table public.hackathon_submissions
  add column if not exists tech_tags text[] not null default '{}';

alter table public.hackathon_submissions
  add column if not exists prizes text;

grant select, insert on public.hackathon_submissions to authenticated;
