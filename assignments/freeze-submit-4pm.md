# 3:45 PM freeze — submission checklist

## Portal / team

- [ ] Final commit SHA: `________________`
- [ ] 60–90s video URL (Will): `________________`
- [ ] Deployed URL (or note **local demo only**): `________________`
- [ ] Team member list confirmed with organizer

## Honest feature list (for judges)

**Shipped (target when deploy + Keyan land):**

- Sign-in (Supabase)
- Profile facts (real when adapter live)
- Browse published jobs (real when seeded)
- Paste/parse job text
- Match + prep **preview** (fixture until résumé live)

**Explicitly cut / fixture:**

- Employer posting
- Live Claude job search (`JOB_SEARCH_PROVIDER=none`)
- Saved-application persistence (fixture `/saved`)
- Prep live generation (`IS_PREP_LIVE` false)

## Commands (integrator last run)

```powershell
npm run typecheck
npm test
npm run build
npm run smoke -- --grep dallas-
```

Record pass/fail and **NOT RUN** reasons in [`teammates.md`](../teammates.md).

## Security one-liner (if tested)

Student A private job not readable by Student B — cite `dallas-private-jobs-db.spec` only if run with live creds.