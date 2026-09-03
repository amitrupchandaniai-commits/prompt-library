-- Phase 5 — Google Integration (docs/GOOGLE_INTEGRATION.md).
-- google_integrations is per-connecting-user (unlike sources/research_runs/
-- research_candidates, which are shared single-tenant data — see 0011's
-- comment): OAuth tokens genuinely belong to whichever user connected Google,
-- so this table is RLS-scoped to that user rather than "all authenticated".

create table public.google_integrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,

  -- AES-256-GCM ciphertext (base64), see lib/google/crypto.ts. Never plaintext.
  access_token_encrypted text not null,
  refresh_token_encrypted text not null,
  token_expiry timestamptz not null,
  scopes text[] not null default '{}',

  spreadsheet_id text,
  drive_root_folder_id text,
  drive_subfolder_ids jsonb not null default '{}',

  -- Opt-in reverse sync (Sheets Review Status/Reviewer Notes -> Supabase).
  -- Off by default (docs/GOOGLE_INTEGRATION.md §4).
  sheets_review_sync_enabled boolean not null default false,

  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.google_integrations enable row level security;
create policy "google_integrations_all_own" on public.google_integrations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table public.research_candidates
  add column google_sheet_row_id int;

alter table public.research_runs
  add column sheets_sync_status text not null default 'pending'
    check (sheets_sync_status in ('pending', 'synced', 'failed')),
  add column sheets_sync_error text,
  add column sheets_synced_at timestamptz,
  add column drive_report_status text not null default 'pending'
    check (drive_report_status in ('pending', 'uploaded', 'failed')),
  add column drive_report_error text,
  add column drive_report_file_id text,
  add column drive_report_uploaded_at timestamptz;
