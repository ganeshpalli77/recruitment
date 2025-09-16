# Resume Upload Feature Setup

This document outlines the setup required for the resume upload functionality in the candidates page.

## Supabase Storage Setup

### 1. Create Storage Bucket

In your Supabase dashboard:

1. Go to **Storage** in the sidebar
2. Click **"Create Bucket"**
3. Set bucket name: `resumes`
4. Make it **Public** (so resume URLs are accessible)
5. Click **"Create Bucket"**

### 2. Set up Storage Policies

Add the following RLS policies for the `resumes` bucket:

```sql
-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload resumes" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'resumes' AND 
  auth.role() = 'authenticated'
);

-- Allow authenticated users to read resume files
CREATE POLICY "Authenticated users can read resumes" ON storage.objects
FOR SELECT USING (
  bucket_id = 'resumes' AND 
  auth.role() = 'authenticated'
);

-- Allow authenticated users to delete resume files
CREATE POLICY "Authenticated users can delete resumes" ON storage.objects
FOR DELETE USING (
  bucket_id = 'resumes' AND 
  auth.role() = 'authenticated'
);
```

### 3. Update Database Schema (Optional Enhancement)

Add a job_id column to the candidates table to better link candidates to specific jobs:

```sql
-- Add job_id column to candidates table
ALTER TABLE candidates 
ADD COLUMN job_id UUID REFERENCES job_postings(id);

-- Create index for better performance
CREATE INDEX idx_candidates_job_id ON candidates(job_id);
```

## Environment Variables

Make sure your `.env.local` includes:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## File Upload Limitations

The current setup has the following limitations:

- **File Types**: PDF, DOC, DOCX, TXT only
- **File Size**: Maximum 10MB per file
- **Storage**: Files are stored in Supabase Storage
- **Processing**: Demo AI processing (replace with real AI service)

## Features Implemented

### ✅ Resume Upload Form
- Drag & drop file upload
- Multiple file selection
- File validation (type and size)
- Progress tracking
- Error handling

### ✅ Candidates Results Table
- AI-powered ranking by overall score
- Detailed candidate breakdowns
- Skills, experience, and education scoring
- Interactive candidate details drawer
- Responsive design

### ✅ Job-Specific Candidate Management
- Dynamic routing: `/job-postings/[id]/candidates`
- Job-specific candidate filtering
- AI analysis integration
- Professional UI with shadcn components

## Production Considerations

### 1. Real AI Integration
Replace the mock `simulateResumeProcessing` function in `actions.ts` with:
- Azure OpenAI integration for resume parsing
- Skills extraction and matching
- Experience level assessment
- Education qualification analysis

### 2. Background Job Processing
Consider implementing:
- Queue system for large resume batches
- Background workers for AI processing
- Progress tracking and notifications
- Error handling and retry mechanisms

### 3. File Management
Implement:
- File compression for storage optimization
- Automatic file cleanup for old resumes
- Virus scanning for uploaded files
- CDN integration for better performance

### 4. Advanced Features
Consider adding:
- Bulk resume upload
- Resume content search
- Candidate interview scheduling
- Email notifications to candidates
- Export candidates to CSV/PDF

## Testing

To test the functionality:

1. Navigate to any job posting
2. Click on the job title or "View Candidates" button
3. Upload resume files via drag & drop or file selection
4. Process the files using the "Process with AI" button
5. View ranked candidates in the results table
6. Click on candidate names to view detailed breakdowns

## Troubleshooting

### Storage Errors
- Ensure the `resumes` bucket exists and is public
- Verify RLS policies are correctly set
- Check file size and type restrictions

### Upload Failures
- Verify environment variables are set
- Check browser console for detailed error messages
- Ensure user is authenticated

### AI Processing Issues
- Replace mock data with real AI service integration
- Add proper error handling for AI service failures
- Implement retry mechanisms for failed processing
