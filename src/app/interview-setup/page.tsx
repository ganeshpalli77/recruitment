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
import {
  IconCalendar,
  IconClock,
  IconUsers,
  IconBriefcase,
  IconStar,
  IconSettings,
  IconVideo,
  IconCalendarPlus,
  IconCheckbox,
  IconArrowRight,
} from "@tabler/icons-react"
import Link from "next/link"
import { InterviewSetupTable } from "@/components/interview-setup-table"

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function InterviewSetupPage({ searchParams }: PageProps) {
  const supabase = await createClient()

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  // Fetch all job postings from Supabase
  const { data: jobPostings, error: jobPostingsError } = await supabase
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
      updated_at,
      ai_analysis
    `)
    .order('created_at', { ascending: false })

  if (jobPostingsError) {
    console.error('Error fetching job postings:', jobPostingsError)
  }

  // Get candidate counts for each job
  const jobPostingsWithCandidates = await Promise.all(
    (jobPostings || []).map(async (job) => {
      const { count } = await supabase
        .from('resume_results')
        .select('*', { count: 'exact', head: true })
        .eq('job_posting_id', job.id)
        .eq('processing_status', 'completed')

      return {
        ...job,
        candidateCount: count || 0
      }
    })
  )


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
              
              {/* Page Header */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl">
                      <IconCalendar className="h-6 w-6 text-white" />
                    </div>
                    Interview Setup
                  </h1>
                  <p className="text-gray-600 dark:text-gray-300">
                    Schedule and manage interviews for your job postings
                  </p>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Job Postings
                    </CardTitle>
                    <IconBriefcase className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{jobPostingsWithCandidates.length}</div>
                    <p className="text-xs text-muted-foreground">
                      Active recruitment positions
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Candidates
                    </CardTitle>
                    <IconUsers className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {jobPostingsWithCandidates.reduce((acc, job) => acc + job.candidateCount, 0)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Evaluated candidates across all jobs
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Active Postings
                    </CardTitle>
                    <IconCheckbox className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {jobPostingsWithCandidates.filter(job => job.status === 'active').length}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Ready for interviews
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Job Postings Table */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    All Job Postings ({jobPostingsWithCandidates.length})
                  </h2>
                </div>

                {jobPostingsWithCandidates.length > 0 ? (
                  <InterviewSetupTable data={jobPostingsWithCandidates} />
                ) : (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <IconBriefcase className="h-16 w-16 text-gray-400 mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        No job postings yet
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 mb-4 text-center max-w-md">
                        Create your first job posting to start scheduling interviews with candidates.
                      </p>
                      <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
                        <Link href="/job-postings/create">
                          <IconBriefcase className="h-4 w-4 mr-2" />
                          Create Job Posting
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
