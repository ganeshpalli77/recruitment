-- Recruitment Database Schema Setup
-- Run this in your Supabase SQL Editor or via the dashboard

-- Enable UUID extension for generating unique IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create candidates table for storing parsed resume data
CREATE TABLE candidates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  position TEXT NOT NULL,
  status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'under_review', 'shortlisted', 'rejected', 'hired')),
  ai_score INTEGER CHECK (ai_score >= 0 AND ai_score <= 100),
  skills_match TEXT, -- percentage like "85%"
  experience_years INTEGER,
  education TEXT,
  resume_url TEXT,
  resume_content TEXT, -- parsed resume text
  submission_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create job_postings table for managing open positions
CREATE TABLE job_postings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  requirements TEXT NOT NULL,
  skills_required TEXT[] DEFAULT '{}',
  experience_required INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('draft', 'active', 'closed', 'paused')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create candidate_evaluations table for AI scoring details
CREATE TABLE candidate_evaluations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
  job_posting_id UUID REFERENCES job_postings(id) ON DELETE CASCADE,
  skills_score INTEGER CHECK (skills_score >= 0 AND skills_score <= 100),
  experience_score INTEGER CHECK (experience_score >= 0 AND experience_score <= 100),
  education_score INTEGER CHECK (education_score >= 0 AND education_score <= 100),
  overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
  evaluation_details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(candidate_id, job_posting_id)
);

-- Create resume_processing_queue for handling bulk uploads
CREATE TABLE resume_processing_queue (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_candidates_status ON candidates(status);
CREATE INDEX idx_candidates_ai_score ON candidates(ai_score DESC);
CREATE INDEX idx_candidates_submission_date ON candidates(submission_date DESC);
CREATE INDEX idx_job_postings_status ON job_postings(status);
CREATE INDEX idx_candidate_evaluations_overall_score ON candidate_evaluations(overall_score DESC);

-- Enable Row Level Security
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE resume_processing_queue ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for authenticated users
CREATE POLICY "Users can view all candidates" ON candidates
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert candidates" ON candidates
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update candidates" ON candidates
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view all job postings" ON job_postings
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage their job postings" ON job_postings
  FOR ALL USING (auth.uid() = created_by);

CREATE POLICY "Users can view evaluations" ON candidate_evaluations
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage evaluations" ON candidate_evaluations
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage processing queue" ON resume_processing_queue
  FOR ALL USING (auth.role() = 'authenticated');

-- Insert sample data to test the dashboard
INSERT INTO candidates (name, email, position, status, ai_score, skills_match, experience_years, education) VALUES 
('Sarah Johnson', 'sarah.johnson@email.com', 'Senior Frontend Developer', 'shortlisted', 92, '95%', 5, 'BS Computer Science'),
('Michael Chen', 'michael.chen@email.com', 'Senior Frontend Developer', 'shortlisted', 89, '88%', 6, 'MS Software Engineering'),
('Emily Rodriguez', 'emily.rodriguez@email.com', 'Backend Developer', 'under_review', 85, '82%', 4, 'BS Computer Science'),
('David Kim', 'david.kim@email.com', 'DevOps Engineer', 'shortlisted', 91, '93%', 7, 'BS Information Technology'),
('Jessica Thompson', 'jessica.thompson@email.com', 'Full Stack Developer', 'processing', 78, '75%', 3, 'Bootcamp Graduate');

COMMENT ON TABLE candidates IS 'Stores candidate information from parsed resumes';
COMMENT ON TABLE job_postings IS 'Manages job postings and requirements';
COMMENT ON TABLE candidate_evaluations IS 'AI scoring and evaluation details';
COMMENT ON TABLE resume_processing_queue IS 'Queue for bulk resume processing';
