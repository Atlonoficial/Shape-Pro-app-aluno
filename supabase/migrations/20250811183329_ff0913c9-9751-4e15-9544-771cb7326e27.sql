-- Create public avatars bucket if not exists
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Allow public read access to avatar images
create policy "Avatar images are publicly accessible"
on storage.objects for select
using (bucket_id = 'avatars');

-- Allow users to upload their own avatar (path must start with their user id)
create policy "Users can upload their own avatar"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'avatars'
  and auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to update their own avatar
create policy "Users can update their own avatar"
on storage.objects for update to authenticated
using (
  bucket_id = 'avatars'
  and auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own avatar
create policy "Users can delete their own avatar"
on storage.objects for delete to authenticated
using (
  bucket_id = 'avatars'
  and auth.uid()::text = (storage.foldername(name))[1]
);