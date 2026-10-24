-- The Spotlight — database schema (Neon Postgres).
-- Safe to run more than once: everything is "if not exists" / "or replace".
-- The app connects server-side only (DATABASE_URL), so there is no public
-- database API and no row-level security to configure — the browser can
-- never read these tables directly.

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
  -- Reserved for account-based submissions. Not used yet.
  user_id uuid
);

create index if not exists submissions_created_at_idx on submissions (created_at desc);
create index if not exists submissions_department_idx on submissions (department);
create index if not exists submissions_question_idx on submissions (question_id);
create index if not exists submissions_featured_idx on submissions (featured) where featured = true;

-- Anonymous message box + Talk to the Founder.
-- Retention rule: every message is kept for exactly 30 days from when it was
-- sent. The only way it leaves sooner is the admin deleting it. After 30
-- days it is purged by purge_expired_messages().
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  -- 'anonymous' = no identity collected at all
  -- 'founder'   = Talk to the Founder (name/contact optional)
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

-- Removes messages past their 30 days. The admin inbox calls this on every
-- load, so expiry works without any scheduler.
create or replace function purge_expired_messages()
returns integer
language sql
as $$
  with deleted as (
    delete from messages where expires_at <= now() returning 1
  )
  select count(*)::integer from deleted;
$$;
