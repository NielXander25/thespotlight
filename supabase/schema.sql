-- The Spotlight — database schema
-- Run this in the Supabase SQL editor (Project -> SQL Editor -> New query).

create extension if not exists "pgcrypto";

create table if not exists submissions (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 80),
  department text not null check (char_length(department) between 2 and 60),
  message text not null check (char_length(message) between 5 and 600),
  created_at timestamptz not null default now(),
  status text not null default 'visible' check (status in ('visible', 'hidden')),
  featured boolean not null default false,
  identity_revealed boolean not null default false,
  ip_hash text
);

create index if not exists submissions_created_at_idx on submissions (created_at desc);
create index if not exists submissions_department_idx on submissions (department);
create index if not exists submissions_featured_idx on submissions (featured) where featured = true;

-- Row Level Security: the browser only ever gets the anon key, and should
-- only be able to INSERT new guesses. All reading, updating, and deleting
-- happens through server-side API routes using the service role key
-- (after the admin session cookie is verified), which bypasses RLS entirely.
alter table submissions enable row level security;

drop policy if exists "public can submit guesses" on submissions;
create policy "public can submit guesses"
  on submissions for insert
  to anon
  with check (true);

-- Deliberately no SELECT/UPDATE/DELETE policy for anon — the public page
-- never reads submissions back, so it can never leak names, departments,
-- or messages. All reads for the dashboard go through the service role key.
