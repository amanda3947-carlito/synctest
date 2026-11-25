-- Sync, migration 0016: the mixtape is the one build.
-- The featured build (3 to 6 of your spots or watching & reading, for people to swap into) is gone; the profile
-- interactions coming next cover that ground. Spots and Watching & Reading stay as collections on the profile.
-- Every featured build comes down (and any build on one), set_featured goes, and a profile's build is its mixtape.

delete from public.builds         where type_key <> 'mixtape';
delete from public.profile_builds where type_key <> 'mixtape';
delete from public.build_types    where key      <> 'mixtape';
drop function if exists public.set_featured(text, jsonb);

create or replace function public.profile_builds_guard() returns trigger language plpgsql as $$
declare t public.build_types;
begin
  if new.type_key <> 'mixtape' then raise exception 'a profile''s build is its mixtape'; end if;
  select * into t from public.build_types where key = new.type_key;
  perform public.check_items(t, new.items);
  if not public.owner_complete(t, new.items) then
    raise exception 'a % on your profile needs at least % %s before it goes up', t.name, t.min_items, t.unit;
  end if;
  new.items := public.stamp_items(t.kind, '[]'::jsonb, new.items, new.profile_id);   -- every item on an owner's build is theirs
  new.position := 0;
  return new;
end $$;
