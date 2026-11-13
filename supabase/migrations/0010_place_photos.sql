-- Sync, migration 0010: a photo for a spot. The app looks one up near the pin (Wikimedia Commons,
-- no key) the first time a spot without a picture is shown, and keeps it here so it is fetched once.
-- Only an empty image_path can be filled, and only with an https picture URL.
create or replace function public.set_place_image(p_place uuid, p_url text) returns void
language sql security definer set search_path = public as $$
  update public.places set image_path = p_url
    where id = p_place and image_path is null and p_url ~ '^https://[a-z0-9.-]+/.+\.(jpe?g|png|webp)(\?.*)?$';
$$;
grant execute on function public.set_place_image(uuid, text) to authenticated;
