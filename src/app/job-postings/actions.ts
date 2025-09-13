'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

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

  const { error } = await supabase
    .from('job_postings')
    .insert(jobData)

  if (error) {
    console.error('Error creating job posting:', error)
    redirect('/job-postings?error=' + encodeURIComponent(error.message))
  }

  revalidatePath('/job-postings')
  redirect('/job-postings?success=Job posting created successfully')
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
