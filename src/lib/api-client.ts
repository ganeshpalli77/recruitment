/**
 * API client for communicating with the FastAPI backend
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export interface JobAnalysisRequest {
  job_id: string
  title: string
  description: string
  requirements?: string
}

export interface AnalysisResult {
  key_skills: string[]
  required_experience?: string
  education_requirements: string[]
  responsibilities: string[]
  qualifications: string[]
  nice_to_have: string[]
  job_level?: string
  remote_work?: boolean
  salary_range?: string
  company_benefits: string[]
  industry?: string
  job_summary: string
  difficulty_score: number
  ai_confidence_score: number
}

export interface JobAnalysisResponse {
  job_id: string
  analysis_result: AnalysisResult
  status: string
  message: string
  timestamp: string
}

export interface HealthCheckResponse {
  status: string
  timestamp: string
  services: {
    azure_openai: string
    supabase: string
  }
}

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl
  }

  /**
   * Check if the backend is healthy and services are connected
   */
  async healthCheck(): Promise<HealthCheckResponse> {
    const response = await fetch(`${this.baseUrl}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Health check failed: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Trigger AI analysis of a job description
   */
  async analyzeJob(request: JobAnalysisRequest): Promise<JobAnalysisResponse> {
    const response = await fetch(`${this.baseUrl}/analyze-job`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: response.statusText }))
      throw new Error(`Job analysis failed: ${errorData.detail || response.statusText}`)
    }

    return response.json()
  }

  /**
   * Get existing job analysis from backend
   */
  async getJobAnalysis(jobId: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/job/${jobId}/analysis`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (response.status === 404) {
      return null // No analysis found
    }

    if (!response.ok) {
      throw new Error(`Failed to get job analysis: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Test if the backend is reachable
   */
  async isBackendReachable(): Promise<boolean> {
    try {
      await fetch(`${this.baseUrl}/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      return true
    } catch {
      return false
    }
  }
}

// Export singleton instance
export const apiClient = new ApiClient()

// Export types
export type { JobAnalysisRequest, JobAnalysisResponse, AnalysisResult, HealthCheckResponse }
