-- Fix mutable search_path on trigger functions
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- handle_new_user must stay SECURITY DEFINER (it writes to public.profiles as the
-- inserting trigger, before the new user has any grants), but it should only ever be
-- invoked by the auth.users trigger, not callable directly via RPC.
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- Missing indexes on foreign keys flagged by the performance advisor
create index collection_prompts_prompt_id_idx on public.collection_prompts (prompt_id);
create index prompt_tags_tag_id_idx on public.prompt_tags (tag_id);
create index prompt_versions_created_by_idx on public.prompt_versions (created_by);

-- Rewrite RLS policies to call auth.uid() once per statement via (select ...)
-- instead of once per row (Postgres RLS initplan performance pattern).
drop policy "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using ((select auth.uid()) = id);

drop policy "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

drop policy "tags_all_own" on public.tags;
create policy "tags_all_own" on public.tags
  for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy "prompts_all_own" on public.prompts;
create policy "prompts_all_own" on public.prompts
  for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy "prompt_tags_all_own" on public.prompt_tags;
create policy "prompt_tags_all_own" on public.prompt_tags
  for all using (
    exists (select 1 from public.prompts p where p.id = prompt_id and p.user_id = (select auth.uid()))
  )
  with check (
    exists (select 1 from public.prompts p where p.id = prompt_id and p.user_id = (select auth.uid()))
  );

drop policy "collections_all_own" on public.collections;
create policy "collections_all_own" on public.collections
  for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy "collection_prompts_all_own" on public.collection_prompts;
create policy "collection_prompts_all_own" on public.collection_prompts
  for all using (
    exists (select 1 from public.collections c where c.id = collection_id and c.user_id = (select auth.uid()))
  )
  with check (
    exists (select 1 from public.collections c where c.id = collection_id and c.user_id = (select auth.uid()))
  );

drop policy "favorites_all_own" on public.favorites;
create policy "favorites_all_own" on public.favorites
  for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy "prompt_versions_select_own" on public.prompt_versions;
create policy "prompt_versions_select_own" on public.prompt_versions
  for select using (
    exists (select 1 from public.prompts p where p.id = prompt_id and p.user_id = (select auth.uid()))
  );

drop policy "prompt_versions_insert_own" on public.prompt_versions;
create policy "prompt_versions_insert_own" on public.prompt_versions
  for insert with check (
    exists (select 1 from public.prompts p where p.id = prompt_id and p.user_id = (select auth.uid()))
  );

drop policy "audit_log_select_own" on public.audit_log;
create policy "audit_log_select_own" on public.audit_log
  for select using ((select auth.uid()) = user_id);
