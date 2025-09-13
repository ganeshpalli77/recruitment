import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { JobPostingForm } from "@/components/job-posting-form"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { IconArrowLeft } from "@tabler/icons-react"
import Link from "next/link"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Suspense } from 'react'

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

async function AlertMessages({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const params = await searchParams
  const error = params.error as string | undefined

  return (
    <>
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{decodeURIComponent(error)}</AlertDescription>
        </Alert>
      )}
    </>
  )
}

export default async function CreateJobPostingPage({ searchParams }: PageProps) {
  const supabase = await createClient()

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
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
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950">
              <div className="flex flex-col gap-6 py-8 px-4 lg:px-8">
                {/* Navigation Header */}
                <div className="flex items-center gap-4 mb-4">
                  <Button variant="outline" size="sm" asChild className="shadow-sm">
                    <Link href="/job-postings">
                      <IconArrowLeft className="h-4 w-4 mr-2" />
                      Back to Job Postings
                    </Link>
                  </Button>
                </div>

                <Suspense fallback={<div></div>}>
                  <AlertMessages searchParams={searchParams} />
                </Suspense>

                {/* Centered Job Posting Form */}
                <div className="max-w-4xl mx-auto w-full">
                  <JobPostingForm />
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
