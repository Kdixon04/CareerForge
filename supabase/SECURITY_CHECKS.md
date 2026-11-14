# Career Forge database security checks

These checks are a repeatable manual procedure for the MVP. Run them against an isolated Supabase project or a preview branch when available. Do not reset or seed production with test users.

Use fictional accounts:

- Student A and Student B
- Employer A and Employer B
- An ordinary student account that has not been trusted-promoted

Use each account's normal Supabase Auth session and a user-scoped client. Do not use a service-role key for the assertions.

## Required assertions

1. Student A can select, insert, update, and delete only Student A's `profiles`, `student_facts`, `saved_applications`, and `resume_versions`. Queries by Student B's IDs return no rows and denied writes leave the database unchanged.
2. Employer A can create, update, publish, pause, and read only Employer A's employer listings. Employer A cannot read or update Employer B's drafts, and `get_employer_stats()` returns only Employer A's listing counts.
3. The ordinary student cannot insert, update, upsert, or delete a `user_roles` row and cannot become an employer or admin by editing `profiles` or Auth user metadata. Role promotion is performed only by a trusted server-side/admin setup process.
4. A student can select a published employer job. The same student cannot select another employer's draft, a hidden listing, or an unpublished private import. A student who saved a listing can still read a paused copy as inactive.
5. Calling `record_job_view(job_id)` as a student on a published employer job creates at most one `(job_id, viewer_user_id)` row even after refresh/retry. Anonymous users, employers, and unpublished jobs are rejected.
6. Repeatedly saving the same job does not increase `current_saves`; unsaving removes the row and decrements the derived count.

Record the exact command/UI path and result for each assertion. A passing UI flow is not enough: inspect returned rows and persisted state as well.
