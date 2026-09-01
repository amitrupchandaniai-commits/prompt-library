create table public.prompt_versions (
  id uuid primary key default gen_random_uuid(),
  prompt_id uuid not null references public.prompts (id) on delete cascade,
  version_number int not null,
  title text not null,
  prompt_text text not null,
  change_source text not null default 'user_edit'
    check (change_source in ('original', 'user_edit', 'ai_improved', 'ai_tested')),
  created_at timestamptz not null default now(),
  created_by uuid not null references auth.users (id),
  unique (prompt_id, version_number)
);

create index prompt_versions_prompt_id_idx on public.prompt_versions (prompt_id);

create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  action text not null,
  object_type text not null,
  object_id uuid,
  previous_value jsonb,
  new_value jsonb,
  created_at timestamptz not null default now()
);

create index audit_log_user_id_idx on public.audit_log (user_id);
create index audit_log_created_at_idx on public.audit_log (created_at desc);
