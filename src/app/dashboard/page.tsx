import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppSidebar } from "@/components/app-sidebar"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DataTable } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  // Fetch candidates from database with optimized query for better performance
  const { data: candidates, error: candidatesError } = await supabase
    .from('candidates')
    .select(`
      id,
      name,
      email,
      position,
      status,
      ai_score,
      skills_match,
      experience_years,
      education,
      submission_date
    `)
    .order('ai_score', { ascending: false })
    .limit(20) // Limit to 20 for better performance

  if (candidatesError) {
    console.error('Error fetching candidates:', candidatesError)
  }

  // Transform data to match the expected format
  const transformedData = candidates?.map(candidate => ({
    id: parseInt(candidate.id.split('-')[0], 16), // Convert UUID to number for table
    candidateName: candidate.name,
    position: candidate.position,
    status: candidate.status || 'processing',
    aiScore: candidate.ai_score?.toString() || '0',
    skillsMatch: candidate.skills_match || '0%',
    experienceYears: candidate.experience_years?.toString() || '0',
    education: candidate.education || '',
    resume: `resume_${candidate.id.slice(0, 8)}.pdf`,
    submissionDate: candidate.submission_date ? new Date(candidate.submission_date).toISOString().split('T')[0] : '',
    reviewer: 'AI System'
  })) || []

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
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <SectionCards />
              <div className="px-4 lg:px-6">
                <ChartAreaInteractive />
              </div>
              <DataTable data={transformedData} />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}