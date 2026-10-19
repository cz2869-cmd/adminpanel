-- Run this once in the Supabase SQL editor for the Morningside Nook project.
-- The SQL editor is the database owner, so it can grant access before the
-- admin app will let anyone in. That is how you avoid locking yourself out:
-- set profiles.is_superadmin here, then sign in with that Google account.

alter table public.profiles
  add column if not exists is_superadmin boolean not null default false;

create or replace function public.is_superadmin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select p.is_superadmin from public.profiles p where p.id = auth.uid()),
    false
  );
$$;

revoke all on function public.is_superadmin() from public;
grant execute on function public.is_superadmin() to authenticated;

drop policy if exists "captions_admin_insert" on public.captions;
create policy "captions_admin_insert"
on public.captions
for insert
to authenticated
with check (public.is_superadmin());

drop policy if exists "captions_admin_update" on public.captions;
create policy "captions_admin_update"
on public.captions
for update
to authenticated
using (public.is_superadmin())
with check (public.is_superadmin());

drop policy if exists "captions_admin_delete" on public.captions;
create policy "captions_admin_delete"
on public.captions
for delete
to authenticated
using (public.is_superadmin());

grant update on public.captions to authenticated;

-- Replace the email with the Google account that should open Nook Desk.
update public.profiles
set is_superadmin = true
where id in (
  select id from auth.users where email = 'you@example.com'
);
