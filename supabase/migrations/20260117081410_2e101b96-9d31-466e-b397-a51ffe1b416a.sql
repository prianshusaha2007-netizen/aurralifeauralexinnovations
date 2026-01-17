-- Make the analyzed-images bucket private
UPDATE storage.buckets SET public = false WHERE id = 'analyzed-images';

-- Drop the overly permissive public policy
DROP POLICY IF EXISTS "Anyone can view analyzed images" ON storage.objects;

-- Create user-scoped policies for the private bucket
CREATE POLICY "Users can upload their own images" ON storage.objects 
  FOR INSERT WITH CHECK (
    bucket_id = 'analyzed-images' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own images" ON storage.objects 
  FOR SELECT USING (
    bucket_id = 'analyzed-images' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own images" ON storage.objects 
  FOR UPDATE USING (
    bucket_id = 'analyzed-images' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own images" ON storage.objects 
  FOR DELETE USING (
    bucket_id = 'analyzed-images' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );