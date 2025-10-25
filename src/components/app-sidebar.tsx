"use client"

import * as React from "react"
import {
  IconBrain,
  IconCamera,
  IconChartBar,
  IconDashboard,
  IconDatabase,
  IconFileAi,
  IconFileDescription,
  IconFileWord,
  IconFolder,
  IconHelp,
  IconInnerShadowTop,
  IconListDetails,
  IconReport,
  IconSearch,
  IconSettings,
  IconUsers,
} from "@tabler/icons-react"

import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const data = {
  user: {
    name: "Recruiter",
    email: "recruiter@company.com", 
    avatar: "", // Remove broken avatar to prevent 404s
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconDashboard,
    },
    {
      title: "Job Postings",
      url: "/job-postings",
      icon: IconFileDescription,
    },
    {
      title: "Candidates",
      url: "/candidates",
      icon: IconUsers,
    },
    {
      title: "Interview Setup",
      url: "/interview-setup",
      icon: IconChartBar,
    },
    {
      title: "AI Evaluation",
      url: "/ai-evaluation",
      icon: IconBrain,
    },
  ],
  navClouds: [
    {
      title: "Resume Processing",
      icon: IconCamera,
      isActive: true,
      url: "#",
      items: [
        {
          title: "Upload Resumes",
          url: "#",
        },
        {
          title: "Processing Queue",
          url: "#",
        },
        {
          title: "Parsed Resumes",
          url: "#",
        },
      ],
    },
    {
      title: "Candidate Evaluation",
      icon: IconFileAi,
      url: "#",
      items: [
        {
          title: "AI Scoring",
          url: "#",
        },
        {
          title: "Shortlisted",
          url: "#",
        },
        {
          title: "Rejected",
          url: "#",
        },
      ],
    },
    {
      title: "Reports",
      icon: IconReport,
      url: "#",
      items: [
        {
          title: "Evaluation Reports",
          url: "#",
        },
        {
          title: "Bias Analysis",
          url: "#",
        },
        {
          title: "Performance Metrics",
          url: "#",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "#",
      icon: IconSettings,
    },
    {
      title: "Help & Support",
      url: "#",
      icon: IconHelp,
    },
    {
      title: "Search Candidates",
      url: "#",
      icon: IconSearch,
    },
  ],
  documents: [
    {
      name: "Resume Database",
      url: "#",
      icon: IconDatabase,
    },
    {
      name: "Evaluation Reports",
      url: "#",
      icon: IconReport,
    },
    {
      name: "Job Templates",
      url: "#",
      icon: IconFileWord,
    },
  ],
}

export function AppSidebar({ 
  user,
  ...props 
}: React.ComponentProps<typeof Sidebar> & {
  user?: {
    name?: string
    email: string
    avatar?: string
  }
}) {
  // Use real user data or fallback to default
  const userData = user ? {
    name: user.name || user.email?.split('@')[0] || 'User',
    email: user.email,
    avatar: user.avatar || '',
  } : data.user

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="#">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">Utilitarian Labs</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavDocuments items={data.documents} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  )
}