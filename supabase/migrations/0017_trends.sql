create table public.trends (
  id uuid primary key default gen_random_uuid(),
  week_start date not null,
  trend text not null,
  signal_strength text not null check (signal_strength in ('high', 'medium', 'low')),
  notes text not null,
  created_at timestamptz not null default now()
);
create index trends_week_start_idx on public.trends (week_start desc);

alter table public.trends enable row level security;
create policy "trends_all_authenticated" on public.trends
  for all to authenticated using (true) with check (true);
