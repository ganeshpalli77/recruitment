import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { AIEvaluationTable } from "./components/ai-evaluation-table"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

export default async function AIEvaluationPage() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  // Fetch all job postings with interview results count
  const { data: jobPostings, error } = await supabase
    .from('job_postings')
    .select(`
      id,
      title,
      description,
      experience_required,
      status,
      created_at,
      interview_results (count)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching job postings:', error)
  }

  const jobPostingsData = jobPostings || []

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
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  AI Evaluation
                </h1>
                <p className="text-gray-600 dark:text-gray-300 mt-2">
                  Review AI-analyzed interview results for each job posting.
                </p>
              </div>

              {/* AI Evaluation Table */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    All Job Postings ({jobPostingsData.length})
                  </h2>
                </div>
                
                {jobPostingsData.length > 0 ? (
                  <AIEvaluationTable data={jobPostingsData} />
                ) : (
                  <div className="border rounded-lg p-12 text-center">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      No job postings yet
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      Create job postings and conduct interviews to see AI evaluation results here.
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
