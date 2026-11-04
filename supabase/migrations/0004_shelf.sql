-- Sync, migration 0004: "Reading & watching".
-- What a person is into right now, off the record player: films, shows and books. One row per
-- item with its cover; the key is the catalog id, so two people with the same thing see "you too".

create type public.shelf_kind as enum ('film', 'show', 'book');

create table public.profile_shelf (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  kind       public.shelf_kind not null,
  key        text not null,                    -- e.g. itunes:1234567 or seed:past-lives
  title      text not null check (length(title) between 1 and 160),
  meta       text,                             -- "2023 · Celine Song", "FX", "Sally Rooney"
  art        text,                             -- cover URL; null draws a typographic cover
  position   int not null default 0,
  created_at timestamptz not null default now(),
  unique (profile_id, key)
);
create index on public.profile_shelf (profile_id, position);
create index on public.profile_shelf (key);

alter table public.profile_shelf enable row level security;
create policy "shelf: read unless blocked" on public.profile_shelf for select to authenticated
  using (profile_id = auth.uid() or not public.blocked_between(auth.uid(), profile_id));
create policy "shelf: write own" on public.profile_shelf for all to authenticated
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());
grant select, insert, update, delete on public.profile_shelf to authenticated;

-- "you too": what you and they are both into
create or replace function public.shared_shelf(p_profile uuid) returns setof public.profile_shelf
language sql stable security definer set search_path = public as $$
  select theirs.* from public.profile_shelf theirs
  join public.profile_shelf mine on mine.key = theirs.key and mine.profile_id = public.me()
  where theirs.profile_id = p_profile
$$;
revoke execute on function public.shared_shelf(uuid) from public, anon;
grant execute on function public.shared_shelf(uuid) to authenticated;
