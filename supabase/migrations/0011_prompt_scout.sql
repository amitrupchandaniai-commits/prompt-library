-- Prompt Scout is single-tenant/admin data in this personal-workspace app: any
-- authenticated user of this deployment can manage sources and review candidates
-- (there's no per-user ownership concept for a shared research pipeline). This is
-- documented as a simplification to revisit if the app ever becomes multi-tenant.

create table public.sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  url text not null,
  type text not null default 'rss' check (type in ('rss', 'api', 'web')),
  trust_score smallint not null default 70 check (trust_score between 0 and 100),
  enabled boolean not null default true,
  last_scanned_at timestamptz,
  scan_frequency text not null default 'weekly',
  notes text,
  created_at timestamptz not null default now()
);

alter table public.sources enable row level security;
create policy "sources_all_authenticated" on public.sources
  for all to authenticated using (true) with check (true);

create table public.research_runs (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'running' check (status in ('running', 'completed', 'failed', 'partial')),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  sources_scanned int not null default 0,
  items_discovered int not null default 0,
  items_analyzed int not null default 0,
  items_rejected int not null default 0,
  duplicates_found int not null default 0,
  published_count int not null default 0,
  pending_review_count int not null default 0,
  input_tokens int not null default 0,
  output_tokens int not null default 0,
  ai_cost_usd numeric(10, 6) not null default 0,
  errors jsonb not null default '[]',
  triggered_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);

alter table public.research_runs enable row level security;
create policy "research_runs_all_authenticated" on public.research_runs
  for all to authenticated using (true) with check (true);

create table public.research_candidates (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.research_runs (id) on delete cascade,

  title text not null,
  description text,
  prompt_text text not null,
  category_id uuid references public.categories (id),
  use_case text,
  tags text[] not null default '{}',

  quality_score smallint,
  clarity_score smallint,
  specificity_score smallint,
  context_score smallint,
  structure_score smallint,
  reusability_score smallint,
  originality_score smallint,
  practical_value_score smallint,

  duplicate_probability smallint,
  duplicate_of_prompt_id uuid references public.prompts (id),

  security_status text not null default 'passed' check (security_status in ('passed', 'flagged', 'rejected')),
  security_notes text,

  is_ai_optimized boolean not null default true,
  original_excerpt text,

  source_id uuid references public.sources (id),
  source_url text not null,
  source_name text,
  source_author text,
  source_publication_date timestamptz,
  content_hash text not null,

  review_status text not null default 'pending' check (review_status in ('pending', 'approved', 'rejected', 'merged')),
  reviewer_notes text,
  recommended_action text,
  supabase_prompt_id uuid references public.prompts (id),

  created_at timestamptz not null default now()
);

create index research_candidates_run_id_idx on public.research_candidates (run_id);
create index research_candidates_review_status_idx on public.research_candidates (review_status);

alter table public.research_candidates enable row level security;
create policy "research_candidates_all_authenticated" on public.research_candidates
  for all to authenticated using (true) with check (true);

create table public.processed_content (
  id uuid primary key default gen_random_uuid(),
  source_url text not null,
  content_hash text not null,
  publication_date timestamptz,
  processed_at timestamptz not null default now(),
  run_id uuid references public.research_runs (id),
  unique (source_url, content_hash)
);

create index processed_content_lookup_idx on public.processed_content (source_url, content_hash);

alter table public.processed_content enable row level security;
create policy "processed_content_all_authenticated" on public.processed_content
  for all to authenticated using (true) with check (true);
