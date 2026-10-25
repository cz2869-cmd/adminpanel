-- Run this once in the Supabase SQL editor, after admin.sql.
-- It adds prompt chains, model records, generation logs, terms,
-- and the signup allow lists used by Nook Desk.

create table if not exists public.llm_providers (
  id bigint generated always as identity primary key,
  name text not null,
  slug text not null unique,
  base_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.llm_models (
  id bigint generated always as identity primary key,
  provider_id bigint not null references public.llm_providers (id) on delete cascade,
  name text not null,
  model_key text not null,
  created_at timestamptz not null default now(),
  unique (provider_id, model_key)
);

create table if not exists public.prompt_chains (
  id bigint generated always as identity primary key,
  name text not null unique,
  description text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.prompt_chain_steps (
  id bigint generated always as identity primary key,
  chain_id bigint not null references public.prompt_chains (id) on delete cascade,
  position integer not null,
  role text not null check (role in ('system', 'user')),
  content text not null,
  created_at timestamptz not null default now(),
  unique (chain_id, position)
);

create table if not exists public.prompt_chain_mix (
  id bigint generated always as identity primary key,
  chain_id bigint not null references public.prompt_chains (id) on delete cascade,
  model_id bigint not null references public.llm_models (id) on delete cascade,
  weight numeric not null default 1 check (weight >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (chain_id, model_id)
);

create table if not exists public.terms (
  id bigint generated always as identity primary key,
  name text not null,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.generation_requests (
  id bigint generated always as identity primary key,
  user_id uuid references public.profiles (id) on delete set null,
  chain_id bigint references public.prompt_chains (id) on delete set null,
  prompt text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.llm_responses (
  id bigint generated always as identity primary key,
  request_id bigint references public.generation_requests (id) on delete set null,
  model_id bigint references public.llm_models (id) on delete set null,
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_generation_examples (
  id bigint generated always as identity primary key,
  title text not null,
  input_text text not null,
  output_text text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.allowed_signup_domains (
  id bigint generated always as identity primary key,
  domain text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.whitelisted_emails (
  id bigint generated always as identity primary key,
  email text not null unique,
  created_at timestamptz not null default now()
);

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'llm_providers',
    'llm_models',
    'prompt_chains',
    'prompt_chain_steps',
    'prompt_chain_mix',
    'terms',
    'generation_requests',
    'llm_responses',
    'ai_generation_examples',
    'allowed_signup_domains',
    'whitelisted_emails'
  ]
  loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_admin_all', table_name);
    execute format(
      'create policy %I on public.%I for all to authenticated using (public.is_superadmin()) with check (public.is_superadmin())',
      table_name || '_admin_all',
      table_name
    );
    execute format(
      'grant select, insert, update, delete on public.%I to authenticated',
      table_name
    );
  end loop;
end $$;

grant usage, select on all sequences in schema public to authenticated;

create or replace function public.admin_list_users()
returns table (
  id uuid,
  email text,
  created_at timestamptz,
  first_name text,
  last_name text,
  avatar_url text,
  is_superadmin boolean
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_superadmin() then
    raise exception 'not allowed';
  end if;

  return query
  select
    u.id,
    u.email::text,
    u.created_at,
    p.first_name,
    p.last_name,
    p.avatar_url,
    coalesce(p.is_superadmin, false)
  from auth.users u
  left join public.profiles p on p.id = u.id
  order by u.created_at desc;
end;
$$;

revoke all on function public.admin_list_users() from public;
grant execute on function public.admin_list_users() to authenticated;

create or replace function public.log_generation(
  request_prompt text,
  response_text text,
  model_key text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  new_request_id bigint;
begin
  if coalesce(trim(request_prompt), '') = '' or coalesce(trim(response_text), '') = '' then
    return;
  end if;

  if auth.uid() is not null then
    insert into public.profiles (id)
    values (auth.uid())
    on conflict (id) do nothing;
  end if;

  insert into public.generation_requests (user_id, chain_id, prompt)
  values (
    auth.uid(),
    (select c.id from public.prompt_chains c order by c.id limit 1),
    left(request_prompt, 8000)
  )
  returning id into new_request_id;

  insert into public.llm_responses (request_id, model_id, content)
  values (
    new_request_id,
    (
      select m.id
      from public.llm_models m
      where m.model_key = log_generation.model_key
      limit 1
    ),
    left(response_text, 8000)
  );
end;
$$;

revoke all on function public.log_generation(text, text, text) from public;
grant execute on function public.log_generation(text, text, text) to anon, authenticated;

insert into public.llm_providers (name, slug, base_url)
select 'Google', 'google', 'https://generativelanguage.googleapis.com'
where not exists (select 1 from public.llm_providers where slug = 'google');

insert into public.llm_models (provider_id, name, model_key)
select p.id, 'Gemini 3 Flash', 'gemini-3-flash-preview'
from public.llm_providers p
where p.slug = 'google'
  and not exists (
    select 1 from public.llm_models m
    where m.provider_id = p.id and m.model_key = 'gemini-3-flash-preview'
  );

insert into public.llm_models (provider_id, name, model_key)
select p.id, 'Gemini 3.8 Flash', 'gemini-3.8-flash'
from public.llm_providers p
where p.slug = 'google'
  and not exists (
    select 1 from public.llm_models m
    where m.provider_id = p.id and m.model_key = 'gemini-3.8-flash'
  );

insert into public.prompt_chains (name, description)
select 'Suggest a cafe', 'The prompt used when a student cannot decide where to sit.'
where not exists (select 1 from public.prompt_chains where name = 'Suggest a cafe');

insert into public.prompt_chain_steps (chain_id, position, role, content)
select c.id, 1, 'system', $step$Pick exactly one cafe for a Columbia student. Reply with JSON only: {"id": <one cafe id from the list>, "reason": "<one or two warm sentences>"}. Do not invent a cafe. Do not mention that you are an AI.$step$
from public.prompt_chains c
where c.name = 'Suggest a cafe'
  and not exists (
    select 1 from public.prompt_chain_steps s
    where s.chain_id = c.id and s.position = 1
  );

insert into public.prompt_chain_steps (chain_id, position, role, content)
select c.id, 2, 'user', $step$Vibes they chose: {{vibes}}.
What they wrote: {{note}}.
Cafes:
{{catalog}}$step$
from public.prompt_chains c
where c.name = 'Suggest a cafe'
  and not exists (
    select 1 from public.prompt_chain_steps s
    where s.chain_id = c.id and s.position = 2
  );

insert into public.prompt_chain_mix (chain_id, model_id, weight, is_active)
select c.id, m.id, 1, true
from public.prompt_chains c
join public.llm_models m on m.model_key = 'gemini-3-flash-preview'
where c.name = 'Suggest a cafe'
  and not exists (
    select 1 from public.prompt_chain_mix mix
    where mix.chain_id = c.id and mix.model_id = m.id
  );

insert into public.terms (name, body)
select 'Vibe', 'A preset the student taps before asking for a cafe, such as Cozy or Studying.'
where not exists (select 1 from public.terms where name = 'Vibe');

insert into public.ai_generation_examples (title, input_text, output_text)
select
  'Quiet study afternoon',
  'Presets: Studying, Quiet corner. Note: somewhere I can stay for two hours.',
  'Blue Java has enough table space to spread out a laptop and stay awhile.'
where not exists (
  select 1 from public.ai_generation_examples where title = 'Quiet study afternoon'
);

insert into public.allowed_signup_domains (domain)
select 'columbia.edu'
where not exists (
  select 1 from public.allowed_signup_domains where domain = 'columbia.edu'
);
