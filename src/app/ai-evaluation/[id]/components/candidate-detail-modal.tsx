"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { 
  IconStar, 
  IconTrendingUp, 
  IconTrendingDown,
  IconMinus,
  IconBrain,
  IconMessageCircle,
  IconVideo,
  IconFileText,
  IconCheck,
  IconX,
} from "@tabler/icons-react"
import { CandidateEvaluation } from "./candidate-evaluation-table"

interface CandidateDetailModalProps {
  candidate: CandidateEvaluation | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const getScoreColor = (score: number) => {
  if (score >= 4) return 'text-green-600 bg-green-50'
  if (score >= 3) return 'text-yellow-600 bg-yellow-50'
  return 'text-red-600 bg-red-50'
}

const getScoreIcon = (score: number) => {
  if (score >= 4) return <IconTrendingUp className="h-5 w-5" />
  if (score >= 3) return <IconMinus className="h-5 w-5" />
  return <IconTrendingDown className="h-5 w-5" />
}

export function CandidateDetailModal({ 
  candidate, 
  open, 
  onOpenChange 
}: CandidateDetailModalProps) {
  if (!candidate) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl">{candidate.candidate_name}</DialogTitle>
          <DialogDescription>
            Complete AI evaluation analysis and interview details
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-4">
          <div className="space-y-6 pb-6">
            {/* Overall Scores Section */}
            <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <IconBrain className="h-5 w-5 text-blue-600" />
                Overall Performance
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Overall Score</p>
                  <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg font-bold text-lg ${getScoreColor(candidate.overall_score)}`}>
                    {getScoreIcon(candidate.overall_score)}
                    {candidate.overall_score}/5
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Average Score</p>
                  <p className="text-2xl font-bold text-gray-900">{candidate.average_score.toFixed(1)}/5</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Questions</p>
                  <p className="text-2xl font-bold text-gray-900">{candidate.total_questions}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Communication</p>
                  <p className="text-lg font-semibold text-gray-900 capitalize">{candidate.communication_quality}</p>
                </div>
              </div>
              
              <div className="mt-4 flex items-center gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Recommendation</p>
                  <Badge className="text-sm px-3 py-1 bg-blue-100 text-blue-800 border-blue-300">
                    {candidate.recommendation}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Confidence</p>
                  <Badge className="text-sm px-3 py-1 bg-purple-100 text-purple-800 border-purple-300">
                    {candidate.confidence_level}
                  </Badge>
                </div>
              </div>
            </Card>

            {/* Summary Section */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <IconFileText className="h-5 w-5 text-gray-600" />
                Executive Summary
              </h3>
              <Card className="p-4">
                <p className="text-gray-700 leading-relaxed">{candidate.summary}</p>
              </Card>
            </div>

            {/* Strengths & Areas for Improvement */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-green-700">
                  <IconCheck className="h-5 w-5" />
                  Key Strengths
                </h3>
                <Card className="p-4 bg-green-50 border-green-200">
                  <ul className="space-y-2">
                    {(candidate.key_strengths || candidate.strengths) && (candidate.key_strengths || candidate.strengths).length > 0 ? (
                      (candidate.key_strengths || candidate.strengths).map((strength: string, index: number) => (
                        <li key={index} className="flex items-start gap-2">
                          <IconCheck className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-700">{strength}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-sm text-gray-500">No strengths recorded</li>
                    )}
                  </ul>
                </Card>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-orange-700">
                  <IconX className="h-5 w-5" />
                  Areas for Improvement
                </h3>
                <Card className="p-4 bg-orange-50 border-orange-200">
                  <ul className="space-y-2">
                    {(candidate.key_weaknesses || candidate.areas_for_improvement) && (candidate.key_weaknesses || candidate.areas_for_improvement).length > 0 ? (
                      (candidate.key_weaknesses || candidate.areas_for_improvement).map((area: string, index: number) => (
                        <li key={index} className="flex items-start gap-2">
                          <IconX className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-700">{area}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-sm text-gray-500">No areas for improvement recorded</li>
                    )}
                  </ul>
                </Card>
              </div>
            </div>

            {/* Question Analysis Section */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <IconMessageCircle className="h-5 w-5 text-gray-600" />
                Detailed Question Analysis ({candidate.question_analyses?.length || 0} questions)
              </h3>
              <div className="space-y-4">
                {candidate.question_analyses && candidate.question_analyses.length > 0 ? (
                  candidate.question_analyses.map((qa: any, index: number) => (
                    <Card key={index} className="p-4 bg-white border-l-4 border-l-blue-500">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-500 mb-1">Question {index + 1}</p>
                            <p className="font-medium text-gray-900">{qa.question}</p>
                          </div>
                          <div className={`flex items-center gap-1 px-3 py-1 rounded-full font-bold text-sm ${getScoreColor(qa.score)}`}>
                            {getScoreIcon(qa.score)}
                            {qa.score}/5
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-sm font-semibold text-gray-600 mb-1">Answer:</p>
                          <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">{qa.answer}</p>
                        </div>

                        <div>
                          <p className="text-sm font-semibold text-gray-600 mb-1">Feedback:</p>
                          <p className="text-sm text-gray-700">{qa.feedback}</p>
                        </div>

                        {qa.strengths && qa.strengths.length > 0 && (
                          <div>
                            <p className="text-sm font-semibold text-green-700 mb-1">✓ Strengths:</p>
                            <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                              {qa.strengths.map((strength: string, i: number) => (
                                <li key={i}>{strength}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {qa.improvements && qa.improvements.length > 0 && (
                          <div>
                            <p className="text-sm font-semibold text-orange-700 mb-1">→ Improvements:</p>
                            <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                              {qa.improvements.map((improvement: string, i: number) => (
                                <li key={i}>{improvement}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </Card>
                  ))
                ) : (
                  <Card className="p-4 bg-gray-50">
                    <p className="text-sm text-gray-600 italic">
                      No detailed question analysis available
                    </p>
                  </Card>
                )}
              </div>
            </div>

            {/* Interview Metadata */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Interview Details</h3>
              <Card className="p-4">
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Interview Date</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(candidate.analyzed_at).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Candidate ID</p>
                    <p className="font-mono text-xs text-gray-900">{candidate.candidate_id}</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Video Recording Link */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <IconVideo className="h-5 w-5 text-gray-600" />
                Interview Recording
              </h3>
              <Card className="p-4">
                <p className="text-sm text-gray-600 mb-2">
                  Screen recording from the interview session
                </p>
                <a 
                  href="#" 
                  className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
                  onClick={(e) => {
                    e.preventDefault()
                    alert('Video playback functionality to be implemented')
                  }}
                >
                  <IconVideo className="h-4 w-4" />
                  View Interview Recording
                </a>
              </Card>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
