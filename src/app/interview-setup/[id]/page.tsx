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
} from "@tabler/icons-react"
import Link from "next/link"

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

  // Fetch top-ranked candidates for this job
  const { data: topCandidates, error: candidatesError } = await supabase
    .from('resume_results')
    .select('*')
    .eq('job_posting_id', id)
    .eq('processing_status', 'completed')
    .order('overall_score', { ascending: false })
    .limit(10)

  if (candidatesError) {
    console.error('Error fetching candidates:', candidatesError)
  }

  const candidates = topCandidates?.map(result => ({
    id: result.id,
    name: result.candidate_name || 'Unknown',
    email: result.candidate_email || '',
    phone: result.candidate_phone || '',
    overallScore: result.overall_score || 0,
    skillsScore: result.skills_score || 0,
    experienceScore: result.experience_score || 0,
    educationScore: result.education_score || 0,
    recommendation: result.recommendation,
    skills_matched: result.skills_matched || [],
    experience_details: result.experience_details || {},
  })) || []

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

              {/* Top Candidates Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <IconUsers className="h-5 w-5" />
                    Top Candidates for Interview
                  </h2>
                  <Button asChild variant="outline">
                    <Link href={`/job-postings/${id}/candidates`}>
                      View All Candidates
                    </Link>
                  </Button>
                </div>

                {candidates.length > 0 ? (
                  <div className="grid gap-4">
                    {candidates.map((candidate, index) => (
                      <Card key={candidate.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 space-y-3">
                              {/* Candidate Header */}
                              <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white font-semibold">
                                  #{index + 1}
                                </div>
                                <div className="flex-1">
                                  <h3 className="text-lg font-semibold">{candidate.name}</h3>
                                  <div className="flex items-center gap-4 text-sm text-gray-600">
                                    {candidate.email && (
                                      <span className="flex items-center gap-1">
                                        📧 {candidate.email}
                                      </span>
                                    )}
                                    {candidate.phone && (
                                      <span className="flex items-center gap-1">
                                        <IconPhone className="h-3 w-3" />
                                        {candidate.phone}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Scores */}
                              <div className="grid grid-cols-4 gap-4">
                                <div className="space-y-1">
                                  <div className="text-xs text-gray-500">Overall</div>
                                  <div className="text-2xl font-bold text-purple-600">
                                    {candidate.overallScore}
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <div className="text-xs text-gray-500">Skills</div>
                                  <div className="text-lg font-semibold">
                                    {candidate.skillsScore}
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <div className="text-xs text-gray-500">Experience</div>
                                  <div className="text-lg font-semibold">
                                    {candidate.experienceScore}
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <div className="text-xs text-gray-500">Education</div>
                                  <div className="text-lg font-semibold">
                                    {candidate.educationScore}
                                  </div>
                                </div>
                              </div>

                              {/* Matched Skills */}
                              {candidate.skills_matched && candidate.skills_matched.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {candidate.skills_matched.slice(0, 6).map((skill: string, idx: number) => (
                                    <Badge key={idx} variant="outline" className="text-xs">
                                      ✓ {skill}
                                    </Badge>
                                  ))}
                                  {candidate.skills_matched.length > 6 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{candidate.skills_matched.length - 6}
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col gap-2 ml-4">
                              <Badge className={getRecommendationColor(candidate.recommendation)}>
                                {candidate.recommendation?.replace('_', ' ')}
                              </Badge>
                              <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white whitespace-nowrap">
                                <IconCalendarPlus className="h-4 w-4 mr-1" />
                                Schedule
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <IconUsers className="h-16 w-16 text-gray-400 mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        No candidates yet
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 mb-4 text-center max-w-md">
                        Upload and evaluate resumes to see candidates here.
                      </p>
                      <Button asChild className="bg-green-600 hover:bg-green-700 text-white">
                        <Link href={`/job-postings/${id}/candidates`}>
                          <IconUsers className="h-4 w-4 mr-2" />
                          Go to Candidates
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>

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
                    <Button variant="outline" className="justify-start">
                      <IconCalendarPlus className="h-4 w-4 mr-2" />
                      Schedule Batch Interviews
                    </Button>
                    <Button variant="outline" className="justify-start">
                      <IconVideo className="h-4 w-4 mr-2" />
                      Setup Video Links
                    </Button>
                    <Button variant="outline" className="justify-start">
                      <IconMapPin className="h-4 w-4 mr-2" />
                      Set Interview Location
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

