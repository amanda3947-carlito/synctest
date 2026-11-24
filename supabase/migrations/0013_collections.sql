-- Sync, migration 0013: mixtapes first, collections alongside.
--
-- The Plan, Dinner and Watchlist builds were an earlier iteration and are gone. A profile now has:
--   * its mixtape (the rotation), always, and the build everything centres on;
--   * collections it fills in: Watching & Reading (profile_shelf), Spots (profile_places), and text
--     (prompts, plus a caption on each photo, added here);
--   * at most one featured build next to the mixtape, picked from a collection: 'spots' or 'shelf'.
--     The owner features 3 to 6 of their spots or titles; a visitor swaps or adds their own, two changes
--     a turn, the same back-and-forth as a mixtape, and both agreeing is the match.
--
-- Items in a featured build are list items like a mixtape's tracks:
--   spots: {key: 'place:<uuid>' or 'place:<osm id>', title, meta, art?, place_id?, lat?, lng?}
--   shelf: {key: catalog id, kind: film|show|book, title, meta, art?}

-- 1. retire the old builds. Builds of those kinds (and their turns, matches, chats and notices) go with them.
delete from public.builds         where type_key in ('plan', 'dinner', 'watchlist');
delete from public.profile_builds where type_key in ('plan', 'dinner', 'watchlist');
delete from public.build_types    where key      in ('plan', 'dinner', 'watchlist');

-- 2. the new build types. min_each 1: a featured set is done once both of you have something in it.
insert into public.build_types (key, name, verb, kind, unit, capacity, min_items, min_each, per_turn, slots, position) values
  ('spots', 'Spots',              'Swap', 'list', 'spot',  6, 3, 1, 2, '[]', 2),
  ('shelf', 'Watching & Reading', 'Swap', 'list', 'title', 6, 3, 1, 2, '[]', 3)
on conflict (key) do update set name = excluded.name, verb = excluded.verb, kind = excluded.kind, unit = excluded.unit,
  capacity = excluded.capacity, min_items = excluded.min_items, min_each = excluded.min_each, per_turn = excluded.per_turn,
  slots = excluded.slots, position = excluded.position;

-- 3. a profile holds its mixtape and at most one featured build
create or replace function public.profile_builds_guard() returns trigger language plpgsql as $$
declare t public.build_types;
begin
  select * into t from public.build_types where key = new.type_key;
  perform public.check_items(t, new.items);
  if not public.owner_complete(t, new.items) then
    raise exception 'a % on your profile needs at least % %s before it goes up', t.name, t.min_items, t.unit;
  end if;
  -- every item on an owner's build is theirs
  new.items := public.stamp_items(t.kind, '[]'::jsonb, new.items, new.profile_id);
  if new.type_key <> 'mixtape' then
    if exists (select 1 from public.profile_builds where profile_id = new.profile_id and type_key <> 'mixtape'
               and type_key <> new.type_key and id <> new.id) then
      raise exception 'one featured build at a time: take the other one down first';
    end if;
    new.position := 1;
  else
    new.position := 0;
  end if;
  return new;
end $$;

-- feature a collection (or take it down with p_type null): one call, so the swap is never half done
create or replace function public.set_featured(p_type text, p_items jsonb default null) returns public.profile_builds
language plpgsql security definer set search_path = public as $$
declare actor uuid := public.me(); out_row public.profile_builds;
begin
  if p_type is not null and p_type not in ('spots', 'shelf') then raise exception 'only spots or watching & reading can be featured'; end if;
  delete from public.profile_builds where profile_id = actor and type_key <> 'mixtape' and type_key is distinct from p_type;
  if p_type is null then return null; end if;
  insert into public.profile_builds (profile_id, type_key, items) values (actor, p_type, p_items)
  on conflict (profile_id, type_key) do update set items = excluded.items, updated_at = now()
  returning * into out_row;
  return out_row;
end $$;
revoke execute on function public.set_featured(text, jsonb) from public, anon;
grant execute on function public.set_featured(text, jsonb) to authenticated;

-- 4. the feed: people up have a mixtape (the build everything centres on) and a photo
create or replace function public.feed(p_limit int default 20) returns setof public.profiles
language sql stable security definer set search_path = public as $$
  select p.* from public.profiles p
  where p.id <> public.me()
    and not p.paused
    and exists (select 1 from public.profile_builds pb where pb.profile_id = p.id and pb.type_key = 'mixtape')
    and exists (select 1 from public.profile_media m where m.profile_id = p.id and m.approved)
    and not exists (select 1 from public.passes x where x.profile_id = public.me() and x.passed_id = p.id)
    and not public.blocked_between(public.me(), p.id)
    and not exists (select 1 from public.builds b
                    where least(b.starter_id, b.owner_id) = least(public.me(), p.id)
                      and greatest(b.starter_id, b.owner_id) = greatest(public.me(), p.id))
  order by p.created_at desc
  limit p_limit
$$;

-- 5. photo captions: a line of text under a photo, optional
alter table public.profile_media add column if not exists caption text check (caption is null or length(caption) between 1 and 120);
grant insert (caption) on public.profile_media to authenticated;
grant update (caption) on public.profile_media to authenticated;

-- 6. a person's collection as build items, for the stand-ins to draw from
create or replace function public.collection_items(p uuid, p_type text) returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(x.e order by x.pos), '[]'::jsonb) from (
    select jsonb_strip_nulls(jsonb_build_object('key', s.key, 'kind', s.kind, 'title', s.title, 'meta', s.meta, 'art', s.art)) as e, s.position as pos
      from public.profile_shelf s where p_type = 'shelf' and s.profile_id = p
    union all
    select jsonb_strip_nulls(jsonb_build_object('key', 'place:' || pl.id, 'place_id', pl.id, 'title', pl.name,
             'meta', concat_ws(' • ', coalesce(pl.kind, 'Spot'), pl.neighborhood), 'art', pl.image_path, 'lat', pl.lat, 'lng', pl.lng)), pp.position
      from public.profile_places pp join public.places pl on pl.id = pp.place_id where p_type = 'spots' and pp.profile_id = p
    union all
    select (e - 'by'), 0 from public.profile_builds pb, jsonb_array_elements(pb.items) e
      where p_type = 'mixtape' and pb.profile_id = p and pb.type_key = 'mixtape') x
$$;
revoke all on function public.collection_items(uuid, text) from public, anon, authenticated;

-- 7. stand-ins: on a list build they add one or two of their own (from their collection for spots and
--    titles, their rotation for a mixtape; other seed people's when theirs runs out), then agree.
create or replace function public.standin_move(p_build uuid) returns text
language plpgsql security definer set search_path = public as $$
declare b public.builds; t public.build_types; actor uuid; other uuid; took boolean;
        pool jsonb; k int; said text; res text;
begin
  select * into b from public.builds where id = p_build;
  actor := b.turn_id;
  perform set_config('request.jwt.claims', json_build_object('sub', actor, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', actor::text, true);
  if b.status = 'as_is' then
    if b.owner_id <> actor then return 'skip'; end if;
    perform public.match_back(b.id);
    res := 'match_back';
  else
    select * into t from public.build_types where key = b.type_key;
    other := public.other_side(b, actor);
    took := exists (select 1 from public.build_turns where build_id = b.id and actor_id = actor and action in ('start', 'turn'));
    k := least(t.per_turn, 2, t.capacity - jsonb_array_length(b.items));
    if public.build_complete(t, b.items, b.starter_id, b.owner_id) and (other = any (b.agreed_by) or took or k < 1) then
      perform public.agree_build(b.id); res := 'agree';
    else
      select coalesce(jsonb_agg(y.e), '[]'::jsonb) into pool from (
        select x.e from (
          select distinct on (c.e->>'key') c.e, c.pri, c.r from (
            select s.e, s.pri, random() as r from (
              select e, 0 as pri from jsonb_array_elements(public.collection_items(actor, b.type_key)) e
              union all
              select (e - 'by'), 1 from public.profile_builds pb, jsonb_array_elements(pb.items) e
                where pb.type_key = b.type_key and pb.profile_id not in (actor, other)) s
            where not ((s.e->>'key') = any (public.list_keys(b.items)))) c
          order by c.e->>'key', c.pri) x
        order by x.pri, x.r limit greatest(k, 0)) y;
      if jsonb_array_length(pool) = 0 then perform public.agree_build(b.id); res := 'agree';
      else perform public.send_turn(b.id, b.items || pool); res := 'turn'; end if;
    end if;
  end if;
  said := public.standin_line(actor);
  if said is not null then
    if res = 'turn' then
      update public.build_turns set note = said
       where id = (select id from public.build_turns where build_id = b.id and actor_id = actor order by created_at desc limit 1);
    elsif exists (select 1 from public.builds where id = b.id and status = 'agreed') then
      insert into public.messages (match_id, sender_id, body)
        select m.id, actor, said from public.matches m where m.build_id = b.id;
    end if;
  end if;
  return res;
end $$;
revoke all on function public.standin_move(uuid) from public, anon, authenticated;
