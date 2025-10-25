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

interface InterviewScreenProps {
  candidateName: string
  duration: number // in minutes
  greetingMessage: string
  screeningQuestions: string[]
  technicalQuestions: string[]
  hrQuestions: string[]
  jobTitle: string
}

export function InterviewScreen({
  candidateName,
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
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

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

  // Countdown timer
  useEffect(() => {
    if (isPaused || timeLeft <= 0) return

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
  }, [isPaused, timeLeft])

  // Initialize camera
  useEffect(() => {
    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        })
        
        streamRef.current = stream
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream
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
    if (currentRound === 'greeting') {
      return greetingMessage
    }
    return allQuestions[currentQuestionIndex]?.text || ''
  }

  const getCurrentRoundName = () => {
    if (currentRound === 'greeting') return 'Greeting'
    return allQuestions[currentQuestionIndex]?.type || ''
  }

  const nextQuestion = () => {
    if (currentRound === 'greeting') {
      setCurrentRound('screening')
      setCurrentQuestionIndex(0)
    } else if (currentQuestionIndex < allQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    }
  }

  const progress = ((duration * 60 - timeLeft) / (duration * 60)) * 100

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-50 flex flex-col overflow-hidden">
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
          <div className="text-right">
            <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wide hidden sm:block">Time Left</p>
            <p className={`text-xl sm:text-2xl lg:text-3xl font-bold tabular-nums ${
              timeLeft < 60 ? 'text-red-600' : 'text-blue-600'
            }`}>
              {formatTime(timeLeft)}
            </p>
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
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
            >
              <source src="/intervie01 (1).mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>

          <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="sm"
              variant="secondary"
              className="bg-white/90 backdrop-blur-sm hover:bg-white shadow-md"
              onClick={(e) => {
                const video = e.currentTarget.closest('div')?.querySelector('video')
                if (video) {
                  if (video.paused) {
                    video.play()
                  } else {
                    video.pause()
                  }
                }
              }}
            >
              <IconPlayerPlay className="h-4 w-4" />
            </Button>
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
              ref={videoRef}
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
                Question {currentRound === 'greeting' ? 'Greeting' : `${currentQuestionIndex + 1} of ${allQuestions.length}`}
              </span>
            </div>
            
            <p className="text-sm sm:text-base lg:text-lg text-gray-900 leading-relaxed">
              {getCurrentQuestion()}
            </p>
          </div>

          <div className="flex gap-2 w-full sm:w-auto justify-end">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsPaused(!isPaused)}
              className="bg-gray-100 hover:bg-gray-200"
            >
              {isPaused ? (
                <IconPlayerPlay className="h-4 w-4" />
              ) : (
                <IconPlayerPause className="h-4 w-4" />
              )}
            </Button>
            
            <Button
              onClick={nextQuestion}
              disabled={currentQuestionIndex >= allQuestions.length - 1 && currentRound !== 'greeting'}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm sm:text-base"
              size="sm"
            >
              <span className="hidden sm:inline">Next Question</span>
              <span className="sm:hidden">Next</span>
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
