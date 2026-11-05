# Supabase backend and dashboard

1. Create a Supabase project. Copy `.env.example` to `.env.local`.
2. Set the project URL and publishable/anon key, the server-only service role key, and `ADMIN_EMAILS` (comma-separated list of allowed emails; `ADMIN_EMAIL` remains supported for a single admin).
3. Create or invite each admin account in Supabase Auth using an email in `ADMIN_EMAILS`. Only those allowlisted accounts can access the dashboard. Keep public sign-ups disabled.
4. Run [`schema.sql`](./schema.sql) in the Supabase SQL editor. It creates content, skills, project-skill links, comments, page-view tables, grants, and the starter project/skill links. The seed uses `ON CONFLICT DO NOTHING`, so it preserves edits if run again.
5. Run [`career-timeline.sql`](./career-timeline.sql) in the Supabase SQL editor. It creates the secured career milestone table, public logo bucket, and starter education/experience timeline. The seed preserves existing entries if run again.
6. Restart `npm run dev`, then open `/admin/login`. Use the Career Journey editor to add, update, reorder, publish, hide, or remove milestones and upload organization logos.

Admin sign-in uses Supabase Auth with cookie-backed sessions and token refresh in the Next.js 16 `proxy.ts`. Server routes verify the authenticated user's email against `ADMIN_EMAILS` (or the single-email `ADMIN_EMAIL` fallback). The service-role key stays on the server.

Public comments are inserted as `pending`; only approved comments are returned publicly. The dashboard can approve, decline, or delete them. One comment per project per day is accepted per first-party browser ID. This is a basic spam brake, not a full CAPTCHA system.

The dashboard records page views and distinct browser/day counts using random first-party identifiers. It does not collect IP addresses or email addresses for comments.

## Contact email

The `/contact` form sends through the configured SMTP provider in `app/api/contact/route.ts`. Add `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`, and `CONTACT_TO` to `.env.local`; the example file has placeholders. Keep the SMTP password server-side and restart the dev server after changing environment values. Until SMTP is configured, the form displays an error and the direct email link remains available.
