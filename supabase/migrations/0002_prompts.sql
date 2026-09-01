create table public.prompts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,

  -- Phase 1 active columns
  title text not null,
  slug text not null,
  description text,
  prompt_text text not null,
  category_id uuid references public.categories (id),
  subcategory text,
  use_case text,
  industry text,
  difficulty text check (difficulty in ('beginner', 'intermediate', 'advanced')),
  prompt_type text,
  recommended_models text[] not null default '{}',
  variables jsonb not null default '[]',
  example_input text,
  example_output text,
  instructions text,
  notes text,
  is_original boolean not null default true,
  is_archived boolean not null default false,
  user_rating smallint check (user_rating between 1 and 5),

  -- Reserved for later phases (Prompt Scout / AI features) - nullable, unused in Phase 1 UI
  tested_models text[] not null default '{}',
  source_id uuid,
  source_url text,
  source_name text,
  source_author text,
  source_publication_date timestamptz,
  discovered_at timestamptz,
  original_prompt text,
  improved_prompt text,
  quality_score smallint,
  clarity_score smallint,
  specificity_score smallint,
  context_score smallint,
  structure_score smallint,
  reusability_score smallint,
  originality_score smallint,
  practical_value_score smallint,
  favorite_count int not null default 0,
  usage_count int not null default 0,
  is_ai_discovered boolean not null default false,
  is_ai_improved boolean not null default false,
  is_verified boolean not null default false,
  is_duplicate boolean not null default false,
  verification_status text,
  google_sheet_row_id text,
  google_drive_file_id text,
  last_verified_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (user_id, slug)
);

create index prompts_user_id_idx on public.prompts (user_id);
create index prompts_category_id_idx on public.prompts (category_id);
create index prompts_created_at_idx on public.prompts (created_at desc);
create index prompts_title_trgm_idx on public.prompts using gin (title extensions.gin_trgm_ops);
create index prompts_prompt_text_trgm_idx on public.prompts using gin (prompt_text extensions.gin_trgm_ops);

create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger prompts_set_updated_at
  before update on public.prompts
  for each row execute function public.set_updated_at();
