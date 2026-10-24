-- Migration: adds the anonymous message box and "Talk to the Founder" inbox.
-- Run this once in the Supabase SQL editor. Safe to run multiple times.
--
-- Retention rule: every message is kept for exactly 30 days from when it was
-- sent. Nothing hides or removes it before then — the only way a message
-- leaves early is the admin deleting it from the dashboard. After 30 days it
-- is purged (see purge_expired_messages below).

create extension if not exists "pgcrypto";

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
