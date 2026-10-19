-- Run this once in the same Supabase SQL editor, after admin.sql.
-- It stores each "Need a nudge" suggestion: the presets, the written note,
-- the cafe Gemini picked, and whether the student clicked Bring me there
-- or Not this one.

create table if not exists public.cafe_suggestions (
  id bigint generated always as identity primary key,
  user_id uuid references public.profiles (id) on delete set null,
  vibes text[] not null default '{}',
  note text not null default '',
  cafe_id bigint not null references public.cafe (id) on delete cascade,
  reason text not null,
  outcome text not null default 'pending'
    check (outcome in ('pending', 'accepted', 'rejected')),
  client_token uuid not null,
  created_at timestamptz not null default now()
);

alter table public.cafe_suggestions enable row level security;

drop policy if exists "suggestions_admin_select" on public.cafe_suggestions;
create policy "suggestions_admin_select"
on public.cafe_suggestions
for select
to authenticated
using (public.is_superadmin());

drop policy if exists "suggestions_admin_insert" on public.cafe_suggestions;
create policy "suggestions_admin_insert"
on public.cafe_suggestions
for insert
to authenticated
with check (public.is_superadmin());

drop policy if exists "suggestions_admin_update" on public.cafe_suggestions;
create policy "suggestions_admin_update"
on public.cafe_suggestions
for update
to authenticated
using (public.is_superadmin())
with check (public.is_superadmin());

drop policy if exists "suggestions_admin_delete" on public.cafe_suggestions;
create policy "suggestions_admin_delete"
on public.cafe_suggestions
for delete
to authenticated
using (public.is_superadmin());

grant select, insert, update, delete on public.cafe_suggestions to authenticated;
grant usage, select on all sequences in schema public to authenticated;

create or replace function public.save_cafe_suggestion(
  chosen_vibes text[],
  written_note text,
  chosen_cafe bigint,
  ai_reason text
)
returns table (suggestion_id bigint, suggestion_token uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  new_token uuid := gen_random_uuid();
  new_id bigint;
begin
  if auth.uid() is not null then
    insert into public.profiles (id)
    values (auth.uid())
    on conflict (id) do nothing;
  end if;

  insert into public.cafe_suggestions (
    user_id,
    vibes,
    note,
    cafe_id,
    reason,
    outcome,
    client_token
  )
  values (
    auth.uid(),
    coalesce(chosen_vibes, '{}'),
    left(coalesce(written_note, ''), 240),
    chosen_cafe,
    left(coalesce(ai_reason, ''), 500),
    'pending',
    new_token
  )
  returning cafe_suggestions.id into new_id;

  return query select new_id, new_token;
end;
$$;

create or replace function public.record_suggestion_outcome(
  suggestion_id bigint,
  suggestion_token uuid,
  next_outcome text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if next_outcome not in ('accepted', 'rejected') then
    raise exception 'invalid outcome';
  end if;

  update public.cafe_suggestions
  set outcome = next_outcome
  where cafe_suggestions.id = record_suggestion_outcome.suggestion_id
    and cafe_suggestions.client_token = suggestion_token
    and cafe_suggestions.outcome = 'pending';
end;
$$;

revoke all on function public.save_cafe_suggestion(text[], text, bigint, text) from public;
revoke all on function public.record_suggestion_outcome(bigint, uuid, text) from public;
grant execute on function public.save_cafe_suggestion(text[], text, bigint, text) to anon, authenticated;
grant execute on function public.record_suggestion_outcome(bigint, uuid, text) to anon, authenticated;
