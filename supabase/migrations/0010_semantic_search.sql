alter table public.prompts add column embedding vector(1536);

-- Similarity search over the calling user's own prompts only — auth.uid() is read
-- server-side from the session, never trusted from a client-supplied parameter,
-- consistent with the rest of the app's authorization model (docs/SECURITY.md).
create or replace function public.match_prompts(
  query_embedding vector(1536),
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
  where prompts.user_id = (select auth.uid())
    and prompts.embedding is not null
    and prompts.is_archived = false
    and (match_category_id is null or prompts.category_id = match_category_id)
  order by prompts.embedding <=> query_embedding
  limit match_count;
$$;
