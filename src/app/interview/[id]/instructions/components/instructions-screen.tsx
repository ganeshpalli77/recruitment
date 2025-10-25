'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { 
  IconAlertCircle, 
  IconVideo, 
  IconMicrophone, 
  IconClock,
  IconShieldCheck,
  IconEye,
  IconDeviceDesktop
} from '@tabler/icons-react'
import { toast } from 'sonner'

interface InstructionsScreenProps {
  interviewId: string
  candidateId: string
  candidateName: string
  jobPostingId: string
  duration: number
  greetingMessage: string
  screeningQuestions: string[]
  technicalQuestions: string[]
  hrQuestions: string[]
  jobTitle: string
}

export function InstructionsScreen({
  interviewId,
  candidateId,
  candidateName,
  jobPostingId,
  duration,
  greetingMessage,
  screeningQuestions,
  technicalQuestions,
  hrQuestions,
  jobTitle,
}: InstructionsScreenProps) {
  const router = useRouter()
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [agreedToRecording, setAgreedToRecording] = useState(false)

  const handleStartInterview = () => {
    if (!agreedToTerms || !agreedToRecording) {
      toast.error('Please accept all terms', {
        description: 'You must agree to all terms and conditions to proceed'
      })
      return
    }

    // Navigate to the actual interview screen
    router.push(`/interview/${interviewId}?candidateId=${candidateId}&candidateName=${encodeURIComponent(candidateName)}&jobPostingId=${jobPostingId}&duration=${duration}&jobTitle=${encodeURIComponent(jobTitle)}`)
  }

  const totalQuestions = screeningQuestions.length + technicalQuestions.length + hrQuestions.length

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 mb-4">
            <IconShieldCheck className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            Interview Instructions
          </h1>
          <p className="text-lg text-gray-600">
            Please read carefully before starting
          </p>
        </div>

        {/* Candidate Info Card */}
        <Card className="bg-white border-gray-200 shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{candidateName}</h2>
              <p className="text-gray-600">{jobTitle}</p>
            </div>
            <div className="flex items-center gap-2">
              <IconClock className="h-5 w-5 text-blue-600" />
              <span className="text-lg font-semibold text-blue-600">{duration} minutes</span>
            </div>
          </div>
        </Card>

        {/* Instructions Card */}
        <Card className="bg-white border-gray-200 shadow-lg p-6 sm:p-8 mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <IconAlertCircle className="h-6 w-6 text-blue-600" />
            Important Instructions
          </h3>

          <div className="space-y-6">
            {/* Technical Requirements */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 text-lg">📋 Before You Start</h4>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <IconMicrophone className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span><strong>Microphone Access:</strong> You will be asked to allow microphone access for voice responses</span>
                </li>
                <li className="flex items-start gap-2">
                  <IconVideo className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span><strong>Camera Access:</strong> Your camera will be enabled to record your video during the interview</span>
                </li>
                <li className="flex items-start gap-2">
                  <IconDeviceDesktop className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span><strong>Screen Recording:</strong> Your entire screen will be recorded for security and proctoring purposes</span>
                </li>
              </ul>
            </div>

            {/* Interview Format */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 text-lg">🎯 Interview Format</h4>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>You will be interviewed by an AI interviewer</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>Total of <strong>{totalQuestions} questions</strong> covering screening, technical, and HR rounds</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>Duration: <strong>{duration} minutes</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>Speak clearly and naturally - the AI will listen and respond</span>
                </li>
              </ul>
            </div>

            {/* Security & Privacy */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 text-lg flex items-center gap-2">
                <IconEye className="h-5 w-5 text-blue-600" />
                Security & Proctoring
              </h4>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>Your screen, camera, and audio will be recorded throughout the interview</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>Recordings are used for verification and quality assurance only</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>Do not switch tabs, open other applications, or leave the interview screen</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>Ensure you are in a quiet, well-lit environment with stable internet</span>
                </li>
              </ul>
            </div>

            {/* Best Practices */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 text-lg">💡 Best Practices</h4>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>Use headphones for better audio clarity</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>Maintain eye contact with the camera</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>Provide specific examples when answering technical questions</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>Take a moment to think before responding</span>
                </li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Terms Agreement */}
        <Card className="bg-white border-gray-200 shadow-lg p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Terms & Conditions</h3>
          
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <Checkbox
                id="terms"
                checked={agreedToTerms}
                onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                className="mt-1"
              />
              <label
                htmlFor="terms"
                className="text-sm text-gray-700 leading-relaxed cursor-pointer"
              >
                I understand that this is a timed interview and I must complete it within <strong>{duration} minutes</strong>. 
                I confirm that I am in a suitable environment and ready to begin.
              </label>
            </div>

            <div className="flex items-start gap-3 p-4 bg-orange-50 rounded-lg border border-orange-200">
              <Checkbox
                id="recording"
                checked={agreedToRecording}
                onCheckedChange={(checked) => setAgreedToRecording(checked as boolean)}
                className="mt-1"
              />
              <label
                htmlFor="recording"
                className="text-sm text-gray-700 leading-relaxed cursor-pointer"
              >
                I consent to the <strong>recording of my screen, camera, and audio</strong> during this interview for 
                security, proctoring, and verification purposes. I understand that the recordings will be stored securely 
                and used only for evaluation and quality assurance.
              </label>
            </div>
          </div>
        </Card>

        {/* Start Button */}
        <div className="text-center">
          <Button
            size="lg"
            onClick={handleStartInterview}
            disabled={!agreedToTerms || !agreedToRecording}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-6 text-lg shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <IconShieldCheck className="h-6 w-6 mr-2" />
            Start Interview
          </Button>
          
          {(!agreedToTerms || !agreedToRecording) && (
            <p className="mt-4 text-sm text-gray-500">
              Please accept all terms and conditions to proceed
            </p>
          )}
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center">
          <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700">
            <IconShieldCheck className="h-4 w-4 mr-1" />
            Secure & Confidential
          </Badge>
          <p className="mt-2 text-sm text-gray-500">
            All recordings are encrypted and stored securely
          </p>
        </div>
      </div>
    </div>
  )
}
