-- =============================================================================
-- Storage: one public "media" bucket. Files live under a per-user folder
-- (name starts with the uploader's uid) so RLS can scope writes to the owner.
--   <uid>/trucks/logo.jpg   <uid>/specials/<uuid>.jpg   <uid>/checkins/<uuid>.jpg
-- Reads are public (feed photos, logos). 5 MB cap, images only.
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "media: public read"
  on storage.objects for select
  using (bucket_id = 'media');

create policy "media: owner upload"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "media: owner update"
  on storage.objects for update to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "media: owner delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
