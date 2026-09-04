-- profiles_update_own (0005_rls_policies.sql) lets a user update any column
-- on their own row, including is_admin — RLS's `with check` only verifies
-- row ownership, not which columns changed. This trigger silently reverts
-- any is_admin change that doesn't come from the service role (bypasses RLS
-- entirely, so this trigger is the only enforcement point for that column),
-- closing off client-side self-promotion to admin.
create or replace function public.prevent_self_admin_promotion()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.is_admin is distinct from old.is_admin and auth.role() <> 'service_role' then
    new.is_admin := old.is_admin;
  end if;
  return new;
end;
$$;

create trigger profiles_prevent_self_admin_promotion
  before update on public.profiles
  for each row
  execute function public.prevent_self_admin_promotion();

-- Trigger invocation doesn't need EXECUTE granted to the invoking role, only
-- direct calls do — revoke so this can't be called as a client-facing RPC.
revoke execute on function public.prevent_self_admin_promotion() from public, anon, authenticated;
