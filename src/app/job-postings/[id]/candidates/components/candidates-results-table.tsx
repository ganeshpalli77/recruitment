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
  IconMail,
  IconPhone,
  IconTrophy,
  IconStar,
  IconBrain,
  IconBriefcase,
  IconUser,
  IconEye,
  IconDownload,
  IconCircleCheckFilled,
  IconClock,
  IconTrendingUp,
  IconTrendingDown,
  IconMinus,
  IconTags,
  IconCheck,
  IconX,
} from "@tabler/icons-react"
import { toast } from "sonner"
import { shortlistCandidate, removeShortlist } from '../lib/actions'
import { useRouter } from 'next/navigation'

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
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"

interface CandidateData {
  evaluationId: string
  id: string
  name: string
  email: string
  phone?: string | null
  position: string
  status: string
  ai_score?: number | null
  overallScore: number
  skillsScore: number
  experienceScore: number
  educationScore: number
  skills_match?: string | null
  experience_years?: number | null
  education?: string | null
  resume_url?: string | null
  submission_date?: string | null
  evaluationDetails?: any
  evaluatedAt: string
}

interface CandidatesResultsTableProps {
  candidates: CandidateData[]
  jobId: string
}

const getRankIcon = (rank: number) => {
  if (rank === 1) return <IconTrophy className="h-4 w-4 text-yellow-500" />
  if (rank === 2) return <IconTrophy className="h-4 w-4 text-gray-400" />
  if (rank === 3) return <IconTrophy className="h-4 w-4 text-amber-600" />
  return <span className="text-sm font-semibold text-gray-500">#{rank}</span>
}

const getScoreColor = (score: number) => {
  if (score >= 90) return 'text-green-600 bg-green-50 border-green-200'
  if (score >= 80) return 'text-blue-600 bg-blue-50 border-blue-200'
  if (score >= 70) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
  if (score >= 60) return 'text-orange-600 bg-orange-50 border-orange-200'
  return 'text-red-600 bg-red-50 border-red-200'
}

const getScoreTrend = (score: number) => {
  if (score >= 80) return <IconTrendingUp className="h-3 w-3 text-green-500" />
  if (score >= 60) return <IconMinus className="h-3 w-3 text-yellow-500" />
  return <IconTrendingDown className="h-3 w-3 text-red-500" />
}

const getStatusIcon = (status: string) => {
  switch (status.toLowerCase()) {
    case 'shortlisted':
      return <IconCircleCheckFilled className="h-4 w-4 text-green-500" />
    case 'under_review':
    case 'under review':
      return <IconClock className="h-4 w-4 text-yellow-500" />
    case 'processing':
      return <IconBrain className="h-4 w-4 text-blue-500 animate-pulse" />
    default:
      return <IconUser className="h-4 w-4 text-gray-500" />
  }
}

export function CandidatesResultsTable({ candidates, jobId }: CandidatesResultsTableProps) {
  const router = useRouter()
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: 'overallScore', desc: true } // Default sort by overall score descending
  ])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [shortlistedIds, setShortlistedIds] = React.useState<Set<string>>(new Set())
  const [processingIds, setProcessingIds] = React.useState<Set<string>>(new Set())

  // Fetch shortlisted candidates
  React.useEffect(() => {
    const fetchShortlisted = async () => {
      try {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        
        const { data } = await supabase
          .from('interview_selected_students')
          .select('resume_result_id')
          .eq('job_posting_id', jobId)
        
        if (data) {
          setShortlistedIds(new Set(data.map(item => item.resume_result_id)))
        }
      } catch (error) {
        console.error('Error fetching shortlisted candidates:', error)
      }
    }
    
    fetchShortlisted()
  }, [jobId])

  const handleShortlist = async (candidate: CandidateData) => {
    const resumeResultId = candidate.evaluationId
    setProcessingIds(prev => new Set(prev).add(resumeResultId))

    try {
      const result = await shortlistCandidate(jobId, resumeResultId, {
        name: candidate.name,
        email: candidate.email,
        phone: candidate.phone,
        overallScore: candidate.overallScore,
        skillsScore: candidate.skillsScore,
        experienceScore: candidate.experienceScore,
        educationScore: candidate.educationScore,
        recommendation: candidate.evaluationDetails?.recommendation || null
      })

      if (result.success) {
        setShortlistedIds(prev => new Set(prev).add(resumeResultId))
        toast.success(`${candidate.name} shortlisted for interview!`)
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to shortlist candidate')
      }
    } catch (error) {
      toast.error('An error occurred')
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(resumeResultId)
        return newSet
      })
    }
  }

  const handleRemoveShortlist = async (candidate: CandidateData) => {
    const resumeResultId = candidate.evaluationId
    setProcessingIds(prev => new Set(prev).add(resumeResultId))

    try {
      const result = await removeShortlist(jobId, resumeResultId)

      if (result.success) {
        setShortlistedIds(prev => {
          const newSet = new Set(prev)
          newSet.delete(resumeResultId)
          return newSet
        })
        toast.success(`${candidate.name} removed from shortlist`)
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to remove from shortlist')
      }
    } catch (error) {
      toast.error('An error occurred')
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(resumeResultId)
        return newSet
      })
    }
  }

  // Add rank based on sort order
  const rankedCandidates = React.useMemo(() => {
    return candidates.map((candidate, index) => ({
      ...candidate,
      rank: index + 1
    }))
  }, [candidates])

  const columns: ColumnDef<CandidateData & { rank: number }>[] = React.useMemo(
    () => [
      {
        accessorKey: "rank",
        header: "Rank",
        cell: ({ row }) => (
          <div className="flex items-center justify-center w-12">
            {getRankIcon(row.getValue("rank"))}
          </div>
        ),
        enableSorting: false,
      },
      {
        accessorKey: "name",
        header: "Candidate",
        cell: ({ row }) => (
          <Drawer>
            <DrawerTrigger asChild>
              <Button 
                variant="link" 
                className="h-auto p-0 text-left font-medium justify-start"
              >
                <div className="flex flex-col items-start">
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {row.getValue("name")}
                  </span>
                  <span className="text-xs text-gray-500 font-normal">
                    {row.original.email}
                  </span>
                </div>
              </Button>
            </DrawerTrigger>
            <DrawerContent className="max-w-4xl mx-auto max-h-[85vh] sm:max-h-[90vh] flex flex-col overflow-hidden">
              <DrawerHeader className="flex-shrink-0">
                <DrawerTitle className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg">
                    <IconUser className="h-5 w-5 text-white" />
                  </div>
                  {row.original.name}
                  <Badge className={`ml-auto ${getScoreColor(row.original.overallScore)}`}>
                    {row.original.overallScore}% Match
                  </Badge>
                </DrawerTitle>
                <DrawerDescription>
                  Detailed candidate analysis and AI evaluation results
                </DrawerDescription>
              </DrawerHeader>
              
              <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 space-y-6">
                {/* Contact Information */}
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <IconUser className="h-4 w-4" />
                      Contact Information
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <IconMail className="h-4 w-4 text-gray-500" />
                        <span>{row.original.email}</span>
                      </div>
                      {row.original.phone && (
                        <div className="flex items-center gap-2">
                          <IconPhone className="h-4 w-4 text-gray-500" />
                          <span>{row.original.phone}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <IconBriefcase className="h-4 w-4 text-gray-500" />
                        <span>{row.original.position}</span>
                      </div>
                      {row.original.experience_years && (
                        <div className="flex items-center gap-2">
                          <IconClock className="h-4 w-4 text-gray-500" />
                          <span>{row.original.experience_years} years experience</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* AI Scores Breakdown */}
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-4 flex items-center gap-2">
                      <IconBrain className="h-4 w-4" />
                      AI Analysis Breakdown
                    </h4>
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Overall Score</span>
                          <div className="flex items-center gap-2">
                            {getScoreTrend(row.original.overallScore)}
                            <span className="font-semibold">{row.original.overallScore}%</span>
                          </div>
                        </div>
                        <Progress value={row.original.overallScore} className="h-3" />
                      </div>
                      
                      <Separator />
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm">Skills Match</span>
                            <span className="text-sm font-semibold">{row.original.skillsScore}%</span>
                          </div>
                          <Progress value={row.original.skillsScore} className="h-2" />
                        </div>
                        
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm">Experience</span>
                            <span className="text-sm font-semibold">{row.original.experienceScore}%</span>
                          </div>
                          <Progress value={row.original.experienceScore} className="h-2" />
                        </div>
                        
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm">Education</span>
                            <span className="text-sm font-semibold">{row.original.educationScore}%</span>
                          </div>
                          <Progress value={row.original.educationScore} className="h-2" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Detailed Skills Analysis */}
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-4 flex items-center gap-2">
                      <IconTags className="h-4 w-4" />
                      Skills Analysis & Match
                    </h4>
                    
                    {/* Skills Matched */}
                    {row.original.evaluationDetails?.skills_matched && row.original.evaluationDetails.skills_matched.length > 0 && (
                      <div className="mb-4">
                        <h5 className="font-medium text-green-700 dark:text-green-400 mb-2 flex items-center gap-1">
                          <IconCircleCheckFilled className="h-4 w-4" />
                          Matching Skills Found ({row.original.evaluationDetails.skills_matched.length})
                        </h5>
                        <div className="flex flex-wrap gap-2">
                          {row.original.evaluationDetails.skills_matched.map((skill: string, index: number) => (
                            <Badge key={index} className="bg-green-100 text-green-800 border-green-300">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                          ✅ These skills from the job requirements were found in the candidate's resume, indicating relevant experience.
                        </p>
                      </div>
                    )}

                    {/* Skills Missing */}
                    {row.original.evaluationDetails?.skills_missing && row.original.evaluationDetails.skills_missing.length > 0 && (
                      <div className="mb-4">
                        <h5 className="font-medium text-orange-700 dark:text-orange-400 mb-2 flex items-center gap-1">
                          <IconMinus className="h-4 w-4" />
                          Missing Required Skills ({row.original.evaluationDetails.skills_missing.length})
                        </h5>
                        <div className="flex flex-wrap gap-2">
                          {row.original.evaluationDetails.skills_missing.slice(0, 10).map((skill: string, index: number) => (
                            <Badge key={index} variant="outline" className="border-orange-300 text-orange-700">
                              {skill}
                            </Badge>
                          ))}
                          {row.original.evaluationDetails.skills_missing.length > 10 && (
                            <Badge variant="outline" className="border-gray-300 text-gray-600">
                              +{row.original.evaluationDetails.skills_missing.length - 10} more
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                          ⚠️ These skills are required for the position but were not clearly demonstrated in the candidate's resume.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Experience Analysis */}
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-4 flex items-center gap-2">
                      <IconBriefcase className="h-4 w-4" />
                      Experience Assessment
                    </h4>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div>
                          <span className="font-medium">Required Experience:</span>
                          <span className="ml-2 text-gray-600 dark:text-gray-400">Minimum years needed for this role</span>
                        </div>
                        <Badge variant="outline" className="font-semibold">
                          {row.original.evaluationDetails?.evaluation_metadata?.required_experience_years || 'N/A'} years
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div>
                          <span className="font-medium">Candidate Experience:</span>
                          <span className="ml-2 text-gray-600 dark:text-gray-400">Years found in resume</span>
                        </div>
                        <Badge className={row.original.experienceScore >= 70 ? "bg-green-100 text-green-800" : row.original.experienceScore >= 50 ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"}>
                          {row.original.experience_years || 0} years
                        </Badge>
                      </div>

                      {row.original.evaluationDetails?.experience_details && (
                        <div className="p-3 border rounded-lg">
                          <p className="text-sm">
                            <span className="font-medium">Analysis: </span>
                            {row.original.evaluationDetails.experience_details.relevance || "Experience level assessment based on resume content and job requirements."}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* AI Evaluation Summary */}
                {row.original.evaluationDetails?.evaluation_summary && (
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-semibold mb-4 flex items-center gap-2">
                        <IconBrain className="h-4 w-4" />
                        AI Evaluation Summary
                      </h4>
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
                        <p className="text-sm leading-relaxed">
                          {row.original.evaluationDetails.evaluation_summary}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Strengths and Improvements */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Key Strengths */}
                  {row.original.evaluationDetails?.key_strengths && row.original.evaluationDetails.key_strengths.length > 0 && (
                    <Card>
                      <CardContent className="p-4">
                        <h4 className="font-semibold mb-3 flex items-center gap-2 text-green-700 dark:text-green-400">
                          <IconTrendingUp className="h-4 w-4" />
                          Key Strengths
                        </h4>
                        <ul className="space-y-2">
                          {row.original.evaluationDetails.key_strengths.map((strength: string, index: number) => (
                            <li key={index} className="flex items-start gap-2 text-sm">
                              <IconCircleCheckFilled className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                              <span>{strength}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {/* Areas for Improvement */}
                  {row.original.evaluationDetails?.improvement_areas && row.original.evaluationDetails.improvement_areas.length > 0 && (
                    <Card>
                      <CardContent className="p-4">
                        <h4 className="font-semibold mb-3 flex items-center gap-2 text-orange-700 dark:text-orange-400">
                          <IconTrendingDown className="h-4 w-4" />
                          Areas for Development
                        </h4>
                        <ul className="space-y-2">
                          {row.original.evaluationDetails.improvement_areas.map((area: string, index: number) => (
                            <li key={index} className="flex items-start gap-2 text-sm">
                              <IconMinus className="h-4 w-4 text-orange-500 flex-shrink-0 mt-0.5" />
                              <span>{area}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Recommendation */}
                {row.original.evaluationDetails?.recommendation && (
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-semibold mb-4 flex items-center gap-2">
                        <IconStar className="h-4 w-4" />
                        Hiring Recommendation
                      </h4>
                      <div className={`p-4 rounded-lg border-l-4 ${
                        row.original.evaluationDetails.recommendation === 'STRONG_MATCH' 
                          ? 'bg-green-50 dark:bg-green-900/20 border-green-500' 
                          : row.original.evaluationDetails.recommendation === 'GOOD_MATCH'
                          ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500'
                          : row.original.evaluationDetails.recommendation === 'FAIR_MATCH'
                          ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500'
                          : 'bg-red-50 dark:bg-red-900/20 border-red-500'
                      }`}>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={`${
                            row.original.evaluationDetails.recommendation === 'STRONG_MATCH'
                              ? 'bg-green-100 text-green-800'
                              : row.original.evaluationDetails.recommendation === 'GOOD_MATCH'
                              ? 'bg-blue-100 text-blue-800'
                              : row.original.evaluationDetails.recommendation === 'FAIR_MATCH'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {row.original.evaluationDetails.recommendation.replace('_', ' ')}
                          </Badge>
                          <span className="text-sm font-medium">Overall Score: {row.original.overallScore}%</span>
                        </div>
                        <p className="text-sm">
                          {row.original.evaluationDetails.recommendation === 'STRONG_MATCH' 
                            ? '✅ This candidate is an excellent fit for the position with strong alignment across multiple criteria.'
                            : row.original.evaluationDetails.recommendation === 'GOOD_MATCH'
                            ? '👍 This candidate shows good potential with some areas that align well with the job requirements.'
                            : row.original.evaluationDetails.recommendation === 'FAIR_MATCH'
                            ? '⚠️ This candidate has some relevant qualifications but may need additional training or development.'
                            : '❌ This candidate does not meet the minimum requirements for this position at this time.'
                          }
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Processing Information */}
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <IconBrain className="h-4 w-4" />
                      Analysis Details
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Model Used:</span>
                        <p className="text-gray-600 dark:text-gray-400">{row.original.evaluationDetails?.ai_model || 'GPT-4.1'}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Analyzed:</span>
                        <p className="text-gray-600 dark:text-gray-400">{new Date(row.original.evaluatedAt).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Processing Time:</span>
                        <p className="text-gray-600 dark:text-gray-400">{row.original.evaluationDetails?.processing_time_ms ? `${(row.original.evaluationDetails.processing_time_ms / 1000).toFixed(1)}s` : 'N/A'}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">File Name:</span>
                        <p className="text-gray-600 dark:text-gray-400 truncate" title={row.original.evaluationDetails?.file_name}>
                          {row.original.evaluationDetails?.file_name || 'Resume.pdf'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <DrawerFooter className="flex-shrink-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="flex gap-2">
                  {row.original.resume_url && (
                    <Button variant="outline">
                      <IconDownload className="h-4 w-4 mr-2" />
                      Download Resume
                    </Button>
                  )}
                  <Button>
                    Schedule Interview
                  </Button>
                </div>
                <DrawerClose asChild>
                  <Button variant="outline">Close</Button>
                </DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        ),
      },
      {
        accessorKey: "overallScore",
        header: "Overall Score",
        cell: ({ row }) => (
          <div className="text-center">
            <Badge className={`font-bold ${getScoreColor(row.original.overallScore)}`}>
              {row.original.overallScore}%
            </Badge>
          </div>
        ),
      },
      {
        accessorKey: "skillsScore",
        header: "Skills",
        cell: ({ row }) => (
          <div className="text-center">
            <div className="font-semibold text-sm">{row.original.skillsScore}%</div>
            <Progress value={row.original.skillsScore} className="h-1 mt-1" />
          </div>
        ),
      },
      {
        accessorKey: "experienceScore",
        header: "Experience",
        cell: ({ row }) => (
          <div className="text-center">
            <div className="font-semibold text-sm">{row.original.experienceScore}%</div>
            <div className="text-xs text-gray-500 mt-1">
              {row.original.experience_years || 0} years
            </div>
          </div>
        ),
      },
      {
        accessorKey: "educationScore",
        header: "Education",
        cell: ({ row }) => (
          <div className="text-center">
            <div className="font-semibold text-sm">{row.original.educationScore}%</div>
            <Progress value={row.original.educationScore} className="h-1 mt-1" />
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.getValue("status") as string
          return (
            <Badge variant="outline" className="capitalize">
              {getStatusIcon(status)}
              {status.replace('_', ' ')}
            </Badge>
          )
        },
      },
      {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => {
          const candidate = row.original
          const isShortlisted = shortlistedIds.has(candidate.evaluationId)
          const isProcessing = processingIds.has(candidate.evaluationId)

          return (
            <div className="flex items-center gap-2 justify-end">
              {isShortlisted ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRemoveShortlist(candidate)}
                  disabled={isProcessing}
                  className="border-green-200 bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800"
                >
                  <IconCheck className="h-4 w-4 mr-1" />
                  Shortlisted
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleShortlist(candidate)}
                  disabled={isProcessing}
                  className="border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800"
                >
                  <IconStar className="h-4 w-4 mr-1" />
                  Shortlist
                </Button>
              )}
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <IconDotsVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuItem>
                    <IconEye className="mr-2 h-4 w-4" />
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {candidate.resume_url && (
                    <DropdownMenuItem>
                      <IconDownload className="mr-2 h-4 w-4" />
                      Download Resume
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem>
                    <IconClock className="mr-2 h-4 w-4" />
                    Schedule Interview
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )
        },
      },
    ],
    [shortlistedIds, processingIds, handleShortlist, handleRemoveShortlist]
  )

  const table = useReactTable({
    data: rankedCandidates,
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
      <div className="flex items-center py-4 px-4">
        <Input
          placeholder="Filter candidates..."
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("name")?.setFilterValue(event.target.value)
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
      
      <div className="border-t">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="text-center">
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
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="text-center">
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
                  No candidates found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      <div className="flex items-center justify-end space-x-2 py-4 px-4 border-t">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} candidates selected.
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
