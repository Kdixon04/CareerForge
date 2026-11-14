## Nav update request — from Cursor slice 3

Routes `/jobs` and `/jobs/[id]` are on main (PRs #14, #16).

Request: add `{ href: '/jobs', label: 'Find Jobs' }` to the links array
passed to `MainNav` in `src/app/root-shell.tsx`.

No other changes needed. One-line PR whenever convenient.

Requested by: Cursor, 2026-11-14