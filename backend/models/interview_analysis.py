"""
Pydantic models for interview analysis
"""

from pydantic import BaseModel, Field
from typing import List, Optional

class QuestionAnswerPair(BaseModel):
    """Individual question-answer pair from the interview"""
    question: str = Field(..., description="The question asked by AI")
    answer: str = Field(..., description="The candidate's response")
    timestamp: str = Field(..., description="When this exchange occurred")

class QuestionAnalysis(BaseModel):
    """Analysis of a single question-answer pair"""
    question: str = Field(..., description="The question")
    answer: str = Field(..., description="The candidate's answer")
    score: int = Field(..., ge=1, le=5, description="Score from 1-5")
    feedback: str = Field(..., description="Detailed feedback on the answer")
    strengths: List[str] = Field(default=[], description="What the candidate did well")
    improvements: List[str] = Field(default=[], description="Areas for improvement")

class OverallAnalysis(BaseModel):
    """Overall interview analysis"""
    overall_score: int = Field(..., ge=1, le=5, description="Overall score from 1-5")
    summary: str = Field(..., description="Overall performance summary")
    key_strengths: List[str] = Field(..., description="Main strengths across interview")
    key_weaknesses: List[str] = Field(..., description="Main areas for improvement")
    recommendation: str = Field(..., description="Hiring recommendation")
    confidence_level: str = Field(..., description="Candidate's confidence level")
    communication_quality: str = Field(..., description="Quality of communication")

class InterviewAnalysisRequest(BaseModel):
    """Request for interview analysis"""
    candidate_id: str = Field(..., description="Candidate ID")
    candidate_name: str = Field(..., description="Candidate name")
    job_posting_id: str = Field(..., description="Job posting ID")
    job_title: str = Field(..., description="Job title")
    interview_duration: int = Field(..., description="Interview duration in minutes")
    transcript: List[dict] = Field(..., description="Conversation transcript")

class InterviewAnalysisResponse(BaseModel):
    """Response containing interview analysis"""
    candidate_id: str
    question_analyses: List[QuestionAnalysis]
    overall_analysis: OverallAnalysis
    total_questions: int
    average_score: float
    analysis_model: str = "gpt-4o"
