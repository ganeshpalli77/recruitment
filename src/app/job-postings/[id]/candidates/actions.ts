'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function uploadResume(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    redirect('/login')
  }

  try {
    const resume = formData.get('resume') as File
    const jobId = formData.get('jobId') as string

    if (!resume || !jobId) {
      return {
        error: 'Missing required fields'
      }
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
    if (!allowedTypes.includes(resume.type)) {
      return {
        error: 'Invalid file type. Please upload PDF, DOC, DOCX, or TXT files only.'
      }
    }

    // Validate file size (10MB)
    const maxSize = 10 * 1024 * 1024
    if (resume.size > maxSize) {
      return {
        error: 'File too large. Maximum file size is 10MB.'
      }
    }

    // Generate unique filename
    const timestamp = Date.now()
    const fileName = `${timestamp}-${resume.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    const filePath = `resumes/${jobId}/${fileName}`

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('resumes')
      .upload(filePath, resume, {
        contentType: resume.type,
        upsert: false
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return {
        error: 'Failed to upload file. Please try again.'
      }
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('resumes')
      .getPublicUrl(filePath)

    // Add to processing queue
    const { data: queueData, error: queueError } = await supabase
      .from('resume_processing_queue')
      .insert({
        file_name: resume.name,
        file_url: publicUrlData.publicUrl,
        status: 'pending'
      })
      .select()
      .single()

    if (queueError) {
      console.error('Queue error:', queueError)
      // Clean up uploaded file
      await supabase.storage.from('resumes').remove([filePath])
      return {
        error: 'Failed to queue file for processing. Please try again.'
      }
    }

    // For demo purposes, we'll simulate processing and create a candidate entry
    // In production, this would be handled by a background job
    const candidateData = await simulateResumeProcessing(resume.name, publicUrlData.publicUrl, jobId)
    
    if (candidateData) {
      // Insert candidate
      const { data: candidateInsert, error: candidateError } = await supabase
        .from('candidates')
        .insert({
          name: candidateData.name,
          email: candidateData.email,
          phone: candidateData.phone,
          position: candidateData.position,
          status: 'under_review',
          ai_score: candidateData.ai_score,
          skills_match: candidateData.skills_match,
          experience_years: candidateData.experience_years,
          education: candidateData.education,
          resume_url: publicUrlData.publicUrl,
          resume_content: candidateData.resume_content
        })
        .select()
        .single()

      if (candidateError) {
        console.error('Candidate insert error:', candidateError)
        return {
          error: 'Failed to create candidate record.'
        }
      }

      // Create evaluation record
      const { error: evaluationError } = await supabase
        .from('candidate_evaluations')
        .insert({
          candidate_id: candidateInsert.id,
          job_posting_id: jobId,
          skills_score: candidateData.skills_score,
          experience_score: candidateData.experience_score,
          education_score: candidateData.education_score,
          overall_score: candidateData.overall_score,
          evaluation_details: candidateData.evaluation_details
        })

      if (evaluationError) {
        console.error('Evaluation insert error:', evaluationError)
        return {
          error: 'Failed to create evaluation record.'
        }
      }

      // Update queue status
      await supabase
        .from('resume_processing_queue')
        .update({ 
          status: 'completed',
          processed_at: new Date().toISOString()
        })
        .eq('id', queueData.id)
    }

    return {
      success: true,
      message: 'Resume uploaded and processed successfully!'
    }

  } catch (error) {
    console.error('Upload action error:', error)
    return {
      error: 'An unexpected error occurred. Please try again.'
    }
  }
}

// Simulate AI resume processing (in production, this would call your AI service)
async function simulateResumeProcessing(fileName: string, fileUrl: string, jobId: string) {
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 1000))

  // Generate mock candidate data based on filename patterns for demo
  const nameVariations = [
    'John Smith', 'Sarah Johnson', 'Michael Chen', 'Emily Davis', 'David Wilson',
    'Jessica Brown', 'Robert Taylor', 'Ashley Miller', 'Christopher Jones', 'Amanda Garcia'
  ]
  
  const positions = [
    'Software Engineer', 'Senior Developer', 'Full Stack Developer', 'Frontend Developer',
    'Backend Developer', 'DevOps Engineer', 'Product Manager', 'UX Designer', 'Data Analyst'
  ]

  const educationOptions = [
    'BS Computer Science', 'MS Software Engineering', 'BS Information Technology',
    'MS Computer Science', 'BS Engineering', 'MS Data Science', 'Bootcamp Graduate',
    'BS Mathematics', 'MS Information Systems'
  ]

  const randomName = nameVariations[Math.floor(Math.random() * nameVariations.length)]
  const randomPosition = positions[Math.floor(Math.random() * positions.length)]
  const randomEducation = educationOptions[Math.floor(Math.random() * educationOptions.length)]
  
  // Generate realistic scores
  const baseScore = 60 + Math.random() * 35 // Base score between 60-95
  const variance = 10 // Allow some variance between different score types
  
  const skillsScore = Math.round(Math.max(30, Math.min(100, baseScore + (Math.random() - 0.5) * variance)))
  const experienceScore = Math.round(Math.max(30, Math.min(100, baseScore + (Math.random() - 0.5) * variance)))
  const educationScore = Math.round(Math.max(30, Math.min(100, baseScore + (Math.random() - 0.5) * variance)))
  
  // Weighted overall score (skills 40%, experience 35%, education 25%)
  const overallScore = Math.round(
    (skillsScore * 0.4) + (experienceScore * 0.35) + (educationScore * 0.25)
  )

  return {
    name: randomName,
    email: `${randomName.toLowerCase().replace(/\s+/g, '.')}@email.com`,
    phone: `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`,
    position: randomPosition,
    ai_score: overallScore,
    skills_match: `${skillsScore}%`,
    experience_years: Math.floor(Math.random() * 10) + 1,
    education: randomEducation,
    resume_content: `Extracted content from ${fileName}`,
    skills_score: skillsScore,
    experience_score: experienceScore,
    education_score: educationScore,
    overall_score: overallScore,
    evaluation_details: {
      processed_at: new Date().toISOString(),
      file_name: fileName,
      ai_model: 'gpt-4o',
      confidence_score: 0.85 + Math.random() * 0.1,
      key_skills: ['JavaScript', 'React', 'Node.js', 'Python', 'SQL'],
      extracted_experience: `${Math.floor(Math.random() * 10) + 1} years`,
      match_reasoning: 'Strong technical background with relevant experience in required technologies.'
    }
  }
}
