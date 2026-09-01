# AI Cost Control

> **Status: design document only.** No AI calls exist in Phase 1 (no Builder/Improver/Tester/Prompt Scout yet), so there's nothing to meter. This documents the model so Phase 2's first AI call ships with cost tracking already wired, instead of bolting it on afterward.

## 1. Principle

Every AI call, from every feature, is logged before it's trusted. Cost tracking is not optional instrumentation added later — the `AIProvider` abstraction (`ARCHITECTURE.md` §2) logs on every call by construction, so a feature can't accidentally ship without it.

## 2. `ai_usage_log` (future table, see `DATABASE.md`)

Every call records: feature (`prompt_builder | prompt_improver | prompt_tester | prompt_scout | classification | ...`), provider, model, user_id (nullable for system/agent calls), research_run_id (nullable), input_tokens, output_tokens, latency_ms, cost_usd (computed from published per-model pricing at call time), created_at, and whether the call errored.

## 3. Budget Enforcement (Prompt Scout, spec §41)

- Default weekly AI budget: **$10**, configurable in Settings → Costs, along with max tokens, max candidates, max sources.
- The pipeline checks cumulative `cost_usd` for the current run against the budget **before** each non-critical step (e.g. before optionally improving a candidate that already passed quality scoring). Critical steps already committed (finishing the analysis of a candidate already fetched) are allowed to complete rather than left half-done.
- On budget exhaustion: stop starting new non-critical work, save all progress so far, generate a partial weekly report explicitly marked partial, and notify the admin (in-app + run record flag).
- User-facing AI features (Builder/Improver/Tester, Phase 2/6) get a simpler per-request cost estimate shown before the call where feasible, and a per-user daily/monthly soft cap configurable in Settings — exact UX decided when Phase 2 is built, not guessed here.

## 4. Dashboards (spec §43, built in Phase 6)

- Daily / Weekly / Monthly AI cost
- Cost by feature
- Cost by model/provider
- Cost by research run (Prompt Scout)

All derived from `ai_usage_log` — no separate ledger to keep in sync.

## 5. Provider Pricing

Per-model input/output token pricing is kept in a small config map (`lib/ai/pricing.ts`, added in Phase 2) rather than hardcoded per call site, so a price change or new model is a one-line update. Costs are computed at call time from actual token usage returned by the provider API, not estimated from text length.
