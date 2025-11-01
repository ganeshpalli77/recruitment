import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { CandidateEvaluationTable } from "./components/candidate-evaluation-table"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { IconArrowLeft } from "@tabler/icons-react"
import Link from "next/link"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function JobEvaluationDetailPage({ params }: PageProps) {
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
    .order('analyzed_at', { ascending: false })

  if (resultsError) {
    console.error('Error fetching interview results:', resultsError)
  }

  // Fetch interview recordings separately
  const { data: recordings } = await supabase
    .from('interview_recordings')
    .select('candidate_id, video_url, file_path')
    .eq('job_posting_id', id)

  // Merge recordings with results
  const candidatesData = (interviewResults || []).map(result => ({
    ...result,
    interview_recordings: recordings?.filter(r => r.candidate_id === result.candidate_id) || []
  }))

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
            <div className="flex flex-col gap-6 py-6 px-4 lg:px-6">
              {/* Back Button */}
              <div>
                <Button variant="ghost" asChild className="mb-4">
                  <Link href="/ai-evaluation">
                    <IconArrowLeft className="h-4 w-4 mr-2" />
                    Back to AI Evaluation
                  </Link>
                </Button>
              </div>

              {/* Header */}
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {jobPosting.title}
                </h1>
                <p className="text-gray-600 dark:text-gray-300 mt-2">
                  AI evaluation results for interviewed candidates
                </p>
                <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                  <span>Experience Required: {jobPosting.experience_required} years</span>
                  <span>•</span>
                  <span className="capitalize">Status: {jobPosting.status}</span>
                </div>
              </div>

              {/* Candidates Table */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Interview Results ({candidatesData.length})
                  </h2>
                </div>
                
                {candidatesData.length > 0 ? (
                  <CandidateEvaluationTable data={candidatesData} jobId={id} />
                ) : (
                  <div className="border rounded-lg p-12 text-center">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      No interviews yet
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      No candidates have completed interviews for this position yet.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
