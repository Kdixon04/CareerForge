# Judges — feature list (honest tiers)

**Fill at submit (do not invent):**

| Field | Value |
|---|---|
| Deployed URL | `________________` |
| 60–90s video URL | `________________` |
| Final `main` SHA | `________________` |
| Team | Dallas, Keyan, Steve Rogers, Will |

---

## Tier A — demo these (working or clearly labeled)

| Feature | Status to claim |
|---|---|
| Sign-in (Supabase Auth) | Real when env configured; otherwise demo accounts **only if** provisioned by human |
| Student RootShell nav (Profile / Find jobs / Saved / Calendar) | Shipped (PR #48) |
| Profile facts UI | UI shipped; **persistence** depends on profile adapter / env |
| Browse published employer jobs | Real list/detail when seeded + env; fixture mode in CI |
| Paste / parse job text (preview) | Shipped; preview is **not** a saved private import |
| Match review UI | Fixture / practice preview until résumé routes live |
| Internship Prep Hub UI | Fixture preview; `IS_PREP_LIVE` stays false |
| Calendar (deadlines / reminders / export links) | Shipped as Will's feature on main |

## Tier B — present as partial / fail-closed

| Feature | Honest label |
|---|---|
| `POST /api/jobs/import` + `GET /api/jobs/[id]` | Fail-closed 503 until Keyan `JobDataAdapter` |
| `POST /api/resume/suggest` + `GET/PATCH /api/resume/[id]` | Fail-closed 503 until Keyan resume adapters + Claude key |
| Saved applications | Fixture `/saved` — not durable persistence |
| Employer stats / views | Schema/RLS exist; product UI may be cut |

## Tier C — stretch / optional if time

| Feature | Note |
|---|---|
| Live Claude job search | `JOB_SEARCH_PROVIDER=none` unless smoke-checked |
| Custom admin UI | Stretch (Keyan) |
| Contacts / follow-ups | After data handoff (Will) |
| Live prep generation (`/api/prep/*`) | Routes exist; fail-closed without adapters/key |

## Explicitly cut (do not claim)

| Cut | Why |
|---|---|
| Verified open jobs / ATS scores / hiring outcomes | No evidence |
| School endorsement / Career Center partnership | Research reference only |
| Auto-submit applications | Never |
| Live search as default demo path | Prefer paste + fixture honesty |
| Merging DRAFT #35 without Steve | Integrator rule |

## Demo narration reminder

Use [demo/WILL-VIDEO-SCRIPT.md](../demo/WILL-VIDEO-SCRIPT.md). Say **fixture** or **preview** whenever persistence or AI is not live. No secrets on screen.
