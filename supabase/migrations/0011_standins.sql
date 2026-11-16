-- Sync, migration 0011: stand-ins. The seed people take their turn on their own, so a demo plays out
-- like real people on the other end. Every 30 seconds a database job finds builds where it is a
-- stand-in's move and the build has sat for that stand-in's pace, then moves as that person through
-- the same engine functions a phone calls (send_turn, agree_build, match_back), so every rule holds.
--
--   a mixtape (or any list): on their first move they add one or two tracks from their own rotation
--     (another seed rotation when theirs runs out); once they have put something in and the build is
--     complete, or you have already agreed, they agree. Both agreed is a match.
--   a plan or a dinner: on their first move they swap one slot for their own; after that they agree.
--   loved as is: they match back.
-- Each move carries a line of theirs as its note, and a match gets a line in the chat.
-- The table has no policies, so the app never sees who is a stand-in.

create extension if not exists pg_cron;

create table if not exists public.standins (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  pace       interval not null default '75 seconds',
  lines      text[] not null default '{}'
);
alter table public.standins enable row level security;

create or replace function public.standin_line(p uuid) returns text language sql volatile as $$
  select lines[1 + floor(random() * array_length(lines, 1))::int]
    from public.standins where profile_id = p and coalesce(array_length(lines, 1), 0) > 0
$$;

-- one move by whoever holds the build, acting as them
create or replace function public.standin_move(p_build uuid) returns text
language plpgsql security definer set search_path = public as $$
declare b public.builds; t public.build_types; actor uuid; other uuid; took boolean;
        pool jsonb; k int; slot text; v jsonb; said text; res text;
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
    if t.kind = 'list' then
      k := least(t.per_turn, 2, t.capacity - jsonb_array_length(b.items));
      if public.build_complete(t, b.items, b.starter_id, b.owner_id) and (other = any (b.agreed_by) or took or k < 1) then
        perform public.agree_build(b.id); res := 'agree';
      else
        -- tracks of theirs first, then from the other seed rotations; never one already in the build
        select coalesce(jsonb_agg(y.e), '[]'::jsonb) into pool from (
          select x.e from (
            select distinct on (c.e->>'key') c.e, c.pri, c.r from (
              select (e - 'by') as e, s.pri, random() as r
                from (select items, 0 as pri from public.profile_builds where profile_id = actor and type_key = b.type_key
                      union all
                      select items, 1 from public.profile_builds where type_key = b.type_key and profile_id not in (actor, other)) s,
                     jsonb_array_elements(s.items) e
               where not ((e->>'key') = any (public.list_keys(b.items)))) c
            order by c.e->>'key', c.pri) x
          order by x.pri, x.r limit greatest(k, 0)) y;
        if jsonb_array_length(pool) = 0 then perform public.agree_build(b.id); res := 'agree';
        else perform public.send_turn(b.id, b.items || pool); res := 'turn'; end if;
      end if;
    else
      if other = any (b.agreed_by) or took then
        perform public.agree_build(b.id); res := 'agree';
      else
        select s->>'id', pb.items->(s->>'id') into slot, v
          from public.profile_builds pb, jsonb_array_elements(t.slots) s
         where pb.profile_id = actor and pb.type_key = b.type_key
           and coalesce(pb.items->(s->>'id')->>'value', '') <> ''
           and (pb.items->(s->>'id')->>'value') is distinct from (b.items->(s->>'id')->>'value')
         order by random() limit 1;
        if slot is null then perform public.agree_build(b.id); res := 'agree';
        else perform public.send_turn(b.id, b.items || jsonb_build_object(slot, v - 'by')); res := 'turn'; end if;
      end if;
    end if;
  end if;
  -- their line: on a turn it rides as the note; when it lands a match it opens the chat
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

-- the job: every build waiting on a stand-in who has let it sit for their pace
create or replace function public.standins_tick() returns int
language plpgsql security definer set search_path = public as $$
declare r record; n int := 0;
begin
  for r in select b.id, b.turn_id from public.builds b join public.standins s on s.profile_id = b.turn_id
            where b.status in ('open', 'as_is') and b.updated_at < now() - s.pace
            order by b.updated_at limit 25
  loop
    begin
      perform public.standin_move(r.id);
      n := n + 1;
    exception when others then
      raise warning 'stand-in % could not move on build %: %', r.turn_id, r.id, sqlerrm;
      update public.builds set updated_at = now() where id = r.id;   -- try again after their pace
    end;
  end loop;
  return n;
end $$;

revoke all on function public.standin_line(uuid) from public, anon, authenticated;
revoke all on function public.standin_move(uuid) from public, anon, authenticated;
revoke all on function public.standins_tick() from public, anon, authenticated;

select cron.schedule('standins', '30 seconds', 'select public.standins_tick()');
