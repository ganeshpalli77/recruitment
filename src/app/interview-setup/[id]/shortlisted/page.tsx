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
  IconArrowLeft,
  IconUsers,
  IconStar,
  IconTrophy,
  IconCalendar,
  IconCheck,
} from "@tabler/icons-react"
import Link from "next/link"
import { ShortlistedCandidatesTable } from "./components/shortlisted-candidates-table"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ShortlistedCandidatesPage({ params }: PageProps) {
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

  // Fetch shortlisted candidates
  const { data: shortlistedCandidates, error: candidatesError } = await supabase
    .from('interview_selected_students')
    .select('*')
    .eq('job_posting_id', id)
    .order('overall_score', { ascending: false })

  if (candidatesError) {
    console.error('Error fetching shortlisted candidates:', candidatesError)
  }

  const candidates = shortlistedCandidates || []

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

              {/* Page Header */}
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl">
                      <IconStar className="h-6 w-6 text-white" />
                    </div>
                    Shortlisted Candidates
                  </h1>
                  <p className="text-gray-600 dark:text-gray-300">
                    Selected candidates for {jobPosting.title}
                  </p>
                </div>
                <Badge className="bg-green-100 text-green-800 border-green-300 text-lg px-4 py-1">
                  <IconCheck className="h-4 w-4 mr-1" />
                  {candidates.length} Shortlisted
                </Badge>
              </div>

              {/* Shortlisted Candidates Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IconTrophy className="h-5 w-5 text-amber-500" />
                    Interview-Ready Candidates
                  </CardTitle>
                  <CardDescription>
                    These candidates have been shortlisted and are ready for interview scheduling
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {candidates.length > 0 ? (
                    <ShortlistedCandidatesTable 
                      candidates={candidates}
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
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
