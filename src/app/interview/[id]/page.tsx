import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { InterviewScreen } from './components/interview-screen'
import { ElevenLabsProvider } from './components/elevenlabs-provider'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function InterviewPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch interview questions for this candidate
  const { data: interviewData, error } = await supabase
    .from('interview_questions')
    .select(`
      *,
      job_postings (
        title,
        description
      )
    `)
    .eq('id', id)
    .single()

  if (error || !interviewData) {
    redirect('/interview-setup')
  }

  return (
    <ElevenLabsProvider>
      <InterviewScreen 
        candidateId={interviewData.candidate_id}
        candidateName={interviewData.candidate_name}
        jobPostingId={interviewData.job_posting_id}
        duration={interviewData.interview_duration}
        greetingMessage={interviewData.greeting_message}
        screeningQuestions={interviewData.screening_questions}
        technicalQuestions={interviewData.technical_questions}
        hrQuestions={interviewData.hr_questions}
        jobTitle={interviewData.job_postings?.title || 'Position'}
      />
    </ElevenLabsProvider>
  )
}
