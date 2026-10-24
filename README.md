# The Spotlight

The public site and admin tools for AFIT's "The Spotlight" media platform:

- **Homepage (`/`)** — editorial front page (masthead with the text mark,
  section desks, the Spotlight Profile format, publishing rhythm). Add real
  published stories to `stories` in `src/content/site.ts` and they appear in
  "Latest" and under their desk. If exactly one guess is live, it's teased in
  the lead.
- **Talk To The Founder (`/founder`)** — message straight to the founder;
  name and contact are optional. `/founder?topic=recommend` is the
  "Recommend someone" variant.
- **Anonymous messages (`/message`)** — no name, no account, and the IP is
  never stored with the message.
- **Admin → Messages** — inbox for both. **Every message is kept for 30 days**
  from when it was sent, then purged; the admin deleting it is the only way
  it leaves sooner.
- **Two dashboard accounts** — *Team admin* (`ADMIN_PASSWORD`) and *Founder*
  (`FOUNDER_PASSWORD`), picked on the login screen. Talk to the Founder
  messages are visible to the founder account only; everything else is
  shared.

Brand: the text mark (`src/components/brand/Wordmark.tsx`) is the primary
signature. The logo mark (`public/brand/logo-mark.png`) is used sparingly —
favicon, footer, and social preview image only.

The guessing game:

1. **Public pages (`/your-question-slug`)** — each guessing round ("question")
   gets its own link. Students who open it submit a guess; every submission
   is tagged with exactly which question it answered.
2. **Admin dashboard (`/admin`)** — password-protected. Create questions and
   copy their links, view/search/filter guesses (by question, department, or
   text), mark them featured, and build a screenshot-ready "guesses are in"
   graphic to repost to the WhatsApp Channel.

## How question links work

- Go to **Admin → Questions → New question**, give it a headline (e.g. "Who's
  in the Spotlight — Week 3?"), optional supporting text, and a reveal label
  (e.g. "Friday"). A slug is generated from the title — editable before you
  create it, e.g. `thespotlight.ng/whos-in-the-spotlight-wk3`.
- Copy that link and share it. Everyone who opens it sees that question's own
  headline and submits against that question's ID — nothing is inferred from
  timing or guesswork, the link *is* the question.
- Close a question (`Close guessing`) once its Monday reveal happens; its
  link then shows a "this guess is closed" state instead of the form. You can
  reopen it any time.
- The bare domain (`/`) is now the homepage. If there's exactly one active
  question it's linked from the lead; it never lists questions publicly.
- Deleting a question does **not** delete the guesses that answered it — they
  become "Uncategorized" in All Guesses (see `ON DELETE SET NULL` in the
  schema).

## Planned next: accounts

You mentioned wanting users to create accounts eventually. To make that a
plain migration instead of a rewrite, `submissions.user_id` already exists in
the schema (nullable, unenforced, unused by any code yet). When you're ready:
Neon Auth (or Auth.js) is the natural fit given the rest of the stack — add a sign-in
flow, set `user_id` on insert for logged-in users, and optionally require it
going forward. Nothing above needs to change structurally for that to slot in.

## Stack & why

- **Next.js 14 (App Router) + TypeScript + Tailwind** — matches your existing
  frontend stack, one codebase for public site + admin + API.
- **Neon (serverless Postgres)** via `@neondatabase/serverless`. The database
  is only ever reached from server code using `DATABASE_URL`; the browser has
  no database credentials or direct read path, so names, departments, and
  messages can't leak through a public request. All queries bind user input
  as parameters.
- **Signed cookie session (`jose`)** — one password per account (env vars)
  issues an HTTP-only, signed JWT cookie, carrying which account signed in,
  checked by `src/middleware.ts` on every `/admin/*` and `/api/admin/*`
  request.
- **Zustand** — client-side store for the admin dashboard (filters, submission
  list, Share View selection) — matches your existing stack.
- **html-to-image** — lets the admin download the Share View poster as a PNG
  directly from the browser, in addition to just screenshotting it.

## Getting started

### 1. Create the database

The production database is the Neon project **The Spotlight**
(console.neon.tech → organization "Jathniel"), and `db/schema.sql` has
already been applied to it. For a fresh database, open Neon's **SQL Editor**
and run everything in `db/schema.sql` — it's safe to run more than once.
Expired messages are purged every time the admin inbox loads, so no
scheduler is needed.

### 2. Configure environment variables

Copy `.env.example` to `.env.local` and fill in:

```
DATABASE_URL=...        # Neon → Connect → pooled connection string (server-only)
ADMIN_PASSWORD=...      # Team admin login
FOUNDER_PASSWORD=...    # Founder login (sees Talk to the Founder messages)
SESSION_SECRET=...      # any long random string (e.g. `openssl rand -hex 32`)
```

### 3. Install and run

```
npm install
npm run dev
```

- Public page: `http://localhost:3000`
- Admin login: `http://localhost:3000/admin/login`

### 4. Deploy

Any Node host works (Vercel is the path of least resistance for Next.js).
Set the same environment variables in your host's dashboard — on Vercel,
add them under **Settings → Environment Variables** for the Production
environment (and Preview, if you want previews to work against the same
database — or point Preview at a Neon branch).

Every route that reads or writes data (`/`, `/[slug]`, and everything under
`/api/admin`) is explicitly marked `export const dynamic = "force-dynamic"`.
This matters: without it, Next.js tries to prerender those routes at *build*
time, before your environment variables are guaranteed to be present, which
fails the build with a `DATABASE_URL is not set` error. If you ever add a
new route that reads the database or checks the session cookie, add
that same line at the top of the file.

On Vercel, remember the in-memory rate limiter (`src/lib/rate-limit.ts`)
resets per serverless instance — fine for launch traffic, but swap it for a
Redis-backed limiter (e.g. Upstash) if you see spam at scale.

## How the "identity stays hidden" rule is enforced

- The public submission form always sends `name` + `department`, and they're
  always stored — the admin needs them.
- The public site **never has a read path** to the `submissions` table (the
  database is only reachable from server code, and no public route returns
  submissions), so there is no public page or public API response that could
  ever include a name.
- Every submission has an `identity_revealed` boolean, defaulting to `false`.
  It only flips to `true` when the admin explicitly toggles "Reveal identity
  on poster" for that submission in Share View — and it only affects what's
  shown on the poster graphic, nothing else.

## Project structure

```
src/
  app/
    page.tsx                    Root: redirects to the one active question,
                                 or shows a neutral fallback
    [slug]/page.tsx             Public per-question page (the shared link)
    api/submissions/route.ts    Public POST endpoint (insert-only, validates
                                 the question exists & is active)
    admin/
      login/page.tsx            Admin login (outside auth + outside sidebar)
      (shell)/                  Route group: pages wrapped in the sidebar shell
        dashboard/page.tsx
        questions/page.tsx       Create questions, copy links, open/close them
        guesses/page.tsx
        featured/page.tsx
        settings/page.tsx
        layout.tsx               Sidebar shell
      share/page.tsx            Share View — deliberately outside the shell
                                 so the poster area stays screenshot-clean
    api/admin/
      login/route.ts  logout/route.ts
      questions/route.ts          GET list (with guess counts) + POST create
      questions/[id]/route.ts     PATCH (title/subtext/active/slug) + DELETE
      submissions/route.ts        GET list (search/filter by question or
                                   department/sort/stats)
      submissions/[id]/route.ts   PATCH (feature/hide/reveal) + DELETE
      export/route.ts             CSV export
  components/
    public/     SpotlightBeam, QuestionExperience, SubmissionForm, ClosedState
    admin/      Sidebar, StatCard, SubmissionCard, Filters, ShareCard,
                QuestionCard, NewQuestionForm
    ui/         TextInput, TextArea, FieldWrapper
  lib/
    db.ts         server-only Neon Postgres client
    auth.ts       accounts + session token sign/verify
    session.ts    reads the signed-in account in API routes
    rate-limit.ts in-memory throttle + IP hashing
    slug.ts       slug generation for question links
    store.ts      Zustand store for the admin dashboard
    types.ts      Shared types
  middleware.ts   Protects /admin/* and /api/admin/*
db/
  schema.sql    Full schema (questions, submissions, messages), idempotent
```

## Using the Share View

1. Mark strong guesses **Featured** from All Guesses or the Dashboard.
2. Go to **Featured**, tick the ones you want in this graphic → **Create Share
   View**.
3. On the Share View page, optionally toggle **Reveal identity** per guess.
4. Click **Enter presentation mode** to hide all controls, or **Download PNG**
   to save the graphic directly — either way it's ready to post to the
   WhatsApp Channel.
