"use client"

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  IconChevronDown,
  IconEye,
  IconArrowLeft,
  IconTrendingDown,
} from '@tabler/icons-react'
import Link from 'next/link'
import { CandidateDetailModal } from '../../components/candidate-detail-modal'

interface InterviewResult {
  id: string
  candidate_id: string
  candidate_name: string
  overall_score: number
  average_score: number
  total_questions: number
  recommendation: string
  confidence_level: string
  communication_quality: string
  summary: string
  strengths: string[]
  key_strengths?: string[]
  areas_for_improvement: string[]
  key_weaknesses?: string[]
  question_analyses?: any[]
  analyzed_at: string
  created_at: string
}

interface InterviewResultsViewProps {
  jobPosting: {
    id: string
    title: string
    description: string
    experience_required: number
    status: string
  }
  results: InterviewResult[]
}

export function InterviewResultsView({ jobPosting, results }: InterviewResultsViewProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCandidate, setSelectedCandidate] = useState<InterviewResult | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [visibleColumns, setVisibleColumns] = useState({
    candidateName: true,
    overallScore: true,
    avgScore: true,
    questions: true,
    recommendation: true,
    communication: true,
    interviewDate: true,
  })

  // Calculate statistics
  const totalCandidates = results.length
  const averageScore = results.length > 0
    ? (results.reduce((sum, r) => sum + r.average_score, 0) / results.length).toFixed(1)
    : '0.0'
  const recommendedCount = results.filter(r => 
    r.recommendation.toLowerCase().includes('recommend') && 
    !r.recommendation.toLowerCase().includes('not')
  ).length

  // Filter results
  const filteredResults = results.filter(result =>
    result.candidate_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getScoreBadgeColor = (score: number) => {
    if (score >= 4) return 'text-green-600'
    if (score >= 3) return 'text-yellow-600'
    if (score >= 2) return 'text-orange-600'
    return 'text-red-600'
  }

  const getRecommendationBadge = (recommendation: string) => {
    const rec = recommendation.toLowerCase()
    if (rec.includes('highly') || rec.includes('strong')) {
      return 'bg-green-100 text-green-800 border-green-300'
    }
    if (rec.includes('recommend') && !rec.includes('not')) {
      return 'bg-blue-100 text-blue-800 border-blue-300'
    }
    if (rec.includes('consider')) {
      return 'bg-yellow-100 text-yellow-800 border-yellow-300'
    }
    return 'bg-red-100 text-red-800 border-red-300'
  }

  return (
    <div className="flex flex-col gap-6 py-6 px-4 lg:px-6">
      {/* Back Button */}
      <div>
        <Button variant="ghost" asChild>
          <Link href={`/ai-evaluation/${jobPosting.id}`}>
            <IconArrowLeft className="h-4 w-4 mr-2" />
            Back to Candidates
          </Link>
        </Button>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Interview Results ({totalCandidates})
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mt-1">
          {jobPosting.title}
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-100">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Candidates</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{totalCandidates}</p>
        </Card>

        <Card className="p-6 bg-green-50 dark:bg-green-900/20 border-green-100">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Average Score</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{averageScore}/5</p>
        </Card>

        <Card className="p-6 bg-purple-50 dark:bg-purple-900/20 border-purple-100">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Recommended</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {recommendedCount}/{totalCandidates}
          </p>
        </Card>
      </div>

      {/* Filter and Controls */}
      <div className="flex items-center justify-between gap-4">
        <Input
          placeholder="Filter candidates..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-xs"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              Columns <IconChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuCheckboxItem
              checked={visibleColumns.candidateName}
              onCheckedChange={(checked) =>
                setVisibleColumns(prev => ({ ...prev, candidateName: checked }))
              }
            >
              Candidate Name
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibleColumns.overallScore}
              onCheckedChange={(checked) =>
                setVisibleColumns(prev => ({ ...prev, overallScore: checked }))
              }
            >
              Overall Score
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibleColumns.avgScore}
              onCheckedChange={(checked) =>
                setVisibleColumns(prev => ({ ...prev, avgScore: checked }))
              }
            >
              Avg Score
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibleColumns.questions}
              onCheckedChange={(checked) =>
                setVisibleColumns(prev => ({ ...prev, questions: checked }))
              }
            >
              Questions
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibleColumns.recommendation}
              onCheckedChange={(checked) =>
                setVisibleColumns(prev => ({ ...prev, recommendation: checked }))
              }
            >
              Recommendation
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibleColumns.communication}
              onCheckedChange={(checked) =>
                setVisibleColumns(prev => ({ ...prev, communication: checked }))
              }
            >
              Communication
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibleColumns.interviewDate}
              onCheckedChange={(checked) =>
                setVisibleColumns(prev => ({ ...prev, interviewDate: checked }))
              }
            >
              Interview Date
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Results Table */}
      <div className="rounded-md border bg-white dark:bg-gray-900">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 dark:bg-gray-800">
              {visibleColumns.candidateName && <TableHead>Candidate Name</TableHead>}
              {visibleColumns.overallScore && <TableHead>Overall Score</TableHead>}
              {visibleColumns.avgScore && <TableHead>Avg Score</TableHead>}
              {visibleColumns.questions && <TableHead>Questions</TableHead>}
              {visibleColumns.recommendation && <TableHead>Recommendation</TableHead>}
              {visibleColumns.communication && <TableHead>Communication</TableHead>}
              {visibleColumns.interviewDate && <TableHead>Interview Date</TableHead>}
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredResults.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  No candidates found
                </TableCell>
              </TableRow>
            ) : (
              filteredResults.map((result) => (
                <TableRow key={result.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  {visibleColumns.candidateName && (
                    <TableCell className="font-medium">
                      {result.candidate_name}
                    </TableCell>
                  )}
                  {visibleColumns.overallScore && (
                    <TableCell>
                      <span className={`flex items-center gap-1 font-bold ${getScoreBadgeColor(result.overall_score)}`}>
                        <IconTrendingDown className="h-4 w-4" />
                        {result.overall_score}/5
                      </span>
                    </TableCell>
                  )}
                  {visibleColumns.avgScore && (
                    <TableCell className="text-gray-600">
                      {result.average_score.toFixed(1)}/5
                    </TableCell>
                  )}
                  {visibleColumns.questions && (
                    <TableCell className="text-center">
                      {result.total_questions}
                    </TableCell>
                  )}
                  {visibleColumns.recommendation && (
                    <TableCell>
                      <Badge 
                        className={getRecommendationBadge(result.recommendation)}
                        variant="outline"
                      >
                        {result.recommendation}
                      </Badge>
                    </TableCell>
                  )}
                  {visibleColumns.communication && (
                    <TableCell className="capitalize text-gray-600">
                      {result.communication_quality}
                    </TableCell>
                  )}
                  {visibleColumns.interviewDate && (
                    <TableCell className="text-gray-600">
                      <div className="text-sm">
                        {new Date(result.analyzed_at).toISOString().split('T')[0]}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(result.analyzed_at).toISOString().split('T')[1].slice(0, 5)}
                      </div>
                    </TableCell>
                  )}
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedCandidate(result)
                        setModalOpen(true)
                      }}
                    >
                      <IconEye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Detail Modal */}
      <CandidateDetailModal
        candidate={selectedCandidate}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  )
}
