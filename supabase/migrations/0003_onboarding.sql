-- Sync, migration 0003: what first run needs.
-- `onboarded` marks a profile that has been through the optional steps (or skipped them),
-- so the app stops offering them on every open. Places and events get a search index.

alter table public.profiles add column if not exists onboarded boolean not null default false;
create extension if not exists pg_trgm;
create index if not exists places_name_trgm on public.places using gin (name gin_trgm_ops);
create index if not exists events_title_trgm on public.events using gin (title gin_trgm_ops);

-- a person may remove their own place and event links freely (the rows in places/events stay for others)
-- (already covered by the "write own" policies on profile_places / profile_events)

-- count of shared contacts, for the Mutuals step
create or replace function public.my_contact_count() returns int
language sql stable security definer set search_path = public as $$
  select count(*)::int from public.contact_hashes where profile_id = public.me()
$$;
revoke execute on function public.my_contact_count() from public, anon;
grant execute on function public.my_contact_count() to authenticated;
