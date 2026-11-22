-- Stored frequently asked questions derived from uploaded VTU question papers.

create table if not exists public.question_clusters (
  id uuid primary key default gen_random_uuid(),
  subject_code text not null,
  subject_title text not null default '',
  scheme text not null default '2022',
  module_number integer not null check (module_number between 1 and 5),
  representative_question text not null,
  normalized_question text not null,
  repeat_count integer not null default 1,
  typical_marks text,
  years_appeared text[] not null default '{}',
  embedding_model text,
  review_status text not null default 'approved'
    check (review_status in ('approved', 'review')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (subject_code, scheme, module_number, normalized_question)
);

create table if not exists public.raw_questions (
  id uuid primary key default gen_random_uuid(),
  cluster_id uuid not null references public.question_clusters(id) on delete cascade,
  paper_id uuid not null references public.managed_resources(id) on delete cascade,
  question_number text,
  module_number integer not null check (module_number between 1 and 5),
  question_text text not null,
  normalized_text text not null,
  occurrence_hash text not null,
  marks text,
  exam_session text,
  page_number integer,
  created_at timestamptz not null default now(),
  unique (paper_id, occurrence_hash)
);

create table if not exists public.paper_processing_jobs (
  id uuid primary key default gen_random_uuid(),
  paper_id uuid not null references public.managed_resources(id) on delete cascade,
  status text not null default 'queued'
    check (status in ('queued', 'processing', 'completed', 'failed')),
  attempt_count integer not null default 0,
  last_error text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (paper_id)
);

create index if not exists question_clusters_lookup_idx
  on public.question_clusters(subject_code, scheme, module_number, repeat_count desc);
create index if not exists raw_questions_cluster_idx
  on public.raw_questions(cluster_id);
create index if not exists raw_questions_paper_idx
  on public.raw_questions(paper_id);

alter table public.question_clusters enable row level security;
alter table public.raw_questions enable row level security;
alter table public.paper_processing_jobs enable row level security;

grant select on public.question_clusters to anon, authenticated;
grant select on public.raw_questions to anon, authenticated;
grant select on public.paper_processing_jobs to authenticated;
grant insert, update, delete on public.question_clusters to authenticated;
grant insert, update, delete on public.raw_questions to authenticated;
grant insert, update, delete on public.paper_processing_jobs to authenticated;

drop policy if exists "frequent questions public read" on public.question_clusters;
create policy "frequent questions public read" on public.question_clusters
  for select using (review_status = 'approved');

drop policy if exists "raw questions public read" on public.raw_questions;
create policy "raw questions public read" on public.raw_questions
  for select using (exists (
    select 1 from public.question_clusters cluster
    where cluster.id = raw_questions.cluster_id
      and cluster.review_status = 'approved'
  ));

drop policy if exists "frequent questions admin manage" on public.question_clusters;
create policy "frequent questions admin manage" on public.question_clusters
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "raw questions admin manage" on public.raw_questions;
create policy "raw questions admin manage" on public.raw_questions
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "processing jobs admin manage" on public.paper_processing_jobs;
create policy "processing jobs admin manage" on public.paper_processing_jobs
  for all using (public.is_admin()) with check (public.is_admin());
