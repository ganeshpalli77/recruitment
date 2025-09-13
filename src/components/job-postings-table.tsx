"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconDotsVertical,
  IconEdit,
  IconTrash,
  IconEye,
  IconClock,
  IconCheck,
  IconX,
  IconPlayerPause,
  IconBrain,
  IconStar,
  IconMapPin,
  IconBriefcase,
  IconTags,
  IconFileText,
  IconClipboardList,
} from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

import { updateJobPostingStatus, deleteJobPosting } from '@/app/job-postings/actions'

export type JobPosting = {
  id: string
  title: string
  description: string
  requirements: string
  experience_required: number
  skills_required: string[]
  status: 'draft' | 'active' | 'closed' | 'paused'
  created_at: string
  updated_at: string
  // AI Analysis field (consolidated)
  ai_analysis?: {
    key_skills: string[]
    required_experience?: string
    education_requirements: string[]
    responsibilities: string[]
    qualifications: string[]
    nice_to_have: string[]
    job_level?: string
    remote_work?: boolean
    salary_range?: string
    company_benefits: string[]
    industry?: string
    job_summary: string
    difficulty_score: number
    confidence_score: number
    analysis_date: string
  } | null
}

interface JobPostingsTableProps {
  data: JobPosting[]
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'active':
      return <IconCheck className="h-4 w-4" />
    case 'paused':
      return <IconPlayerPause className="h-4 w-4" />
    case 'closed':
      return <IconX className="h-4 w-4" />
    case 'draft':
      return <IconClock className="h-4 w-4" />
    default:
      return <IconClock className="h-4 w-4" />
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
    case 'paused':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
    case 'closed':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    case 'draft':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
  }
}

export function JobPostingsTable({ data }: JobPostingsTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})

  const columns: ColumnDef<JobPosting>[] = React.useMemo(
    () => [
      {
        accessorKey: "title",
        header: "Job Title",
        cell: ({ row }) => (
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="link" className="h-auto p-0 text-left font-medium">
                {row.getValue("title")}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden p-0 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-blue-950 dark:to-indigo-950">
              <div className="overflow-y-auto max-h-[95vh]">
                <DialogHeader className="sticky top-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700 p-6 z-10">
                  <DialogTitle className="text-2xl font-bold flex items-center gap-3 text-gray-900 dark:text-white">
                    <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl">
                      <IconBriefcase className="h-6 w-6 text-white" />
                    </div>
                    {row.getValue("title")}
                  </DialogTitle>
                  <DialogDescription className="flex flex-wrap items-center gap-6 text-base mt-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                      <IconClock className="h-4 w-4 text-blue-600" />
                      <span className="text-blue-800 dark:text-blue-200 font-medium">
                        {row.original.experience_required} years experience
                      </span>
                    </div>
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
                      row.original.status === 'active' 
                        ? 'bg-green-100 dark:bg-green-900/30' 
                        : 'bg-gray-100 dark:bg-gray-800'
                    }`}>
                      <IconCheck className={`h-4 w-4 ${
                        row.original.status === 'active' ? 'text-green-600' : 'text-gray-500'
                      }`} />
                      <span className={`font-medium capitalize ${
                        row.original.status === 'active' 
                          ? 'text-green-800 dark:text-green-200' 
                          : 'text-gray-600 dark:text-gray-400'
                      }`}>
                        {row.original.status}
                      </span>
                    </div>
                  </DialogDescription>
                </DialogHeader>
                <div className="p-6 space-y-8">
                {/* AI Analysis Section - Show First if Available */}
                {row.original.ai_analysis && (
                  <div className="space-y-6">
                    {/* Header Card */}
                    <div className="relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-indigo-600/10 dark:from-blue-400/10 dark:to-indigo-400/10"></div>
                      <div className="relative p-8">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-4">
                            <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-lg">
                              <IconBrain className="h-8 w-8 text-white" />
                            </div>
                            <div>
                              <h4 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">AI Analysis Results</h4>
                              <p className="text-blue-600 dark:text-blue-400 font-medium flex items-center gap-2">
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                Powered by Azure OpenAI GPT-4o
                              </p>
                            </div>
                          </div>
                          {row.original.ai_analysis.confidence_score && (
                            <div className="text-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 rounded-2xl shadow-lg">
                              <div className="text-3xl font-bold mb-1">
                                {Math.round(row.original.ai_analysis.confidence_score * 100)}%
                              </div>
                              <div className="text-sm opacity-90">confidence</div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* AI Job Summary */}
                    {row.original.ai_analysis.job_summary && (
                      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 p-6 border-b border-amber-200 dark:border-amber-800">
                          <h5 className="text-lg font-bold text-amber-900 dark:text-amber-100 flex items-center gap-2">
                            <span className="text-2xl">✨</span>
                            AI Job Summary
                          </h5>
                        </div>
                        <div className="p-6">
                          <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-base">
                            {row.original.ai_analysis.job_summary}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Key Metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {row.original.ai_analysis.difficulty_score && (
                        <div className="group hover:scale-105 transition-all duration-200">
                          <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-orange-100 dark:border-orange-800 relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 opacity-50"></div>
                            <div className="relative">
                              <div className="text-3xl font-bold text-orange-600 mb-2">
                                {row.original.ai_analysis.difficulty_score}<span className="text-lg">/10</span>
                              </div>
                              <div className="text-sm text-orange-700 dark:text-orange-300 font-semibold">Difficulty</div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {row.original.ai_analysis.job_level && (
                        <div className="group hover:scale-105 transition-all duration-200">
                          <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-purple-100 dark:border-purple-800 relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 opacity-50"></div>
                            <div className="relative">
                              <div className="text-lg font-bold text-purple-600 mb-2 capitalize">
                                {row.original.ai_analysis.job_level}
                              </div>
                              <div className="text-sm text-purple-700 dark:text-purple-300 font-semibold">Level</div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {row.original.ai_analysis.remote_work !== null && (
                        <div className="group hover:scale-105 transition-all duration-200">
                          <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-green-100 dark:border-green-800 relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 opacity-50"></div>
                            <div className="relative">
                              <div className="text-lg font-bold text-green-600 mb-2">
                                {row.original.ai_analysis.remote_work ? 'Yes' : 'No'}
                              </div>
                              <div className="text-sm text-green-700 dark:text-green-300 font-semibold">Remote</div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {row.original.ai_analysis.salary_range && (
                        <div className="group hover:scale-105 transition-all duration-200">
                          <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-emerald-100 dark:border-emerald-800 relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 opacity-50"></div>
                            <div className="relative">
                              <div className="text-sm font-bold text-emerald-600 mb-2 truncate">
                                {row.original.ai_analysis.salary_range}
                              </div>
                              <div className="text-sm text-emerald-700 dark:text-emerald-300 font-semibold">Salary</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* AI-Extracted Skills - Prominently Displayed */}
                    {row.original.ai_analysis.key_skills && row.original.ai_analysis.key_skills.length > 0 && (
                      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 border-b border-blue-200 dark:border-blue-800">
                          <h5 className="text-xl font-bold text-blue-900 dark:text-blue-100 flex items-center gap-3">
                            <span className="p-2 bg-blue-100 dark:bg-blue-800 rounded-xl">
                              <IconTags className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </span>
                            <span className="text-2xl">🔍</span>
                            AI-Extracted Key Skills
                          </h5>
                        </div>
                        <div className="p-6">
                          <div className="flex flex-wrap gap-3">
                            {row.original.ai_analysis.key_skills.map((skill, index) => (
                              <div
                                key={skill}
                                className="group hover:scale-105 transition-all duration-200"
                              >
                                <Badge className="text-sm px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 font-semibold">
                                  <span className="mr-2 text-yellow-300">⭐</span>
                                  {skill}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Key Responsibilities */}
                    {row.original.ai_analysis.responsibilities && row.original.ai_analysis.responsibilities.length > 0 && (
                      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6 border-b border-green-200 dark:border-green-800">
                          <h5 className="text-xl font-bold text-green-900 dark:text-green-100 flex items-center gap-3">
                            <span className="p-2 bg-green-100 dark:bg-green-800 rounded-xl">
                              <IconClipboardList className="h-5 w-5 text-green-600 dark:text-green-400" />
                            </span>
                            <span className="text-2xl">🎯</span>
                            Key Responsibilities
                          </h5>
                        </div>
                        <div className="p-6">
                          <div className="space-y-4">
                            {row.original.ai_analysis.responsibilities.slice(0, 6).map((responsibility, index) => (
                              <div 
                                key={index} 
                                className="flex items-start gap-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
                              >
                                <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                                  {index + 1}
                                </span>
                                <span className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                  {responsibility}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Additional AI Insights */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-6">
                      {row.original.ai_analysis.industry && (
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <IconBriefcase className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">Industry:</span>
                          <span>{row.original.ai_analysis.industry}</span>
                        </div>
                      )}
                      
                      {row.original.ai_analysis.required_experience && (
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <IconClock className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">Experience:</span>
                          <span>{row.original.ai_analysis.required_experience}</span>
                        </div>
                      )}
                    </div>

                    {/* Additional AI Details */}
                    {(row.original.ai_analysis.qualifications && row.original.ai_analysis.qualifications.length > 0) ||
                     (row.original.ai_analysis.education_requirements && row.original.ai_analysis.education_requirements.length > 0) ||
                     (row.original.ai_analysis.nice_to_have && row.original.ai_analysis.nice_to_have.length > 0) ||
                     (row.original.ai_analysis.company_benefits && row.original.ai_analysis.company_benefits.length > 0) ? (
                      <div className="space-y-4">
                        {/* Qualifications */}
                        {row.original.ai_analysis.qualifications && row.original.ai_analysis.qualifications.length > 0 && (
                          <div>
                            <h5 className="font-semibold mb-2 text-blue-900 dark:text-blue-100 flex items-center gap-2">
                              <IconCheck className="h-4 w-4" />
                              🎓 Required Qualifications
                            </h5>
                            <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                              {row.original.ai_analysis.qualifications.slice(0, 5).map((qualification, index) => (
                                <li key={index} className="flex items-start gap-2">
                                  <span className="text-green-500 mt-1">✓</span>
                                  <span>{qualification}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Education Requirements */}
                        {row.original.ai_analysis.education_requirements && row.original.ai_analysis.education_requirements.length > 0 && (
                          <div>
                            <h5 className="font-semibold mb-2 text-blue-900 dark:text-blue-100 flex items-center gap-2">
                              <IconBriefcase className="h-4 w-4" />
                              📚 Education Requirements
                            </h5>
                            <div className="flex flex-wrap gap-2">
                              {row.original.ai_analysis.education_requirements.map((education, index) => (
                                <Badge key={index} className="text-xs bg-purple-100 text-purple-800 border-purple-300">
                                  {education}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Nice to Have */}
                        {row.original.ai_analysis.nice_to_have && row.original.ai_analysis.nice_to_have.length > 0 && (
                          <div>
                            <h5 className="font-semibold mb-2 text-blue-900 dark:text-blue-100 flex items-center gap-2">
                              <IconStar className="h-4 w-4" />
                              💡 Nice to Have
                            </h5>
                            <div className="flex flex-wrap gap-2">
                              {row.original.ai_analysis.nice_to_have.map((skill, index) => (
                                <Badge key={index} variant="outline" className="text-xs border-gray-300">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Company Benefits */}
                        {row.original.ai_analysis.company_benefits && row.original.ai_analysis.company_benefits.length > 0 && (
                          <div>
                            <h5 className="font-semibold mb-2 text-blue-900 dark:text-blue-100 flex items-center gap-2">
                              <IconMapPin className="h-4 w-4" />
                              🎁 What We Offer
                            </h5>
                            <div className="flex flex-wrap gap-2">
                              {row.original.ai_analysis.company_benefits.map((benefit, index) => (
                                <Badge key={index} className="text-xs bg-green-100 text-green-800 border-green-300">
                                  {benefit}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                )}
                
                {/* Show message if no AI analysis is available */}
                {!row.original.ai_analysis && (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="text-center py-16 px-8">
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-32 h-32 bg-gradient-to-r from-blue-200 to-indigo-200 dark:from-blue-800 dark:to-indigo-800 rounded-full opacity-20 animate-pulse"></div>
                        </div>
                        <IconBrain className="relative h-20 w-20 text-blue-400 mx-auto mb-6 animate-pulse" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        AI Analysis in Progress
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 mb-8 text-lg max-w-md mx-auto">
                        Our AI is analyzing this job posting to extract key insights and requirements. This usually takes just a few moments.
                      </p>
                      <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-full border border-blue-200 dark:border-blue-800">
                        <div className="relative">
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-300 border-t-blue-600"></div>
                        </div>
                        <span className="text-blue-700 dark:text-blue-300 font-semibold">
                          Processing with Azure OpenAI GPT-4o
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        ),
      },
      {
        accessorKey: "experience_required",
        header: "Min Experience",
        cell: ({ row }) => (
          <div className="text-center">
            {row.getValue("experience_required")} years
          </div>
        ),
      },
      {
        accessorKey: "ai_analysis_status",
        header: "AI Analysis",
        cell: ({ row }) => {
          const hasAnalysis = row.original.ai_analysis
          const difficultyScore = row.original.ai_analysis?.difficulty_score
          const confidenceScore = row.original.ai_analysis?.confidence_score

          return (
            <div className="text-center">
              {hasAnalysis ? (
                <div className="flex flex-col items-center gap-1">
                  <Badge className="bg-green-100 text-green-800 border-green-300 text-xs">
                    <IconBrain className="h-3 w-3 mr-1" />
                    Analyzed
                  </Badge>
                  {difficultyScore && (
                    <div className="flex items-center gap-1">
                      <IconStar className="h-3 w-3 text-yellow-500" />
                      <span className="text-xs text-gray-600">{difficultyScore}/10</span>
                    </div>
                  )}
                </div>
              ) : (
                <Badge variant="outline" className="text-xs text-gray-500">
                  <IconClock className="h-3 w-3 mr-1" />
                  Pending
                </Badge>
              )}
            </div>
          )
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.getValue("status") as string
          return (
            <Badge 
              className={`capitalize ${getStatusColor(status)}`}
              variant="outline"
            >
              {getStatusIcon(status)}
              {status}
            </Badge>
          )
        },
      },
      {
        accessorKey: "created_at",
        header: "Created",
        cell: ({ row }) => {
          const dateString = row.getValue("created_at") as string
          // Use consistent ISO format to avoid hydration mismatches
          try {
            const date = new Date(dateString)
            const formattedDate = date.toISOString().split('T')[0]
            return (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {formattedDate}
              </div>
            )
          } catch (error) {
            return (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                N/A
              </div>
            )
          }
        },
      },
      {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => {
          const job = row.original

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <IconDotsVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem asChild>
                  <Dialog>
                    <DialogTrigger className="flex w-full items-center">
                      <IconEye className="mr-2 h-4 w-4" />
                      View Details
                    </DialogTrigger>
                  </Dialog>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <IconEdit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                {job.status === 'active' && (
                <DropdownMenuItem asChild>
                  <form action={updateJobPostingStatus}>
                    <input type="hidden" name="id" value={job.id} />
                    <input type="hidden" name="status" value="paused" />
                    <button type="submit" className="flex w-full items-center">
                      <IconPlayerPause className="mr-2 h-4 w-4" />
                      Pause
                    </button>
                  </form>
                </DropdownMenuItem>
                )}
                {job.status === 'paused' && (
                  <DropdownMenuItem asChild>
                    <form action={updateJobPostingStatus}>
                      <input type="hidden" name="id" value={job.id} />
                      <input type="hidden" name="status" value="active" />
                      <button type="submit" className="flex w-full items-center">
                        <IconCheck className="mr-2 h-4 w-4" />
                        Activate
                      </button>
                    </form>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <form action={deleteJobPosting}>
                    <input type="hidden" name="id" value={job.id} />
                    <button type="submit" className="flex w-full items-center text-red-600">
                      <IconTrash className="mr-2 h-4 w-4" />
                      Delete
                    </button>
                  </form>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
      },
    ],
    []
  )

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  })

  return (
    <div className="w-full">
      <div className="flex items-center py-4">
        <Input
          placeholder="Filter jobs..."
          value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("title")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Columns <IconChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                )
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No job postings found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <IconChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <IconChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <IconChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <IconChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
