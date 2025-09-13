"""
Pydantic models for job analysis requests and responses
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class JobAnalysisRequest(BaseModel):
    """Request model for job analysis"""
    job_id: str = Field(..., description="Unique job posting ID")
    title: str = Field(..., description="Job title")
    description: str = Field(..., description="Job description")
    requirements: Optional[str] = Field(None, description="Job requirements")

class AnalysisResult(BaseModel):
    """AI analysis result model"""
    key_skills: List[str] = Field(..., description="Extracted key skills")
    required_experience: Optional[str] = Field(None, description="Required experience level")
    education_requirements: List[str] = Field(default_factory=list, description="Education requirements")
    responsibilities: List[str] = Field(default_factory=list, description="Key responsibilities")
    qualifications: List[str] = Field(default_factory=list, description="Required qualifications")
    nice_to_have: List[str] = Field(default_factory=list, description="Nice to have skills")
    job_level: Optional[str] = Field(None, description="Job level (entry, mid, senior, etc.)")
    remote_work: Optional[bool] = Field(None, description="Remote work availability")
    salary_range: Optional[str] = Field(None, description="Salary range if mentioned")
    company_benefits: List[str] = Field(default_factory=list, description="Company benefits")
    industry: Optional[str] = Field(None, description="Industry/domain")
    job_summary: str = Field(..., description="AI-generated job summary")
    difficulty_score: int = Field(..., ge=1, le=10, description="Job difficulty score (1-10)")
    ai_confidence_score: float = Field(..., ge=0.0, le=1.0, description="AI confidence in analysis")

class JobAnalysisResponse(BaseModel):
    """Response model for job analysis"""
    job_id: str = Field(..., description="Job posting ID")
    analysis_result: AnalysisResult = Field(..., description="Analysis results")
    status: str = Field(..., description="Analysis status")
    message: str = Field(..., description="Response message")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Analysis timestamp")

class JobAnalysisDB(BaseModel):
    """Database model for storing job analysis"""
    id: str
    ai_key_skills: List[str]
    ai_experience_level: Optional[str]
    ai_education_requirements: List[str]
    ai_responsibilities: List[str]
    ai_qualifications: List[str]
    ai_nice_to_have: List[str]
    ai_job_level: Optional[str]
    ai_remote_work: Optional[bool]
    ai_salary_range: Optional[str]
    ai_benefits: List[str]
    ai_industry: Optional[str]
    ai_job_summary: str
    ai_difficulty_score: int
    ai_confidence_score: float
    ai_analysis_date: datetime
