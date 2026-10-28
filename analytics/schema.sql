-- Run once in Supabase: SQL Editor -> New query -> paste -> Run.
-- Anonymous visitors can only INSERT. Only a signed-in user (you) can SELECT.

create table if not exists public.events (
  id           bigint generated always as identity primary key,
  created_at   timestamptz not null default now(),
  session_id   text not null check (char_length(session_id) <= 40),
  type         text not null check (type in ('pageview','section_view','scroll_depth','click','session_end')),
  target       text check (char_length(target) <= 200),   -- section id, link label, etc.
  value        numeric,                                   -- dwell seconds, scroll %, total seconds
  href         text check (char_length(href) <= 500),     -- destination of a clicked link
  path         text check (char_length(path) <= 200),
  referrer     text check (char_length(referrer) <= 300),
  utm_source   text check (char_length(utm_source) <= 100),
  utm_medium   text check (char_length(utm_medium) <= 100),
  utm_campaign text check (char_length(utm_campaign) <= 100),
  ref_tag      text check (char_length(ref_tag) <= 60),   -- from ?ref=acme on links you send out
  device       text check (device in ('mobile','tablet','desktop')),
  screen_w     int,
  tz           text check (char_length(tz) <= 60),        -- browser timezone, a coarse location hint
  lang         text check (char_length(lang) <= 20)
);

create index if not exists events_created_idx on public.events (created_at desc);
create index if not exists events_session_idx on public.events (session_id);

alter table public.events enable row level security;

drop policy if exists "anyone can insert events" on public.events;
create policy "anyone can insert events"
  on public.events for insert to anon, authenticated
  with check (true);

drop policy if exists "only signed-in owner can read events" on public.events;
create policy "only signed-in owner can read events"
  on public.events for select to authenticated
  using (true);

-- IMPORTANT: in Supabase -> Authentication -> Providers -> Email, turn OFF
-- "Allow new users to sign up", then create your own user under
-- Authentication -> Users. Otherwise anyone could register and read the data.
