# Dallas (Antigravity) ↔ Stretch Prep Hub Routes Specification

**Date:** 2026-11-14  
**Status:** STRETCH Feature — Prepared, Fail-Closed & Inert  
**From:** Dallas / Antigravity (server prep routes & Claude generation)  
**Cross-Reference:** Cursor's `assignments/stretch-prep-hub.md` and `src/app/(student)/jobs/prep-hub.ts` (PR #45)  
**Target:** Interview prep hub supporting student practice grounded strictly in truthful profile facts and job descriptions.  

---

## 1. Core Principles & Truthfulness Guardrails

1. **Preemption by Core-at-12:**
   - Stretch prep routes are secondary to the core MVP student journey.
   - The moment Keyan lands database adapters (`src/lib/data/jobs.ts`), core private-job persistence and résumé enablement preempt this work.
2. **Strict Factual Grounding (Reuse `resume-suggest` discipline):**
   - Questions and suggested answers use **only** the student's own verified facts.
   - Every suggested answer must cite fact IDs in `evidence`.
   - Any suggested answer containing numeric, percentage, or date tokens not present in cited facts is rejected.
   - Requirements not covered by student facts are placed in `gapNote`, never fabricated into fake answers.
   - Buzzwords are extracted and defined based **strictly on the job description text**.
3. **Fail-Closed & Inert:**
   - If `ANTHROPIC_API_KEY` is absent: 503 `SERVICE_UNAVAILABLE`.
   - If database adapters are absent: 503 `SERVICE_UNAVAILABLE`.
   - If user is signed out: 401 `UNAUTHENTICATED`.
   - If explicit consent (`consent: true`) is missing: 400 `INVALID_INPUT`.
   - No mock persistence, no fake saves, no credit spend during automated tests.
4. **Single Provider Selector:**
   - News search reuses the single provider selector `JOB_SEARCH_PROVIDER=claude_web` (default `none`). No secondary flag.
   - When provider is `none` or unconfigured, news returns `{ items: [], enabled: false }` with clear unverified labels; never fabricates news.
5. **No Real Contacts Endpoint (Cursor UI Owned):**
   - Networking contacts are strictly Cursor's fictional demo UI fixture (`PrepBundle.contacts`).
   - No backend `/api/prep/contacts` endpoint exists; zero real outreach or messaging.

---

## 2. Server Contracts (Matching Cursor's `PrepBundle` Exactly)

### A. `POST /api/prep/questions`
Generates interview practice questions cross-referenced against student facts.

- **Auth:** Verified session via `createSupabaseServerClient().auth.getUser()`; 401 if signed out.
- **Request Body:**
  ```ts
  {
    jobId: string; // uuid
    consent: boolean; // must be true
  }
  ```
- **Success Response (200) matching `PrepQuestion[]`:**
  ```ts
  {
    data: {
      questions: {
        id: string; // uuid
        text: string;
        answerableByFactIds: string[];
        bestFactId: string | null;
        suggestedAnswer: {
          text: string;
          evidence: string[]; // fact IDs
        } | null;
        gapNote: string | null;
      }[];
    }
  }
  ```
- **Error Codes:**
  - 400: `INVALID_INPUT` (missing `jobId`, invalid UUID, or `consent !== true`).
  - 401: `UNAUTHENTICATED` (signed out).
  - 404: `NOT_FOUND` (job does not exist or belongs to another student).
  - 503: `SERVICE_UNAVAILABLE` (missing `ANTHROPIC_API_KEY` or database adapters).

### B. `POST /api/prep/buzzwords`
Extracts key technical buzzwords and domain terms grounded exclusively in the job posting text.

- **Auth:** Verified session; 401 if signed out.
- **Request Body:**
  ```ts
  {
    jobId: string; // uuid
    consent: boolean; // must be true
  }
  ```
- **Success Response (200) matching `PrepBundle.buzzwords`:**
  ```ts
  {
    data: {
      buzzwords: {
        term: string;
        definition: string;
        contextInJob: string;
        verified: false;
      }[];
    }
  }
  ```

### C. `GET /api/prep/news?query=...`
Retrieves recent industry news for company prep, matching Cursor's `PrepNewsItem` contract.

- **Auth:** Verified session; 401 if signed out.
- **Query Params:** `query` (company or industry keyword, max 100 chars).
- **Success Response (200) matching `PrepNewsItem[]`:**
  ```ts
  {
    data: {
      items: {
        id: string;
        title: string;
        source: string;
        url: string; // https-only
        publishedAt: string | null;
        summary: string;
        unverified: true;
      }[];
      enabled: boolean;
      provider: string;
      note?: string;
    }
  }
  ```
- **Fail-Closed Behavior:** When `JOB_SEARCH_PROVIDER !== 'claude_web'` or unconfigured, returns 200 with `{ items: [], enabled: false, provider: 'none', note: '...' }`. Never invents news articles.

---

## 3. Required Keyan Adapters & One-Line Enablement Guide

### Required Keyan Adapters:
1. `getAuthorizedJob(id: string): Promise<JobPosting | null>` in `src/lib/data/jobs.ts`
2. `getStudentFacts(userId: string): Promise<StudentFact[]>` (or via `getProfile`)

### Server-Side Enablement:
1. Set `ANTHROPIC_API_KEY=sk-ant-...`.
2. Set `JOB_SEARCH_PROVIDER=claude_web` (for news).
3. In `src/app/api/prep/questions/route.ts` and `src/app/api/prep/buzzwords/route.ts`, inject Keyan's adapters into `handlePrepQuestions` and `handlePrepBuzzwords`.

### Client-Side Enablement (Cursor):
- In `src/app/(student)/jobs/prep-hub.ts`, flip `IS_PREP_LIVE = true` once backend routes are verified.

---

## 4. Testing & Verification

1. **Routine Unit Tests (Always Run in CI — Vitest):**
   - Mocked model caller and mocked adapters.
   - Tests unauthenticated requests (401), missing consent (400), invalid body (400), adapter absent (503), missing API key (503), grounding checks (rejection of ungrounded numbers/dates), foreign-fact rejection, and provider disabled state.
2. **Guarded Live Smoke Test (`src/lib/claude/prep-live.test.ts`):**
   - Guarded by `Boolean(process.env.ANTHROPIC_API_KEY && process.env.JOB_SEARCH_PROVIDER === 'claude_web')`.
   - Never runs in standard CI and consumes no live credits.
