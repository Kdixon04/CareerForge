# Will — demo video script (60–90 seconds)

**Student:** Fictional only — e.g. *Jordan Avery*, computer science student (not a real person).  
**Record against:** Deployed production/preview URL once Dallas marks smoke green; if only localhost, on-screen label: **“Development build.”**  
**Voice:** Honest about **REAL** vs **FIXTURE** (see [teammates.md](../teammates.md) demo table).

---

## On-screen labels (use sparingly, 1–2 sec each)

- **REAL** — Supabase auth, saved profile facts (when adapter live), seeded published jobs, paste parse.
- **PREVIEW / FIXTURE** — Match/résumé generation, saved applications list, calendar sample, prep hub UI.

---

## Script (~75 seconds)

| Time | Visual | Narration |
|------|--------|-----------|
| 0–10s | Logo / sign-in → Profile | “I’m Jordan, a student using Career Forge. I sign in with my own account—**real**—and open my profile to capture skills and projects in my own words.” **Label: REAL** |
| 10–22s | Add 2–3 facts → Save → Reload profile | “I save and reload. What I entered stays mine—**real** persistence when our database adapter is connected.” **Label: REAL** *(if save fails on deploy, say “profile preview” and show FIXTURE badge)* |
| 22–35s | `/jobs` → open listing | “I browse internships our team seeded for the demo—**real listings** in the database—or I can paste a job description when search isn’t turned on yet.” **Label: REAL** for seeded browse; paste parse **REAL** |
| 35–50s | Paste form **or** job detail → Match or Prep CTA | “Before I apply, I review how my experience lines up. Match and prep views are **practice previews** today—review anything AI suggests before you trust it.” **Label: FIXTURE** on match/prep unless résumé routes are live |
| 50–60s | Toggle light/dark; quick mobile crop | “It works on my phone and in dark mode—built for students between classes.” |
| 60–75s | Saved + Calendar flash (optional) | “Saved applications and calendar here are **labeled samples**—the core path we shipped is profile → job → honest preparation.” **Label: FIXTURE** on `/saved` and `/calendar` |
| 75–90s | Closing card: URL + team | “Career Forge: your story, real jobs, evidence-linked prep. Built at BYU–Idaho hackathon—not employer posting or live search in this cut.” |

---

## Demo table → narration cheatsheet

| Step | Route | Say on camera |
|------|--------|----------------|
| Sign in | `/sign-in` | REAL (with env) |
| Profile save/reload | `/profile` | REAL when adapter live; else “preview UI” |
| Browse + filters | `/jobs` | REAL when DB seeded |
| Job detail | `/jobs/[id]` | REAL for published row |
| Paste preview | `/jobs` form | REAL parse; private save off until flag flip |
| Match / résumé edit | `/match/[id]` | FIXTURE until résumé routes + adapter |
| Saved applications | `/saved` | FIXTURE |
| Calendar | `/calendar` | FIXTURE sample schedule |
| Prep hub | `/jobs/[id]/prep` | FIXTURE (`IS_PREP_LIVE` false) |

---

## Optional 5-second security line (only if private save verified)

“Another student can’t see my pasted job—that’s row-level security in Supabase.” **REAL** only after Student A/B smoke.

---

## Cuts to state explicitly (judges)

- Employer posting and analytics: **not in this demo**.
- Live Claude job search: **off** (`JOB_SEARCH_PROVIDER=none`) unless team flips after smoke.
- Saved application persistence: **cut** → fixture page.

---

## Delivery checklist for Will

- [ ] Fictional name and facts only in recording
- [ ] Deployed URL in description or end card (when available)
- [ ] PREVIEW/FIXTURE badges where table says fixture
- [ ] 60–90s total; landscape + one vertical clip optional
- [ ] No passwords, API keys, or real resumes on screen