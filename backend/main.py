"""
FastAPI Backend for Recruitment Dashboard
Handles job description analysis using Azure OpenAI GPT-4
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks, UploadFile, File, Form, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
from dotenv import load_dotenv
import logging
from datetime import datetime
from typing import Optional, Dict, Any, List
import asyncio
import tempfile
from pathlib import Path
import base64
import aiofiles
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from config import get_settings
from services.openai_service import OpenAIService
from services.supabase_service import SupabaseService
from services.resume_evaluation_service import ResumeEvaluationService
from models.job_analysis import JobAnalysisRequest, JobAnalysisResponse, AnalysisResult
from models.resume_evaluation import (
    ResumeUploadRequest,
    BatchResumeUploadRequest,
    ResumeEvaluationResult,
    ResumeEvaluationResponse,
    BatchEvaluationResponse,
    ResumeSearchRequest,
    ResumeRankingResponse,
    EvaluationStatistics
)
from utils.logger import setup_logging

# Load environment variables
load_dotenv()

# Setup logging
setup_logging()
logger = logging.getLogger(__name__)

# Get application settings
settings = get_settings()

# Initialize rate limiter
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["1000 per hour"]  # Default rate limit
)

# Initialize FastAPI app
app = FastAPI(
    title="Recruitment Dashboard API",
    description="Backend API for analyzing job descriptions and evaluating resumes using Azure OpenAI",
    version="2.0.0",
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None
)

# Add rate limiter to app
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

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
resume_evaluation_service = None

# Processing queue for batch operations
processing_queue = asyncio.Queue(maxsize=1000)

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

def get_resume_evaluation_service():
    global resume_evaluation_service
    if resume_evaluation_service is None:
        resume_evaluation_service = ResumeEvaluationService()
    return resume_evaluation_service

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

# ============================================================================
# Resume Evaluation Endpoints
# ============================================================================

@app.post("/evaluate-resume", response_model=ResumeEvaluationResponse)
@limiter.limit("100 per minute")  # Rate limit for single resume evaluation
async def evaluate_single_resume(
    request: Request,
    background_tasks: BackgroundTasks,
    job_posting_id: str = Form(...),
    resume_file: UploadFile = File(...),
):
    """
    Evaluate a single resume against a job posting
    
    Rate limited to 100 requests per minute to prevent abuse
    """
    try:
        logger.info(f"Evaluating resume {resume_file.filename} for job {job_posting_id}")
        
        # Save uploaded file temporarily
        temp_dir = tempfile.gettempdir()
        temp_file_path = Path(temp_dir) / f"resume_{datetime.now().timestamp()}_{resume_file.filename}"
        
        async with aiofiles.open(temp_file_path, 'wb') as f:
            content = await resume_file.read()
            await f.write(content)
        
        # Get evaluation service
        eval_service = get_resume_evaluation_service()
        
        # Evaluate resume
        result = await eval_service.evaluate_resume(
            job_posting_id=job_posting_id,
            resume_file_path=str(temp_file_path),
            resume_file_name=resume_file.filename
        )
        
        # Clean up temp file
        background_tasks.add_task(cleanup_temp_file, temp_file_path)
        
        return ResumeEvaluationResponse(
            success=True,
            message="Resume evaluated successfully",
            result=ResumeEvaluationResult(**result)
        )
        
    except Exception as e:
        logger.error(f"Error evaluating resume: {str(e)}")
        return ResumeEvaluationResponse(
            success=False,
            message="Failed to evaluate resume",
            error=str(e)
        )

@app.post("/evaluate-batch", response_model=BatchEvaluationResponse)
@limiter.limit("10 per minute")  # Stricter rate limit for batch operations
async def evaluate_batch_resumes(
    request: Request,
    background_tasks: BackgroundTasks,
    batch_request: BatchResumeUploadRequest,
):
    """
    Evaluate multiple resumes for a job posting
    
    Designed to handle up to 15k-20k resumes with proper queuing and rate limiting
    """
    try:
        job_posting_id = batch_request.job_posting_id
        resumes = batch_request.resumes
        
        logger.info(f"Batch evaluation requested for {len(resumes)} resumes for job {job_posting_id}")
        
        if len(resumes) > 100:
            # For large batches, queue for processing
            background_tasks.add_task(
                process_batch_in_background,
                job_posting_id,
                resumes
            )
            
            return BatchEvaluationResponse(
                success=True,
                message=f"Batch of {len(resumes)} resumes queued for processing",
                total_processed=0,
                successful=0,
                failed=0,
                results=[]
            )
        else:
            # Process smaller batches immediately
            eval_service = get_resume_evaluation_service()
            
            # Prepare file paths
            resume_files = []
            for resume in resumes:
                if 'content' in resume:
                    # Save base64 content to temp file
                    temp_file = await save_base64_to_temp(resume['content'], resume['name'])
                    resume_files.append({
                        'path': str(temp_file),
                        'name': resume['name'],
                        'url': resume.get('url')
                    })
                elif 'url' in resume:
                    # Download from URL
                    temp_file = await download_resume_from_url(resume['url'], resume['name'])
                    resume_files.append({
                        'path': str(temp_file),
                        'name': resume['name'],
                        'url': resume['url']
                    })
            
            # Evaluate batch
            results = await eval_service.evaluate_batch(
                job_posting_id=job_posting_id,
                resume_files=resume_files,
                max_concurrent=5
            )
            
            # Clean up temp files
            for rf in resume_files:
                background_tasks.add_task(cleanup_temp_file, Path(rf['path']))
            
            # Count successes and failures
            successful = sum(1 for r in results if r.get('processing_status') == 'completed')
            failed = len(results) - successful
            
            return BatchEvaluationResponse(
                success=True,
                message=f"Processed {len(results)} resumes",
                total_processed=len(results),
                successful=successful,
                failed=failed,
                results=[ResumeEvaluationResult(**r) for r in results if r.get('processing_status') == 'completed']
            )
            
    except Exception as e:
        logger.error(f"Error in batch evaluation: {str(e)}")
        return BatchEvaluationResponse(
            success=False,
            message="Failed to process batch",
            total_processed=0,
            successful=0,
            failed=0,
            results=[],
            errors=[{"error": str(e)}]
        )

@app.post("/search-resumes", response_model=List[ResumeEvaluationResult])
@limiter.limit("200 per minute")
async def search_evaluated_resumes(
    request: Request,
    search_request: ResumeSearchRequest,
):
    """
    Search and filter evaluated resumes
    """
    try:
        supabase_svc = get_supabase_service()
        
        # Build query
        query = supabase_svc.client.table('resume_results').select('*')
        
        if search_request.job_posting_id:
            query = query.eq('job_posting_id', search_request.job_posting_id)
        
        if search_request.min_score is not None:
            query = query.gte('overall_score', search_request.min_score)
        
        if search_request.max_score is not None:
            query = query.lte('overall_score', search_request.max_score)
        
        if search_request.recommendation:
            query = query.eq('recommendation', search_request.recommendation)
        
        # Apply sorting
        if search_request.sort_order == 'asc':
            query = query.order(search_request.sort_by, desc=False)
        else:
            query = query.order(search_request.sort_by, desc=True)
        
        # Apply pagination
        query = query.limit(search_request.limit).offset(search_request.offset)
        
        # Execute query
        response = query.execute()
        
        return [ResumeEvaluationResult(**r) for r in response.data]
        
    except Exception as e:
        logger.error(f"Error searching resumes: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to search resumes: {str(e)}")

@app.get("/job/{job_id}/rankings", response_model=ResumeRankingResponse)
async def get_job_resume_rankings(job_id: str, limit: int = 100):
    """
    Get ranked resumes for a specific job posting
    """
    try:
        supabase_svc = get_supabase_service()
        
        # Get job details
        job_response = supabase_svc.client.table('job_postings').select('title').eq('id', job_id).single().execute()
        job_title = job_response.data.get('title', 'Unknown')
        
        # Get ranked resumes
        resumes_response = supabase_svc.client.table('resume_results')\
            .select('*')\
            .eq('job_posting_id', job_id)\
            .eq('processing_status', 'completed')\
            .order('overall_score', desc=True)\
            .limit(limit)\
            .execute()
        
        # Get total count
        count_response = supabase_svc.client.table('resume_results')\
            .select('*', count='exact')\
            .eq('job_posting_id', job_id)\
            .execute()
        
        total_candidates = count_response.count if hasattr(count_response, 'count') else len(count_response.data)
        
        return ResumeRankingResponse(
            job_posting_id=job_id,
            job_title=job_title,
            total_candidates=total_candidates,
            evaluated_candidates=len(resumes_response.data),
            rankings=[ResumeEvaluationResult(**r) for r in resumes_response.data]
        )
        
    except Exception as e:
        logger.error(f"Error getting rankings: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get rankings: {str(e)}")

@app.get("/evaluation-stats", response_model=EvaluationStatistics)
async def get_evaluation_statistics(job_posting_id: Optional[str] = None):
    """
    Get statistics about resume evaluations
    """
    try:
        supabase_svc = get_supabase_service()
        
        # Build base query
        query = supabase_svc.client.table('resume_results').select('*')
        
        if job_posting_id:
            query = query.eq('job_posting_id', job_posting_id)
        
        response = query.execute()
        data = response.data
        
        if not data:
            return EvaluationStatistics(
                total_evaluations=0,
                average_score=0.0,
                score_distribution={},
                top_skills=[],
                recommendation_distribution={},
                average_processing_time_ms=0.0,
                evaluation_period={}
            )
        
        # Calculate statistics
        scores = [r['overall_score'] for r in data if r.get('overall_score') is not None]
        avg_score = sum(scores) / len(scores) if scores else 0
        
        # Score distribution
        score_distribution = {
            "0-20": sum(1 for s in scores if 0 <= s < 20),
            "20-40": sum(1 for s in scores if 20 <= s < 40),
            "40-60": sum(1 for s in scores if 40 <= s < 60),
            "60-80": sum(1 for s in scores if 60 <= s < 80),
            "80-100": sum(1 for s in scores if 80 <= s <= 100),
        }
        
        # Recommendation distribution
        recommendations = [r.get('recommendation', 'UNKNOWN') for r in data]
        recommendation_distribution = {
            rec: recommendations.count(rec)
            for rec in set(recommendations)
        }
        
        # Processing time
        processing_times = [r['processing_time_ms'] for r in data if r.get('processing_time_ms')]
        avg_processing_time = sum(processing_times) / len(processing_times) if processing_times else 0
        
        # Evaluation period
        dates = [r.get('evaluated_at') for r in data if r.get('evaluated_at')]
        if dates:
            dates_parsed = [datetime.fromisoformat(d.replace('Z', '+00:00')) for d in dates]
            evaluation_period = {
                'start': min(dates_parsed),
                'end': max(dates_parsed)
            }
        else:
            evaluation_period = {}
        
        # Top skills (simplified - would need more processing for accurate skill extraction)
        all_skills = []
        for r in data:
            if r.get('skills_matched'):
                all_skills.extend(r['skills_matched'])
        
        skill_counts = {}
        for skill in all_skills:
            skill_counts[skill] = skill_counts.get(skill, 0) + 1
        
        top_skills = [
            {'skill': skill, 'count': count}
            for skill, count in sorted(skill_counts.items(), key=lambda x: x[1], reverse=True)[:10]
        ]
        
        return EvaluationStatistics(
            total_evaluations=len(data),
            average_score=avg_score,
            score_distribution=score_distribution,
            top_skills=top_skills,
            recommendation_distribution=recommendation_distribution,
            average_processing_time_ms=avg_processing_time,
            evaluation_period=evaluation_period
        )
        
    except Exception as e:
        logger.error(f"Error getting statistics: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get statistics: {str(e)}")

@app.post("/fix-candidate-names/{job_id}")
@limiter.limit("10 per minute")
async def fix_candidate_names_for_job(request: Request, job_id: str):
    """
    Fix candidate names for a specific job by re-extracting them using LLM
    """
    try:
        logger.info(f"Fixing candidate names for job {job_id}")
        
        supabase_svc = get_supabase_service()
        openai_svc = get_openai_service()
        
        # Get all resume results for this job with bad names
        response = supabase_svc.client.table('resume_results')\
            .select('id, candidate_name, parsed_resume_text')\
            .eq('job_posting_id', job_id)\
            .execute()
        
        results = response.data
        fixed_count = 0
        
        for result in results:
            current_name = result.get('candidate_name', '')
            resume_text = result.get('parsed_resume_text', '')
            
            # Check if name needs fixing
            if current_name in ['SUMMARY', 'Unknown', 'Candidate', ''] or not current_name:
                if resume_text:
                    # Extract proper name using LLM
                    extracted_name = await openai_svc.extract_candidate_name(resume_text)
                    
                    # Update the record
                    update_response = supabase_svc.client.table('resume_results')\
                        .update({'candidate_name': extracted_name})\
                        .eq('id', result['id'])\
                        .execute()
                    
                    if update_response.data:
                        logger.info(f"Updated name from '{current_name}' to '{extracted_name}'")
                        fixed_count += 1
        
        return {
            "success": True,
            "message": f"Fixed {fixed_count} candidate names for job {job_id}",
            "fixed_count": fixed_count
        }
        
    except Exception as e:
        logger.error(f"Error fixing candidate names: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fix names: {str(e)}")

# ============================================================================
# Helper Functions
# ============================================================================

async def cleanup_temp_file(file_path: Path):
    """Clean up temporary files after processing"""
    try:
        if file_path.exists():
            file_path.unlink()
            logger.debug(f"Cleaned up temp file: {file_path}")
    except Exception as e:
        logger.error(f"Error cleaning up temp file: {str(e)}")

async def save_base64_to_temp(base64_content: str, filename: str) -> Path:
    """Save base64 content to temporary file"""
    try:
        # Decode base64
        file_content = base64.b64decode(base64_content)
        
        # Create temp file
        temp_dir = tempfile.gettempdir()
        temp_file_path = Path(temp_dir) / f"resume_{datetime.now().timestamp()}_{filename}"
        
        async with aiofiles.open(temp_file_path, 'wb') as f:
            await f.write(file_content)
        
        return temp_file_path
    except Exception as e:
        logger.error(f"Error saving base64 to temp: {str(e)}")
        raise

async def download_resume_from_url(url: str, filename: str) -> Path:
    """Download resume from URL to temporary file"""
    try:
        import httpx
        
        async with httpx.AsyncClient() as client:
            response = await client.get(url)
            response.raise_for_status()
            
            # Create temp file
            temp_dir = tempfile.gettempdir()
            temp_file_path = Path(temp_dir) / f"resume_{datetime.now().timestamp()}_{filename}"
            
            async with aiofiles.open(temp_file_path, 'wb') as f:
                await f.write(response.content)
            
            return temp_file_path
    except Exception as e:
        logger.error(f"Error downloading resume from URL: {str(e)}")
        raise

async def process_batch_in_background(job_posting_id: str, resumes: List[Dict[str, str]]):
    """Process large batch of resumes in background"""
    try:
        logger.info(f"Processing batch of {len(resumes)} resumes in background for job {job_posting_id}")
        
        eval_service = get_resume_evaluation_service()
        
        # Process in chunks to avoid overwhelming the system
        CHUNK_SIZE = 50
        for i in range(0, len(resumes), CHUNK_SIZE):
            chunk = resumes[i:i+CHUNK_SIZE]
            
            # Prepare file paths for chunk
            resume_files = []
            for resume in chunk:
                if 'content' in resume:
                    temp_file = await save_base64_to_temp(resume['content'], resume['name'])
                    resume_files.append({
                        'path': str(temp_file),
                        'name': resume['name'],
                        'url': resume.get('url')
                    })
                elif 'url' in resume:
                    temp_file = await download_resume_from_url(resume['url'], resume['name'])
                    resume_files.append({
                        'path': str(temp_file),
                        'name': resume['name'],
                        'url': resume['url']
                    })
            
            # Evaluate chunk
            await eval_service.evaluate_batch(
                job_posting_id=job_posting_id,
                resume_files=resume_files,
                max_concurrent=10  # Higher concurrency for background processing
            )
            
            # Clean up temp files
            for rf in resume_files:
                await cleanup_temp_file(Path(rf['path']))
            
            # Add delay between chunks to avoid rate limits
            await asyncio.sleep(2)
        
        logger.info(f"Completed background processing of {len(resumes)} resumes")
        
    except Exception as e:
        logger.error(f"Error in background batch processing: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=settings.debug
    )
