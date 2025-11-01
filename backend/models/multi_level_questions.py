"""
Pydantic models for multi-level interview question generation
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime


class QuestionVariation(BaseModel):
    """A single difficulty variation of a question"""
    difficulty: str = Field(..., description="Difficulty level: easy, medium, or difficult")
    question: str = Field(..., description="The interview question text")
    expected_duration_seconds: int = Field(..., description="Expected time for candidate to answer")


class QuestionGroup(BaseModel):
    """A group containing a base question and its difficulty variations"""
    base_question: str = Field(..., description="The base question concept")
    variations: List[QuestionVariation] = Field(..., description="3 difficulty variations of the question")


class MultiLevelQuestionGenerationRequest(BaseModel):
    """Request model for generating multi-level interview questions"""
    candidate_id: str = Field(..., description="UUID of the candidate")
    candidate_name: str = Field(..., description="Name of the candidate")
    job_posting_id: str = Field(..., description="UUID of the job posting")
    job_title: str = Field(..., description="Job title/position")
    job_description: str = Field(..., description="Detailed job description")
    job_requirements: str = Field(..., description="Job requirements and qualifications")
    skills_required: List[str] = Field(default_factory=list, description="List of required skills")
    ai_analysis: Optional[str] = Field(None, description="AI-generated analysis of the job")
    duration_minutes: int = Field(..., description="Interview duration in minutes (10, 20, 30, 45, 60)")
    screening_percentage: int = Field(default=30, description="Percentage of screening questions")
    technical_percentage: int = Field(default=50, description="Percentage of technical questions")
    hr_percentage: int = Field(default=20, description="Percentage of HR questions")


class MultiLevelQuestionGenerationResponse(BaseModel):
    """Response model for multi-level interview questions"""
    candidate_id: str
    candidate_name: str
    job_posting_id: str
    interview_duration: int
    screening_percentage: int
    technical_percentage: int
    hr_percentage: int
    base_questions_count: int = Field(..., description="Number of base questions generated")
    total_questions: int = Field(..., description="Total questions including all variations (base_count * 3)")
    greeting_message: str
    screening_questions: List[QuestionGroup]
    technical_questions: List[QuestionGroup]
    hr_questions: List[QuestionGroup]
    model: str = Field(default="gpt-4o", description="AI model used for generation")
    generation_time_ms: int = Field(..., description="Time taken to generate questions in milliseconds")
    generated_at: str = Field(..., description="ISO timestamp of generation")


class QuestionDistribution(BaseModel):
    """Distribution of questions across categories"""
    screening: int
    technical: int
    hr: int
    base_total: int
    total_with_variations: int
