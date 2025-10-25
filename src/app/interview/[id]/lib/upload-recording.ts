'use server'

import { createClient } from '@/lib/supabase/server'

interface UploadRecordingParams {
  candidateId: string
  candidateName: string
  jobPostingId: string
  videoBlob: Blob
  interviewDate: string
}

export async function uploadInterviewRecording(
  candidateId: string,
  candidateName: string,
  jobPostingId: string,
  videoFile: File
) {
  try {
    console.log('📤 Uploading interview recording to Supabase...')
    
    const supabase = await createClient()
    
    // Create unique filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const sanitizedName = candidateName.replace(/[^a-zA-Z0-9]/g, '_')
    const fileName = `interview_${sanitizedName}_${candidateId}_${timestamp}.webm`
    const filePath = `interview-recordings/${jobPostingId}/${fileName}`
    
    console.log(`📁 Upload path: ${filePath}`)
    console.log(`📊 File size: ${(videoFile.size / 1024 / 1024).toFixed(2)} MB`)
    
    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('interview-videos')
      .upload(filePath, videoFile, {
        contentType: 'video/webm',
        cacheControl: '3600',
        upsert: false
      })
    
    if (uploadError) {
      console.error('❌ Upload error:', uploadError)
      return {
        success: false,
        error: uploadError.message
      }
    }
    
    console.log('✅ Video uploaded successfully')
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from('interview-videos')
      .getPublicUrl(filePath)
    
    const videoUrl = urlData.publicUrl
    console.log(`🔗 Video URL: ${videoUrl}`)
    
    // Store video URL in database
    const { error: dbError } = await supabase
      .from('interview_recordings')
      .insert({
        candidate_id: candidateId,
        job_posting_id: jobPostingId,
        video_url: videoUrl,
        file_path: filePath,
        file_size_mb: Number((videoFile.size / 1024 / 1024).toFixed(2)),
        duration_seconds: null, // Can be updated later if needed
        recorded_at: new Date().toISOString()
      })
    
    if (dbError) {
      console.error('❌ Database error:', dbError)
      return {
        success: false,
        error: `Failed to save video URL: ${dbError.message}`
      }
    }
    
    console.log('✅ Recording saved to database')
    
    return {
      success: true,
      videoUrl: videoUrl,
      filePath: filePath
    }
    
  } catch (error) {
    console.error('❌ Upload failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}
