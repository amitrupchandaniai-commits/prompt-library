-- profiles
alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- categories: global, read-only to authenticated users (writes: service role only)
alter table public.categories enable row level security;

create policy "categories_select_all" on public.categories
  for select to authenticated using (true);

-- tags
alter table public.tags enable row level security;

create policy "tags_all_own" on public.tags
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- prompts
alter table public.prompts enable row level security;

create policy "prompts_all_own" on public.prompts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- prompt_tags (owner determined via referenced prompt)
alter table public.prompt_tags enable row level security;

create policy "prompt_tags_all_own" on public.prompt_tags
  for all using (
    exists (select 1 from public.prompts p where p.id = prompt_id and p.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.prompts p where p.id = prompt_id and p.user_id = auth.uid())
  );

-- collections
alter table public.collections enable row level security;

create policy "collections_all_own" on public.collections
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- collection_prompts (owner determined via referenced collection)
alter table public.collection_prompts enable row level security;

create policy "collection_prompts_all_own" on public.collection_prompts
  for all using (
    exists (select 1 from public.collections c where c.id = collection_id and c.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.collections c where c.id = collection_id and c.user_id = auth.uid())
  );

-- favorites
alter table public.favorites enable row level security;

create policy "favorites_all_own" on public.favorites
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- prompt_versions (owner determined via referenced prompt; append-only from the client's perspective)
alter table public.prompt_versions enable row level security;

create policy "prompt_versions_select_own" on public.prompt_versions
  for select using (
    exists (select 1 from public.prompts p where p.id = prompt_id and p.user_id = auth.uid())
  );

create policy "prompt_versions_insert_own" on public.prompt_versions
  for insert with check (
    exists (select 1 from public.prompts p where p.id = prompt_id and p.user_id = auth.uid())
  );

-- audit_log: readable by the owning user; writes are service-role only (no insert policy for authenticated)
alter table public.audit_log enable row level security;

create policy "audit_log_select_own" on public.audit_log
  for select using (auth.uid() = user_id);
