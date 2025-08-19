-- Create storage buckets for progress photos and medical exams
INSERT INTO storage.buckets (id, name, public) VALUES ('progress-photos', 'progress-photos', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('medical-exams', 'medical-exams', false);

-- Create RLS policies for progress photos bucket (public read, user-specific uploads)
CREATE POLICY "Progress photos are publicly viewable" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'progress-photos');

CREATE POLICY "Users can upload their own progress photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'progress-photos' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own progress photos" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'progress-photos' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own progress photos" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'progress-photos' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Create RLS policies for medical exams bucket (private with user/teacher access)
CREATE POLICY "Users can view their own medical exams" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'medical-exams' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Teachers can view students medical exams" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'medical-exams' AND
  EXISTS (
    SELECT 1 FROM public.students s 
    WHERE s.user_id::text = (storage.foldername(name))[1]
    AND s.teacher_id = auth.uid()
  )
);

CREATE POLICY "Users can upload their own medical exams" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'medical-exams' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own medical exams" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'medical-exams' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own medical exams" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'medical-exams' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);