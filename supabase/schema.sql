-- The Spotlight — database schema (fresh install)
-- Run this in the Supabase SQL editor (Project -> SQL Editor -> New query).
-- If you already ran the original schema and have existing data, use
-- supabase/migrations/002_add_questions.sql instead.

create extension if not exists "pgcrypto";

-- Each "question" is one guessing round with its own shareable link,
-- e.g. thespotlight.ng/whos-in-the-spotlight-wk3
create table if not exists questions (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null check (char_length(slug) between 2 and 60),
  title text not null check (char_length(title) between 2 and 140),
  subtext text check (subtext is null or char_length(subtext) <= 240),
  reveal_label text not null default 'Monday' check (char_length(reveal_label) <= 40),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists submissions (
  id uuid primary key default gen_random_uuid(),
  -- Nullable so a question can be deleted without deleting the guesses that
  -- answered it (they just become "uncategorized" in the dashboard).
  question_id uuid references questions(id) on delete set null,
  name text not null check (char_length(name) between 2 and 80),
  department text not null check (char_length(department) between 2 and 60),
  message text not null check (char_length(message) between 5 and 600),
  created_at timestamptz not null default now(),
  status text not null default 'visible' check (status in ('visible', 'hidden')),
  featured boolean not null default false,
  identity_revealed boolean not null default false,
  ip_hash text,
  -- Reserved for account-based submissions. Not used yet — accounts are
  -- planned next. Left nullable and unenforced so it can be adopted later
  -- without another migration. Would reference auth.users(id) once Supabase
  -- Auth (or similar) is wired up.
  user_id uuid
);

create index if not exists submissions_created_at_idx on submissions (created_at desc);
create index if not exists submissions_department_idx on submissions (department);
create index if not exists submissions_question_idx on submissions (question_id);
create index if not exists submissions_featured_idx on submissions (featured) where featured = true;

-- Row Level Security: the browser only ever gets the anon key, and should
-- only be able to INSERT new guesses. All reading, updating, and deleting —
-- for both questions and submissions — happens through server-side API
-- routes / server components using the service role key (after the admin
-- session cookie is verified, or for public question lookups server-side),
-- which bypasses RLS entirely.
alter table submissions enable row level security;
alter table questions enable row level security;

drop policy if exists "public can submit guesses" on submissions;
create policy "public can submit guesses"
  on submissions for insert
  to anon
  with check (true);

-- Deliberately no SELECT/UPDATE/DELETE policy for anon on either table.
-- Question pages are rendered server-side (service role), so the public
-- never gets a direct read path to either table — a name, department, or
-- message can never leak through a public request, and the list of
-- questions/links can never be enumerated.
