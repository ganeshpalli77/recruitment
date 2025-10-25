'use server'

interface TranscriptEntry {
  role: 'ai' | 'user'
  message: string
  timestamp: string
}

interface AnalyzeInterviewParams {
  candidateId: string
  candidateName: string
  jobPostingId: string
  jobTitle: string
  interviewDuration: number
  transcript: TranscriptEntry[]
}

export async function analyzeInterview(params: AnalyzeInterviewParams) {
  try {
    console.log('📊 Analyzing interview for:', params.candidateName)
    
    const response = await fetch('http://localhost:8000/api/analyze-interview', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        candidate_id: params.candidateId,
        candidate_name: params.candidateName,
        job_posting_id: params.jobPostingId,
        job_title: params.jobTitle,
        interview_duration: params.interviewDuration,
        transcript: params.transcript
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      return {
        success: false,
        error: errorData.detail || 'Failed to analyze interview'
      }
    }

    const analysisResult = await response.json()
    
    console.log('✅ Analysis complete. Overall score:', analysisResult.overall_analysis.overall_score)
    
    return {
      success: true,
      data: analysisResult
    }

  } catch (error) {
    console.error('❌ Error analyzing interview:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }
  }
}
