create table public.prompt_tags (
  prompt_id uuid not null references public.prompts (id) on delete cascade,
  tag_id uuid not null references public.tags (id) on delete cascade,
  primary key (prompt_id, tag_id)
);

create table public.collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index collections_user_id_idx on public.collections (user_id);

create trigger collections_set_updated_at
  before update on public.collections
  for each row execute function public.set_updated_at();

create table public.collection_prompts (
  collection_id uuid not null references public.collections (id) on delete cascade,
  prompt_id uuid not null references public.prompts (id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (collection_id, prompt_id)
);

create table public.favorites (
  user_id uuid not null references auth.users (id) on delete cascade,
  prompt_id uuid not null references public.prompts (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, prompt_id)
);

create index favorites_prompt_id_idx on public.favorites (prompt_id);
