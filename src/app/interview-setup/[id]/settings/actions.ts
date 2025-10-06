'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateInterviewSettings(
  jobId: string,
  settings: {
    duration: number
    interviewType: string
    rounds: number
    interviewers: string[]
    location: string
    meetingLink?: string
    notificationsEnabled: boolean
    timeSlots?: any[]
    bufferTime?: number
  }
) {
  try {
    const supabase = await createClient()

    // Check if settings already exist
    const { data: existing } = await supabase
      .from('interview_setup')
      .select('id')
      .eq('job_posting_id', jobId)
      .single()

    let result

    if (existing) {
      // Update existing settings
      result = await supabase
        .from('interview_setup')
        .update({
          duration: settings.duration,
          interview_type: settings.interviewType,
          rounds: settings.rounds,
          interviewers: settings.interviewers,
          location: settings.location || null,
          meeting_link: settings.meetingLink || null,
          notifications_enabled: settings.notificationsEnabled,
          time_slots: settings.timeSlots || [],
          buffer_time: settings.bufferTime || 15,
          updated_at: new Date().toISOString()
        })
        .eq('job_posting_id', jobId)
    } else {
      // Insert new settings
      result = await supabase
        .from('interview_setup')
        .insert({
          job_posting_id: jobId,
          duration: settings.duration,
          interview_type: settings.interviewType,
          rounds: settings.rounds,
          interviewers: settings.interviewers,
          location: settings.location || null,
          meeting_link: settings.meetingLink || null,
          notifications_enabled: settings.notificationsEnabled,
          time_slots: settings.timeSlots || [],
          buffer_time: settings.bufferTime || 15
        })
    }

    if (result.error) {
      console.error('Error updating interview settings:', result.error)
      return { success: false, error: result.error.message }
    }

    // Revalidate the paths to refresh the data
    revalidatePath('/interview-setup')
    revalidatePath(`/interview-setup/${jobId}/settings`)

    return { success: true }
  } catch (error) {
    console.error('Error in updateInterviewSettings:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}
