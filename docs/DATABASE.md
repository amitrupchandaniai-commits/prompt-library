# Database Schema

Supabase Postgres 17. Extensions enabled: `pgcrypto` (uuid generation), `pg_trgm` (keyword search), `vector` (pgvector — enabled now, unused until Phase 3).

Every table with a `user_id` column has Row Level Security enabled with a policy restricting `SELECT/INSERT/UPDATE/DELETE` to `auth.uid() = user_id`, unless noted otherwise. No table is ever readable/writable by the anonymous role.

## Phase 1 Tables (created by migrations 0001–0006)

### `profiles`
1:1 with `auth.users`, created via trigger on signup.
| column | type | notes |
|---|---|---|
| id | uuid PK, references auth.users(id) | |
| display_name | text | |
| avatar_url | text | |
| personalization_enabled | boolean default true | spec §44 — kill switch for future recommendation features |
| created_at / updated_at | timestamptz | |

RLS: user reads/writes only their own row.

### `categories`
Global taxonomy (spec §8), not user-scoped. Seeded with the fixed list from the spec in migration 0006.
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| name | text unique | |
| slug | text unique | |
| description | text | |
| sort_order | int | |
| created_at | timestamptz | |

RLS: `SELECT` allowed for any authenticated user; `INSERT/UPDATE/DELETE` denied to authenticated role (service role only) — there's no admin UI yet, so writes happen only via migration/seed today. Documented here so Phase-N admin UI knows the constraint to lift.

### `tags`
User-scoped, created ad hoc.
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid references auth.users | |
| name | text | |
| created_at | timestamptz | |

Unique constraint on `(user_id, lower(name))`. RLS: owner only.

### `prompts`
The full column set from spec §7. Columns are grouped below by when they become active; **all are created now** to avoid a disruptive migration when Prompt Scout ships, but only the "Phase 1 active" group is read/written by the Phase 1 UI — the rest stay `null`/default.

**Phase 1 active columns:**
id, user_id, title, slug, description, prompt_text, category_id, subcategory, use_case, industry, difficulty, prompt_type, recommended_models (text[]), variables (jsonb), example_input, example_output, instructions, notes, is_original (default true), is_archived (default false), user_rating (smallint 1–5, nullable), created_at, updated_at.

**Reserved for later phases (nullable/defaulted, not exposed in Phase 1 UI):**
tested_models (text[]), source_id, source_url, source_name, source_author, source_publication_date, discovered_at, original_prompt, improved_prompt, quality_score, clarity_score, specificity_score, context_score, structure_score, reusability_score, originality_score, practical_value_score, favorite_count, usage_count, is_ai_discovered (default false), is_ai_improved (default false), is_verified (default false), is_duplicate (default false), verification_status, google_sheet_row_id, google_drive_file_id, last_verified_at, embedding (vector(1536), added as a column in Phase 3 migration, not Phase 1).

RLS: owner only for all operations.
Indexes: `(user_id)`, `(category_id)`, unique `(user_id, slug)`, `(created_at)`, GIN trigram indexes on `title` and `prompt_text` for `ILIKE` search.

**`embedding vector(1536)`** (Phase 3, active) — OpenAI `text-embedding-3-small` embedding of `title + description + prompt_text`, regenerated on every save that changes the text. Nullable: prompts saved before Phase 3, or saved without `OPENAI_API_KEY` configured, have no embedding and are simply excluded from semantic search results until backfilled (`npm run backfill-embeddings`) or re-saved. No ANN index (ivfflat/hnsw) yet — a linear scan is fine at personal-library scale; add one if the library grows into the thousands of rows. See `match_prompts()` in migration `0010_semantic_search.sql`.

### `prompt_tags`
Join table, `(prompt_id, tag_id)` PK. RLS: owner of the referenced prompt (checked via `EXISTS` subquery).

### `collections`
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid | |
| name | text | |
| description | text | |
| created_at / updated_at | timestamptz | |

RLS: owner only.

### `collection_prompts`
Join table, `(collection_id, prompt_id)` PK, `added_at timestamptz`. RLS: owner of the referenced collection.

### `favorites`
| column | type | notes |
|---|---|---|
| user_id | uuid | |
| prompt_id | uuid | |
| created_at | timestamptz | |

PK `(user_id, prompt_id)`. RLS: owner only.

### `prompt_versions`
Append-only. A row is written on prompt creation (V1) and on every subsequent edit.
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| prompt_id | uuid | |
| version_number | int | |
| prompt_text | text | snapshot |
| title | text | snapshot |
| change_source | text | `'original' \| 'user_edit' \| 'ai_improved' \| 'ai_tested'` (last two unused until Phase 2/6) |
| created_at | timestamptz | |
| created_by | uuid | |

RLS: owner of the referenced prompt (via `EXISTS`).

### `audit_log`
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid | actor |
| action | text | e.g. `prompt.created`, `prompt.archived`, `collection.deleted` |
| object_type | text | |
| object_id | uuid | |
| previous_value | jsonb | nullable |
| new_value | jsonb | nullable |
| created_at | timestamptz | |

RLS: `SELECT` restricted to the owning user; `INSERT` only via service role (server actions write audit rows explicitly — never client-writable) so a compromised client can't forge or erase its own trail.

## Prompt Scout Tables (Phase 4, active)

Single-tenant/admin data — RLS grants full access to any authenticated user of this deployment rather than scoping by `user_id`, since there's no per-user ownership concept for a shared research pipeline (documented simplification, see `docs/AGENT_ARCHITECTURE.md`).

- **`sources`** — id, name, url, type (`rss|api|web` — only `rss` is actually fetched so far), trust_score, enabled, last_scanned_at, scan_frequency, notes.
- **`research_runs`** — id (Run ID), status (`running|completed|partial|failed`), started_at, ended_at, sources_scanned, items_discovered, items_analyzed, items_rejected, duplicates_found, published_count, pending_review_count, input_tokens, output_tokens, ai_cost_usd, errors (jsonb), triggered_by.
- **`research_candidates`** — id (Candidate ID), run_id, title, description, prompt_text, category_id, use_case, tags, quality/clarity/specificity/context/structure/reusability/originality/practical_value scores, duplicate_probability, duplicate_of_prompt_id, security_status (`passed|flagged|rejected`), security_notes, is_ai_optimized, source provenance fields (source_id/url/name/author/publication_date — always derived from the real feed item, never LLM-invented), content_hash, review_status (`pending|approved|rejected|merged` — `merged` reserved, no UI yet), reviewer_notes, recommended_action, supabase_prompt_id (set on approval).
- **`processed_content`** — source_url, content_hash, publication_date, processed_at, run_id — dedup memory so the same item is never analyzed twice across runs (spec §40); unique on `(source_url, content_hash)`.

Not yet added: `google_sheet_row_id` / `drive_report_status` columns (Phase 5).

## `ai_usage_log` (Phase 2, active)

id, user_id (nullable — system/agent calls), feature (`prompt_builder|prompt_improver|prompt_scout|...`), provider, model, research_run_id (nullable, links a Prompt Scout LLM call back to its run), input_tokens, output_tokens, latency_ms, cost_usd, error (nullable), created_at. RLS: owner (`user_id`) can select/insert own rows — see `docs/AI_COST_CONTROL.md`.

## Migration File Map

| file | contents |
|---|---|
| `0001_init.sql` | extensions, `profiles` + signup trigger, `categories`, `tags` |
| `0002_prompts.sql` | `prompts` table, full column set, indexes |
| `0003_organization.sql` | `prompt_tags`, `collections`, `collection_prompts`, `favorites` |
| `0004_versioning_audit.sql` | `prompt_versions`, `audit_log` |
| `0005_rls_policies.sql` | RLS enable + policies for every table above |
| `0006_seed_categories.sql` | inserts the fixed category list from spec §8 |
| `0007_advisor_fixes.sql` | RLS/function performance and security fixes flagged by the Supabase advisor |
| `0008_ai_usage_log.sql` | `ai_usage_log` table (Phase 2) |
| `0009_version_restore.sql` | adds `restored` to `prompt_versions.change_source` |
| `0010_semantic_search.sql` | `prompts.embedding` column + `match_prompts()` similarity search function (Phase 3) |
| `0011_prompt_scout.sql` | `sources`, `research_runs`, `research_candidates`, `processed_content` (Phase 4) |
| `0012_seed_sources.sql` | seeds the 5 verified starter sources |
