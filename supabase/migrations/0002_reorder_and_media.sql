-- Sync, migration 0002.
-- 1. Reordering a mixtape counts as a change (the designed sheet lets you send a reorder on its own).
-- 2. Photos show without review for now: `approved` defaults to true, and clients can no longer
--    set the column themselves, so flipping the default back later is all moderation needs.

create or replace function public.build_changes(kind public.build_kind, old_items jsonb, new_items jsonb)
returns int language sql immutable as $$
  select case kind
    when 'list' then greatest(
      (select count(*) from unnest(public.list_keys(new_items)) k where k <> all (public.list_keys(old_items))),
      (select count(*) from unnest(public.list_keys(old_items)) k where k <> all (public.list_keys(new_items))),
      case when public.list_keys(old_items) <> public.list_keys(new_items)
            and public.list_keys(old_items) @> public.list_keys(new_items)
            and public.list_keys(new_items) @> public.list_keys(old_items) then 1 else 0 end)
    else (select count(*) from (select jsonb_object_keys(old_items || new_items) k) ks
          where (old_items->k->>'value') is distinct from (new_items->k->>'value'))
  end::int
$$;

alter table public.profile_media alter column approved set default true;
revoke insert, update on public.profile_media from authenticated;
grant insert (profile_id, kind, path, poster_path, position) on public.profile_media to authenticated;
grant update (kind, path, poster_path, position) on public.profile_media to authenticated;
