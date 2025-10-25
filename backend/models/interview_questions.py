"""
Pydantic models for interview question generation
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class InterviewQuestionGenerationRequest(BaseModel):
    """Request model for generating interview questions"""
    job_title: str = Field(..., description="Job title/position")
    job_description: str = Field(..., description="Full job description")
    job_requirements: str = Field(..., description="Job requirements")
    skills_required: List[str] = Field(default=[], description="Required skills")
    ai_analysis: Optional[Dict[str, Any]] = Field(None, description="AI analysis of job posting")
    candidate_name: str = Field(..., description="Candidate's name")
    screening_count: int = Field(..., description="Number of screening questions")
    technical_count: int = Field(..., description="Number of technical questions")
    hr_count: int = Field(..., description="Number of HR questions")
    duration: int = Field(..., description="Interview duration in minutes")

class InterviewQuestion(BaseModel):
    """Individual interview question"""
    question: str = Field(..., description="The interview question")
    category: str = Field(..., description="Question category (screening/technical/hr)")
    difficulty: Optional[str] = Field(None, description="Question difficulty level")

class InterviewQuestionGenerationResponse(BaseModel):
    """Response model for generated interview questions"""
    screening_questions: List[str] = Field(..., description="Screening round questions")
    technical_questions: List[str] = Field(..., description="Technical round questions")
    hr_questions: List[str] = Field(..., description="HR round questions")
    total_questions: int = Field(..., description="Total number of questions generated")
    model: str = Field(..., description="AI model used for generation")
    generation_time_ms: Optional[int] = Field(None, description="Time taken to generate in milliseconds")
