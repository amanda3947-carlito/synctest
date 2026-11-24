-- Sync, migration 0015: a like with a note is never blocked.
-- Building together is the point, but a profile-level like with a note is always open to you:
--   * any note that isn't empty will do (it was 3 characters or more, which bounced "hi" or a single emoji);
--   * no build between you yet: it's a like as is, waiting on their response (love_as_is, unchanged otherwise);
--     their response (match back, or a change) is what unlocks the full chat;
--   * a build already going: the note goes to them on that build (send_note), whoever's turn it is;
--   * already matched: the note lands in your chat.

alter type public.turn_action add value if not exists 'note';

create or replace function public.love_as_is(p_profile_build uuid, p_note text) returns public.builds
language plpgsql security definer set search_path = public as $$
declare actor uuid := public.me(); pb public.profile_builds; b public.builds;
begin
  if length(trim(coalesce(p_note, ''))) < 1 then raise exception 'add a note to send your like'; end if;
  select * into pb from public.profile_builds where id = p_profile_build;
  if not found then raise exception 'build not found'; end if;
  perform public.open_build_checks(pb, actor);
  insert into public.builds (type_key, profile_build_id, starter_id, owner_id, items, turn_id, status, as_is_note)
    values (pb.type_key, pb.id, actor, pb.profile_id, pb.items, pb.profile_id, 'as_is', trim(p_note)) returning * into b;
  insert into public.build_turns (build_id, actor_id, action, items, note) values (b.id, actor, 'love_as_is', pb.items, trim(p_note));
  perform public.notify(pb.profile_id, 'as_is', actor, b.id, null, trim(p_note));
  return b;
end $$;

-- a note on a build you two already have going (or, once matched, a message in your chat)
create or replace function public.send_note(p_build uuid, p_note text) returns public.builds
language plpgsql security definer set search_path = public as $$
declare actor uuid := public.me(); b public.builds; other uuid; m public.matches;
begin
  if length(trim(coalesce(p_note, ''))) < 1 then raise exception 'add a note to send it'; end if;
  select * into b from public.builds where id = p_build;
  if not found or not public.is_participant(b, actor) then raise exception 'build not found'; end if;
  other := public.other_side(b, actor);
  if public.blocked_between(actor, other) then raise exception 'unavailable'; end if;
  if b.status = 'closed' then raise exception 'this build has ended'; end if;
  if b.status = 'agreed' then
    select * into m from public.matches where build_id = b.id;
    if not found or m.ended_at is not null then raise exception 'this chat has ended'; end if;
    insert into public.messages (match_id, sender_id, body) values (m.id, actor, trim(p_note));
    perform public.notify(other, 'message', actor, null, m.id, left(trim(p_note), 120));
    return b;
  end if;
  insert into public.build_turns (build_id, actor_id, action, note) values (b.id, actor, 'note', trim(p_note));
  perform public.notify(other, 'message', actor, b.id, null, left(trim(p_note), 120));
  return b;
end $$;
revoke execute on function public.send_note(uuid, text) from public, anon;
grant execute on function public.send_note(uuid, text) to authenticated;
