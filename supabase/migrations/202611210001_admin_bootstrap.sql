insert into public.profiles (id, full_name, email, role, is_active)
select
  users.id,
  coalesce(users.raw_user_meta_data ->> 'full_name', 'ExamMeta Admin'),
  users.email,
  'admin',
  true
from auth.users users
where lower(users.email) = 'exammeta@edu.com'
on conflict (id) do update
set role = 'admin',
    is_active = true,
    email = excluded.email,
    updated_at = now();
