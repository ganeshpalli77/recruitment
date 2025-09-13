"""
FastAPI Backend for Recruitment Dashboard
Handles job description analysis using Azure OpenAI GPT-4
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
from dotenv import load_dotenv
import logging
from datetime import datetime
from typing import Optional, Dict, Any, List

from config import get_settings
from services.openai_service import OpenAIService
from services.supabase_service import SupabaseService
from models.job_analysis import JobAnalysisRequest, JobAnalysisResponse, AnalysisResult
from utils.logger import setup_logging

# Load environment variables
load_dotenv()

# Setup logging
setup_logging()
logger = logging.getLogger(__name__)

# Get application settings
settings = get_settings()

# Initialize FastAPI app
app = FastAPI(
    title="Recruitment Dashboard API",
    description="Backend API for analyzing job descriptions using Azure OpenAI",
    version="1.0.0",
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # Next.js dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services (will be initialized on first use to handle missing env vars gracefully)
openai_service = None
supabase_service = None

def get_openai_service():
    global openai_service
    if openai_service is None:
        openai_service = OpenAIService()
    return openai_service

def get_supabase_service():
    global supabase_service
    if supabase_service is None:
        supabase_service = SupabaseService()
    return supabase_service

@app.get("/")
async def root():
    """Root endpoint for health check"""
    return {"message": "Recruitment Dashboard API", "status": "running"}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Test Azure OpenAI connection
        openai_svc = get_openai_service()
        await openai_svc.test_connection()
        
        # Test Supabase connection
        supabase_svc = get_supabase_service()
        await supabase_svc.test_connection()
        
        return {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "services": {
                "azure_openai": "connected",
                "supabase": "connected"
            }
        }
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        raise HTTPException(status_code=503, detail="Service unhealthy")

@app.post("/analyze-job", response_model=JobAnalysisResponse)
async def analyze_job_description(
    request: JobAnalysisRequest,
    background_tasks: BackgroundTasks
):
    """
    Analyze job description using Azure OpenAI GPT-4
    Extract key requirements, skills, and important information
    """
    try:
        logger.info(f"Analyzing job description for job ID: {request.job_id}")
        
        # Perform AI analysis
        openai_svc = get_openai_service()
        analysis_result = await openai_svc.analyze_job_description(
            title=request.title,
            description=request.description,
            requirements=request.requirements
        )
        
        # Add background task to update Supabase
        background_tasks.add_task(
            update_job_analysis_in_db,
            request.job_id,
            analysis_result
        )
        
        return JobAnalysisResponse(
            job_id=request.job_id,
            analysis_result=analysis_result,
            status="completed",
            message="Job description analyzed successfully"
        )
        
    except Exception as e:
        logger.error(f"Error analyzing job description: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to analyze job description: {str(e)}"
        )

async def update_job_analysis_in_db(job_id: str, analysis_result: AnalysisResult):
    """Background task to update job analysis in Supabase"""
    try:
        supabase_svc = get_supabase_service()
        await supabase_svc.update_job_analysis(job_id, analysis_result)
        logger.info(f"Updated job analysis in database for job ID: {job_id}")
    except Exception as e:
        logger.error(f"Failed to update job analysis in database: {str(e)}")

@app.get("/job/{job_id}/analysis")
async def get_job_analysis(job_id: str):
    """Get job analysis from database"""
    try:
        supabase_svc = get_supabase_service()
        analysis = await supabase_svc.get_job_analysis(job_id)
        if not analysis:
            raise HTTPException(status_code=404, detail="Job analysis not found")
        return analysis
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching job analysis: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch job analysis")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=settings.debug
    )
