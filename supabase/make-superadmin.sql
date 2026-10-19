-- Make a Google account a superadmin for Nook Desk.
-- Run this in the same Supabase SQL editor as Morningside Nook.
-- The person must sign in with Google once first. If the insert
-- changes 0 rows, they have not signed in yet.

-- Optional. Use this only to look up an email. It does not change access.
select email, created_at
from auth.users
order by created_at desc;

-- This is the statement that grants access. Replace the email.
insert into public.profiles (id, is_superadmin)
select id, true
from auth.users
where email = 'grader@gmail.com'
on conflict (id) do update
set is_superadmin = true;
