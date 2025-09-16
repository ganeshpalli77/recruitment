"""
Pydantic models for resume evaluation
"""

from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID

class ResumeUploadRequest(BaseModel):
    """Request model for resume upload"""
    job_posting_id: str = Field(..., description="UUID of the job posting")
    file_name: str = Field(..., description="Name of the resume file")
    file_content: Optional[str] = Field(None, description="Base64 encoded file content")
    file_url: Optional[str] = Field(None, description="URL where file is stored")

class BatchResumeUploadRequest(BaseModel):
    """Request model for batch resume upload"""
    job_posting_id: str = Field(..., description="UUID of the job posting")
    resumes: List[Dict[str, str]] = Field(..., description="List of resume files with name and content/url")

class ResumeEvaluationResult(BaseModel):
    """Response model for resume evaluation"""
    model_config = ConfigDict(from_attributes=True)
    
    # Identification
    id: Optional[UUID] = None
    job_posting_id: str
    candidate_name: str
    candidate_email: Optional[str] = None
    candidate_phone: Optional[str] = None
    
    # File info
    resume_file_name: str
    resume_file_url: Optional[str] = None
    
    # Scores
    skills_score: int = Field(..., ge=0, le=100)
    experience_score: int = Field(..., ge=0, le=100)
    education_score: int = Field(..., ge=0, le=100)
    overall_score: int = Field(..., ge=0, le=100)
    
    # Detailed evaluation
    skills_matched: List[str] = []
    skills_missing: List[str] = []
    experience_details: Dict[str, Any] = {}
    education_details: Dict[str, Any] = {}
    
    # Insights
    evaluation_summary: Optional[str] = None
    key_strengths: List[str] = []
    improvement_areas: List[str] = []
    recommendation: str = Field(..., description="STRONG_MATCH, GOOD_MATCH, FAIR_MATCH, NO_MATCH")
    
    # Processing info
    processing_status: str = "pending"
    processing_error: Optional[str] = None
    processing_time_ms: Optional[int] = None
    
    # Timestamps
    evaluated_at: Optional[datetime] = None
    created_at: Optional[datetime] = None

class ResumeEvaluationResponse(BaseModel):
    """Response wrapper for resume evaluation"""
    success: bool
    message: str
    result: Optional[ResumeEvaluationResult] = None
    error: Optional[str] = None

class BatchEvaluationResponse(BaseModel):
    """Response for batch resume evaluation"""
    success: bool
    message: str
    total_processed: int
    successful: int
    failed: int
    results: List[ResumeEvaluationResult] = []
    errors: List[Dict[str, str]] = []

class ResumeSearchRequest(BaseModel):
    """Request model for searching evaluated resumes"""
    job_posting_id: Optional[str] = None
    min_score: Optional[int] = Field(None, ge=0, le=100)
    max_score: Optional[int] = Field(None, ge=0, le=100)
    recommendation: Optional[str] = None
    limit: int = Field(100, ge=1, le=1000)
    offset: int = Field(0, ge=0)
    sort_by: str = Field("overall_score", description="Field to sort by")
    sort_order: str = Field("desc", description="asc or desc")

class ResumeRankingResponse(BaseModel):
    """Response for resume ranking"""
    job_posting_id: str
    job_title: str
    total_candidates: int
    evaluated_candidates: int
    rankings: List[ResumeEvaluationResult] = []

class EvaluationStatistics(BaseModel):
    """Statistics for evaluations"""
    total_evaluations: int
    average_score: float
    score_distribution: Dict[str, int]  # score ranges and counts
    top_skills: List[Dict[str, Any]]  # skill and frequency
    recommendation_distribution: Dict[str, int]
    average_processing_time_ms: float
    evaluation_period: Dict[str, datetime]  # start and end dates
