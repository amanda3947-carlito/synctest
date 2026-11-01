-- Sync storage: the private `media` bucket for profile photos, videos and build art.
-- Run after 0001_init.sql. Paths are <user id>/<file>, so each person writes only their own folder;
-- anyone signed in can read, and RLS on profile_media decides what is shown where.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', false, 52428800,
        array['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm','video/quicktime'])
on conflict (id) do nothing;

create policy "media: signed-in read" on storage.objects for select to authenticated
  using (bucket_id = 'media');
create policy "media: upload to own folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "media: update own" on storage.objects for update to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "media: delete own" on storage.objects for delete to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
