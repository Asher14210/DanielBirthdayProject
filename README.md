# DanielBirthdayProject

## Letter content

The public collection contains **Wendy — 别看这个** first, using the winter envelope palette and snowflake seal, followed by **Rachel — Happy Eggberthday!**, using the Botanist's green palette and leaf seal. Both supplied messages are preserved verbatim, including Rachel's two-line closing. No sample letters or generated message paragraphs are shown. Real entries in `src/components/magical/letterData.js` drive the multi-letter browsing/reveal flow automatically.

When changing letter IDs or names, deploy the Supabase function before the website so tracking recognizes them. Its server-only legacy ID/name map accepts already-open pages from earlier deployments without putting sample content in the frontend or rewriting historical records.

## Decision tracker

Only the exact name `Daniel` (ignoring surrounding spaces) passes the homepage name gate. The server issues an eight-hour signed entry cookie tied to the browser and requires it for normal submissions. This is a name gate, not identity verification or protection for the letter text bundled in the public website. The admin password still opens `/admin` from the homepage and allows unlimited test choices.

Every confirmed letter opening is recorded with the participant name, browser identity, choice number, visible-tab picking time, and database submission time. With multiple letters, the original “Kidding.” reveal lets visitors continue browsing after their first letter; with one letter, closing returns directly to its envelope. Reopening a letter counts as another choice. A letter opens only after saving succeeds; retries of the same request do not create duplicate records.

Timing starts when the carousel appears and stops at confirmation. Each subsequent choice starts a fresh timer, excluding time spent reading, on the reveal, or in a hidden tab. The timer restarts if the page reloads before submission.

Enter the admin password in the homepage name field to open `/admin`, or log in directly at `/admin`. The password is checked on the server and exchanged for an HttpOnly, eight-hour session cookie; it is never bundled in the frontend or saved in browser storage. The long homepage password is masked once it exceeds the 32-character name limit.

Admins can select **Test letters**, **Choose again**, or **Admin records**. Test submissions are labeled `[Test]` and have a separate choice sequence from the browser's normal visits. Log out to return to participant mode.

A persistent cookie groups choices from the same browser across refreshes and restarts. There is no choice limit. Clearing cookies, private browsing, or switching browsers creates a separate history. The private `letter_decision_history` view numbers each browser's records in insertion order before the admin API limits its response to the newest 500 records.

### Hosting and secrets

`/api/tracker` is a same-origin proxy to the `letter-tracker` Supabase Edge Function in project `lmvdhvtqdtjohgzdagcn`. **Vercel needs no tracker environment variables.** The proxy contains only the public function URL, forwards only tracker cookies and authorization, and never exposes database credentials. It rejects cross-origin browser writes, limits request size, and fails closed when Supabase is unavailable.

The Edge Function owns password verification, signed cookies, and database access. Set `ADMIN_PASSWORD` in **Supabase → Edge Functions → Secrets**, using a strong random password. Supabase supplies its database URL and server key to the function; never put an admin or database secret in a `VITE_` variable, the frontend, or Git. Rotating `ADMIN_PASSWORD` invalidates existing signed sessions.

Deploy the backend with `supabase functions deploy letter-tracker --project-ref lmvdhvtqdtjohgzdagcn`. The checked-in configuration disables gateway JWT verification because this function verifies its own signed visitor/admin cookies. Anonymous requests cannot read records or submit without a signed entry session. No CORS access is enabled.

After the function is configured, merge/deploy the repository change through the existing Vercel Git integration. Changing the function or its secrets does not require access to the website owner's Vercel account. Changing the website proxy still requires a repository change and a successful website deployment.

The `letter_decisions` table has RLS enabled with no public policies. Only the server API can read or write it. The history view uses `security_invoker` and is readable only by the server role. Apply `supabase/migrations/20260906140403_track_every_letter_choice.sql` to the existing database before deploying this version; it preserves existing records and replaces the one-choice constraint with request deduplication.

For local testing, use `vercel dev`; the proxy talks to the configured Supabase function without local tracker secrets. Vite alone runs the participant UI but not the `/api/tracker` function. Run `npm test` for isolated backend, adapter, and proxy tests; `npm run build` verifies the frontend build.
