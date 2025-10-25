'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  IconBriefcase,
  IconCode,
  IconUsers,
  IconAlertCircle,
} from "@tabler/icons-react"
import { cn } from "@/lib/utils"

interface QuestionDistributionProps {
  screeningPercentage: number
  technicalPercentage: number
  hrPercentage: number
  onDistributionChange: (screening: number, technical: number, hr: number) => void
}

export function QuestionDistribution({
  screeningPercentage,
  technicalPercentage,
  hrPercentage,
  onDistributionChange,
}: QuestionDistributionProps) {
  const [screening, setScreening] = useState(screeningPercentage)
  const [technical, setTechnical] = useState(technicalPercentage)
  const [hr, setHr] = useState(hrPercentage)

  const total = screening + technical + hr
  const isValid = total === 100

  // Auto-adjust to maintain 100% total
  const handleScreeningChange = (value: number[]) => {
    const newScreening = value[0]
    const remaining = 100 - newScreening
    const ratio = remaining > 0 ? (technical + hr) / (technical + hr || 1) : 0
    
    const newTechnical = Math.round(remaining * (technical / (technical + hr || 1)))
    const newHr = remaining - newTechnical

    setScreening(newScreening)
    setTechnical(newTechnical)
    setHr(newHr)
    onDistributionChange(newScreening, newTechnical, newHr)
  }

  const handleTechnicalChange = (value: number[]) => {
    const newTechnical = value[0]
    const remaining = 100 - newTechnical
    const ratio = remaining > 0 ? (screening + hr) / (screening + hr || 1) : 0
    
    const newScreening = Math.round(remaining * (screening / (screening + hr || 1)))
    const newHr = remaining - newScreening

    setScreening(newScreening)
    setTechnical(newTechnical)
    setHr(newHr)
    onDistributionChange(newScreening, newTechnical, newHr)
  }

  const handleHrChange = (value: number[]) => {
    const newHr = value[0]
    const remaining = 100 - newHr
    const ratio = remaining > 0 ? (screening + technical) / (screening + technical || 1) : 0
    
    const newScreening = Math.round(remaining * (screening / (screening + technical || 1)))
    const newTechnical = remaining - newScreening

    setScreening(newScreening)
    setTechnical(newTechnical)
    setHr(newHr)
    onDistributionChange(newScreening, newTechnical, newHr)
  }

  return (
    <Card className="w-full">
      <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 py-3 px-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <IconBriefcase className="h-5 w-5 text-purple-600" />
              Question Distribution
            </CardTitle>
            <CardDescription className="mt-1 text-sm">
              Configure the percentage of questions for each interview round
            </CardDescription>
          </div>
          <Badge 
            variant={isValid ? "default" : "destructive"}
            className={cn(
              "text-xs px-3 py-1",
              isValid 
                ? "bg-green-100 text-green-800 border-green-300 hover:bg-green-100" 
                : "bg-red-100 text-red-800 border-red-300"
            )}
          >
            {isValid ? (
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-green-600 animate-pulse"></span>
                {total}%
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <IconAlertCircle className="h-3 w-3" />
                {total}%
              </span>
            )}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {/* Screening Round */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <IconUsers className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <Label htmlFor="screening-slider" className="text-sm font-semibold text-gray-900 dark:text-white">
                  Screening Round
                </Label>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Basic qualification assessment
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-blue-600">{screening}%</div>
            </div>
          </div>
          <Slider
            id="screening-slider"
            min={0}
            max={100}
            step={5}
            value={[screening]}
            onValueChange={handleScreeningChange}
            className="w-full"
          />
        </div>

        {/* Technical Round */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <IconCode className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <Label htmlFor="technical-slider" className="text-sm font-semibold text-gray-900 dark:text-white">
                  Technical Round
                </Label>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Skills and technical knowledge
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-purple-600">{technical}%</div>
            </div>
          </div>
          <Slider
            id="technical-slider"
            min={0}
            max={100}
            step={5}
            value={[technical]}
            onValueChange={handleTechnicalChange}
            className="w-full"
          />
        </div>

        {/* HR Round */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-green-100 dark:bg-green-900 rounded-lg">
                <IconBriefcase className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <Label htmlFor="hr-slider" className="text-sm font-semibold text-gray-900 dark:text-white">
                  HR Round
                </Label>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Soft skills and communication
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-green-600">{hr}%</div>
            </div>
          </div>
          <Slider
            id="hr-slider"
            min={0}
            max={100}
            step={5}
            value={[hr]}
            onValueChange={handleHrChange}
            className="w-full"
          />
        </div>

        {/* Summary */}
        <div className="pt-3 border-t">
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-2 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <div className="text-lg font-bold text-blue-600">{screening}%</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Screening</div>
            </div>
            <div className="text-center p-2 bg-purple-50 dark:bg-purple-950 rounded-lg">
              <div className="text-lg font-bold text-purple-600">{technical}%</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Technical</div>
            </div>
            <div className="text-center p-2 bg-green-50 dark:bg-green-950 rounded-lg">
              <div className="text-lg font-bold text-green-600">{hr}%</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">HR</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
