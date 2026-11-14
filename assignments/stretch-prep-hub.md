# Stretch — Internship Prep Hub (spec + ownership)

**Status:** STRETCH (AGENTS.md: "stretch only after core works and there is a safe time budget"). Everything here is **fixture-first and clearly labeled**. Nothing claims real data, persistence, or live AI until core + Keyan land.

**Priority rule — core at ~12:00 Denver:** the moment Keyan's data adapters arrive, STOP stretch and switch to core MVP enablement (private-job + résumé persistence, flag flips, deploy, Student A/B verification). This hub must never block or modify core files, auth, `src/contracts/**`, any `IS_*_PERSISTENCE_AVAILABLE` flag, or Keyan/Steve paths.

## What it is

From the internship detail at `/jobs/[id]`, a clearly-labeled **"Prep for this role (preview)"** entry leads to `/jobs/[id]/prep`, a preview hub with four sections:

1. **Buzzwords / terms glossary** — AI-generated terms likely relevant to the role. Labeled *"AI-generated — may be inaccurate, verify."*
2. **Likely interview questions** — practice questions with **two views**:
   - **View A (questions → answers):** a list of likely questions; for each, a suggested answer grounded in the student's own facts, plus an explicit **gap** note when their experience can't answer it.
   - **View B (experience → questions):** the student selects an existing fact **or** types a new experience, and sees which questions it can answer, with an **"Answers this best"** marker.
3. **Connect (fictional demo):** sample people who "work there" who would answer questions. **Fictional dummy data only — not real people, no real outreach.** A "Draft a message" action only opens a local pre-filled template; it sends nothing.
4. **Role / company news** — AI-gathered via the same Claude provider used for internship discovery. **Unverified**, fixture fallback when the provider is disabled.

## Truthfulness guardrails (UI + routes)

- Internships stay **unverified** — never "open", "verified", or "endorsed".
- Interview questions & buzzwords are **AI-generated practice, not the employer's actual content**; review before use.
- Answers are **grounded in the student's own facts**, student-authored, and **never auto-submitted**.
- Contacts are **fictional demo data** with **no real outreach**.
- News is **AI-gathered / unverified** ("verify before relying"); HTTPS-only, sanitized; never fabricated specifics presented as fact; fixture when the provider is off.
- **No causal hiring claims** (usage ≠ outcomes).
- AI is **mocked** in routine tests; live only in separately labeled, guarded smokes.

## Ownership split (Dallas family)

| Area | Owner | Paths |
|------|-------|-------|
| Prep hub UI, fixtures, view logic, tests | **Cursor** | `src/app/(student)/jobs/[id]/prep/**`, `src/app/(student)/jobs/prep-hub.ts`, `src/app/(student)/jobs/fixture-prep-hub.ts`, `tests/e2e/dallas-prep-hub.spec.ts` |
| Generation routes + Claude logic (inert/fail-closed, mocked tests) | **Antigravity** | `src/app/api/prep/**`, `src/lib/claude/prep-*.ts` (questions, buzzwords, news only) |

**Anti-collision (Antigravity ↔ Cursor):**
- **Connect / contacts:** Cursor **only** — fictional demo contacts live in the UI fixture (`PrepBundle.contacts`). Antigravity must **not** add a real-data or outreach `/api/prep/contacts` route. If a placeholder endpoint exists for tests, it must return clearly fictional sample rows and perform no messaging; delete it if redundant.
- **Interview questions UI:** Cursor renders `PrepBundle.questions` and the two views; Antigravity generates the same shape server-side.
- **News:** Antigravity `GET /api/prep/news` (provider-gated); Cursor displays items labeled unverified; no fabricated headlines in UI when provider is off.
- **E2E:** routine Dallas prep UI tests are Cursor-owned (`dallas-prep-hub.spec.ts`). Antigravity may add **guarded** live prep smokes (`test.skip` without keys) in a clearly named file; must not block CI.

UI consumes the shared `PrepBundle` fixture now; routes will produce the same shape later behind a gate (`IS_PREP_LIVE`). No second search-enable flag — news reuses the single `JOB_SEARCH_PROVIDER` selector.

## Shared fixture contract

```ts
type PrepBundle = {
  jobId: string;
  buzzwords: { term: string; definition: string }[];
  questions: {
    id: string; text: string;
    answerableByFactIds: string[]; bestFactId: string | null;
    suggestedAnswer: { text: string; evidence: string[] } | null;
    gapNote: string | null;
  }[];
  contacts: { id: string; name: string; role: string; org: string; blurb: string; fictional: true }[];
  news: { id: string; title: string; source: string; url: string; publishedAt: string | null; summary: string; unverified: true }[];
};
```

The two views are projections of the `questions` ⇄ facts matrix: View A reads each question's `suggestedAnswer`/`gapNote`; View B filters questions by a chosen `factId` (or a local token-overlap heuristic for typed text) and marks `bestFactId` / the top match as "Answers this best."

## Enablement later (one gate)

- Cursor: flip `IS_PREP_LIVE = true` in `src/app/(student)/jobs/prep-hub.ts` and point the sections at Antigravity's routes — only after routes + any needed Keyan read adapters are merged and verified. Never flip on mocks.

## Status log

- 2026-11-14 (Cursor): spec written; fixture-first UI + view logic + Playwright added on `dallas/cursor-stretch-prep-hub`. Inert (`IS_PREP_LIVE = false`), no network, no core files touched. Awaiting Antigravity `src/app/api/prep/**` routes. Core-at-12 preempts.
