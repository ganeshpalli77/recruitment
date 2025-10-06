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
import {
  IconArrowLeft,
  IconBriefcase,
  IconCalendar,
  IconClock,
  IconUsers,
  IconStar,
  IconTags,
  IconCalendarPlus,
  IconVideo,
  IconPhone,
  IconMapPin,
  IconSparkles,
  IconCheck,
} from "@tabler/icons-react"
import Link from "next/link"
import { ShortlistedTable } from "./components/shortlisted-table"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function InterviewSetupJobPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  // Fetch the job posting details
  const { data: jobPosting, error: jobError } = await supabase
    .from('job_postings')
    .select('*')
    .eq('id', id)
    .single()

  if (jobError || !jobPosting) {
    redirect('/interview-setup')
  }

  // Fetch shortlisted candidates for this job
  const { data: shortlistedCandidates, error: candidatesError } = await supabase
    .from('interview_selected_students')
    .select('*')
    .eq('job_posting_id', id)
    .order('overall_score', { ascending: false })

  if (candidatesError) {
    console.error('Error fetching shortlisted candidates:', candidatesError)
  }

  const candidates = shortlistedCandidates || []

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'STRONG_MATCH':
        return 'bg-green-100 text-green-800 border-green-300'
      case 'GOOD_MATCH':
        return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'FAIR_MATCH':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'NO_MATCH':
        return 'bg-red-100 text-red-800 border-red-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

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
                  <Link href="/interview-setup" className="flex items-center gap-2">
                    <IconArrowLeft className="h-4 w-4" />
                    Back to Interview Setup
                  </Link>
                </Button>
              </div>

              {/* Job Details Card */}
              <Card className="border-2">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <CardTitle className="text-2xl flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl">
                          <IconBriefcase className="h-5 w-5 text-white" />
                        </div>
                        {jobPosting.title}
                      </CardTitle>
                      <CardDescription className="text-base">
                        {jobPosting.description}
                      </CardDescription>
                    </div>
                    <Badge className="bg-green-100 text-green-800 border-green-300 capitalize">
                      {jobPosting.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Job Info */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex items-center gap-2">
                      <IconClock className="h-4 w-4 text-gray-500" />
                      <div>
                        <div className="text-sm font-medium">{jobPosting.experience_required}+ years</div>
                        <div className="text-xs text-gray-500">Experience</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <IconUsers className="h-4 w-4 text-gray-500" />
                      <div>
                        <div className="text-sm font-medium">{candidates.length} candidates</div>
                        <div className="text-xs text-gray-500">Evaluated</div>
                      </div>
                    </div>
                    {jobPosting.ai_analysis?.difficulty_score && (
                      <div className="flex items-center gap-2">
                        <IconStar className="h-4 w-4 text-yellow-500" />
                        <div>
                          <div className="text-sm font-medium">{jobPosting.ai_analysis.difficulty_score}/10</div>
                          <div className="text-xs text-gray-500">Difficulty</div>
                        </div>
                      </div>
                    )}
                    {jobPosting.ai_analysis?.job_level && (
                      <div className="flex items-center gap-2">
                        <IconSparkles className="h-4 w-4 text-purple-500" />
                        <div>
                          <div className="text-sm font-medium capitalize">{jobPosting.ai_analysis.job_level}</div>
                          <div className="text-xs text-gray-500">Level</div>
                        </div>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Required Skills */}
                  {jobPosting.skills_required && jobPosting.skills_required.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <IconTags className="h-4 w-4" />
                        Required Skills
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {jobPosting.skills_required.map((skill: string, index: number) => (
                          <Badge key={index} variant="secondary">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Shortlisted Candidates Section */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg">
                          <IconStar className="h-4 w-4 text-white" />
                        </div>
                        Shortlisted Candidates
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Candidates selected for interview scheduling
                      </CardDescription>
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-300">
                      <IconCheck className="h-3 w-3 mr-1" />
                      {candidates.length} shortlisted
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {candidates.length > 0 ? (
                    <ShortlistedTable 
                      data={candidates}
                      jobId={id}
                    />
                  ) : (
                    <div className="text-center py-12 px-6">
                      <IconUsers className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        No shortlisted candidates yet
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-md mx-auto">
                        Go to the candidates page and click "Shortlist" on candidates you want to interview.
                      </p>
                      <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
                        <Link href={`/job-postings/${id}/candidates`}>
                          <IconUsers className="h-4 w-4 mr-2" />
                          View All Candidates
                        </Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200">
                <CardHeader>
                  <CardTitle className="text-lg">Quick Interview Actions</CardTitle>
                  <CardDescription>
                    Common actions for scheduling and managing interviews
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 md:grid-cols-3">
                    <Button asChild variant="outline" className="justify-start">
                      <Link href={`/interview-setup/${id}/shortlisted`}>
                        <IconStar className="h-4 w-4 mr-2" />
                        View Shortlisted
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="justify-start">
                      <Link href={`/interview-setup/${id}/settings`}>
                        <IconCalendarPlus className="h-4 w-4 mr-2" />
                        Interview Settings
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="justify-start">
                      <Link href={`/job-postings/${id}/candidates`}>
                        <IconUsers className="h-4 w-4 mr-2" />
                        All Candidates
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

