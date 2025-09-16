"use client"

import React, { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { uploadResume } from '../actions'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  IconUpload,
  IconFile,
  IconX,
  IconCheck,
  IconLoader,
  IconCloudUpload,
  IconFileText,
  IconAlertCircle,
  IconSparkles,
  IconBrain,
} from "@tabler/icons-react"

interface ResumeUploadFormProps {
  jobId: string
}

interface UploadedFile {
  file: File
  id: string
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error'
  progress: number
  error?: string
}

export function ResumeUploadForm({ jobId }: ResumeUploadFormProps) {
  const router = useRouter()
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const acceptedFileTypes = ['.pdf', '.doc', '.docx', '.txt']
  const maxFileSize = 10 * 1024 * 1024 // 10MB

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const droppedFiles = Array.from(e.dataTransfer.files)
    handleFiles(droppedFiles)
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    handleFiles(selectedFiles)
  }, [])

  const handleFiles = useCallback((newFiles: File[]) => {
    const validFiles = newFiles.filter(file => {
      // Check file type
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
      if (!acceptedFileTypes.includes(fileExtension)) {
        alert(`File ${file.name} is not supported. Please upload PDF, DOC, DOCX, or TXT files.`)
        return false
      }
      
      // Check file size
      if (file.size > maxFileSize) {
        alert(`File ${file.name} is too large. Maximum file size is 10MB.`)
        return false
      }
      
      return true
    })

    const uploadedFiles: UploadedFile[] = validFiles.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      status: 'pending',
      progress: 0
    }))

    setFiles(prev => [...prev, ...uploadedFiles])
  }, [])

  const removeFile = useCallback((fileId: string) => {
    setFiles(prev => prev.filter(file => file.id !== fileId))
  }, [])

  const clearAllFiles = useCallback(() => {
    setFiles([])
  }, [])

  const processFiles = useCallback(async () => {
    if (files.length === 0) return

    setIsProcessing(true)

    try {
      // Update all files to uploading status
      setFiles(prev => prev.map(file => ({ ...file, status: 'uploading' as const })))

      // Process files one by one
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        
        try {
          // Simulate progress for uploading
          for (let progress = 0; progress <= 50; progress += 10) {
            setFiles(prev => prev.map(f => 
              f.id === file.id ? { ...f, progress } : f
            ))
            await new Promise(resolve => setTimeout(resolve, 200))
          }

          // Create FormData for file upload
          const formData = new FormData()
          formData.append('resume', file.file)
          formData.append('jobId', jobId)

          // Upload file using server action
          const result = await uploadResume(formData)

          if (result.error) {
            throw new Error(result.error)
          }

          // Update to processing status
          setFiles(prev => prev.map(f => 
            f.id === file.id ? { ...f, status: 'processing', progress: 75 } : f
          ))

          // Simulate AI processing
          await new Promise(resolve => setTimeout(resolve, 2000))

          // Complete
          setFiles(prev => prev.map(f => 
            f.id === file.id ? { ...f, status: 'completed', progress: 100 } : f
          ))

        } catch (error) {
          setFiles(prev => prev.map(f => 
            f.id === file.id ? { 
              ...f, 
              status: 'error', 
              error: 'Upload failed. Please try again.' 
            } : f
          ))
        }
      }

      // Refresh the page after a short delay to show new candidates
      setTimeout(() => {
        router.refresh()
      }, 1000)

    } catch (error) {
      console.error('Processing error:', error)
    } finally {
      setIsProcessing(false)
    }
  }, [files, jobId, router])

  const getStatusIcon = (status: UploadedFile['status']) => {
    switch (status) {
      case 'pending':
        return <IconFile className="h-4 w-4 text-gray-500" />
      case 'uploading':
        return <IconCloudUpload className="h-4 w-4 text-blue-500 animate-pulse" />
      case 'processing':
        return <IconBrain className="h-4 w-4 text-purple-500 animate-pulse" />
      case 'completed':
        return <IconCheck className="h-4 w-4 text-green-500" />
      case 'error':
        return <IconAlertCircle className="h-4 w-4 text-red-500" />
    }
  }

  const getStatusColor = (status: UploadedFile['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-gray-100 text-gray-700'
      case 'uploading':
        return 'bg-blue-100 text-blue-700'
      case 'processing':
        return 'bg-purple-100 text-purple-700'
      case 'completed':
        return 'bg-green-100 text-green-700'
      case 'error':
        return 'bg-red-100 text-red-700'
    }
  }

  const allCompleted = files.length > 0 && files.every(file => file.status === 'completed')
  const hasErrors = files.some(file => file.status === 'error')
  const canProcess = files.length > 0 && !isProcessing

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
          isDragging
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 hover:border-gray-400 dark:border-gray-600'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.txt"
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isProcessing}
        />
        
        <div className="space-y-3">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-2xl flex items-center justify-center">
            <IconUpload className={`h-8 w-8 ${isDragging ? 'text-blue-600 scale-110' : 'text-gray-500'} transition-all duration-200`} />
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              {isDragging ? 'Drop files here' : 'Upload Resumes'}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Drag & drop files or click to browse
            </p>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-gray-500">
            <span>Supports:</span>
            {acceptedFileTypes.map(type => (
              <Badge key={type} variant="outline" className="text-xs">
                {type.toUpperCase()}
              </Badge>
            ))}
          </div>
          
          <p className="text-xs text-gray-500">
            Maximum file size: 10MB
          </p>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-gray-900 dark:text-white">
                Files ({files.length})
              </h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFiles}
                disabled={isProcessing}
              >
                Clear All
              </Button>
            </div>
            
            <div className="space-y-3">
              {files.map(file => (
                <div
                  key={file.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="flex-shrink-0">
                    {getStatusIcon(file.status)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {file.file.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className={`text-xs ${getStatusColor(file.status)}`}>
                        {file.status.charAt(0).toUpperCase() + file.status.slice(1)}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {(file.file.size / 1024 / 1024).toFixed(1)} MB
                      </span>
                    </div>
                    
                    {file.status === 'uploading' || file.status === 'processing' ? (
                      <div className="mt-2">
                        <Progress value={file.progress} className="h-2" />
                        <p className="text-xs text-gray-500 mt-1">
                          {file.status === 'uploading' ? 'Uploading...' : 'AI Processing...'}
                        </p>
                      </div>
                    ) : null}
                    
                    {file.error && (
                      <p className="text-xs text-red-600 mt-1">{file.error}</p>
                    )}
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(file.id)}
                    disabled={isProcessing}
                    className="flex-shrink-0"
                  >
                    <IconX className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Process Button */}
      {canProcess && (
        <Button
          onClick={processFiles}
          disabled={isProcessing}
          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
          size="lg"
        >
          {isProcessing ? (
            <>
              <IconLoader className="h-4 w-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <IconSparkles className="h-4 w-4 mr-2" />
              Process with AI ({files.length} files)
            </>
          )}
        </Button>
      )}

      {/* Success Message */}
      {allCompleted && (
        <Alert className="border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400">
          <IconCheck className="h-4 w-4" />
          <AlertDescription>
            All files have been processed successfully! Candidates have been analyzed and ranked.
          </AlertDescription>
        </Alert>
      )}

      {/* Error Message */}
      {hasErrors && (
        <Alert variant="destructive">
          <IconAlertCircle className="h-4 w-4" />
          <AlertDescription>
            Some files failed to process. Please try uploading them again.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
