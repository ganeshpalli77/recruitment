'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  IconBrain, 
  IconChevronRight, 
  IconSearch,
  IconStar,
  IconUsers,
  IconChartBar
} from '@tabler/icons-react'

interface JobPosting {
  id: string
  title: string
  description: string
  min_experience: number
  max_experience: number
  status: string
  created_at: string
  interview_results?: Array<{ count: number }>
}

interface AIEvaluationScreenProps {
  jobPostings: JobPosting[]
}

export function AIEvaluationScreen({ jobPostings }: AIEvaluationScreenProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')

  // Filter job postings based on search
  const filteredJobs = jobPostings.filter(job =>
    job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Get interview count for a job
  const getInterviewCount = (job: JobPosting) => {
    return job.interview_results?.[0]?.count || 0
  }

  // Navigate to evaluation details
  const handleViewEvaluation = (jobId: string) => {
    router.push(`/ai-evaluation/${jobId}`)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <IconBrain className="h-8 w-8 text-blue-600" />
              AI Evaluation
            </h1>
            <p className="text-gray-600 mt-2">
              Review AI-analyzed interview results for each job posting
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4 border-l-4 border-l-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Job Postings</p>
                <p className="text-2xl font-bold text-gray-900">{jobPostings.length}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <IconChartBar className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="p-4 border-l-4 border-l-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Interviews</p>
                <p className="text-2xl font-bold text-gray-900">
                  {jobPostings.reduce((sum, job) => sum + getInterviewCount(job), 0)}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <IconUsers className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </Card>

          <Card className="p-4 border-l-4 border-l-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Positions</p>
                <p className="text-2xl font-bold text-gray-900">
                  {jobPostings.filter(job => job.status === 'active').length}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                <IconStar className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Job Postings Table */}
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                All Job Postings ({filteredJobs.length})
              </h2>
              <div className="relative w-72">
                <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Filter jobs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-semibold">Job Title</TableHead>
                    <TableHead className="font-semibold">Experience</TableHead>
                    <TableHead className="font-semibold">Interviews</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Created</TableHead>
                    <TableHead className="font-semibold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredJobs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-gray-500">
                        {searchQuery ? 'No jobs found matching your search' : 'No job postings yet'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredJobs.map((job) => {
                      const interviewCount = getInterviewCount(job)
                      const createdDate = new Date(job.created_at).toLocaleDateString()

                      return (
                        <TableRow 
                          key={job.id}
                          className="hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() => handleViewEvaluation(job.id)}
                        >
                          <TableCell className="font-medium text-blue-600">
                            {job.title}
                          </TableCell>
                          <TableCell>
                            {job.min_experience}-{job.max_experience} years
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <IconUsers className="h-4 w-4 text-gray-500" />
                              <span className="font-semibold">{interviewCount}</span>
                              <span className="text-gray-500 text-sm">candidates</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={job.status === 'active' ? 'default' : 'secondary'}
                              className={job.status === 'active' ? 'bg-green-100 text-green-700 border-green-300' : ''}
                            >
                              {job.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-600">
                            {createdDate}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleViewEvaluation(job.id)
                              }}
                            >
                              View Results
                              <IconChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            {filteredJobs.length > 0 && (
              <div className="mt-4 text-sm text-gray-600">
                Showing {filteredJobs.length} of {jobPostings.length} job posting(s)
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
