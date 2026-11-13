-- Sync, migration 0008: you can have builds going with several people at once.
-- The one-in-flight-per-starter rule is gone; the one-live-build-per-pair rule stays.
drop index if exists public.builds_one_in_flight_per_starter;
create index if not exists builds_starter_status on public.builds (starter_id, status);

create or replace function public.open_build_checks(pb public.profile_builds, actor uuid) returns void language plpgsql as $$
begin
  if pb.profile_id = actor then raise exception 'that is your own build'; end if;
  if public.blocked_between(actor, pb.profile_id) then raise exception 'unavailable'; end if;
  if exists (select 1 from public.passes where profile_id = pb.profile_id and passed_id = actor) then raise exception 'unavailable'; end if;
  if exists (select 1 from public.builds where status in ('open','as_is','agreed')
             and least(starter_id, owner_id) = least(actor, pb.profile_id) and greatest(starter_id, owner_id) = greatest(actor, pb.profile_id)) then
    raise exception 'you two already have a build going';
  end if;
end $$;
