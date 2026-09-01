# Google Integration

> **Status: design document only.** No Google API code ships in Phase 1 — there is no Prompt Scout to feed Sheets/Drive yet, and social login is deferred to Phase 5. This documents the target design so Phase 5 implements against a settled plan rather than improvising, and so the Phase 1 Settings page can show a "Connect Google" placeholder honestly (spec §52).

## 1. Principle

**Supabase is the source of truth. Google Sheets is a secondary, human-friendly operational view. Google Drive is document/report storage.** (spec §4, §64). The sync direction is one-way by default: Supabase → Sheets/Drive. A validated, explicitly-enabled reverse path (Sheets edits → Supabase) exists only for a small allow-listed set of review columns — never for security, permission, or system-configuration data.

## 2. OAuth

- Google OAuth2, requested scopes limited to what's needed: `spreadsheets`, `drive.file` (not full `drive` — the app should only see files it created), plus `openid email profile` if/when Google social login is enabled.
- Tokens (`access_token`, `refresh_token`) stored server-side only, in a `google_integrations` table (future, Phase 5) scoped to the connecting user, never sent to the browser.
- If Google isn't connected, the app functions fully otherwise — Settings shows "Connect Google" rather than broken buttons.
- No passwords are ever requested; only the standard OAuth consent screen.

## 3. Google Sheets Layout

One spreadsheet: **"Prompt Library — AI Research"**, with worksheets:

1. **New Discoveries** — one row per research candidate. Columns (spec §33): Candidate ID, Date Discovered, Title, Description, Prompt, Category, Subcategory, Tags, Use Case, Quality Score, Clarity Score, Specificity Score, Structure Score, Reusability Score, Originality Score, Source, Source URL, Author, AI Optimized, Duplicate Probability, Security Status, Review Status, Reviewer Notes, Supabase Prompt ID, Created At.
2. **Approved Prompts** — mirrors published candidates for a human-friendly export view.
3. **Rejected Prompts** — rejected candidates + reason, for audit/tuning the pipeline.
4. **Weekly Reports** — one row per run, summary metrics.
5. **Sources** — mirrors the `sources` registry (read-mostly view for admins who prefer a spreadsheet).
6. **Agent Activity** — append-only log of pipeline events per run.
7. **Trends** — weekly trend-detection output (spec §46).

## 4. Sync Strategy

- **Key**: `Candidate ID` (UUID) is the unique sync key, written to a hidden/first column. Before writing, the sync job reads existing rows and matches on this key.
- **Upsert, never duplicate**: existing Candidate ID → update the row in place; new → append.
- **Supabase → Sheets is authoritative direction**. `research_candidates.google_sheet_row_id` stores the row reference for fast lookup.
- **Sheets → Supabase (reverse)**: only enabled if the admin turns on "Sheets review sync" in Settings. Even then, only these columns are ever read back: `Review Status`, `Reviewer Notes`. Every incoming value is validated (enum check on Review Status, length cap on notes) before writing to Supabase. Never: user permissions, API keys, security settings, database IDs, system configuration, or agent security rules (spec §35) — those columns aren't even present in the sheet, so there's nothing to read back.

## 5. Google Drive Layout

Folder: **"Prompt Library"**, with subfolders:
- `/Weekly Reports` — `Prompt_Scout_Weekly_Report_YYYY-MM-DD.pdf` (+ optional `.md`/`.json`/`.csv` per settings)
- `/Prompt Exports` — user-triggered exports (single prompt / collection / full library)
- `/Research` — supporting research documentation from a run
- `/Backups` — optional periodic export backups
- `/Documentation` — reserved

Every uploaded file's Drive file ID is stored back on the originating Supabase record (`prompts.google_drive_file_id`, future `research_runs.drive_report_file_id`) so the app can always deep-link to it.

## 6. Error Handling (spec §53–54)

- Sheets sync failure: does **not** fail the Prompt Scout run. The run record stores `sheets_sync_status = 'failed'` + `reason` + `timestamp`; a dashboard warning is shown; a retry job re-attempts later.
- Drive upload failure: does **not** fail the run. Report is kept in Supabase storage (or job output) so it's not lost; `drive_report_status = 'failed'`, retried later.
- Both failure paths are logged to `research_runs.errors` (jsonb) for observability (spec §57).

## 7. Security

- OAuth tokens encrypted at rest (Supabase Vault or equivalent), server-only access.
- `drive.file` scope (not full Drive) limits blast radius if a token leaks — the app can only see files it created.
- Every write validated server-side; no raw client input reaches the Sheets/Drive API without passing through the same Zod validation used for the rest of the app.
