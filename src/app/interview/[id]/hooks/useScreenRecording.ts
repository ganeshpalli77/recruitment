'use client'

import { useState, useRef, useCallback } from 'react'
import { toast } from 'sonner'

interface UseScreenRecordingProps {
  onRecordingComplete?: (videoBlob: Blob) => void
}

export function useScreenRecording({ onRecordingComplete }: UseScreenRecordingProps = {}) {
  const [isRecording, setIsRecording] = useState(false)
  const [recordingError, setRecordingError] = useState<string | null>(null)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const screenStreamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const startRecording = useCallback(async () => {
    try {
      console.log('🎥 Requesting screen recording permissions...')
      
      // Request screen capture
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        } as any,
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        } as any,
      })

      screenStreamRef.current = screenStream
      
      // Create media recorder
      let mimeType = 'video/webm;codecs=vp9'
      
      // Fallback to vp8 if vp9 not supported
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm;codecs=vp8'
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'video/webm'
        }
      }
      
      const options: MediaRecorderOptions = {
        mimeType: mimeType,
        videoBitsPerSecond: 2500000, // 2.5 Mbps for good quality
      }

      const mediaRecorder = new MediaRecorder(screenStream, options)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      // Handle data available
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data)
          console.log(`📦 Chunk recorded: ${event.data.size} bytes`)
        }
      }

      // Handle recording stop
      mediaRecorder.onstop = () => {
        console.log('🛑 Recording stopped. Processing...')
        const videoBlob = new Blob(chunksRef.current, { type: 'video/webm' })
        console.log(`✅ Recording complete. Total size: ${(videoBlob.size / 1024 / 1024).toFixed(2)} MB`)
        
        if (onRecordingComplete) {
          onRecordingComplete(videoBlob)
        }
        
        // Clean up
        if (screenStreamRef.current) {
          screenStreamRef.current.getTracks().forEach(track => track.stop())
          screenStreamRef.current = null
        }
        
        chunksRef.current = []
        setIsRecording(false)
      }

      // Handle errors
      mediaRecorder.onerror = (event: any) => {
        console.error('❌ Recording error:', event.error)
        setRecordingError(event.error?.message || 'Recording failed')
        toast.error('Recording Error', {
          description: 'Failed to record screen. Please try again.'
        })
      }

      // Handle stream ending (user stopped sharing)
      screenStream.getVideoTracks()[0].onended = () => {
        console.log('⚠️ User stopped screen sharing')
        toast.warning('Screen sharing stopped', {
          description: 'Please share your screen again to continue the interview'
        })
        stopRecording()
      }

      // Start recording
      mediaRecorder.start(1000) // Collect data every second
      setIsRecording(true)
      setRecordingError(null)
      
      console.log('✅ Screen recording started')
      toast.success('Recording Started', {
        description: 'Your screen is being recorded for proctoring'
      })

      return true
    } catch (error: any) {
      console.error('❌ Failed to start screen recording:', error)
      
      let errorMessage = 'Failed to start screen recording'
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Screen recording permission denied. You must allow screen sharing to proceed.'
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No screen available to record'
      }
      
      setRecordingError(errorMessage)
      toast.error('Recording Failed', {
        description: errorMessage
      })
      
      return false
    }
  }, [onRecordingComplete])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      console.log('⏹️ Stopping recording...')
      mediaRecorderRef.current.stop()
    }
  }, [isRecording])

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.pause()
      console.log('⏸️ Recording paused')
    }
  }, [isRecording])

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.resume()
      console.log('▶️ Recording resumed')
    }
  }, [isRecording])

  return {
    isRecording,
    recordingError,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
  }
}
