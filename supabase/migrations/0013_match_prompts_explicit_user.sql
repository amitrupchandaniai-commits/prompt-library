-- match_prompts relied on auth.uid(), which is null for a service-role client with
-- no session (e.g. a Trigger.dev scheduled job) -- silently disabling duplicate
-- detection there. Switch to an explicit match_user_id, always derived server-side
-- (from the session in normal request handling, or a looked-up user id in a
-- headless job) -- never from client input, so this doesn't reopen the
-- "never trust client-supplied ids" issue it was written to avoid.
drop function public.match_prompts(vector, uuid, int);

create or replace function public.match_prompts(
  query_embedding vector(1536),
  match_user_id uuid,
  match_category_id uuid default null,
  match_count int default 50
)
returns table (
  id uuid,
  similarity float
)
language sql
stable
security invoker
set search_path = public, extensions
as $$
  select
    prompts.id,
    1 - (prompts.embedding <=> query_embedding) as similarity
  from public.prompts
  where prompts.user_id = match_user_id
    and prompts.embedding is not null
    and prompts.is_archived = false
    and (match_category_id is null or prompts.category_id = match_category_id)
  order by prompts.embedding <=> query_embedding
  limit match_count;
$$;
