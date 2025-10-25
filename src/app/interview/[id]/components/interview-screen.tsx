'use client'

import { useState, useEffect, useRef } from 'react'
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  IconMicrophone,
  IconMicrophoneOff,
  IconVideo,
  IconVideoOff,
  IconPlayerPause,
  IconPlayerPlay,
  IconX,
} from "@tabler/icons-react"
import { useConversation } from '@elevenlabs/react'
import { toast } from 'sonner'
import { analyzeInterview } from '../lib/analyze-interview'
import { uploadRecordingClient } from '../lib/upload-recording-client'
import { useRouter } from 'next/navigation'
import { useScreenRecording } from '../hooks/useScreenRecording'

interface InterviewScreenProps {
  candidateId: string
  candidateName: string
  jobPostingId: string
  duration: number // in minutes
  greetingMessage: string
  screeningQuestions: string[]
  technicalQuestions: string[]
  hrQuestions: string[]
  jobTitle: string
}

export function InterviewScreen({
  candidateId,
  candidateName,
  jobPostingId,
  duration,
  greetingMessage,
  screeningQuestions,
  technicalQuestions,
  hrQuestions,
  jobTitle,
}: InterviewScreenProps) {
  const [timeLeft, setTimeLeft] = useState(duration * 60) // Convert to seconds
  const [isPaused, setIsPaused] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOn, setIsVideoOn] = useState(true)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [currentRound, setCurrentRound] = useState<'greeting' | 'screening' | 'technical' | 'hr'>('greeting')
  const [agentId, setAgentId] = useState<string | null>(null)
  const [interviewStarted, setInterviewStarted] = useState(false)
  const [currentAIQuestion, setCurrentAIQuestion] = useState<string>('')
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [conversationTranscript, setConversationTranscript] = useState<Array<{
    role: 'ai' | 'user'
    message: string
    timestamp: string
  }>>([])
  
  const aiVideoRef = useRef<HTMLVideoElement>(null)
  const candidateVideoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const recordingBlobRef = useRef<Blob | null>(null)
  const router = useRouter()
  
  // Screen recording hook
  const { isRecording, startRecording, stopRecording } = useScreenRecording({
    onRecordingComplete: (videoBlob) => {
      console.log('📹 Recording complete, saving blob...')
      console.log(`📊 Blob size: ${(videoBlob.size / 1024 / 1024).toFixed(2)} MB`)
      console.log(`⏰ Blob ready at: ${new Date().toISOString().split('T')[1]}`)
      setRecordingBlob(videoBlob)
      recordingBlobRef.current = videoBlob // Store in ref immediately
    }
  })

  // Expose transcript to console for debugging
  useEffect(() => {
    // Make transcript accessible from browser console
    (window as any).getInterviewTranscript = () => {
      console.log('\n📋 CURRENT INTERVIEW TRANSCRIPT')
      console.log('═══════════════════════════════════════════════════════')
      console.log(`Messages so far: ${conversationTranscript.length}`)
      console.log('═══════════════════════════════════════════════════════\n')
      
      if (conversationTranscript.length === 0) {
        console.log('No messages yet. Interview not started or no conversation.')
        return []
      }
      
      conversationTranscript.forEach((entry, index) => {
        const roleIcon = entry.role === 'ai' ? '🤖' : '👤'
        const roleName = entry.role === 'ai' ? 'AI' : 'CANDIDATE'
        console.log(`${index + 1}. [${entry.timestamp}] ${roleIcon} ${roleName}: ${entry.message}`)
      })
      
      return conversationTranscript
    }
    
    console.log('💡 TIP: Type "getInterviewTranscript()" in console to view current transcript at any time')
  }, [conversationTranscript])

  // Initialize Eleven Labs conversation
  const conversation = useConversation({
    onConnect: () => {
      console.log('🟢 INTERVIEW CONNECTED')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('📋 Interview Details:')
      console.log(`   Candidate: ${candidateName}`)
      console.log(`   Position: ${jobTitle}`)
      console.log(`   Duration: ${duration} minutes`)
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    },
    onDisconnect: () => {
      console.log('🔴 INTERVIEW DISCONNECTED')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    },
    onMessage: (message) => {
      const timestamp = new Date().toLocaleTimeString()
      
      console.log('\n💬 NEW MESSAGE')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log(`📍 Role: ${message.source === 'ai' ? '🤖 AI INTERVIEWER' : '👤 CANDIDATE'}`)
      console.log(`📝 Message: ${message.message}`)
      console.log(`⏰ Timestamp: ${timestamp}`)
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
      
      // Store in transcript
      const transcriptEntry = {
        role: message.source === 'ai' ? 'ai' as const : 'user' as const,
        message: message.message,
        timestamp: timestamp
      }
      
      setConversationTranscript(prev => [...prev, transcriptEntry])
      
      // Log separately for easy identification
      if (message.source === 'ai') {
        console.log('🎯 AI QUESTION:', message.message)
        // Update current question display
        setCurrentAIQuestion(message.message)
      } else {
        console.log('✅ CANDIDATE RESPONSE:', message.message)
      }
    },
    onError: (error) => {
      console.error('❌ INTERVIEW ERROR:', error)
    },
    overrides: {
      agent: {
        prompt: {
          prompt: `You are an AI interviewer conducting a ${duration}-minute interview for the position of ${jobTitle}.
          
Your role:
1. Start with this greeting: "${greetingMessage}"
2. Ask the following questions one by one, waiting for the candidate's response before moving to the next:

SCREENING QUESTIONS:
${screeningQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

TECHNICAL QUESTIONS:
${technicalQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

HR QUESTIONS:
${hrQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

Instructions:
- Ask questions naturally and conversationally
- Listen carefully to each answer
- Ask follow-up questions when appropriate
- Be professional but friendly
- Keep track of time (${duration} minutes total)
- Thank the candidate at the end

Start with the greeting and proceed through all questions systematically.`,
        },
        firstMessage: greetingMessage,
        language: "en",
      },
    },
  })

  const { status, isSpeaking, startSession, endSession } = conversation

  // Sync AI video with speaking state for realistic experience
  useEffect(() => {
    const video = aiVideoRef.current
    if (!video) return

    if (isSpeaking) {
      // AI is asking a question - play the video
      video.play().catch(error => {
        console.log('Video play failed:', error)
      })
      console.log('🎬 AI video playing - AI is speaking')
    } else {
      // AI is listening to response - pause the video
      video.pause()
      console.log('⏸️ AI video paused - AI is listening')
    }
  }, [isSpeaking])

  // Start AI interview with voice
  const startAIInterview = async () => {
    try {
      // Start screen recording first
      console.log('🎬 Starting screen recording...')
      const recordingStarted = await startRecording()
      
      if (!recordingStarted) {
        toast.error('Screen recording required', {
          description: 'You must allow screen recording to proceed with the interview'
        })
        return
      }
      
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true })
      
      // Get Eleven Labs Agent ID from environment
      const elevenLabsAgentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID
      
      if (!elevenLabsAgentId) {
        toast.error('Eleven Labs Agent ID not configured', {
          description: 'Please set NEXT_PUBLIC_ELEVENLABS_AGENT_ID in your environment variables'
        })
        return
      }

      toast.info('Starting AI interview...', {
        description: 'The AI interviewer will greet you shortly'
      })

      let conversationId: string

      // Try to get signed URL for secure conversation (if API key is configured)
      try {
        const signedUrlResponse = await fetch('/api/elevenlabs/signed-url', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ agentId: elevenLabsAgentId }),
        })

        if (signedUrlResponse.ok) {
          const { conversationToken } = await signedUrlResponse.json()
          
          // Use conversation token for secure conversation
          conversationId = await startSession({
            conversationToken: conversationToken,
            connectionType: 'webrtc',
          })
          
          console.log('Using signed conversation (secure mode)')
        } else {
          throw new Error('Signed conversation not available')
        }
      } catch (signedUrlError) {
        // Fallback to public agent mode
        console.log('Falling back to public agent mode:', signedUrlError)
        
        conversationId = await startSession({
          agentId: elevenLabsAgentId,
          connectionType: 'webrtc',
        })
        
        console.log('Using public agent mode (consider adding ELEVENLABS_API_KEY for production)')
      }

      setAgentId(conversationId)
      setInterviewStarted(true) // Start the timer
      setCurrentAIQuestion(greetingMessage) // Set initial greeting
      
      toast.success('Interview started!', {
        description: 'Recording in progress. Speak clearly into your microphone.'
      })
    } catch (error) {
      console.error('Error starting AI interview:', error)
      toast.error('Failed to start interview', {
        description: error instanceof Error ? error.message : 'Could not connect to voice agent'
      })
    }
  }

  // Log complete transcript
  const logCompleteTranscript = () => {
    console.log('\n\n')
    console.log('═══════════════════════════════════════════════════════')
    console.log('📊 COMPLETE INTERVIEW TRANSCRIPT')
    console.log('═══════════════════════════════════════════════════════')
    console.log(`Candidate: ${candidateName}`)
    console.log(`Position: ${jobTitle}`)
    console.log(`Total Messages: ${conversationTranscript.length}`)
    console.log('═══════════════════════════════════════════════════════\n')
    
    conversationTranscript.forEach((entry, index) => {
      const roleIcon = entry.role === 'ai' ? '🤖' : '👤'
      const roleName = entry.role === 'ai' ? 'AI INTERVIEWER' : 'CANDIDATE'
      
      console.log(`\n[${index + 1}] ${roleIcon} ${roleName} - ${entry.timestamp}`)
      console.log('─'.repeat(55))
      console.log(entry.message)
      console.log('─'.repeat(55))
    })
    
    console.log('\n═══════════════════════════════════════════════════════')
    console.log('END OF TRANSCRIPT')
    console.log('═══════════════════════════════════════════════════════\n\n')
    
    // Also provide as JSON for easy copy-paste
    console.log('📋 TRANSCRIPT AS JSON (for database storage):')
    console.log(JSON.stringify({
      candidate: candidateName,
      position: jobTitle,
      duration: duration,
      transcript: conversationTranscript,
      interviewDate: new Date().toISOString()
    }, null, 2))
  }

  // End the interview
  const stopAIInterview = async () => {
    // Log complete transcript before ending
    if (conversationTranscript.length > 0) {
      logCompleteTranscript()
    }
    
    endSession()
    setAgentId(null)
    
    // Stop screen recording
    console.log('⏹️ Stopping screen recording...')
    stopRecording()
    
    // Store interview data in sessionStorage for the analyzing page
    const interviewData = {
      candidateId: candidateId,
      candidateName: candidateName,
      jobPostingId: jobPostingId,
      jobTitle: jobTitle,
      interviewDuration: duration,
      transcript: conversationTranscript,
      hasRecording: isRecording
    }
    
    sessionStorage.setItem('pendingInterviewAnalysis', JSON.stringify(interviewData))
    
    // Show uploading state
    setIsUploading(true)
    toast.info('Uploading interview recording...', {
      description: 'Please wait while we save your video',
      duration: 60000 // Long duration
    })
    
    // Wait for blob to be ready
    console.log('⏳ Waiting for recording blob...')
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const finalBlob = recordingBlobRef.current
    
    if (finalBlob) {
      console.log('📤 Uploading recording to Supabase...')
      console.log(`📊 Recording size: ${(finalBlob.size / 1024 / 1024).toFixed(2)} MB`)
      
      const videoFile = new File([finalBlob], `interview_${candidateId}.webm`, { type: 'video/webm' })
      
      try {
        const result = await uploadRecordingClient(candidateId, candidateName, jobPostingId, videoFile)
        
        if (result.success) {
          console.log('✅ Recording uploaded:', result.videoUrl)
          toast.success('Video uploaded successfully!', {
            description: 'Redirecting to results...'
          })
          
          // Wait a moment then redirect
          await new Promise(resolve => setTimeout(resolve, 1000))
          router.push(`/interview/${candidateId}/analyzing?name=${encodeURIComponent(candidateName)}&job=${encodeURIComponent(jobTitle)}`)
        } else {
          console.error('❌ Upload failed:', result.error)
          toast.error('Upload failed', {
            description: result.error || 'Could not save recording. Proceeding anyway...'
          })
          
          // Still redirect even if upload fails
          await new Promise(resolve => setTimeout(resolve, 2000))
          router.push(`/interview/${candidateId}/analyzing?name=${encodeURIComponent(candidateName)}&job=${encodeURIComponent(jobTitle)}`)
        }
      } catch (error) {
        console.error('❌ Upload error:', error)
        toast.error('Upload error', {
          description: 'Failed to upload recording. Proceeding anyway...'
        })
        
        // Still redirect even if upload fails
        await new Promise(resolve => setTimeout(resolve, 2000))
        router.push(`/interview/${candidateId}/analyzing?name=${encodeURIComponent(candidateName)}&job=${encodeURIComponent(jobTitle)}`)
      }
    } else {
      console.warn('⚠️ No recording blob available')
      toast.warning('No recording captured', {
        description: 'Proceeding without video...'
      })
      
      // Redirect anyway
      await new Promise(resolve => setTimeout(resolve, 2000))
      router.push(`/interview/${candidateId}/analyzing?name=${encodeURIComponent(candidateName)}&job=${encodeURIComponent(jobTitle)}`)
    }
    
    setIsUploading(false)
  }

  // All questions combined
  const allQuestions = [
    ...screeningQuestions.map(q => ({ text: q, type: 'screening' })),
    ...technicalQuestions.map(q => ({ text: q, type: 'technical' })),
    ...hrQuestions.map(q => ({ text: q, type: 'hr' })),
  ]

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  // Countdown timer - only starts after interview begins
  useEffect(() => {
    if (!interviewStarted || isPaused || timeLeft <= 0) return

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [interviewStarted, isPaused, timeLeft])

  // Initialize camera
  useEffect(() => {
    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        })
        
        streamRef.current = stream
        
        if (candidateVideoRef.current) {
          candidateVideoRef.current.srcObject = stream
        }
      } catch (error) {
        console.error('Error accessing camera:', error)
      }
    }

    if (isVideoOn) {
      initCamera()
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [isVideoOn])

  // Toggle video
  const toggleVideo = () => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled
        setIsVideoOn(videoTrack.enabled)
      }
    }
  }

  // Toggle audio
  const toggleAudio = () => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        setIsMuted(!audioTrack.enabled)
      }
    }
  }

  // Get current question to display
  const getCurrentQuestion = () => {
    // If interview started and we have an AI question, show it
    if (interviewStarted && currentAIQuestion) {
      return currentAIQuestion
    }
    // Before interview starts, show greeting message as preview
    if (!interviewStarted) {
      return greetingMessage
    }
    // Fallback to waiting message
    return 'Waiting for AI interviewer...'
  }

  const getCurrentRoundName = () => {
    if (!interviewStarted) return 'Preview'
    if (!currentAIQuestion) return 'Connecting'
    
    // Try to determine round from the transcript
    const aiQuestions = conversationTranscript.filter(t => t.role === 'ai')
    const questionCount = aiQuestions.length
    
    if (questionCount === 0) return 'Greeting'
    if (questionCount <= screeningQuestions.length) return 'Screening'
    if (questionCount <= screeningQuestions.length + technicalQuestions.length) return 'Technical'
    return 'HR Round'
  }


  const progress = ((duration * 60 - timeLeft) / (duration * 60)) * 100

// Countdown timer - only starts after interview begins
useEffect(() => {
  if (!interviewStarted || isPaused || timeLeft <= 0) return

  const timer = setInterval(() => {
    setTimeLeft(prev => {
      if (prev <= 1) {
        clearInterval(timer)
        return 0
      }
      return prev - 1
    })
  }, 1000)

  return () => clearInterval(timer)
}, [interviewStarted, isPaused, timeLeft])

// Initialize camera
useEffect(() => {
  const initCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      })
        
      streamRef.current = stream
        
      if (candidateVideoRef.current) {
        candidateVideoRef.current.srcObject = stream
      }
    } catch (error) {
      console.error('Error accessing camera:', error)
    }
  }

  if (isVideoOn) {
    initCamera()
  }

  return () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
    }
  }
}, [isVideoOn])

  return (
  <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8 relative">
    {/* Upload Loading Overlay */}
    {isUploading && (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
        <Card className="bg-white p-8 max-w-md w-full mx-4 shadow-2xl">
          <div className="text-center space-y-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 animate-pulse">
              <IconVideo className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Uploading Interview Recording
              </h3>
              <p className="text-gray-600">
                Please wait while we securely save your video...
              </p>
            </div>
            <div className="space-y-2">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full animate-pulse w-3/4"></div>
              </div>
              <p className="text-sm text-gray-500">
                This may take a few moments depending on your connection
              </p>
            </div>
          </div>
        </Card>
      </div>
    )}
    
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3 sm:py-4 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm sm:text-lg">
            {candidateName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-sm sm:text-lg lg:text-xl font-bold text-gray-900">{candidateName}</h1>
            <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">{jobTitle}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 sm:gap-6">
          {/* Start Interview Button */}
          {!agentId ? (
            <Button
              size="default"
              onClick={startAIInterview}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
            >
              <IconMicrophone className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Start AI Interview</span>
              <span className="sm:hidden">Start</span>
            </Button>
          ) : (
            <Button
              size="default"
              variant="destructive"
              onClick={stopAIInterview}
              className="shadow-lg"
            >
              <IconX className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">End Interview</span>
              <span className="sm:hidden">End</span>
            </Button>
          )}
          
          <div className="flex items-center gap-4">
            {/* Recording Indicator */}
            {isRecording && (
              <Badge className="bg-red-600 text-white border-0 animate-pulse">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-white"></span>
                  <span className="hidden sm:inline">Recording</span>
                </span>
              </Badge>
            )}
            
            {/* Timer */}
            <div className="text-right">
              <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wide hidden sm:block">Time Left</p>
              <p className={`text-xl sm:text-2xl lg:text-3xl font-bold tabular-nums ${
                timeLeft < 60 ? 'text-red-600' : 'text-blue-600'
              }`}>
                {formatTime(timeLeft)}
              </p>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.close()}
            className="text-gray-500 hover:text-gray-900 hidden sm:flex"
          >
            <IconX className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <Progress value={progress} className="h-1" />

      {/* Main Content */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-4 p-2 sm:p-4 overflow-auto lg:overflow-hidden">
        {/* Left: AI Interviewer Video */}
        <Card className="bg-white/80 backdrop-blur-sm border-gray-200 overflow-hidden relative group shadow-lg h-[40vh] lg:h-full">
          <div className="absolute top-2 left-2 sm:top-4 sm:left-4 z-10">
            <Badge className="bg-blue-600 text-white border-0 text-xs sm:text-sm">
              AI Interviewer
            </Badge>
          </div>
          
          <div className="h-full relative bg-gradient-to-br from-blue-50 to-indigo-50">
            <video
              ref={aiVideoRef}
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
            >
              <source src="/intervie01 (1).mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            
            {/* Speaking Indicator */}
            {isSpeaking && (
              <div className="absolute bottom-4 left-4 pointer-events-none">
                <div className="flex gap-1 bg-white/90 backdrop-blur-sm rounded-full px-3 py-2 shadow-lg">
                  <div className="w-1.5 h-6 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-1.5 h-6 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-1.5 h-6 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            )}

          </div>

          <div className="absolute bottom-2 sm:bottom-4 right-2 sm:right-4 flex gap-2">
            {status === 'connected' && (
              <Badge className="bg-green-600 text-white border-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-white animate-pulse"></span>
                  Connected
                </span>
              </Badge>
            )}
          </div>
        </Card>

        {/* Right: Camera Feed */}
        <Card className="bg-white/80 backdrop-blur-sm border-gray-200 overflow-hidden relative group shadow-lg h-[40vh] lg:h-full">
          <div className="absolute top-2 left-2 sm:top-4 sm:left-4 z-10">
            <Badge className="bg-blue-600 text-white border-0 text-xs sm:text-sm">
              Your Camera
            </Badge>
          </div>
          
          <div className="h-full relative bg-gray-100">
            <video
              ref={candidateVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            
            {!isVideoOn && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                <div className="text-center">
                  <IconVideoOff className="h-16 w-16 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">Camera is off</p>
                </div>
              </div>
            )}
          </div>

          {/* Camera Controls */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="sm"
              variant={isMuted ? "destructive" : "secondary"}
              onClick={toggleAudio}
              className="bg-white/90 backdrop-blur-sm hover:bg-white shadow-md"
            >
              {isMuted ? (
                <IconMicrophoneOff className="h-4 w-4" />
              ) : (
                <IconMicrophone className="h-4 w-4" />
              )}
            </Button>
            
            <Button
              size="sm"
              variant={!isVideoOn ? "destructive" : "secondary"}
              onClick={toggleVideo}
              className="bg-white/90 backdrop-blur-sm hover:bg-white shadow-md"
            >
              {isVideoOn ? (
                <IconVideo className="h-4 w-4" />
              ) : (
                <IconVideoOff className="h-4 w-4" />
              )}
            </Button>
          </div>
        </Card>
      </div>

      {/* Bottom: Interview Questions */}
      <Card className="mx-2 sm:mx-4 mb-2 sm:mb-4 bg-white/80 backdrop-blur-sm border-gray-200 p-3 sm:p-4 lg:p-6 shadow-lg">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-6">
          <div className="flex-1 w-full">
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3 flex-wrap">
              <Badge className="bg-blue-600 text-white border-0 text-xs sm:text-sm">
                {getCurrentRoundName().toUpperCase()}
              </Badge>
              <span className="text-xs sm:text-sm text-gray-600">
                {conversationTranscript.filter(t => t.role === 'ai').length > 0 
                  ? `Question ${conversationTranscript.filter(t => t.role === 'ai').length}`
                  : 'Current Question'}
              </span>
            </div>
            
            <p className="text-sm sm:text-base lg:text-lg text-gray-900 leading-relaxed">
              {getCurrentQuestion()}
            </p>
          </div>

          <div className="flex gap-2 w-full sm:w-auto justify-end">
            {isSpeaking && (
              <Badge className="bg-green-600 text-white border-0 animate-pulse">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-white"></span>
                  AI Speaking
                </span>
              </Badge>
            )}
          </div>
        </div>
      </Card>
    </div>
    </div>
  )
}
