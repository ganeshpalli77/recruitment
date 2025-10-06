'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  IconClock,
  IconDeviceFloppy,
  IconLoader2,
  IconCheck,
} from "@tabler/icons-react"
import { toast } from "sonner"
import { updateInterviewSettings } from '../lib/actions'
import { cn } from "@/lib/utils"

interface InterviewSettingsFormProps {
  jobId: string
  currentSettings: {
    duration: number
    interviewType: string
    rounds: number
    interviewers: string[]
    location: string
    meetingLink?: string
    notificationsEnabled: boolean
    timeSlots?: any[]
    bufferTime?: number
  }
}

const DURATION_OPTIONS = [
  { value: '20', label: '20 minutes', description: 'Quick screening interview' },
  { value: '30', label: '30 minutes', description: 'Standard initial interview' },
  { value: '45', label: '45 minutes', description: 'In-depth technical discussion' },
  { value: '60', label: '60 minutes', description: 'Comprehensive evaluation' },
]

export function InterviewSettingsForm({ jobId, currentSettings }: InterviewSettingsFormProps) {
  const router = useRouter()
  const [duration, setDuration] = useState(String(currentSettings.duration))
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const updatedSettings = {
        ...currentSettings,
        duration: parseInt(duration),
      }

      const result = await updateInterviewSettings(jobId, updatedSettings)

      if (result.success) {
        toast.success('Interview settings saved successfully!')
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to save settings')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setIsSaving(false)
    }
  }

  const hasChanges = parseInt(duration) !== currentSettings.duration

  return (
    <Card className="w-full">
      <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <IconClock className="h-6 w-6 text-blue-600" />
              Interview Duration
            </CardTitle>
            <CardDescription className="mt-2 text-base">
              Select how long each interview session should last
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            {hasChanges && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
                <IconClock className="h-4 w-4" />
                Unsaved changes
              </div>
            )}
            <Button
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6"
            >
              {isSaving ? (
                <>
                  <IconLoader2 className="h-5 w-5 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <IconDeviceFloppy className="h-5 w-5 mr-2" />
                  Save Settings
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {DURATION_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => setDuration(option.value)}
              className={cn(
                "relative p-6 rounded-xl border-2 transition-all duration-200 text-left group hover:shadow-lg",
                duration === option.value
                  ? "border-blue-600 bg-blue-50 dark:bg-blue-950 shadow-md scale-105"
                  : "border-gray-200 dark:border-gray-700 hover:border-blue-300 hover:bg-gray-50 dark:hover:bg-gray-800"
              )}
            >
              {/* Selected Indicator */}
              {duration === option.value && (
                <div className="absolute top-3 right-3 flex items-center justify-center w-6 h-6 bg-blue-600 rounded-full">
                  <IconCheck className="h-4 w-4 text-white" />
                </div>
              )}

              {/* Duration Badge */}
              <div className={cn(
                "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold mb-3",
                duration === option.value
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 group-hover:bg-blue-100 group-hover:text-blue-700"
              )}>
                <IconClock className="h-4 w-4" />
                {option.label}
              </div>

              {/* Description */}
              <p className={cn(
                "text-sm leading-relaxed",
                duration === option.value
                  ? "text-blue-900 dark:text-blue-100 font-medium"
                  : "text-gray-600 dark:text-gray-400"
              )}>
                {option.description}
              </p>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
