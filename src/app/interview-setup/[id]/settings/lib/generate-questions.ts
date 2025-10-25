'use server'

import { createClient } from '@/lib/supabase/server'

interface QuestionGenerationParams {
  candidateId: string
  candidateName: string
  jobId: string
}

interface QuestionDistribution {
  screening: number
  technical: number
  hr: number
}

export async function generateInterviewQuestions({ 
  candidateId, 
  candidateName, 
  jobId 
}: QuestionGenerationParams) {
  try {
    const supabase = await createClient()

    // 1. Get interview setup details (duration and question distribution)
    const { data: interviewSetup, error: setupError } = await supabase
      .from('interview_setup')
      .select('duration, screening_round_percentage, technical_round_percentage, hr_round_percentage')
      .eq('job_posting_id', jobId)
      .single()

    if (setupError || !interviewSetup) {
      return { 
        success: false, 
        error: 'Interview setup not found. Please configure interview settings first.' 
      }
    }

    // 2. Get job posting with AI analysis
    const { data: jobPosting, error: jobError } = await supabase
      .from('job_postings')
      .select('title, description, requirements, skills_required, ai_analysis')
      .eq('id', jobId)
      .single()

    if (jobError || !jobPosting) {
      return { success: false, error: 'Job posting not found' }
    }

    // 3. Calculate number of questions based on duration
    const duration = interviewSetup.duration
    let totalQuestions = 0
    
    switch (duration) {
      case 20:
        totalQuestions = 7
        break
      case 30:
        totalQuestions = 11
        break
      case 45:
        totalQuestions = 16
        break
      case 60:
        totalQuestions = 20
        break
      default:
        totalQuestions = 11 // default to 30 min
    }

    // 4. Calculate distribution of questions per round
    const screeningPercentage = interviewSetup.screening_round_percentage || 30
    const technicalPercentage = interviewSetup.technical_round_percentage || 50
    const hrPercentage = interviewSetup.hr_round_percentage || 20

    const distribution: QuestionDistribution = {
      screening: Math.round((screeningPercentage / 100) * totalQuestions),
      technical: Math.round((technicalPercentage / 100) * totalQuestions),
      hr: 0
    }
    
    // Adjust HR questions to ensure total equals expected
    distribution.hr = totalQuestions - distribution.screening - distribution.technical

    // 5. Generate greeting message
    const greeting = `Welcome to the interview, ${candidateName}! Thank you for taking the time to speak with us today about the ${jobPosting.title} position. We're excited to learn more about your background and experience. This interview will take approximately ${duration} minutes. Let's get started!`

    // 6. Call backend API to generate questions using Azure OpenAI
    const backendResponse = await fetch('http://localhost:8000/api/generate-interview-questions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        job_title: jobPosting.title,
        job_description: jobPosting.description,
        job_requirements: jobPosting.requirements,
        skills_required: jobPosting.skills_required,
        ai_analysis: jobPosting.ai_analysis,
        candidate_name: candidateName,
        screening_count: distribution.screening,
        technical_count: distribution.technical,
        hr_count: distribution.hr,
        duration: duration
      })
    })

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json()
      return { 
        success: false, 
        error: errorData.detail || 'Failed to generate questions from AI service' 
      }
    }

    const generatedQuestions = await backendResponse.json()

    // 7. Store questions in database
    const { data: savedQuestions, error: saveError } = await supabase
      .from('interview_questions')
      .upsert({
        candidate_id: candidateId,
        candidate_name: candidateName,
        job_posting_id: jobId,
        interview_duration: duration,
        screening_percentage: screeningPercentage,
        technical_percentage: technicalPercentage,
        hr_percentage: hrPercentage,
        greeting_message: greeting,
        screening_questions: generatedQuestions.screening_questions || [],
        technical_questions: generatedQuestions.technical_questions || [],
        hr_questions: generatedQuestions.hr_questions || [],
        total_questions: totalQuestions,
        ai_model: generatedQuestions.model || 'gpt-4'
      }, {
        onConflict: 'candidate_id,job_posting_id'
      })
      .select()
      .single()

    if (saveError) {
      console.error('Error saving questions:', saveError)
      return { 
        success: false, 
        error: 'Failed to save generated questions to database' 
      }
    }

    return {
      success: true,
      data: {
        questionId: savedQuestions.id,
        totalQuestions,
        distribution,
        greeting
      }
    }

  } catch (error) {
    console.error('Error generating interview questions:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }
  }
}
