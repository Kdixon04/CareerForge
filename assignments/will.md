# Will — demo, product explanation, and user-flow QA

Read [AGENTS.md](../AGENTS.md) first. You own the 60–90 second YouTube-style demo video, fictional demo materials, and an independent user walkthrough. C/C++ and electrical engineering are known strengths; web/video-tool experience and availability remain TBD. You need not learn a web framework to contribute.

## Ownership and first task

Own demo/**: script, shot list, persona/sample job, QA checklist/findings, recording notes, submission-link notes. Keep large videos outside Git and put the shared artifact URL in demo/video.md. Do not upload secrets/screenshots of private dashboards. Another person's source/tests/config/SQL require a specific announced handoff.

First hour: draft a three-sentence explanation and a five-beat 60–90 second outline: problem -> student's experience -> real job discovery or pasted fallback -> evidence-backed resume edits -> saved next step, with a short employer view if implemented. Mark features planned/built/fallback/cut; update status when owners verify. Test a 10-second screen/audio recording now.

## Ordered deliverables

1. demo/script.md with timed narration and shots. Theme wording is our interpretation (reinvent resume/career center), not school endorsement or confirmed organizer approval.
2. demo/persona.json aligned with StudentProfile/StudentFact contracts: one fictional student, education, skills, two projects, one experience, stable fact ids, no real contacts. Make an obvious missing skill so gap detection can be demonstrated.
3. demo/job-sample.txt as clearly fictional fallback, and a separate harmless injection fixture for private QA. For real search demo, capture source URL/date and avoid claiming it is open just because AI returned it.
4. demo/qa.md checklist for the exact journey in both themes on phone and desktop, plus findings. Work against fixtures early and live deployed flow when available.
5. demo/video.md with recording status, external video link/visibility, runtime and final commit recorded. Use 60–90 seconds as the team requirement; verify actual event submission rules with Dallas. Do not treat a "YouTube-style" format as proof of the required host.
6. Two timed rehearsals, backup footage and final link playback check. Record early usable clips as features land, then capture the final version after freeze.

## Acceptance and useful testing contribution

- Video is 60–90 seconds when played, narration audible, on-screen text readable, captures the real implemented product and links to the submitted deployed version.
- Routine claims match feature status. Mocked/pre-recorded/pasted results are labeled; no fake live search, ATS success score, unverifiable performance claim or causal hiring claim.
- Check student sign-in -> add/save experience -> find/paste job -> see evidence/gaps -> edit/save bullet -> reload -> same edit -> save application/status -> reload -> same state. Ask owners to fix discrepancies; don't patch code in their folders.
- Verify light/dark switch and persistence across screens/reload, mobile menu/form readability and no horizontal scroll.
- If employer included, employer draft -> publish -> student view/save -> own stats; no implication of seeing private student resumes.
- Check search-disabled/error path and a previously saved resume/recording fallback if the AI service is down.
- Review footage for keys, cookies/tokens, personal information, browser notifications and private dashboards before upload. Test accounts/people in the demo are fictional.
- Product UI/description discloses selected text goes to Claude. Give appropriate source links; unknown deadlines remain unknown.

Feature owners run Playwright; your manual QA/rehearsal is additional evidence, not a substitute. Optional contained automation task only after explicit path handoff/pairing; your core time stays available for recording/editing/submission.

## Time and handoff

Start script/persona/audio setup immediately, not in the final hours. Record draft clips by the middle of the available time. Final 20–25%: stabilize shots, edit/caption, export, rehearse and check submission playback with buffer. Captions are recommended for readability; polish should not delay submission.

For reports: deliverable file/link; timed runtime; version/commit recorded; claim status (built/fallback/cut); device/theme checked; exact steps of any issue; priority and owner; next action. Never post credentials in a report. Help track deadlines/owner progress in demo/checkpoints.md if useful; Dallas maintains shared decisions.

