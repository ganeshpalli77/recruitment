import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { CandidatesJobPostingsTable } from "@/components/candidates-job-postings-table"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { IconPlus, IconBriefcase, IconUsers } from "@tabler/icons-react"
import Link from "next/link"
import { Suspense } from 'react'

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

async function AlertMessages({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const params = await searchParams
  const error = params.error as string | undefined
  const success = params.success as string | undefined

  return (
    <>
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{decodeURIComponent(error)}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="mb-6 border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400">
          <AlertDescription>{decodeURIComponent(success)}</AlertDescription>
        </Alert>
      )}
    </>
  )
}

export default async function CandidatesPage({ searchParams }: PageProps) {
  const supabase = await createClient()

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  // Fetch job postings from database including AI analysis
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

  const jobPostingsData = jobPostings || []

  // Also fetch candidates count for display
  const { count: candidatesCount } = await supabase
    .from('candidates')
    .select('*', { count: 'exact', head: true })

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
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl">
                      <IconUsers className="h-8 w-8 text-white" />
                    </div>
                    Candidates
                  </h1>
                  <p className="text-gray-600 dark:text-gray-300 mt-2">
                    View available job postings and manage candidate applications. {candidatesCount ? `${candidatesCount} candidates in system.` : ''}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button asChild variant="outline">
                    <Link href="/job-postings">
                      <IconBriefcase className="h-4 w-4 mr-2" />
                      Manage Jobs
                    </Link>
                  </Button>
                  <Button asChild className="bg-purple-600 hover:bg-purple-700 text-white">
                    <Link href="/job-postings/create">
                      <IconPlus className="h-4 w-4 mr-2" />
                      Create Job
                    </Link>
                  </Button>
                </div>
              </div>

              <Suspense fallback={<div></div>}>
                <AlertMessages searchParams={searchParams} />
              </Suspense>

              {/* Job Postings for Candidates */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Available Job Openings ({jobPostingsData.length})
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">
                      Browse and review job postings available for candidate applications
                    </p>
                  </div>
                </div>
                
                {jobPostingsData.length > 0 ? (
                  <CandidatesJobPostingsTable data={jobPostingsData} />
                ) : (
                  <div className="border rounded-lg p-12 text-center bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 border-purple-200 dark:border-purple-800">
                    <div className="mx-auto mb-4 p-4 bg-purple-100 dark:bg-purple-800 rounded-full w-fit">
                      <IconBriefcase className="h-12 w-12 text-purple-600 dark:text-purple-300" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      No job postings available
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      Create job postings to start accepting candidate applications.
                    </p>
                    <Button asChild className="bg-purple-600 hover:bg-purple-700 text-white">
                      <Link href="/job-postings/create">
                        <IconPlus className="h-4 w-4 mr-2" />
                        Create Your First Job
                      </Link>
                    </Button>
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
