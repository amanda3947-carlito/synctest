-- Sync, migration 0005: the essentials.
-- A last name (never shown; for verification and mutuals later) and "the basics": occupation,
-- education, hometown, location, height, activity, kids, smoking, kept as a small JSON object so
-- the list can grow without a migration.

alter table public.profiles add column if not exists last_name text check (last_name is null or length(last_name) <= 60);
alter table public.profiles add column if not exists details jsonb not null default '{}' check (jsonb_typeof(details) = 'object');
