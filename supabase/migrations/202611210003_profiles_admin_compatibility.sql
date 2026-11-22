-- Compatibility migration for projects whose profiles table pre-dates roles.
-- Safe to run after the main platform migration as well.

alter table public.profiles
  add column if not exists role text not null default 'student',
  add column if not exists is_active boolean not null default true;

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check
  check (role in ('student', 'admin', 'super_admin'));

-- Promote the configured ExamMeta administrator when that account exists.
update public.profiles
set role = 'admin', is_active = true
where lower(email) = 'exammeta@edu.com';
