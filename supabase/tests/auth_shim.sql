-- Stand-in for Supabase's auth schema and roles, for running the migration on plain Postgres.
-- Not for production: Supabase provides the real thing.
create schema if not exists auth;
create table if not exists auth.users (
  id uuid primary key, instance_id uuid, aud text, role text, email text, phone text, phone_confirmed_at timestamptz,
  raw_app_meta_data jsonb, raw_user_meta_data jsonb, created_at timestamptz, updated_at timestamptz
);
create or replace function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role nologin bypassrls; end if;
end $$;
grant usage on schema public to anon, authenticated, service_role;
alter default privileges in schema public grant select, insert, update, delete on tables to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
