create table public.ai_usage_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  feature text not null,
  provider text not null,
  model text not null,
  research_run_id uuid,
  input_tokens int not null default 0,
  output_tokens int not null default 0,
  latency_ms int not null default 0,
  cost_usd numeric(10, 6) not null default 0,
  error text,
  created_at timestamptz not null default now()
);

create index ai_usage_log_user_id_idx on public.ai_usage_log (user_id);
create index ai_usage_log_created_at_idx on public.ai_usage_log (created_at desc);

alter table public.ai_usage_log enable row level security;

create policy "ai_usage_log_select_own" on public.ai_usage_log
  for select using ((select auth.uid()) = user_id);

create policy "ai_usage_log_insert_own" on public.ai_usage_log
  for insert with check ((select auth.uid()) = user_id);
