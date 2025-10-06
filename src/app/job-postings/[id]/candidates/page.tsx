import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { 
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  IconBriefcase,
  IconClock,
  IconCheck,
  IconUpload,
  IconUsers,
  IconStar,
  IconTrendingUp,
  IconFileText,
  IconBrain,
  IconTags,
  IconClipboardList,
  IconArrowLeft,
  IconTrophy,
  IconSparkles,
} from "@tabler/icons-react"
import Link from "next/link"
import { CandidatesResultsTable } from "./components/candidates-results-table"
import { UploadButton } from "./components/upload-button"
import { FixNamesButton } from "./components/fix-names-button"

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function JobCandidatesPage({ params, searchParams }: PageProps) {
  const { id } = await params
  const searchParams_ = await searchParams
  const supabase = await createClient()

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  // Fetch the job posting details
  const { data: jobPosting, error: jobError } = await supabase
    .from('job_postings')
    .select(`
      id,
      title,
      description,
      requirements,
      experience_required,
      skills_required,
      status,
      created_at,
      ai_analysis
    `)
    .eq('id', id)
    .single()

  if (jobError || !jobPosting) {
    redirect('/job-postings')
  }

  // Fetch evaluated resumes for this job posting (from resume_results table)
  const { data: resumeResults, error: candidatesError } = await supabase
    .from('resume_results')
    .select('*')
    .eq('job_posting_id', id)
    .eq('processing_status', 'completed')
    .order('overall_score', { ascending: false })

  if (candidatesError) {
    console.error('Error fetching candidates:', candidatesError)
  }

  // Fetch shortlisted count
  const { count: shortlistedCount } = await supabase
    .from('interview_selected_students')
    .select('*', { count: 'exact', head: true })
    .eq('job_posting_id', id)

  const candidates = resumeResults?.map(result => ({
    id: result.id,
    evaluationId: result.id,
    name: result.candidate_name || 'Unknown',
    email: result.candidate_email || '',
    phone: result.candidate_phone || '',
    position: 'Candidate',
    status: 'under_review',
    overallScore: result.overall_score || 0,
    skillsScore: result.skills_score || 0,
    experienceScore: result.experience_score || 0,
    educationScore: result.education_score || 0,
    skills_match: `${result.skills_score || 0}%`,
    experience_years: result.experience_details?.years || 0,
    education: result.education_details?.highest_degree || '',
    resume_url: result.resume_file_url || '',
    evaluatedAt: result.evaluated_at || result.created_at || new Date().toISOString(),
    evaluationDetails: {
      evaluation_summary: result.evaluation_summary,
      skills_matched: result.skills_matched || [],
      skills_missing: result.skills_missing || [],
      key_strengths: result.key_strengths || [],
      improvement_areas: result.improvement_areas || [],
      recommendation: result.recommendation,
      processing_time_ms: result.processing_time_ms,
      ai_model: result.ai_model || 'gpt-4.1',
      file_name: result.resume_file_name,
      evaluation_metadata: result.evaluation_metadata || {}
    }
  })) || []

  // Handle alert messages
  const error_msg = searchParams_.error as string | undefined
  const success_msg = searchParams_.success as string | undefined

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
              
              {/* Back Navigation */}
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/job-postings" className="flex items-center gap-2">
                    <IconArrowLeft className="h-4 w-4" />
                    Back to Job Postings
                  </Link>
                </Button>
              </div>

              {/* Page Header */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl">
                      <IconUsers className="h-6 w-6 text-white" />
                    </div>
                    Candidates for {jobPosting.title}
                  </h1>
                  <p className="text-gray-600 dark:text-gray-300">
                    Upload resumes and manage candidates for this position
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {shortlistedCount && shortlistedCount > 0 && (
                    <Button asChild variant="outline" className="border-green-200 bg-green-50 text-green-700 hover:bg-green-100">
                      <Link href={`/interview-setup/${id}/shortlisted`}>
                        <IconCheck className="h-4 w-4 mr-1" />
                        {shortlistedCount} Shortlisted
                      </Link>
                    </Button>
                  )}
                  <UploadButton jobId={id} />
                  {candidates.length > 0 && (
                    <FixNamesButton jobId={id} />
                  )}
                </div>
              </div>

              {/* Alert Messages */}
              {error_msg && (
                <Alert variant="destructive">
                  <AlertDescription>{decodeURIComponent(error_msg)}</AlertDescription>
                </Alert>
              )}
              
              {success_msg && (
                <Alert className="border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400">
                  <AlertDescription>{decodeURIComponent(success_msg)}</AlertDescription>
                </Alert>
              )}


              {/* Main Content */}
              <div className="space-y-6">
                {/* Candidates Results Section */}
                <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <div className="p-2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg">
                          <IconTrophy className="h-4 w-4 text-white" />
                        </div>
                        Candidate Rankings
                        <Badge variant="secondary" className="ml-auto">
                          {candidates.length} candidates
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        AI-ranked candidates based on skills match, experience, and education
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                      {candidates.length > 0 ? (
                        <CandidatesResultsTable 
                          candidates={candidates}
                          jobId={id}
                        />
                      ) : (
                        <div className="text-center py-12 px-6">
                          <div className="mb-6">
                            <IconSparkles className="h-16 w-16 text-gray-400 mx-auto mb-4 animate-pulse" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            No candidates yet
                          </h3>
                          <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-md mx-auto">
                            Upload resumes to get started with AI-powered candidate analysis and ranking for this position.
                          </p>
                          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-full text-blue-700 dark:text-blue-300 text-sm">
                            <IconBrain className="h-4 w-4" />
                            AI analysis ready
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
