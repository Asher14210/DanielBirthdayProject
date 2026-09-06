# DanielBirthdayProject

## Decision tracker

The first confirmed letter choice is recorded with the participant name, visible-tab picking time (from View Letters to confirmation, excluding hidden-tab time), and database submission time. A letter opens only after saving succeeds; failed saves can be retried.

Enter the admin password in the homepage name field to open `/admin`, or log in directly at `/admin`. The password is checked on the server and exchanged for an HttpOnly, eight-hour session cookie; it is never bundled in the frontend or saved in browser storage. The long homepage password is masked once it exceeds the 32-character name limit.

Admins can select **Test letters**, **Choose again**, or **Admin records**. Test submissions are labeled `[Test]` and do not consume or reset the browser's normal choice. Log out to return to participant mode.

A persistent browser cookie and the database's unique `visitor_id` constraint enforce one choice even after refresh, restart, renaming, or simultaneous submissions. This is a browser limit, not hardware identification: deleting cookies, private browsing, another browser, or cookie expiry can create a new visitor. Stronger one-person enforcement requires verified accounts or single-use invitation codes. The timer restarts if the page reloads before submission.

For Vercel:

1. Add `SUPABASE_URL` and `SUPABASE_SECRET_KEY` as sensitive environment variables. Never prefix the secret with `VITE_`.
2. Add `ADMIN_PASSWORD` as a sensitive environment variable.
3. Deploy.

The `letter_decisions` table has RLS enabled with no public policies. Only the server API can read or write it.

For local API testing, use `vercel dev` after pulling the same variables into `.env.local`. Vite alone runs the participant UI but not the `/api/tracker` function.
