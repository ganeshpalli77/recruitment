'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { apiClient } from '@/lib/api-client'

export async function createJobPosting(formData: FormData) {
  const supabase = await createClient()

  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    redirect('/login')
  }

  const jobData = {
    title: formData.get('title') as string,
    description: formData.get('description') as string,
    requirements: formData.get('requirements') as string,
    experience_required: parseInt(formData.get('experience_required') as string) || 0,
    skills_required: (formData.get('skills_required') as string)?.split(',').map(s => s.trim()) || [],
    created_by: user.id,
    status: 'active' as const
  }

  // Insert job posting and get the inserted record
  const { data: insertedJob, error } = await supabase
    .from('job_postings')
    .insert(jobData)
    .select('*')
    .single()

  if (error || !insertedJob) {
    console.error('Error creating job posting:', error)
    redirect('/job-postings?error=' + encodeURIComponent(error?.message || 'Failed to create job posting'))
  }

  // Trigger AI analysis asynchronously (don't wait for completion)
  try {
    console.log('Triggering AI analysis for job:', insertedJob.id)
    
    // Check if backend is reachable first
    const isReachable = await apiClient.isBackendReachable()
    
    if (isReachable) {
      // Fire and forget - trigger AI analysis
      apiClient.analyzeJob({
        job_id: insertedJob.id,
        title: insertedJob.title,
        description: insertedJob.description,
        requirements: insertedJob.requirements
      }).catch((error) => {
        console.error('AI analysis failed (non-blocking):', error)
      })
    } else {
      console.warn('Backend not reachable, skipping AI analysis')
    }
  } catch (error) {
    console.error('Error triggering AI analysis (non-blocking):', error)
    // Don't fail the job creation if AI analysis fails
  }

  revalidatePath('/job-postings')
  redirect('/job-postings?success=Job posting created successfully. AI analysis will be available shortly.')
}

export async function updateJobPostingStatus(formData: FormData) {
  const supabase = await createClient()

  const id = formData.get('id') as string
  const status = formData.get('status') as string

  const { error } = await supabase
    .from('job_postings')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    console.error('Error updating job posting:', error)
    redirect('/job-postings?error=' + encodeURIComponent(error.message))
  }

  revalidatePath('/job-postings')
  redirect('/job-postings?success=Job status updated successfully')
}

export async function deleteJobPosting(formData: FormData) {
  const supabase = await createClient()

  const id = formData.get('id') as string

  const { error } = await supabase
    .from('job_postings')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting job posting:', error)
    redirect('/job-postings?error=' + encodeURIComponent(error.message))
  }

  revalidatePath('/job-postings')
  redirect('/job-postings?success=Job posting deleted successfully')
}
