# The Spotlight — Guessing Game

A two-sided app for AFIT's "The Spotlight" media platform:

1. **Public page (`/`)** — students submit a guess for who's being featured Monday.
2. **Admin dashboard (`/admin`)** — password-protected, view/search/filter guesses,
   mark them featured, and build a screenshot-ready "guesses are in" graphic to
   repost to the WhatsApp Channel.

## Stack & why

- **Next.js 14 (App Router) + TypeScript + Tailwind** — matches your existing
  frontend stack, one codebase for public site + admin + API.
- **Supabase (Postgres)** — production-suitable managed Postgres with Row Level
  Security. The public page uses the anon key and can only INSERT rows (never
  read them back), so there's no way for the public frontend to leak names,
  departments, or messages. All admin reads/writes go through server-side API
  routes using the service role key, gated by the session cookie.
- **Signed cookie session (`jose`)** — a single admin password (env var) issues
  an HTTP-only, signed JWT cookie checked by `src/middleware.ts` on every
  `/admin/*` and `/api/admin/*` request. No user table needed for a single
  admin; swap in Supabase Auth later if you want multiple admin accounts.
- **Zustand** — client-side store for the admin dashboard (filters, submission
  list, Share View selection) — matches your existing stack.
- **html-to-image** — lets the admin download the Share View poster as a PNG
  directly from the browser, in addition to just screenshotting it.

## Getting started

### 1. Create the Supabase project & table

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** and run everything in `supabase/schema.sql`. This
   creates the `submissions` table and its Row Level Security policies.
3. From **Project Settings → API**, copy the Project URL, `anon` key, and
   `service_role` key.

### 2. Configure environment variables

Copy `.env.example` to `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...      # server-only, never exposed to the browser
ADMIN_PASSWORD=...                 # the dashboard login password
SESSION_SECRET=...                 # any long random string (e.g. `openssl rand -hex 32`)
NEXT_PUBLIC_REVEAL_LABEL=Monday    # shown on the public page, e.g. "this Friday"
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
Set the same environment variables in your host's dashboard. On Vercel,
remember the in-memory rate limiter (`src/lib/rate-limit.ts`) resets per
serverless instance — fine for launch traffic, but swap it for a Redis-backed
limiter (e.g. Upstash) if you see spam at scale.

## How the "identity stays hidden" rule is enforced

- The public submission form always sends `name` + `department`, and they're
  always stored — the admin needs them.
- The public site **never has a read path** to the `submissions` table (no
  RLS `SELECT` policy for `anon`), so there is no public page or public API
  response that could ever include a name.
- Every submission has an `identity_revealed` boolean, defaulting to `false`.
  It only flips to `true` when the admin explicitly toggles "Reveal identity
  on poster" for that submission in Share View — and it only affects what's
  shown on the poster graphic, nothing else.

## Project structure

```
src/
  app/
    page.tsx                    Public submission page
    api/submissions/route.ts    Public POST endpoint (insert-only)
    admin/
      login/page.tsx            Admin login (outside auth + outside sidebar)
      (shell)/                  Route group: pages wrapped in the sidebar shell
        dashboard/page.tsx
        guesses/page.tsx
        featured/page.tsx
        settings/page.tsx
        layout.tsx               Sidebar shell
      share/page.tsx            Share View — deliberately outside the shell
                                 so the poster area stays screenshot-clean
    api/admin/
      login/route.ts  logout/route.ts
      submissions/route.ts        GET list (search/filter/sort/stats)
      submissions/[id]/route.ts   PATCH (feature/hide/reveal) + DELETE
      export/route.ts             CSV export
  components/
    public/     SpotlightBeam, SubmissionForm
    admin/      Sidebar, StatCard, SubmissionCard, Filters, ShareCard
    ui/         TextInput, TextArea, FieldWrapper
  lib/
    supabase.ts   anon client (public) + service-role client (admin only)
    auth.ts       session token sign/verify
    rate-limit.ts in-memory throttle + IP hashing
    store.ts      Zustand store for the admin dashboard
    types.ts      Shared types
  middleware.ts   Protects /admin/* and /api/admin/*
supabase/schema.sql
```

## Using the Share View

1. Mark strong guesses **Featured** from All Guesses or the Dashboard.
2. Go to **Featured**, tick the ones you want in this graphic → **Create Share
   View**.
3. On the Share View page, optionally toggle **Reveal identity** per guess.
4. Click **Enter presentation mode** to hide all controls, or **Download PNG**
   to save the graphic directly — either way it's ready to post to the
   WhatsApp Channel.
