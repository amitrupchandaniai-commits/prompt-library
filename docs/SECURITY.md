# Security

## 1. Authentication & Authorization

- Supabase Auth (email/password + magic link in Phase 1). Sessions are cookie-based via `@supabase/ssr`, refreshed in `middleware.ts`.
- **Row Level Security is the enforcement boundary**, not application code alone. Every user-owned table (`prompts`, `collections`, `favorites`, `tags`, `prompt_versions`, `audit_log`, ...) has RLS enabled with a policy scoped to `auth.uid()`. See `DATABASE.md` for the per-table policy summary.
- Server-side route handlers derive `user_id` exclusively from the authenticated session (`supabase.auth.getUser()`), **never** from request body/query params. A request that includes a `user_id` field is ignored for authorization purposes — it cannot be used to act on another user's data.
- The Supabase **service-role key is never sent to the browser** and is only used in server-only contexts (audit log writes, future Prompt Scout jobs) that deliberately need to bypass RLS for a narrow, well-defined reason.

## 2. Input Validation

- Every API route validates its input with a Zod schema before touching the database. Shared schemas live in `lib/validations/` and are reused by client forms, so client and server never disagree about what's valid.
- Structured AI output (Phase 2+) is validated against a schema before being trusted; invalid output is retried once, then routed to manual review — never persisted as-is (spec §62).

## 3. Injection & XSS

- **SQL injection**: no raw SQL string concatenation anywhere in application code; all queries go through the Supabase client (parameterized) or typed RPC calls.
- **XSS**: prompt text and user-generated content are rendered as text/in code blocks, never via `dangerouslySetInnerHTML`. React's default escaping is relied on; if a rich-text renderer is ever introduced, it must run through a sanitizer (e.g. DOMPurify) — not implemented in Phase 1, no rich text yet.
- **Prompt injection** (Phase 4+ agent): all externally-fetched content is treated as untrusted data, never as instructions. Full defense-in-depth model in `AGENT_ARCHITECTURE.md` §4.

## 4. CSRF

Mitigated structurally: all state-changing routes require `POST/PATCH/DELETE`, cookies are `SameSite=Lax` (Supabase default), and mutations require a valid authenticated session — a cross-site request without the session cookie is rejected by RLS/auth regardless of any CSRF token.

## 5. Secrets

- `.env.example` documents every required variable with placeholder values only; real secrets live in `.env.local` (gitignored) or the hosting platform's env store (Vercel).
- No secret is ever logged, echoed in an API response, or committed to git.
- Google OAuth tokens (Phase 5) are stored server-side, encrypted at rest, never exposed to client JS (see `GOOGLE_INTEGRATION.md` §7).
- AI provider keys (Phase 2+) are server-only environment variables; no AI call is ever made from client code.

## 6. Import/Export Safety

- Imported files (TXT/CSV/JSON/Markdown, Phase 6) are parsed defensively — size-limited, schema-validated, never executed or evaluated as code.
- Exported files never include another user's data (query scoped by RLS regardless of export type).

## 7. Rate Limiting & Abuse

Deferred design note for Phase 6/7: API routes that call paid AI providers get a per-user rate limit before implementation, to prevent runaway cost/abuse. Not needed in Phase 1 (no AI calls yet).

## 8. Threat Checklist (spec §60) — Phase 1 Coverage

| Threat | Phase 1 status |
|---|---|
| SQL injection | Mitigated — parameterized queries only |
| XSS | Mitigated — no raw HTML rendering |
| CSRF | Mitigated — session-cookie + method-based mutations |
| Prompt injection | N/A yet (no agent) — designed in `AGENT_ARCHITECTURE.md` |
| Broken authorization | Mitigated — RLS + server-derived `user_id` |
| API abuse | Partial — Supabase's own rate limits apply; app-level limits deferred to when paid AI calls exist |
| Secret leakage | Mitigated — no secrets in repo, service-role key server-only |
| Malicious imports | N/A yet (import feature is Phase 6) |
| Malicious external content | N/A yet (Prompt Scout is Phase 4) |
