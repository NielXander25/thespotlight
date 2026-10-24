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

-- ---------------------------------------------------------------------------
-- Anonymous messages + Talk to the Founder (same as migrations/003_add_messages.sql)
-- Messages are kept for 30 days unless the admin deletes them sooner.
-- ---------------------------------------------------------------------------

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  -- 'anonymous' = the anonymous message box (no identity collected at all)
  -- 'founder'   = Talk to the Founder (sender may optionally leave a name/contact)
  channel text not null default 'anonymous' check (channel in ('anonymous', 'founder')),
  body text not null check (char_length(body) between 2 and 2000),
  sender_name text check (sender_name is null or char_length(sender_name) <= 80),
  sender_contact text check (sender_contact is null or char_length(sender_contact) <= 120),
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 days')
);

create index if not exists messages_created_at_idx on messages (created_at desc);
create index if not exists messages_expires_at_idx on messages (expires_at);
create index if not exists messages_channel_idx on messages (channel);

-- Same model as submissions: inserts and reads both go through server-side
-- routes using the service role key, so anon gets no policies at all. The
-- public can never read, list, or delete a message.
alter table messages enable row level security;

-- Removes messages older than 30 days. The admin API also calls this every
-- time the inbox is loaded, so expiry works even without a scheduler.
create or replace function purge_expired_messages()
returns integer
language sql
security definer
set search_path = public
as $$
  with deleted as (
    delete from messages where expires_at <= now() returning 1
  )
  select count(*)::integer from deleted;
$$;

revoke all on function purge_expired_messages() from public, anon, authenticated;

-- Optional: also purge on a schedule with pg_cron (Database -> Extensions ->
-- enable pg_cron first), so expired messages are removed even if nobody
-- opens the admin inbox. Uncomment and run once:
--
-- select cron.schedule('purge-expired-messages', '15 3 * * *', $$select purge_expired_messages()$$);
