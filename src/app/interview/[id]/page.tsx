import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { InterviewScreen } from './components/interview-screen'
import { ElevenLabsProvider } from './components/elevenlabs-provider'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function InterviewPage({ params }: PageProps) {
  const { id } = await params // id is the candidate_id
  const supabase = await createClient()

  // Fetch multi-level interview questions for this candidate (get latest one)
  const { data: interviewDataList, error } = await supabase
    .from('interview_questions_multi_level')
    .select(`
      *,
      job_postings (
        title,
        description
      )
    `)
    .eq('candidate_id', id)
    .order('created_at', { ascending: false })
    .limit(1)

  if (error || !interviewDataList || interviewDataList.length === 0) {
    console.error('Error fetching interview questions:', error)
    redirect('/interview-setup')
  }

  const interviewData = interviewDataList[0]

  // Transform multi-level questions to flat arrays (using medium difficulty by default)
  const flattenQuestions = (questionGroups: any) => {
    // Parse if it's a string (JSONB from database)
    let parsedGroups = questionGroups
    if (typeof questionGroups === 'string') {
      try {
        parsedGroups = JSON.parse(questionGroups)
      } catch (e) {
        console.error('Failed to parse question groups:', e)
        return []
      }
    }

    // Ensure it's an array
    if (!Array.isArray(parsedGroups)) {
      console.error('Question groups is not an array:', parsedGroups)
      return []
    }

    return parsedGroups.map((group: any) => {
      // Find medium difficulty variation, fallback to first variation
      const mediumVariation = group.variations?.find((v: any) => v.difficulty === 'medium')
      const variation = mediumVariation || group.variations?.[0]
      return variation?.question || group.base_question || ''
    }).filter(q => q) // Remove empty questions
  }

  const screeningQuestions = flattenQuestions(interviewData.screening_questions)
  const technicalQuestions = flattenQuestions(interviewData.technical_questions)
  const hrQuestions = flattenQuestions(interviewData.hr_questions)

  return (
    <ElevenLabsProvider>
      <InterviewScreen 
        candidateId={interviewData.candidate_id}
        candidateName={interviewData.candidate_name}
        jobPostingId={interviewData.job_posting_id}
        duration={interviewData.interview_duration}
        greetingMessage={interviewData.greeting_message}
        screeningQuestions={screeningQuestions}
        technicalQuestions={technicalQuestions}
        hrQuestions={hrQuestions}
        jobTitle={interviewData.job_postings?.title || 'Position'}
      />
    </ElevenLabsProvider>
  )
}
