-- Create bucket for app icons
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'app-icons',
  'app-icons',
  true,
  10485760, -- 10MB limit
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'application/json']
)
ON CONFLICT (id) DO NOTHING;

-- Policy: Allow public to read icons
CREATE POLICY "Public can view app icons"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'app-icons');

-- Policy: Allow authenticated users to upload icons
CREATE POLICY "Authenticated users can upload app icons"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'app-icons');

-- Policy: Allow authenticated users to update icons
CREATE POLICY "Authenticated users can update app icons"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'app-icons');

-- Policy: Allow authenticated users to delete icons
CREATE POLICY "Authenticated users can delete app icons"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'app-icons');