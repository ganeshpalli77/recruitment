"use client"

import * as React from "react"
import {
  IconMail,
  IconPhone,
  IconTrophy,
  IconStar,
  IconCalendarPlus,
  IconClock,
} from "@tabler/icons-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"

interface ShortlistedCandidate {
  id: string
  resume_result_id: string
  candidate_name: string
  candidate_email: string | null
  candidate_phone: string | null
  overall_score: number
  skills_score: number
  experience_score: number
  education_score: number
  recommendation: string | null
  interview_status: string
  interview_date: string | null
  shortlisted_at: string
}

interface ShortlistedCandidatesTableProps {
  candidates: ShortlistedCandidate[]
  jobId: string
}

const getRankIcon = (rank: number) => {
  if (rank === 1) return <IconTrophy className="h-5 w-5 text-yellow-500" />
  if (rank === 2) return <IconTrophy className="h-5 w-5 text-gray-400" />
  if (rank === 3) return <IconTrophy className="h-5 w-5 text-amber-600" />
  return <span className="text-sm font-semibold text-gray-500">#{rank}</span>
}

const getScoreColor = (score: number) => {
  if (score >= 90) return 'text-green-600 bg-green-50'
  if (score >= 80) return 'text-blue-600 bg-blue-50'
  if (score >= 70) return 'text-yellow-600 bg-yellow-50'
  return 'text-orange-600 bg-orange-50'
}

const getRecommendationColor = (recommendation: string | null) => {
  switch (recommendation) {
    case 'STRONG_MATCH':
      return 'bg-green-100 text-green-800 border-green-300'
    case 'GOOD_MATCH':
      return 'bg-blue-100 text-blue-800 border-blue-300'
    case 'FAIR_MATCH':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300'
  }
}

export function ShortlistedCandidatesTable({ candidates, jobId }: ShortlistedCandidatesTableProps) {
  return (
    <div className="w-full">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16 text-center">Rank</TableHead>
            <TableHead>Candidate</TableHead>
            <TableHead className="text-center">Overall</TableHead>
            <TableHead className="text-center">Skills</TableHead>
            <TableHead className="text-center">Experience</TableHead>
            <TableHead className="text-center">Education</TableHead>
            <TableHead className="text-center">Match</TableHead>
            <TableHead className="text-center">Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {candidates.map((candidate, index) => (
            <TableRow key={candidate.id}>
              {/* Rank */}
              <TableCell className="text-center">
                <div className="flex items-center justify-center">
                  {getRankIcon(index + 1)}
                </div>
              </TableCell>

              {/* Candidate */}
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {candidate.candidate_name}
                  </span>
                  <div className="flex flex-col gap-1 mt-1">
                    {candidate.candidate_email && (
                      <span className="text-xs text-gray-600 flex items-center gap-1">
                        <IconMail className="h-3 w-3" />
                        {candidate.candidate_email}
                      </span>
                    )}
                    {candidate.candidate_phone && (
                      <span className="text-xs text-gray-600 flex items-center gap-1">
                        <IconPhone className="h-3 w-3" />
                        {candidate.candidate_phone}
                      </span>
                    )}
                  </div>
                </div>
              </TableCell>

              {/* Overall Score */}
              <TableCell className="text-center">
                <div className="flex flex-col items-center gap-1">
                  <Badge className={`${getScoreColor(candidate.overall_score)} font-bold px-3 py-1`}>
                    {candidate.overall_score}%
                  </Badge>
                  <Progress value={candidate.overall_score} className="h-1 w-16" />
                </div>
              </TableCell>

              {/* Skills Score */}
              <TableCell className="text-center">
                <span className="font-medium">{candidate.skills_score}%</span>
              </TableCell>

              {/* Experience Score */}
              <TableCell className="text-center">
                <span className="font-medium">{candidate.experience_score}%</span>
              </TableCell>

              {/* Education Score */}
              <TableCell className="text-center">
                <span className="font-medium">{candidate.education_score}%</span>
              </TableCell>

              {/* Recommendation */}
              <TableCell className="text-center">
                <Badge className={getRecommendationColor(candidate.recommendation)}>
                  {candidate.recommendation?.replace('_', ' ')}
                </Badge>
              </TableCell>

              {/* Interview Status */}
              <TableCell className="text-center">
                <Badge 
                  variant="outline" 
                  className={
                    candidate.interview_status === 'scheduled' 
                      ? 'border-blue-200 bg-blue-50 text-blue-700'
                      : candidate.interview_status === 'completed'
                      ? 'border-green-200 bg-green-50 text-green-700'
                      : 'border-gray-200 bg-gray-50 text-gray-700'
                  }
                >
                  <IconClock className="h-3 w-3 mr-1" />
                  {candidate.interview_status}
                </Badge>
              </TableCell>

              {/* Actions */}
              <TableCell className="text-right">
                <Button
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <IconCalendarPlus className="h-4 w-4 mr-1" />
                  Schedule
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
