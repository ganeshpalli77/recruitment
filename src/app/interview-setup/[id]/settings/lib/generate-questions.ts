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

    // 3. Calculate number of BASE questions based on duration
    // NOTE: Actual total will be 3x this amount (easy, medium, difficult variations)
    const duration = interviewSetup.duration
    let baseQuestions = 0
    
    switch (duration) {
      case 10:
        baseQuestions = 3  // Total: 9 questions (3 × 3)
        break
      case 20:
        baseQuestions = 7  // Total: 21 questions (7 × 3)
        break
      case 30:
        baseQuestions = 10 // Total: 30 questions (10 × 3)
        break
      case 45:
        baseQuestions = 15 // Total: 45 questions (15 × 3)
        break
      case 60:
        baseQuestions = 20 // Total: 60 questions (20 × 3)
        break
      default:
        baseQuestions = 10 // default to 30 min
    }
    
    const totalQuestions = baseQuestions * 3 // Total questions with all difficulty variations

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

    // 6. Call backend API to generate MULTI-LEVEL questions using Azure OpenAI
    // This generates 3 difficulty variations (easy, medium, difficult) for each base question
    const backendResponse = await fetch('http://localhost:8000/api/generate-multi-level-questions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        candidate_id: candidateId,
        candidate_name: candidateName,
        job_posting_id: jobId,
        job_title: jobPosting.title,
        job_description: jobPosting.description,
        job_requirements: jobPosting.requirements || '',
        skills_required: jobPosting.skills_required || [],
        // ai_analysis is JSONB in database, convert to string for backend
        ai_analysis: jobPosting.ai_analysis 
          ? (typeof jobPosting.ai_analysis === 'string' 
              ? jobPosting.ai_analysis 
              : JSON.stringify(jobPosting.ai_analysis))
          : '',
        duration_minutes: duration,
        screening_percentage: screeningPercentage,
        technical_percentage: technicalPercentage,
        hr_percentage: hrPercentage
      })
    })

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json()
      
      // Handle Pydantic validation errors (array of objects)
      let errorMessage = 'Failed to generate questions from AI service'
      
      if (errorData.detail) {
        if (Array.isArray(errorData.detail)) {
          // Pydantic validation errors
          errorMessage = errorData.detail
            .map((err: any) => `${err.loc?.join('.') || 'field'}: ${err.msg}`)
            .join(', ')
        } else if (typeof errorData.detail === 'string') {
          errorMessage = errorData.detail
        } else {
          errorMessage = JSON.stringify(errorData.detail)
        }
      }
      
      return { 
        success: false, 
        error: errorMessage
      }
    }

    const generatedQuestions = await backendResponse.json()

    // 7. Questions are automatically saved to 'interview_questions_multi_level' table by the backend
    // The response contains all the multi-level questions with difficulty variations
    
    console.log(`✅ Generated ${generatedQuestions.total_questions} questions (${generatedQuestions.base_questions_count} base × 3 difficulty levels)`)

    return {
      success: true,
      data: {
        candidateId: generatedQuestions.candidate_id,
        baseQuestions: generatedQuestions.base_questions_count,
        totalQuestions: generatedQuestions.total_questions,
        distribution: {
          screening: generatedQuestions.screening_questions?.length || 0,
          technical: generatedQuestions.technical_questions?.length || 0,
          hr: generatedQuestions.hr_questions?.length || 0
        },
        greeting: generatedQuestions.greeting_message,
        model: generatedQuestions.model,
        generationTime: generatedQuestions.generation_time_ms
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
