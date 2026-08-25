-- Migration: adds per-question links to an existing Spotlight install.
-- Run this once in the Supabase SQL editor if your `submissions` table
-- already exists from before this feature. Safe to run multiple times.

create table if not exists questions (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null check (char_length(slug) between 2 and 60),
  title text not null check (char_length(title) between 2 and 140),
  subtext text check (subtext is null or char_length(subtext) <= 240),
  reveal_label text not null default 'Monday' check (char_length(reveal_label) <= 40),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table submissions
  add column if not exists question_id uuid references questions(id) on delete set null;

alter table submissions
  add column if not exists user_id uuid;

create index if not exists submissions_question_idx on submissions (question_id);

alter table questions enable row level security;

-- No anon policies on questions — same reasoning as submissions: all reads
-- happen server-side with the service role key, so links can't be
-- enumerated and question data can't be scraped publicly.

-- Optional: if you have existing submissions from before questions existed
-- and want them grouped under a single "Legacy" question instead of shown
-- as uncategorized, uncomment and run this once:
--
-- insert into questions (slug, title, subtext, is_active)
-- values ('legacy', 'Legacy guesses', 'Submitted before per-question links existed.', false)
-- returning id;
--
-- update submissions set question_id = '<the id printed above>' where question_id is null;
