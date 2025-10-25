'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { IconCheck, IconSparkles, IconBrain, IconChartBar, IconFileAnalytics } from '@tabler/icons-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { analyzeInterview } from '../lib/analyze-interview'

export default function AnalyzingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [currentStep, setCurrentStep] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const [analysisTriggered, setAnalysisTriggered] = useState(false)

  const candidateName = searchParams.get('name') || 'Candidate'
  const jobTitle = searchParams.get('job') || 'Position'

  const analysisSteps = [
    { icon: IconFileAnalytics, label: 'Processing Transcript', duration: 2000 },
    { icon: IconBrain, label: 'Analyzing Responses', duration: 3000 },
    { icon: IconChartBar, label: 'Calculating Scores', duration: 2000 },
    { icon: IconSparkles, label: 'Generating Insights', duration: 2000 },
  ]

  // Trigger analysis on mount
  useEffect(() => {
    if (!analysisTriggered) {
      setAnalysisTriggered(true)
      
      // Get interview data from sessionStorage
      const interviewDataStr = sessionStorage.getItem('pendingInterviewAnalysis')
      if (interviewDataStr) {
        try {
          const interviewData = JSON.parse(interviewDataStr)
          
          // Trigger analysis in background
          analyzeInterview(interviewData)
            .then(result => {
              if (result.success) {
                console.log('✅ Analysis complete:', result.data)
                // Clear the stored data
                sessionStorage.removeItem('pendingInterviewAnalysis')
              } else {
                console.error('❌ Analysis failed:', result.error)
              }
            })
            .catch(error => {
              console.error('❌ Analysis error:', error)
            })
        } catch (error) {
          console.error('Failed to parse interview data:', error)
        }
      }
    }
  }, [analysisTriggered])

  // Progress through steps
  useEffect(() => {
    let timeoutId: NodeJS.Timeout

    if (currentStep < analysisSteps.length) {
      timeoutId = setTimeout(() => {
        setCurrentStep(prev => prev + 1)
      }, analysisSteps[currentStep].duration)
    } else if (currentStep === analysisSteps.length && !isComplete) {
      setIsComplete(true)
      // Auto redirect after showing complete message
      timeoutId = setTimeout(() => {
        router.push('/dashboard') // Or wherever you want to redirect
      }, 3000)
    }

    return () => clearTimeout(timeoutId)
  }, [currentStep, analysisSteps, isComplete, router])

  return (
    <div className="min-h-screen w-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Main Card */}
        <Card className="bg-white/90 backdrop-blur-xl border-gray-200 shadow-2xl p-8 sm:p-12">
          {!isComplete ? (
            <>
              {/* Header */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 mb-6 animate-pulse">
                  <IconSparkles className="h-10 w-10 text-white" />
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
                  Analyzing Your Interview
                </h1>
                <p className="text-lg text-gray-600">
                  Please wait while we review your responses
                </p>
              </div>

              {/* Progress Steps */}
              <div className="space-y-4 mb-8">
                {analysisSteps.map((step, index) => {
                  const Icon = step.icon
                  const isActive = index === currentStep
                  const isCompleted = index < currentStep

                  return (
                    <div
                      key={index}
                      className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-500 ${
                        isActive
                          ? 'bg-blue-50 border-2 border-blue-300 scale-105'
                          : isCompleted
                          ? 'bg-green-50 border-2 border-green-300'
                          : 'bg-gray-50 border-2 border-gray-200'
                      }`}
                    >
                      <div
                        className={`flex items-center justify-center w-12 h-12 rounded-full transition-all ${
                          isActive
                            ? 'bg-blue-500 animate-pulse'
                            : isCompleted
                            ? 'bg-green-500'
                            : 'bg-gray-300'
                        }`}
                      >
                        {isCompleted ? (
                          <IconCheck className="h-6 w-6 text-white" />
                        ) : (
                          <Icon
                            className={`h-6 w-6 ${
                              isActive ? 'text-white' : 'text-gray-500'
                            }`}
                          />
                        )}
                      </div>
                      <div className="flex-1">
                        <p
                          className={`font-semibold ${
                            isActive
                              ? 'text-blue-700'
                              : isCompleted
                              ? 'text-green-700'
                              : 'text-gray-500'
                          }`}
                        >
                          {step.label}
                        </p>
                        {isActive && (
                          <div className="mt-2 h-1 bg-blue-200 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full animate-progress" />
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Info Badge */}
              <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700">
                  AI-Powered Analysis
                </Badge>
                <span>•</span>
                <span className="font-medium">{jobTitle}</span>
              </div>
            </>
          ) : (
            /* Completion Screen */
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 mb-6 animate-bounce">
                <IconCheck className="h-12 w-12 text-white" stroke={3} />
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Thank You, {candidateName}!
              </h1>
              <div className="space-y-3 text-gray-700 text-lg max-w-lg mx-auto">
                <p className="leading-relaxed">
                  Your interview has been successfully completed and submitted.
                </p>
                <p className="leading-relaxed font-medium text-blue-600">
                  We are carefully reviewing your answers and will get back to you soon.
                </p>
              </div>
              
              <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-200">
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">What's next?</span> Our team will evaluate your responses and contact you within 2-3 business days.
                </p>
              </div>

              <div className="mt-6">
                <div className="inline-flex items-center gap-2 text-sm text-gray-500">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span>Redirecting...</span>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Decorative Elements */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Powered by AI • Secure & Confidential</p>
        </div>
      </div>

      <style jsx>{`
        @keyframes progress {
          0% {
            width: 0%;
          }
          100% {
            width: 100%;
          }
        }

        .animate-progress {
          animation: progress 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
