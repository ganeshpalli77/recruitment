'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function shortlistCandidate(
  jobPostingId: string,
  resumeResultId: string,
  candidateData: {
    name: string
    email: string | null
    phone: string | null
    overallScore: number
    skillsScore: number
    experienceScore: number
    educationScore: number
    recommendation: string | null
  }
) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Check if already shortlisted
    const { data: existing } = await supabase
      .from('interview_selected_students')
      .select('id')
      .eq('job_posting_id', jobPostingId)
      .eq('resume_result_id', resumeResultId)
      .single()

    if (existing) {
      return { success: false, error: 'Candidate already shortlisted' }
    }

    // Insert into interview_selected_students
    const { error } = await supabase
      .from('interview_selected_students')
      .insert({
        job_posting_id: jobPostingId,
        resume_result_id: resumeResultId,
        candidate_name: candidateData.name,
        candidate_email: candidateData.email,
        candidate_phone: candidateData.phone,
        overall_score: candidateData.overallScore,
        skills_score: candidateData.skillsScore,
        experience_score: candidateData.experienceScore,
        education_score: candidateData.educationScore,
        recommendation: candidateData.recommendation,
        shortlisted_by: user.id,
        interview_status: 'pending'
      })

    if (error) {
      console.error('Error shortlisting candidate:', error)
      return { success: false, error: error.message }
    }

    // Revalidate the page
    revalidatePath(`/job-postings/${jobPostingId}/candidates`)
    
    return { success: true }
  } catch (error) {
    console.error('Error in shortlistCandidate:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

export async function removeShortlist(
  jobPostingId: string,
  resumeResultId: string
) {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('interview_selected_students')
      .delete()
      .eq('job_posting_id', jobPostingId)
      .eq('resume_result_id', resumeResultId)

    if (error) {
      console.error('Error removing shortlist:', error)
      return { success: false, error: error.message }
    }

    // Revalidate the page
    revalidatePath(`/job-postings/${jobPostingId}/candidates`)
    
    return { success: true }
  } catch (error) {
    console.error('Error in removeShortlist:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}
