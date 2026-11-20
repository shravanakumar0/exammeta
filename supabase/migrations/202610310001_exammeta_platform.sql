-- ExamMeta platform schema
-- Idempotent migration for the existing Supabase project.
-- Apply with: supabase db push  (or paste into the Supabase SQL editor)
--
-- Design notes:
--   * Supabase Postgres is the only application database. No Prisma, no second DB.
--   * Academic catalogue data is publicly readable when verified.
--   * Student-owned rows are protected by auth.uid() + RLS.
--   * Service-role credentials are only ever used by server-side code.

create extension if not exists pgcrypto;
create extension if not exists vector;

-- ---------------------------------------------------------------------------
-- Shared helpers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Profiles / roles
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text not null unique,
  role text not null default 'student',
  is_active boolean not null default true,
  branch_id uuid,
  semester_number smallint,
  scheme_code text,
  avatar_url text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists branch_id uuid;
alter table public.profiles add column if not exists semester_number smallint;
alter table public.profiles add column if not exists scheme_code text;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists phone text;

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check check (role in ('student', 'admin', 'super_admin'));

create index if not exists profiles_role_idx on public.profiles(role);
create index if not exists profiles_branch_semester_idx on public.profiles(branch_id, semester_number);

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((
    select role in ('admin', 'super_admin') and is_active
    from public.profiles where id = auth.uid()
  ), false);
$$;

create or replace function public.is_super_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((
    select role = 'super_admin' and is_active
    from public.profiles where id = auth.uid()
  ), false);
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.email,
    'student'
  )
  on conflict (id) do update
    set full_name = excluded.full_name,
        email = excluded.email,
        updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Academic catalogue
-- ---------------------------------------------------------------------------

create table if not exists public.branches (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  short_name text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.schemes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  year smallint,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.semesters (
  id uuid primary key default gen_random_uuid(),
  number smallint not null unique check (number between 1 and 8),
  label text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  name text not null,
  branch_id uuid not null references public.branches(id) on delete restrict,
  semester_id uuid not null references public.semesters(id) on delete restrict,
  scheme_id uuid not null references public.schemes(id) on delete restrict,
  credits numeric(3,1),
  syllabus_url text,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (code, scheme_id)
);

create index if not exists subjects_branch_semester_idx on public.subjects(branch_id, semester_id);
create index if not exists subjects_scheme_idx on public.subjects(scheme_id);

create table if not exists public.modules (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.subjects(id) on delete cascade,
  number smallint not null check (number between 1 and 10),
  title text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (subject_id, number)
);

create table if not exists public.resource_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.academic_resources (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.subjects(id) on delete cascade,
  module_id uuid references public.modules(id) on delete set null,
  category_id uuid references public.resource_categories(id) on delete set null,
  title text not null,
  description text,
  resource_type text not null default 'notes'
    check (resource_type in ('notes', 'question_paper', 'model_paper', 'lab_manual', 'reference', 'placement')),
  academic_year text,
  storage_bucket text,
  file_path text,
  external_url text,
  mime_type text,
  size_bytes bigint,
  uploaded_by uuid references auth.users(id) on delete set null,
  verification_status text not null default 'pending'
    check (verification_status in ('pending', 'verified', 'rejected')),
  download_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint resource_has_location check (
    (storage_bucket is not null and file_path is not null) or external_url is not null
  )
);

create index if not exists academic_resources_subject_idx on public.academic_resources(subject_id, verification_status);
create index if not exists academic_resources_module_idx on public.academic_resources(module_id);
create index if not exists academic_resources_category_idx on public.academic_resources(category_id);

create table if not exists public.question_papers (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.subjects(id) on delete cascade,
  scheme_id uuid references public.schemes(id) on delete set null,
  exam_year smallint not null check (exam_year between 1990 and 2100),
  exam_month text,
  paper_type text not null default 'previous_year'
    check (paper_type in ('previous_year', 'model', 'makeup')),
  storage_bucket text not null default 'previous-year-papers',
  file_path text not null,
  extracted_text text,
  processing_status text not null default 'pending'
    check (processing_status in ('pending', 'processing', 'completed', 'failed')),
  processing_error text,
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists question_papers_subject_year_idx on public.question_papers(subject_id, exam_year);

create table if not exists public.extracted_questions (
  id uuid primary key default gen_random_uuid(),
  question_paper_id uuid not null references public.question_papers(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  module_id uuid references public.modules(id) on delete set null,
  question_number text,
  question_text text not null,
  marks numeric(4,1),
  exam_year smallint,
  embedding vector(768),
  created_at timestamptz not null default now()
);

create index if not exists extracted_questions_paper_idx on public.extracted_questions(question_paper_id);
create index if not exists extracted_questions_subject_idx on public.extracted_questions(subject_id);

create table if not exists public.important_questions (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.subjects(id) on delete cascade,
  module_id uuid references public.modules(id) on delete set null,
  canonical_text text not null,
  normalized_hash text not null,
  frequency integer not null default 0,
  years smallint[] not null default '{}',
  marks numeric(4,1),
  similarity_cluster uuid,
  verification_status text not null default 'pending'
    check (verification_status in ('pending', 'verified', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (subject_id, normalized_hash)
);

create index if not exists important_questions_subject_frequency_idx
  on public.important_questions(subject_id, frequency desc);

create table if not exists public.question_frequency (
  id uuid primary key default gen_random_uuid(),
  important_question_id uuid not null references public.important_questions(id) on delete cascade,
  exam_year smallint not null,
  occurrence_count integer not null default 1 check (occurrence_count > 0),
  created_at timestamptz not null default now(),
  unique (important_question_id, exam_year)
);

create table if not exists public.question_answers (
  id uuid primary key default gen_random_uuid(),
  important_question_id uuid not null references public.important_questions(id) on delete cascade,
  answer_md text not null,
  model text,
  generated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Internships
-- ---------------------------------------------------------------------------

create table if not exists public.internship_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  base_url text not null,
  endpoint text,
  last_synced_at timestamptz,
  status text not null default 'idle' check (status in ('idle', 'running', 'ok', 'error')),
  last_error text,
  created_at timestamptz not null default now()
);

create table if not exists public.internships (
  id uuid primary key default gen_random_uuid(),
  external_id text not null,
  source text not null default 'internscan',
  title text not null,
  company text,
  description text,
  category text,
  location text,
  country text,
  is_remote boolean not null default false,
  application_url text not null,
  posted_at timestamptz,
  deadline date,
  is_active boolean not null default true,
  raw jsonb,
  first_seen_at timestamptz not null default now(),
  last_synced_at timestamptz not null default now(),
  unique (source, external_id)
);

create index if not exists internships_active_idx on public.internships(is_active, posted_at desc);
create index if not exists internships_country_idx on public.internships(country);
create index if not exists internships_category_idx on public.internships(category);

-- ---------------------------------------------------------------------------
-- Hackathons
-- ---------------------------------------------------------------------------

create table if not exists public.hackathons (
  id uuid primary key default gen_random_uuid(),
  external_id text,
  source text not null default 'exammeta',
  name text not null,
  organizer text,
  description text,
  location text,
  mode text not null default 'Offline' check (mode in ('Online', 'Offline', 'Hybrid')),
  tech_tags text[] not null default '{}',
  registration_start_date date,
  registration_deadline date,
  event_date date,
  registration_url text not null,
  official_source_url text,
  status text not null default 'approved'
    check (status in ('pending', 'approved', 'rejected', 'expired')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source, external_id)
);

create index if not exists hackathons_status_deadline_idx on public.hackathons(status, registration_deadline);
create index if not exists hackathons_event_date_idx on public.hackathons(event_date);

create table if not exists public.hackathon_submissions (
  id uuid primary key default gen_random_uuid(),
  submitted_by uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 3 and 160),
  organizer text not null check (char_length(organizer) between 2 and 160),
  description text not null check (char_length(description) between 20 and 5000),
  registration_start_date date,
  registration_deadline date not null,
  event_date date not null,
  location text not null,
  mode text not null check (mode in ('Online', 'Offline', 'Hybrid')),
  registration_url text not null check (registration_url ~* '^https://'),
  contact_email text not null check (contact_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  poster_url text check (poster_url is null or poster_url ~* '^https://'),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'expired')),
  admin_note text,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint event_is_not_before_deadline check (event_date >= registration_deadline)
);

create index if not exists hackathon_submissions_status_deadline_idx
  on public.hackathon_submissions(status, registration_deadline);
create index if not exists hackathon_submissions_submitted_by_idx
  on public.hackathon_submissions(submitted_by);

create or replace function public.expire_hackathons()
returns void language sql security definer set search_path = public as $$
  update public.hackathons
  set status = 'expired', updated_at = now()
  where status = 'approved' and registration_deadline < (now() at time zone 'Asia/Kolkata')::date;

  update public.hackathon_submissions
  set status = 'expired', updated_at = now()
  where status = 'approved' and registration_deadline < (now() at time zone 'Asia/Kolkata')::date;
$$;

-- ---------------------------------------------------------------------------
-- Career guidance
-- ---------------------------------------------------------------------------

create table if not exists public.career_roadmaps (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text,
  category text,
  required_skills jsonb not null default '[]',
  stages jsonb not null default '[]',
  project_suggestions jsonb not null default '[]',
  learning_resources jsonb not null default '[]',
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Study planner / progress
-- ---------------------------------------------------------------------------

create table if not exists public.study_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  exam_date date,
  daily_minutes integer not null default 60 check (daily_minutes between 15 and 1440),
  status text not null default 'active' check (status in ('active', 'completed', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists study_plans_user_idx on public.study_plans(user_id, status);

create table if not exists public.study_tasks (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.study_plans(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete set null,
  module_id uuid references public.modules(id) on delete set null,
  title text not null,
  scheduled_date date not null,
  estimated_minutes integer not null default 30 check (estimated_minutes between 5 and 600),
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'completed', 'skipped')),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists study_tasks_plan_date_idx on public.study_tasks(plan_id, scheduled_date);
create index if not exists study_tasks_user_idx on public.study_tasks(user_id);

create table if not exists public.student_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete cascade,
  module_id uuid references public.modules(id) on delete cascade,
  progress_percent numeric(5,2) not null default 0 check (progress_percent between 0 and 100),
  last_accessed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, module_id)
);

create index if not exists student_progress_user_idx on public.student_progress(user_id);

-- ---------------------------------------------------------------------------
-- AI conversations
-- ---------------------------------------------------------------------------

create table if not exists public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'New conversation',
  context_subject_id uuid references public.subjects(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ai_conversations_user_idx on public.ai_conversations(user_id, updated_at desc);

create table if not exists public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ai_conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  tokens_in integer not null default 0,
  tokens_out integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists ai_messages_conversation_idx on public.ai_messages(conversation_id, created_at);

-- ---------------------------------------------------------------------------
-- Bookmarks, notifications, admin activity, uploads, sync logs
-- ---------------------------------------------------------------------------

create table if not exists public.user_bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  resource_id uuid not null references public.academic_resources(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, resource_id)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text,
  type text not null default 'info',
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_idx on public.notifications(user_id, created_at desc);

create table if not exists public.admin_activity (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text,
  entity_id text,
  details jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists admin_activity_created_idx on public.admin_activity(created_at desc);

create table if not exists public.resource_uploads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete set null,
  title text not null,
  storage_bucket text not null default 'student-uploads',
  file_path text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewer_id uuid references auth.users(id) on delete set null,
  review_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sync_history (
  id uuid primary key default gen_random_uuid(),
  job_type text not null,
  source text,
  status text not null default 'running' check (status in ('running', 'ok', 'error')),
  items_synced integer not null default 0,
  error text,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

create index if not exists sync_history_started_idx on public.sync_history(started_at desc);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------

do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles', 'branches', 'schemes', 'subjects', 'modules', 'academic_resources',
    'question_papers', 'important_questions', 'hackathons', 'career_roadmaps',
    'study_plans', 'study_tasks', 'student_progress', 'ai_conversations',
    'resource_uploads', 'hackathon_submissions'
  ] loop
    execute format('drop trigger if exists set_%I_updated_at on public.%I', t, t);
    execute format(
      'create trigger set_%I_updated_at before update on public.%I for each row execute procedure public.set_updated_at()',
      t, t
    );
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.branches enable row level security;
alter table public.schemes enable row level security;
alter table public.semesters enable row level security;
alter table public.subjects enable row level security;
alter table public.modules enable row level security;
alter table public.resource_categories enable row level security;
alter table public.academic_resources enable row level security;
alter table public.question_papers enable row level security;
alter table public.extracted_questions enable row level security;
alter table public.important_questions enable row level security;
alter table public.question_frequency enable row level security;
alter table public.question_answers enable row level security;
alter table public.internship_sources enable row level security;
alter table public.internships enable row level security;
alter table public.hackathons enable row level security;
alter table public.hackathon_submissions enable row level security;
alter table public.career_roadmaps enable row level security;
alter table public.study_plans enable row level security;
alter table public.study_tasks enable row level security;
alter table public.student_progress enable row level security;
alter table public.ai_conversations enable row level security;
alter table public.ai_messages enable row level security;
alter table public.user_bookmarks enable row level security;
alter table public.notifications enable row level security;
alter table public.admin_activity enable row level security;
alter table public.resource_uploads enable row level security;
alter table public.sync_history enable row level security;

-- Profiles
drop policy if exists "profiles own read" on public.profiles;
create policy "profiles own read" on public.profiles
  for select using (id = auth.uid() or public.is_admin());
drop policy if exists "profiles own update" on public.profiles;
create policy "profiles own update" on public.profiles
  for update using (id = auth.uid())
  with check (id = auth.uid());
drop policy if exists "profiles admin manage" on public.profiles;
create policy "profiles admin manage" on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

-- Stop a student from promoting themselves or re-activating a disabled account.
-- auth.uid() is null for service-role/server-side calls, which are already trusted.
create or replace function public.protect_profile_privileges()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    if new.role is distinct from old.role or new.is_active is distinct from old.is_active then
      raise exception 'Only administrators can change role or account status.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_privileges on public.profiles;
create trigger protect_profile_privileges
  before update on public.profiles
  for each row execute procedure public.protect_profile_privileges();

-- Public catalogue data
do $$
declare
  t text;
begin
  foreach t in array array[
    'branches', 'schemes', 'semesters', 'subjects', 'modules', 'resource_categories',
    'question_papers'
  ] loop
    execute format('drop policy if exists "public read %s" on public.%I', t, t);
    execute format(
      'create policy "public read %s" on public.%I for select using (true)', t, t
    );
    execute format('drop policy if exists "admin manage %s" on public.%I', t, t);
    execute format(
      'create policy "admin manage %s" on public.%I for all using (public.is_admin()) with check (public.is_admin())',
      t, t
    );
  end loop;
end;
$$;

-- Status-aware public read policies.
drop policy if exists "public read academic_resources" on public.academic_resources;
create policy "verified resources public read" on public.academic_resources
  for select using (verification_status = 'verified' or public.is_admin());
drop policy if exists "admin manage academic_resources" on public.academic_resources;
create policy "admin manage academic_resources" on public.academic_resources
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "verified important questions public read" on public.important_questions;
create policy "verified important questions public read" on public.important_questions
  for select using (verification_status = 'verified' or public.is_admin());
drop policy if exists "admin manage important_questions" on public.important_questions;
create policy "admin manage important_questions" on public.important_questions
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "question frequency public read" on public.question_frequency;
create policy "question frequency public read" on public.question_frequency
  for select using (true);
drop policy if exists "admin manage question_frequency" on public.question_frequency;
create policy "admin manage question_frequency" on public.question_frequency
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "question answers public read" on public.question_answers;
create policy "question answers public read" on public.question_answers
  for select using (true);
drop policy if exists "authenticated answer insert" on public.question_answers;
create policy "authenticated answer insert" on public.question_answers
  for insert with check (generated_by = auth.uid());
drop policy if exists "admin manage question_answers" on public.question_answers;
create policy "admin manage question_answers" on public.question_answers
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "published roadmaps public read" on public.career_roadmaps;
create policy "published roadmaps public read" on public.career_roadmaps
  for select using (is_published or public.is_admin());
drop policy if exists "admin manage career_roadmaps" on public.career_roadmaps;
create policy "admin manage career_roadmaps" on public.career_roadmaps
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "active internships public read" on public.internships;
create policy "active internships public read" on public.internships
  for select using (is_active or public.is_admin());
drop policy if exists "admin manage internships" on public.internships;
create policy "admin manage internships" on public.internships
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "approved hackathons public read" on public.hackathons;
create policy "approved hackathons public read" on public.hackathons
  for select using (status = 'approved' or public.is_admin());
drop policy if exists "admin manage hackathons" on public.hackathons;
create policy "admin manage hackathons" on public.hackathons
  for all using (public.is_admin()) with check (public.is_admin());

-- Extracted questions are derived data: read-only for students.
drop policy if exists "extracted questions public read" on public.extracted_questions;
create policy "extracted questions public read" on public.extracted_questions
  for select using (true);
drop policy if exists "extracted questions admin manage" on public.extracted_questions;
create policy "extracted questions admin manage" on public.extracted_questions
  for all using (public.is_admin()) with check (public.is_admin());

-- Hackathon submissions keep the stricter student workflow.
drop policy if exists "submission public approved read" on public.hackathon_submissions;
create policy "submission public approved read" on public.hackathon_submissions
  for select using (
    status = 'approved'
    and registration_deadline >= (now() at time zone 'Asia/Kolkata')::date
  );
drop policy if exists "submission owner read" on public.hackathon_submissions;
create policy "submission owner read" on public.hackathon_submissions
  for select using (submitted_by = auth.uid());
drop policy if exists "submission student create" on public.hackathon_submissions;
create policy "submission student create" on public.hackathon_submissions
  for insert with check (
    submitted_by = auth.uid() and status = 'pending'
    and exists (select 1 from public.profiles where id = auth.uid() and is_active)
  );
drop policy if exists "submission admin manage" on public.hackathon_submissions;
create policy "submission admin manage" on public.hackathon_submissions
  for all using (public.is_admin()) with check (public.is_admin());

-- Student-owned data
do $$
declare
  pair text[];
  pairs text[][] := array[
    array['study_plans', 'user_id'],
    array['study_tasks', 'user_id'],
    array['student_progress', 'user_id'],
    array['ai_conversations', 'user_id'],
    array['ai_messages', 'user_id'],
    array['user_bookmarks', 'user_id'],
    array['notifications', 'user_id'],
    array['resource_uploads', 'user_id']
  ];
begin
  foreach pair slice 1 in array pairs loop
    execute format('drop policy if exists "owner read %s" on public.%I', pair[1], pair[1]);
    execute format(
      'create policy "owner read %s" on public.%I for select using (%I = auth.uid() or public.is_admin())',
      pair[1], pair[1], pair[2]
    );
    execute format('drop policy if exists "owner write %s" on public.%I', pair[1], pair[1]);
    execute format(
      'create policy "owner write %s" on public.%I for all using (%I = auth.uid()) with check (%I = auth.uid())',
      pair[1], pair[1], pair[2], pair[2]
    );
  end loop;
end;
$$;

drop policy if exists "admin activity admin read" on public.admin_activity;
create policy "admin activity admin read" on public.admin_activity
  for select using (public.is_admin());
drop policy if exists "admin activity admin write" on public.admin_activity;
create policy "admin activity admin write" on public.admin_activity
  for insert with check (public.is_admin());

drop policy if exists "sync history admin read" on public.sync_history;
create policy "sync history admin read" on public.sync_history
  for select using (public.is_admin());
drop policy if exists "internship sources admin manage" on public.internship_sources;
create policy "internship sources admin manage" on public.internship_sources
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Storage buckets + policies
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('vtu-notes', 'vtu-notes', true, 52428800, array['application/pdf']),
  ('previous-year-papers', 'previous-year-papers', true, 52428800, array['application/pdf']),
  ('model-papers', 'model-papers', true, 52428800, array['application/pdf']),
  ('academic-documents', 'academic-documents', true, 52428800, array['application/pdf','image/png','image/jpeg']),
  ('student-uploads', 'student-uploads', false, 52428800, array['application/pdf','image/png','image/jpeg'])
on conflict (id) do nothing;

drop policy if exists "academic buckets public read" on storage.objects;
create policy "academic buckets public read" on storage.objects
  for select using (
    bucket_id in ('vtu-notes', 'previous-year-papers', 'model-papers', 'academic-documents')
  );

drop policy if exists "academic buckets admin write" on storage.objects;
create policy "academic buckets admin write" on storage.objects
  for insert with check (
    bucket_id in ('vtu-notes', 'previous-year-papers', 'model-papers', 'academic-documents')
    and public.is_admin()
  );

drop policy if exists "academic buckets admin update" on storage.objects;
create policy "academic buckets admin update" on storage.objects
  for update using (
    bucket_id in ('vtu-notes', 'previous-year-papers', 'model-papers', 'academic-documents')
    and public.is_admin()
  );

drop policy if exists "academic buckets admin delete" on storage.objects;
create policy "academic buckets admin delete" on storage.objects
  for delete using (
    bucket_id in ('vtu-notes', 'previous-year-papers', 'model-papers', 'academic-documents')
    and public.is_admin()
  );

drop policy if exists "student uploads own read" on storage.objects;
create policy "student uploads own read" on storage.objects
  for select using (
    bucket_id = 'student-uploads'
    and (owner = auth.uid() or public.is_admin())
  );

drop policy if exists "student uploads own write" on storage.objects;
create policy "student uploads own write" on storage.objects
  for insert with check (
    bucket_id = 'student-uploads' and owner = auth.uid()
  );

-- ---------------------------------------------------------------------------
-- Seed reference rows (safe to re-run)
-- ---------------------------------------------------------------------------

insert into public.schemes (code, name, year)
values
  ('2022', 'VTU 2022 Scheme', 2022),
  ('2025', 'VTU 2025 Scheme', 2025)
on conflict (code) do nothing;

insert into public.semesters (number, label)
select n, 'Semester ' || n from generate_series(1, 8) as n
on conflict (number) do nothing;

insert into public.branches (code, name, short_name)
values
  ('CSE', 'Computer Science and Engineering', 'CSE'),
  ('ISE', 'Information Science and Engineering', 'ISE'),
  ('AIML', 'Artificial Intelligence and Machine Learning', 'AI/ML'),
  ('DS', 'Data Science', 'DS'),
  ('ECE', 'Electronics and Communication Engineering', 'ECE'),
  ('EEE', 'Electrical and Electronics Engineering', 'EEE'),
  ('ME', 'Mechanical Engineering', 'ME'),
  ('CV', 'Civil Engineering', 'CV'),
  ('AERO', 'Aeronautical Engineering', 'AERO'),
  ('BIOTECH', 'Biotechnology', 'BT')
on conflict (code) do nothing;

insert into public.resource_categories (slug, name, description)
values
  ('notes', 'Notes', 'Module-wise and full-subject notes'),
  ('question-papers', 'Question Papers', 'Previous-year VTU question papers'),
  ('model-papers', 'Model Papers', 'Model and expected question papers'),
  ('lab-manuals', 'Lab Manuals', 'Laboratory manuals and records'),
  ('reference', 'Reference Material', 'Academic reference documents'),
  ('placement', 'Placement Prep', 'Placement and interview preparation resources')
on conflict (slug) do nothing;

-- Promote the first administrator after signup (run manually, once):
-- update public.profiles set role = 'admin' where email = 'your-admin-email@example.com';
-- update public.profiles set role = 'super_admin' where email = 'your-super-admin-email@example.com';
