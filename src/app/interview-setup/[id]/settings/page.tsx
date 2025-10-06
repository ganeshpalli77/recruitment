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
  IconClock,
  IconSettings,
  IconCheck,
  IconDeviceFloppy,
} from "@tabler/icons-react"
import Link from "next/link"
import { InterviewSettingsForm } from "./components/interview-settings-form"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function InterviewSettingsPage({ params }: PageProps) {
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

  // Fetch interview settings from separate table
  let { data: interviewSetup, error: settingsError } = await supabase
    .from('interview_setup')
    .select('*')
    .eq('job_posting_id', id)
    .single()

  // If no settings exist, create default settings
  if (!interviewSetup) {
    const { data: newSettings } = await supabase
      .from('interview_setup')
      .insert({
        job_posting_id: id,
        duration: 30,
        interview_type: 'video',
        rounds: 1,
        notifications_enabled: true
      })
      .select()
      .single()
    
    interviewSetup = newSettings
  }

  // Map database fields to component format
  const currentSettings = {
    duration: interviewSetup?.duration || 30,
    interviewType: interviewSetup?.interview_type || 'video',
    rounds: interviewSetup?.rounds || 1,
    interviewers: interviewSetup?.interviewers || [],
    location: interviewSetup?.location || '',
    meetingLink: interviewSetup?.meeting_link || '',
    notificationsEnabled: interviewSetup?.notifications_enabled !== false,
    timeSlots: interviewSetup?.time_slots || [],
    bufferTime: interviewSetup?.buffer_time || 15
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

              {/* Page Header */}
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl">
                      <IconSettings className="h-6 w-6 text-white" />
                    </div>
                    Interview Settings
                  </h1>
                  <p className="text-gray-600 dark:text-gray-300">
                    Configure interview preferences for this position
                  </p>
                </div>
              </div>


              {/* Settings Form */}
              <InterviewSettingsForm 
                jobId={id}
                currentSettings={currentSettings}
              />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
