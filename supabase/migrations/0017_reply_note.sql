-- Sync, migration 0017: "Reply back" to a note.
-- Building is the mixtape now. Everything else someone can send you (a note on the whole profile, a reply to a
-- prompt, a like on a photo) arrives as a note on your mixtape: a like as is (status 'as_is'), waiting on you.
-- Replying back is your response: it matches you two (the like's note opens your chat, as finish_build does)
-- and your reply lands right under it. One step, so a reply can't match you without the words, or the other way.

create or replace function public.reply_note(p_build uuid, p_note text) returns public.builds
language plpgsql security definer set search_path = public as $$
declare actor uuid := public.me(); b public.builds; m public.matches;
begin
  if length(trim(coalesce(p_note, ''))) < 1 then raise exception 'say something back'; end if;
  select * into b from public.builds where id = p_build for update;
  if not found or b.owner_id <> actor then raise exception 'build not found'; end if;
  if public.blocked_between(actor, b.starter_id) then raise exception 'unavailable'; end if;
  if b.status <> 'as_is' then raise exception 'nothing to reply to'; end if;
  insert into public.build_turns (build_id, actor_id, action, items, note) values (b.id, actor, 'match_back', b.items, trim(p_note));
  b := public.finish_build(b, 'as_is');
  select * into m from public.matches where build_id = b.id;
  insert into public.messages (match_id, sender_id, body) values (m.id, actor, trim(p_note));
  perform public.notify(b.starter_id, 'message', actor, null, m.id, left(trim(p_note), 120));
  return b;
end $$;
revoke execute on function public.reply_note(uuid, text) from public, anon;
grant execute on function public.reply_note(uuid, text) to authenticated;
