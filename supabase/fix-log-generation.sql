-- Run this once in the same SQL editor. It replaces the logger only.
-- The earlier version failed when saving a model response.

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
