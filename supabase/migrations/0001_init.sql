-- Sync backend, migration 0001.
-- Postgres schema for Supabase: profiles, the about facets (events, orbit, mutuals),
-- the build engine (mixtape / watchlist / plan / dinner), matches, chat, safety.
-- Every rule that matters lives here, in security-definer functions, so neither
-- the web wrapper nor the Swift app is trusted to enforce it.

create extension if not exists pgcrypto;

-- ───────────────────────── enums ─────────────────────────
create type public.build_kind   as enum ('list', 'slots');
create type public.build_status as enum ('open', 'as_is', 'agreed', 'closed');
create type public.turn_action  as enum ('start', 'turn', 'agree', 'love_as_is', 'match_back', 'counter', 'close');
create type public.media_kind   as enum ('photo', 'video');
create type public.notice_kind  as enum ('turn', 'as_is', 'match', 'message');

-- ───────────────────────── build types ─────────────────────────
-- One row per thing people build together. New types are rows, not code.
create table public.build_types (
  key        text primary key,                 -- 'mixtape', 'watchlist', 'plan', 'dinner'
  name       text not null,
  verb       text not null,                    -- Remix, Curate, Plan, Cook
  kind       public.build_kind not null,
  unit       text,                             -- 'track', 'title' (list kinds)
  capacity   int,                              -- max items (list)
  min_items  int,                              -- items needed before it can be agreed (list)
  min_each   int,                              -- items each side must have added (list)
  per_turn   int not null default 2,           -- changes allowed per turn
  slots      jsonb not null default '[]',      -- [{id,label}] (slots kinds)
  position   int not null default 0,
  check (kind <> 'list' or (capacity is not null and min_items is not null and min_each is not null)),
  check (kind <> 'slots' or jsonb_array_length(slots) > 0)
);

-- ───────────────────────── profiles ─────────────────────────
create table public.profiles (
  id             uuid primary key references auth.users(id) on delete cascade,
  phone_hash     text unique,                  -- sha256 of E.164 phone; what mutuals match on
  name           text not null check (length(name) between 1 and 40),
  birthdate      date not null check (birthdate <= current_date - interval '18 years'),
  neighborhood   text,
  lat            double precision,
  lng            double precision,
  cover          text not null default 'reeded',
  avatar_path    text,
  intro_quote    text,
  intro_prompt   text default 'Say something witty back',
  lyric_quote    text,
  lyric_prompt   text default 'Name the artist',
  taste          text[] not null default '{}',
  style_paths    text[] not null default '{}',
  paused         boolean not null default false,   -- hidden from the feed by choice
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table public.profile_media (
  id           uuid primary key default gen_random_uuid(),
  profile_id   uuid not null references public.profiles(id) on delete cascade,
  kind         public.media_kind not null,
  path         text not null,                  -- storage object path in bucket 'media'
  poster_path  text,
  position     int not null default 0,
  approved     boolean not null default false, -- photo review before it shows to others
  created_at   timestamptz not null default now()
);
create index on public.profile_media (profile_id, position);

-- "In their orbit": places people like to go. User-generated, shared across profiles.
create table public.places (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  kind         text,                           -- Bar, Restaurant, Store, Park, Venue…
  neighborhood text,
  lat          double precision,
  lng          double precision,
  image_path   text,
  created_by   uuid references public.profiles(id) on delete set null,
  created_at   timestamptz not null default now(),
  unique (name, neighborhood)
);
create table public.profile_places (
  profile_id uuid references public.profiles(id) on delete cascade,
  place_id   uuid references public.places(id) on delete cascade,
  position   int not null default 0,
  primary key (profile_id, place_id)
);

-- "Going to": events. User-generated.
create table public.events (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  venue      text,
  starts_at  timestamptz not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create table public.profile_events (
  profile_id uuid references public.profiles(id) on delete cascade,
  event_id   uuid references public.events(id) on delete cascade,
  primary key (profile_id, event_id)
);
create index on public.events (starts_at);

-- "Mutuals": hashed phone numbers from the address book. Raw numbers never arrive here.
create table public.contact_hashes (
  profile_id uuid references public.profiles(id) on delete cascade,
  phone_hash text not null,
  primary key (profile_id, phone_hash)
);
create index on public.contact_hashes (phone_hash);

-- The builds a person puts on their own profile, fully filled. 1 to 3 of them.
create table public.profile_builds (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  type_key   text not null references public.build_types(key),
  items      jsonb not null,
  position   int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_id, type_key)
);

-- ───────────────────────── the build engine ─────────────────────────
-- A build is one viewer (starter) working on one of an owner's profile builds.
create table public.builds (
  id               uuid primary key default gen_random_uuid(),
  type_key         text not null references public.build_types(key),
  profile_build_id uuid references public.profile_builds(id) on delete set null,
  starter_id       uuid not null references public.profiles(id) on delete cascade,
  owner_id         uuid not null references public.profiles(id) on delete cascade,
  items            jsonb not null,
  turn_id          uuid references public.profiles(id),   -- whose move it is
  round            int not null default 1,
  status           public.build_status not null default 'open',
  agreed_by        uuid[] not null default '{}',
  as_is_note       text,
  via              text,                        -- 'build' | 'as_is' once agreed
  closed_by        uuid references public.profiles(id),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  agreed_at        timestamptz,
  check (starter_id <> owner_id)
);
-- Rule: one in-flight build per starter at a time.
create unique index builds_one_in_flight_per_starter
  on public.builds (starter_id) where status in ('open', 'as_is');
-- Rule: one live build between any two people.
create unique index builds_one_per_pair
  on public.builds (least(starter_id, owner_id), greatest(starter_id, owner_id))
  where status in ('open', 'as_is', 'agreed');
create index on public.builds (owner_id, status);
create index on public.builds (starter_id, status);

create table public.build_turns (
  id         uuid primary key default gen_random_uuid(),
  build_id   uuid not null references public.builds(id) on delete cascade,
  actor_id   uuid not null references public.profiles(id),
  action     public.turn_action not null,
  items      jsonb,
  changes    int,
  note       text,
  created_at timestamptz not null default now()
);
create index on public.build_turns (build_id, created_at);

create table public.passes (
  profile_id uuid references public.profiles(id) on delete cascade,
  passed_id  uuid references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (profile_id, passed_id)
);

-- ───────────────────────── matches and chat ─────────────────────────
create table public.matches (
  id         uuid primary key default gen_random_uuid(),
  build_id   uuid not null unique references public.builds(id) on delete cascade,
  a_id       uuid not null references public.profiles(id) on delete cascade,
  b_id       uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  ended_at   timestamptz,
  ended_by   uuid references public.profiles(id)
);
create index on public.matches (a_id);
create index on public.matches (b_id);

create table public.messages (
  id         uuid primary key default gen_random_uuid(),
  match_id   uuid not null references public.matches(id) on delete cascade,
  sender_id  uuid not null references public.profiles(id),
  body       text not null check (length(body) between 1 and 2000),
  gif_url    text,
  created_at timestamptz not null default now()
);
create index on public.messages (match_id, created_at);

-- ───────────────────────── safety ─────────────────────────
create table public.blocks (
  blocker_id uuid references public.profiles(id) on delete cascade,
  blocked_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id)
);
create table public.reports (
  id          uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reported_id uuid not null references public.profiles(id) on delete cascade,
  reason      text not null,
  details     text,
  created_at  timestamptz not null default now(),
  resolved_at timestamptz
);

-- ───────────────────────── notifications and push ─────────────────────────
create table public.push_tokens (
  profile_id uuid references public.profiles(id) on delete cascade,
  token      text not null,
  platform   text not null default 'ios',
  updated_at timestamptz not null default now(),
  primary key (profile_id, token)
);
-- One row per thing a person should hear about. A webhook / edge function turns rows into APNs pushes.
create table public.notifications (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  kind       public.notice_kind not null,
  build_id   uuid references public.builds(id) on delete cascade,
  match_id   uuid references public.matches(id) on delete cascade,
  from_id    uuid references public.profiles(id) on delete cascade,
  body       text,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);
create index on public.notifications (profile_id, created_at desc);

-- ───────────────────────── housekeeping triggers ─────────────────────────
create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;
create trigger profiles_touch       before update on public.profiles       for each row execute function public.touch_updated_at();
create trigger profile_builds_touch before update on public.profile_builds for each row execute function public.touch_updated_at();
create trigger builds_touch         before update on public.builds         for each row execute function public.touch_updated_at();

-- ───────────────────────── item helpers ─────────────────────────
-- List items:  [{"key":"...", "title":"...", "artist":"...", "art":"...", "by":"<profile uuid>"}]
-- Slot items:  {"when":{"value":"Golden hour","by":"<uuid>"}, "place":{"value":"Public Records","place_id":"<uuid>","by":"<uuid>"}}

create or replace function public.list_keys(items jsonb) returns text[] language sql immutable as $$
  select coalesce(array_agg(e->>'key'), '{}') from jsonb_array_elements(items) e
$$;

-- How many changes one side made in a turn. A swap counts once; so does a plain add or remove.
create or replace function public.build_changes(kind public.build_kind, old_items jsonb, new_items jsonb)
returns int language sql immutable as $$
  select case kind
    when 'list' then greatest(
      (select count(*) from unnest(public.list_keys(new_items)) k where k <> all (public.list_keys(old_items))),
      (select count(*) from unnest(public.list_keys(old_items)) k where k <> all (public.list_keys(new_items))))
    else (select count(*) from (select jsonb_object_keys(old_items || new_items) k) ks
          where (old_items->k->>'value') is distinct from (new_items->k->>'value'))
  end::int
$$;

-- Stamp who added what: untouched items keep their record, new or changed ones get `by = actor`.
create or replace function public.stamp_items(kind public.build_kind, old_items jsonb, new_items jsonb, actor uuid)
returns jsonb language sql immutable as $$
  select case kind
    when 'list' then coalesce((
      select jsonb_agg(coalesce(o.e, n.e || jsonb_build_object('by', actor)) order by n.ord)
      from jsonb_array_elements(new_items) with ordinality n(e, ord)
      left join jsonb_array_elements(old_items) o(e) on o.e->>'key' = n.e->>'key'), '[]'::jsonb)
    else coalesce((
      select jsonb_object_agg(k, case when (old_items->k->>'value') = (n.v->>'value') then old_items->k
                                      else (n.v - 'by') || jsonb_build_object('by', actor) end)
      from jsonb_each(new_items) n(k, v)), '{}'::jsonb)
  end
$$;

-- Shape rules for a build type's items. Raises on anything malformed.
create or replace function public.check_items(t public.build_types, items jsonb) returns void language plpgsql immutable as $$
declare bad text; n int;
begin
  if t.kind = 'list' then
    if jsonb_typeof(items) <> 'array' then raise exception 'items must be an array for %', t.key; end if;
    n := jsonb_array_length(items);
    if n > t.capacity then raise exception '% holds at most % %s', t.name, t.capacity, t.unit; end if;
    select e->>'key' into bad from jsonb_array_elements(items) e
      where coalesce(e->>'key','') = '' or coalesce(e->>'title','') = '' limit 1;
    if found then raise exception 'every % needs a key and a title', t.unit; end if;
    if (select count(distinct e->>'key') from jsonb_array_elements(items) e) <> n then
      raise exception 'duplicate % in %', t.unit, t.name; end if;
  else
    if jsonb_typeof(items) <> 'object' then raise exception 'items must be an object for %', t.key; end if;
    select k into bad from jsonb_object_keys(items) k
      where k not in (select s->>'id' from jsonb_array_elements(t.slots) s) limit 1;
    if found then raise exception 'unknown slot % for %', bad, t.name; end if;
    select k into bad from jsonb_each(items) e(k, v) where coalesce(v->>'value','') = '' limit 1;
    if found then raise exception 'slot % is empty', bad; end if;
  end if;
end $$;

-- An owner's profile build must be fully filled before it goes up.
create or replace function public.owner_complete(t public.build_types, items jsonb) returns boolean language sql immutable as $$
  select case t.kind
    when 'list' then jsonb_array_length(items) >= t.min_items
    else not exists (select 1 from jsonb_array_elements(t.slots) s where coalesce(items->(s->>'id')->>'value','') = '')
  end
$$;

-- A two-person build is complete when it has enough in it and both sides have put something in.
create or replace function public.build_complete(t public.build_types, items jsonb, a uuid, b uuid) returns boolean language sql immutable as $$
  select case t.kind
    when 'list' then jsonb_array_length(items) >= t.min_items
      and (select count(*) from jsonb_array_elements(items) e where e->>'by' = a::text) >= t.min_each
      and (select count(*) from jsonb_array_elements(items) e where e->>'by' = b::text) >= t.min_each
    else public.owner_complete(t, items)
  end
$$;

-- ───────────────────────── profile_builds guards ─────────────────────────
create or replace function public.profile_builds_guard() returns trigger language plpgsql as $$
declare t public.build_types;
begin
  select * into t from public.build_types where key = new.type_key;
  perform public.check_items(t, new.items);
  if not public.owner_complete(t, new.items) then
    raise exception 'a % on your profile has to be filled in before it goes up', t.name;
  end if;
  -- every item on an owner's build is theirs
  new.items := public.stamp_items(t.kind, '[]'::jsonb, new.items, new.profile_id);
  if t.kind = 'slots' then new.items := public.stamp_items(t.kind, '{}'::jsonb, new.items, new.profile_id); end if;
  if tg_op = 'INSERT' and (select count(*) from public.profile_builds where profile_id = new.profile_id) >= 3 then
    raise exception 'a profile holds at most three builds';
  end if;
  return new;
end $$;
create trigger profile_builds_guard before insert or update on public.profile_builds
  for each row execute function public.profile_builds_guard();

-- ───────────────────────── identity helpers ─────────────────────────
create or replace function public.me() returns uuid language plpgsql stable as $$
declare u uuid := auth.uid();
begin
  if u is null then raise exception 'not signed in' using errcode = '42501'; end if;
  return u;
end $$;

create or replace function public.blocked_between(a uuid, b uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.blocks where (blocker_id = a and blocked_id = b) or (blocker_id = b and blocked_id = a))
$$;

create or replace function public.is_participant(b public.builds, who uuid) returns boolean language sql immutable as $$
  select who in (b.starter_id, b.owner_id)
$$;

create or replace function public.other_side(b public.builds, who uuid) returns uuid language sql immutable as $$
  select case when who = b.starter_id then b.owner_id else b.starter_id end
$$;

create or replace function public.notify(p_to uuid, p_kind public.notice_kind, p_from uuid, p_build uuid default null, p_match uuid default null, p_body text default null)
returns void language sql security definer set search_path = public as $$
  insert into public.notifications (profile_id, kind, from_id, build_id, match_id, body) values (p_to, p_kind, p_from, p_build, p_match, p_body)
$$;

-- ───────────────────────── the engine's verbs ─────────────────────────

-- A build reaches agreement: record it, open the match, and seed the chat with the as-is note if there was one.
create or replace function public.finish_build(b public.builds, via text) returns public.builds language plpgsql security definer set search_path = public as $$
declare m public.matches;
begin
  update public.builds set status = 'agreed', via = finish_build.via, agreed_at = now(), turn_id = null
    where id = b.id returning * into b;
  insert into public.matches (build_id, a_id, b_id) values (b.id, b.starter_id, b.owner_id) returning * into m;
  if b.as_is_note is not null then
    insert into public.messages (match_id, sender_id, body) values (m.id, b.starter_id, b.as_is_note);
  end if;
  perform public.notify(b.starter_id, 'match', b.owner_id, b.id, m.id);
  perform public.notify(b.owner_id,   'match', b.starter_id, b.id, m.id);
  return b;
end $$;

-- Common checks before anyone starts on someone's build.
create or replace function public.open_build_checks(pb public.profile_builds, actor uuid) returns void language plpgsql as $$
begin
  if pb.profile_id = actor then raise exception 'that is your own build'; end if;
  if public.blocked_between(actor, pb.profile_id) then raise exception 'unavailable'; end if;
  if exists (select 1 from public.passes where profile_id = pb.profile_id and passed_id = actor) then raise exception 'unavailable'; end if;
  if exists (select 1 from public.builds where starter_id = actor and status in ('open','as_is')) then
    raise exception 'finish the build you have in flight first';
  end if;
  if exists (select 1 from public.builds where status in ('open','as_is','agreed')
             and least(starter_id, owner_id) = least(actor, pb.profile_id) and greatest(starter_id, owner_id) = greatest(actor, pb.profile_id)) then
    raise exception 'you two already have a build going';
  end if;
end $$;

-- Remix / curate / plan / cook: the viewer sends their first changes to the owner.
create or replace function public.start_build(p_profile_build uuid, p_items jsonb) returns public.builds
language plpgsql security definer set search_path = public as $$
declare actor uuid := public.me(); pb public.profile_builds; t public.build_types; b public.builds; n int; stamped jsonb;
begin
  select * into pb from public.profile_builds where id = p_profile_build;
  if not found then raise exception 'build not found'; end if;
  perform public.open_build_checks(pb, actor);
  select * into t from public.build_types where key = pb.type_key;
  perform public.check_items(t, p_items);
  n := public.build_changes(t.kind, pb.items, p_items);
  if n < 1 then raise exception 'change something, or love it as is'; end if;
  if n > t.per_turn then raise exception 'at most % changes per turn', t.per_turn; end if;
  stamped := public.stamp_items(t.kind, pb.items, p_items, actor);
  insert into public.builds (type_key, profile_build_id, starter_id, owner_id, items, turn_id, status)
    values (pb.type_key, pb.id, actor, pb.profile_id, stamped, pb.profile_id, 'open') returning * into b;
  insert into public.build_turns (build_id, actor_id, action, items, changes) values (b.id, actor, 'start', stamped, n);
  perform public.notify(pb.profile_id, 'turn', actor, b.id);
  return b;
end $$;

-- "Love it as is": no changes, a required note, and the owner decides whether to match back.
create or replace function public.love_as_is(p_profile_build uuid, p_note text) returns public.builds
language plpgsql security definer set search_path = public as $$
declare actor uuid := public.me(); pb public.profile_builds; b public.builds;
begin
  if length(trim(coalesce(p_note, ''))) < 3 then raise exception 'say something about it first'; end if;
  select * into pb from public.profile_builds where id = p_profile_build;
  if not found then raise exception 'build not found'; end if;
  perform public.open_build_checks(pb, actor);
  insert into public.builds (type_key, profile_build_id, starter_id, owner_id, items, turn_id, status, as_is_note)
    values (pb.type_key, pb.id, actor, pb.profile_id, pb.items, pb.profile_id, 'as_is', trim(p_note)) returning * into b;
  insert into public.build_turns (build_id, actor_id, action, items, note) values (b.id, actor, 'love_as_is', pb.items, trim(p_note));
  perform public.notify(pb.profile_id, 'as_is', actor, b.id, null, trim(p_note));
  return b;
end $$;

-- A turn: whoever's move it is sends the build back with 1..per_turn changes.
create or replace function public.send_turn(p_build uuid, p_items jsonb) returns public.builds
language plpgsql security definer set search_path = public as $$
declare actor uuid := public.me(); b public.builds; t public.build_types; n int; stamped jsonb; other uuid;
begin
  select * into b from public.builds where id = p_build for update;
  if not found or not public.is_participant(b, actor) then raise exception 'build not found'; end if;
  if b.status <> 'open' then raise exception 'this build is not open'; end if;
  if b.turn_id <> actor then raise exception 'not your turn'; end if;
  select * into t from public.build_types where key = b.type_key;
  perform public.check_items(t, p_items);
  n := public.build_changes(t.kind, b.items, p_items);
  if n < 1 then raise exception 'change something, or agree'; end if;
  if n > t.per_turn then raise exception 'at most % changes per turn', t.per_turn; end if;
  stamped := public.stamp_items(t.kind, b.items, p_items, actor);
  other := public.other_side(b, actor);
  update public.builds set items = stamped, turn_id = other, round = round + 1, agreed_by = '{}'
    where id = b.id returning * into b;
  insert into public.build_turns (build_id, actor_id, action, items, changes) values (b.id, actor, 'turn', stamped, n);
  perform public.notify(other, 'turn', actor, b.id);
  return b;
end $$;

-- Agree: "it's a mixtape". When both have agreed on the same version, it's a match.
create or replace function public.agree_build(p_build uuid) returns public.builds
language plpgsql security definer set search_path = public as $$
declare actor uuid := public.me(); b public.builds; t public.build_types; other uuid;
begin
  select * into b from public.builds where id = p_build for update;
  if not found or not public.is_participant(b, actor) then raise exception 'build not found'; end if;
  if b.status <> 'open' then raise exception 'this build is not open'; end if;
  if b.turn_id <> actor then raise exception 'not your turn'; end if;
  select * into t from public.build_types where key = b.type_key;
  if not public.build_complete(t, b.items, b.starter_id, b.owner_id) then
    raise exception 'not there yet: % needs % %s with at least % from each of you', t.name, t.min_items, t.unit, t.min_each;
  end if;
  other := public.other_side(b, actor);
  insert into public.build_turns (build_id, actor_id, action, items) values (b.id, actor, 'agree', b.items);
  if other = any (b.agreed_by) then
    return public.finish_build(b, 'build');
  end if;
  update public.builds set agreed_by = array_append(agreed_by, actor), turn_id = other where id = b.id returning * into b;
  perform public.notify(other, 'turn', actor, b.id);
  return b;
end $$;

-- The owner matches back on an as-is.
create or replace function public.match_back(p_build uuid) returns public.builds
language plpgsql security definer set search_path = public as $$
declare actor uuid := public.me(); b public.builds;
begin
  select * into b from public.builds where id = p_build for update;
  if not found or b.owner_id <> actor then raise exception 'build not found'; end if;
  if b.status <> 'as_is' then raise exception 'nothing to match back on'; end if;
  insert into public.build_turns (build_id, actor_id, action, items) values (b.id, actor, 'match_back', b.items);
  return public.finish_build(b, 'as_is');
end $$;

-- The owner answers an as-is with changes instead: it becomes an ordinary build, starter's turn.
create or replace function public.counter_as_is(p_build uuid, p_items jsonb) returns public.builds
language plpgsql security definer set search_path = public as $$
declare actor uuid := public.me(); b public.builds; t public.build_types; n int; stamped jsonb;
begin
  select * into b from public.builds where id = p_build for update;
  if not found or b.owner_id <> actor then raise exception 'build not found'; end if;
  if b.status <> 'as_is' then raise exception 'nothing to counter'; end if;
  select * into t from public.build_types where key = b.type_key;
  perform public.check_items(t, p_items);
  n := public.build_changes(t.kind, b.items, p_items);
  if n < 1 then raise exception 'change something, or match back'; end if;
  if n > t.per_turn then raise exception 'at most % changes per turn', t.per_turn; end if;
  stamped := public.stamp_items(t.kind, b.items, p_items, actor);
  update public.builds set status = 'open', items = stamped, turn_id = b.starter_id, round = 1 where id = b.id returning * into b;
  insert into public.build_turns (build_id, actor_id, action, items, changes) values (b.id, actor, 'counter', stamped, n);
  perform public.notify(b.starter_id, 'turn', actor, b.id);
  return b;
end $$;

-- Either side walks away.
create or replace function public.close_build(p_build uuid) returns public.builds
language plpgsql security definer set search_path = public as $$
declare actor uuid := public.me(); b public.builds;
begin
  select * into b from public.builds where id = p_build for update;
  if not found or not public.is_participant(b, actor) then raise exception 'build not found'; end if;
  if b.status not in ('open', 'as_is') then raise exception 'this build is already finished'; end if;
  update public.builds set status = 'closed', closed_by = actor, turn_id = null where id = b.id returning * into b;
  insert into public.build_turns (build_id, actor_id, action) values (b.id, actor, 'close');
  return b;
end $$;

-- ───────────────────────── people ─────────────────────────
create or replace function public.pass_profile(p_profile uuid) returns void
language sql security definer set search_path = public as $$
  insert into public.passes (profile_id, passed_id) values (public.me(), p_profile) on conflict do nothing
$$;

-- The feed: people you haven't passed, blocked, or built with, who have a profile up.
create or replace function public.feed(p_limit int default 20) returns setof public.profiles
language sql stable security definer set search_path = public as $$
  select p.* from public.profiles p
  where p.id <> public.me()
    and not p.paused
    and exists (select 1 from public.profile_builds pb where pb.profile_id = p.id)
    and exists (select 1 from public.profile_media m where m.profile_id = p.id and m.approved)
    and not exists (select 1 from public.passes x where x.profile_id = public.me() and x.passed_id = p.id)
    and not public.blocked_between(public.me(), p.id)
    and not exists (select 1 from public.builds b
                    where least(b.starter_id, b.owner_id) = least(public.me(), p.id)
                      and greatest(b.starter_id, b.owner_id) = greatest(public.me(), p.id))
  order by p.created_at desc
  limit p_limit
$$;

-- Mutuals: people in both address books who are on Sync.
create or replace function public.mutuals(p_profile uuid) returns table (id uuid, name text, avatar_path text)
language sql stable security definer set search_path = public as $$
  select p.id, p.name, p.avatar_path
  from public.contact_hashes mine
  join public.contact_hashes theirs on theirs.phone_hash = mine.phone_hash and theirs.profile_id = p_profile
  join public.profiles p on p.phone_hash = mine.phone_hash
  where mine.profile_id = public.me() and p.id not in (public.me(), p_profile)
$$;

create or replace function public.mutual_count(p_profile uuid) returns int
language sql stable security definer set search_path = public as $$
  select count(*)::int from public.contact_hashes mine
  join public.contact_hashes theirs on theirs.phone_hash = mine.phone_hash and theirs.profile_id = p_profile
  where mine.profile_id = public.me()
$$;

-- Replace my contact hashes with what the phone just sent.
create or replace function public.sync_contacts(p_hashes text[]) returns int
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  delete from public.contact_hashes where profile_id = public.me();
  insert into public.contact_hashes (profile_id, phone_hash) select public.me(), h from unnest(p_hashes) h on conflict do nothing;
  get diagnostics n = row_count;
  return n;
end $$;

-- "You too": places in both orbits.
create or replace function public.shared_places(p_profile uuid) returns setof public.places
language sql stable security definer set search_path = public as $$
  select pl.* from public.places pl
  join public.profile_places a on a.place_id = pl.id and a.profile_id = public.me()
  join public.profile_places b on b.place_id = pl.id and b.profile_id = p_profile
$$;

-- ───────────────────────── chat ─────────────────────────
create or replace function public.send_message(p_match uuid, p_body text, p_gif_url text default null) returns public.messages
language plpgsql security definer set search_path = public as $$
declare actor uuid := public.me(); m public.matches; msg public.messages; other uuid;
begin
  select * into m from public.matches where id = p_match and actor in (a_id, b_id);
  if not found then raise exception 'match not found'; end if;
  if m.ended_at is not null then raise exception 'this chat has ended'; end if;
  other := case when actor = m.a_id then m.b_id else m.a_id end;
  if public.blocked_between(actor, other) then raise exception 'unavailable'; end if;
  insert into public.messages (match_id, sender_id, body, gif_url) values (m.id, actor, p_body, p_gif_url) returning * into msg;
  perform public.notify(other, 'message', actor, null, m.id, left(p_body, 120));
  return msg;
end $$;

create or replace function public.unmatch(p_match uuid) returns void
language sql security definer set search_path = public as $$
  update public.matches set ended_at = now(), ended_by = public.me() where id = p_match and public.me() in (a_id, b_id) and ended_at is null
$$;

-- ───────────────────────── safety ─────────────────────────
create or replace function public.block_profile(p_profile uuid) returns void
language plpgsql security definer set search_path = public as $$
declare actor uuid := public.me();
begin
  insert into public.blocks (blocker_id, blocked_id) values (actor, p_profile) on conflict do nothing;
  update public.builds set status = 'closed', closed_by = actor, turn_id = null
    where status in ('open', 'as_is') and least(starter_id, owner_id) = least(actor, p_profile) and greatest(starter_id, owner_id) = greatest(actor, p_profile);
  update public.matches set ended_at = now(), ended_by = actor
    where ended_at is null and least(a_id, b_id) = least(actor, p_profile) and greatest(a_id, b_id) = greatest(actor, p_profile);
end $$;

create or replace function public.report_profile(p_profile uuid, p_reason text, p_details text default null) returns void
language sql security definer set search_path = public as $$
  insert into public.reports (reporter_id, reported_id, reason, details) values (public.me(), p_profile, p_reason, p_details)
$$;

-- ───────────────────────── row-level security ─────────────────────────
alter table public.build_types    enable row level security;
alter table public.profiles       enable row level security;
alter table public.profile_media  enable row level security;
alter table public.places         enable row level security;
alter table public.profile_places enable row level security;
alter table public.events         enable row level security;
alter table public.profile_events enable row level security;
alter table public.contact_hashes enable row level security;
alter table public.profile_builds enable row level security;
alter table public.builds         enable row level security;
alter table public.build_turns    enable row level security;
alter table public.passes         enable row level security;
alter table public.matches        enable row level security;
alter table public.messages       enable row level security;
alter table public.blocks         enable row level security;
alter table public.reports        enable row level security;
alter table public.push_tokens    enable row level security;
alter table public.notifications  enable row level security;

create policy "build types are public"   on public.build_types for select to authenticated, anon using (true);

create policy "profiles: read unless blocked" on public.profiles for select to authenticated
  using (id = auth.uid() or not public.blocked_between(auth.uid(), id));
create policy "profiles: insert own" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "profiles: update own" on public.profiles for update to authenticated using (id = auth.uid());

create policy "media: read approved or own" on public.profile_media for select to authenticated
  using (profile_id = auth.uid() or (approved and not public.blocked_between(auth.uid(), profile_id)));
create policy "media: write own" on public.profile_media for all to authenticated
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());

create policy "places: read"   on public.places for select to authenticated using (true);
create policy "places: add"    on public.places for insert to authenticated with check (created_by = auth.uid());
create policy "places: edit own" on public.places for update to authenticated using (created_by = auth.uid());
create policy "profile places: read" on public.profile_places for select to authenticated using (true);
create policy "profile places: write own" on public.profile_places for all to authenticated
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());

create policy "events: read"   on public.events for select to authenticated using (true);
create policy "events: add"    on public.events for insert to authenticated with check (created_by = auth.uid());
create policy "events: edit own" on public.events for update to authenticated using (created_by = auth.uid());
create policy "profile events: read" on public.profile_events for select to authenticated using (true);
create policy "profile events: write own" on public.profile_events for all to authenticated
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());

create policy "contacts: own only" on public.contact_hashes for all to authenticated
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());

create policy "profile builds: read" on public.profile_builds for select to authenticated
  using (profile_id = auth.uid() or not public.blocked_between(auth.uid(), profile_id));
create policy "profile builds: write own" on public.profile_builds for all to authenticated
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- builds and turns change only through the functions above
create policy "builds: participants read" on public.builds for select to authenticated
  using (auth.uid() in (starter_id, owner_id));
create policy "turns: participants read" on public.build_turns for select to authenticated
  using (exists (select 1 from public.builds b where b.id = build_id and auth.uid() in (b.starter_id, b.owner_id)));

create policy "passes: own" on public.passes for all to authenticated
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());

create policy "matches: participants read" on public.matches for select to authenticated
  using (auth.uid() in (a_id, b_id));
create policy "messages: participants read" on public.messages for select to authenticated
  using (exists (select 1 from public.matches m where m.id = match_id and auth.uid() in (m.a_id, m.b_id)));

create policy "blocks: own" on public.blocks for all to authenticated
  using (blocker_id = auth.uid()) with check (blocker_id = auth.uid());
create policy "reports: own insert" on public.reports for insert to authenticated with check (reporter_id = auth.uid());
create policy "reports: own read" on public.reports for select to authenticated using (reporter_id = auth.uid());

create policy "push tokens: own" on public.push_tokens for all to authenticated
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create policy "notifications: own read" on public.notifications for select to authenticated using (profile_id = auth.uid());
create policy "notifications: own mark read" on public.notifications for update to authenticated using (profile_id = auth.uid());

-- functions: only signed-in users call them
revoke execute on all functions in schema public from public, anon;
grant execute on all functions in schema public to authenticated;
revoke execute on function public.finish_build(public.builds, text), public.notify(uuid, public.notice_kind, uuid, uuid, uuid, text) from authenticated;

-- ───────────────────────── realtime ─────────────────────────
-- Clients subscribe to their builds, matches and messages; RLS scopes what each one sees.
do $$ begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.builds, public.matches, public.messages, public.notifications;
  end if;
end $$;
