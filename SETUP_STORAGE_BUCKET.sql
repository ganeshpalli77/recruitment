-- Create the resumes storage bucket in Supabase
-- Run this in your Supabase SQL Editor

-- Insert bucket into storage.buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'resumes',
    'resumes', 
    false,  -- Keep private for security
    10485760,  -- 10MB limit
    ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for the bucket

-- Policy: Allow authenticated users to upload
CREATE POLICY "Allow authenticated users to upload resumes"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'resumes');

-- Policy: Allow authenticated users to read their uploads
CREATE POLICY "Allow authenticated users to read resumes"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'resumes');

-- Policy: Allow authenticated users to delete their uploads
CREATE POLICY "Allow authenticated users to delete resumes"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'resumes');

-- Policy: Allow authenticated users to update
CREATE POLICY "Allow authenticated users to update resumes"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'resumes')
WITH CHECK (bucket_id = 'resumes');

-- Verify bucket was created
SELECT * FROM storage.buckets WHERE id = 'resumes';
