import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { InterviewResultsView } from "./components/interview-results-view"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function InterviewResultsPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  // Fetch job posting details
  const { data: jobPosting, error: jobError } = await supabase
    .from('job_postings')
    .select('id, title, description, experience_required, status')
    .eq('id', id)
    .single()

  if (jobError || !jobPosting) {
    redirect('/ai-evaluation')
  }

  // Fetch all interview results for this job with candidate details
  const { data: interviewResults, error: resultsError } = await supabase
    .from('interview_results')
    .select(`
      id,
      candidate_id,
      candidate_name,
      overall_score,
      average_score,
      total_questions,
      recommendation,
      confidence_level,
      communication_quality,
      summary,
      strengths,
      key_strengths,
      areas_for_improvement,
      key_weaknesses,
      question_analyses,
      analyzed_at,
      created_at
    `)
    .eq('job_posting_id', id)
    .order('overall_score', { ascending: false })

  if (resultsError) {
    console.error('Error fetching interview results:', resultsError)
  }

  const resultsData = interviewResults || []

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar 
        variant="inset" 
        user={{
          name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          email: user.email || '',
          avatar: user.user_metadata?.avatar_url || ''
        }}
      />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <InterviewResultsView 
              jobPosting={jobPosting}
              results={resultsData}
            />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
