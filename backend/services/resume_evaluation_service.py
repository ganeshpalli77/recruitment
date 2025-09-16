"""
Resume Evaluation Service
Scores resumes against job requirements using Azure OpenAI
"""

import logging
import json
from typing import Dict, Any, List, Optional
from datetime import datetime
import asyncio
import re

from services.openai_service import OpenAIService
from services.supabase_service import SupabaseService
from services.llamaparse_service import LlamaParseService

logger = logging.getLogger(__name__)

class ResumeEvaluationService:
    """Service for evaluating resumes against job requirements"""
    
    # Scoring weights as per requirements
    SKILLS_WEIGHT = 0.60  # 60% weight for skills
    EXPERIENCE_WEIGHT = 0.30  # 30% weight for experience
    EDUCATION_WEIGHT = 0.10  # 10% weight for education
    
    def __init__(self):
        """Initialize services"""
        self.openai_service = OpenAIService()
        self.supabase_service = SupabaseService()
        self.llamaparse_service = LlamaParseService()
    
    async def evaluate_resume(
        self,
        job_posting_id: str,
        resume_file_path: str,
        resume_file_name: str,
        resume_file_url: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Evaluate a single resume against a job posting
        
        Args:
            job_posting_id: ID of the job posting
            resume_file_path: Path to the resume file
            resume_file_name: Original filename
            resume_file_url: URL where resume is stored
            
        Returns:
            Evaluation results dictionary
        """
        try:
            start_time = datetime.utcnow()
            
            # Step 1: Get job posting details from Supabase [[memory:8114315]]
            job_data = await self._get_job_posting_data(job_posting_id)
            if not job_data:
                raise ValueError(f"Job posting {job_posting_id} not found")
            
            # Step 2: Parse resume using LlamaParse
            logger.info(f"Parsing resume: {resume_file_name}")
            parsed_resume = await self.llamaparse_service.parse_resume_file(resume_file_path)
            
            # Step 2.5: Extract candidate name using LLM
            resume_text = parsed_resume.get('raw_text', '')
            if resume_text:
                extracted_name = await self.openai_service.extract_candidate_name(resume_text)
                # Update parsed resume with extracted name
                if 'personal_info' not in parsed_resume:
                    parsed_resume['personal_info'] = {}
                parsed_resume['personal_info']['name'] = extracted_name
                logger.info(f"Extracted candidate name: {extracted_name}")
            
            # Step 3: Evaluate resume against job requirements
            logger.info(f"Evaluating resume against job {job_posting_id}")
            evaluation_result = await self._evaluate_against_job(
                parsed_resume,
                job_data,
                resume_file_name
            )
            
            # Step 4: Calculate processing time
            processing_time_ms = int((datetime.utcnow() - start_time).total_seconds() * 1000)
            
            # Step 5: Prepare final result
            final_result = {
                'job_posting_id': job_posting_id,
                'candidate_name': parsed_resume.get('personal_info', {}).get('name', 'Unknown'),
                'candidate_email': parsed_resume.get('personal_info', {}).get('email'),
                'candidate_phone': parsed_resume.get('personal_info', {}).get('phone'),
                'resume_file_name': resume_file_name,
                'resume_file_url': resume_file_url,
                'parsed_resume_text': parsed_resume.get('raw_text', ''),
                **evaluation_result,
                'processing_status': 'completed',
                'processing_time_ms': processing_time_ms,
                'ai_model': 'gpt-4.1',
                'evaluated_at': datetime.utcnow().isoformat()
            }
            
            # Step 6: Store in database
            await self._store_evaluation_result(final_result)
            
            return final_result
            
        except Exception as e:
            logger.error(f"Error evaluating resume: {str(e)}")
            
            # Store failed result
            failed_result = {
                'job_posting_id': job_posting_id,
                'resume_file_name': resume_file_name,
                'resume_file_url': resume_file_url,
                'processing_status': 'failed',
                'processing_error': str(e),
                'evaluated_at': datetime.utcnow().isoformat()
            }
            
            await self._store_evaluation_result(failed_result)
            raise
    
    async def evaluate_batch(
        self,
        job_posting_id: str,
        resume_files: List[Dict[str, str]],
        max_concurrent: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Evaluate multiple resumes concurrently
        
        Args:
            job_posting_id: ID of the job posting
            resume_files: List of dicts with 'path', 'name', 'url'
            max_concurrent: Maximum concurrent evaluations
            
        Returns:
            List of evaluation results
        """
        semaphore = asyncio.Semaphore(max_concurrent)
        
        async def evaluate_with_semaphore(resume_file):
            async with semaphore:
                try:
                    return await self.evaluate_resume(
                        job_posting_id,
                        resume_file['path'],
                        resume_file['name'],
                        resume_file.get('url')
                    )
                except Exception as e:
                    logger.error(f"Batch evaluation error for {resume_file['name']}: {str(e)}")
                    return {
                        'resume_file_name': resume_file['name'],
                        'error': str(e),
                        'processing_status': 'failed'
                    }
        
        tasks = [evaluate_with_semaphore(rf) for rf in resume_files]
        results = await asyncio.gather(*tasks)
        
        return results
    
    async def _get_job_posting_data(self, job_posting_id: str) -> Optional[Dict[str, Any]]:
        """Get job posting data from Supabase"""
        try:
            response = self.supabase_service.client.table('job_postings').select('*').eq('id', job_posting_id).single().execute()
            return response.data
        except Exception as e:
            logger.error(f"Error fetching job posting: {str(e)}")
            return None
    
    async def _evaluate_against_job(
        self,
        parsed_resume: Dict[str, Any],
        job_data: Dict[str, Any],
        resume_file_name: str
    ) -> Dict[str, Any]:
        """
        Core evaluation logic using Azure OpenAI
        Uses existing AI analysis from job_postings table - no re-analysis
        
        Args:
            parsed_resume: Parsed resume data
            job_data: Job posting data with ai_analysis
            resume_file_name: Resume filename for reference
            
        Returns:
            Evaluation scores and details
        """
        
        # Extract basic job info
        job_title = job_data.get('title', '')
        experience_required = job_data.get('experience_required', 0)
        
        # USE EXISTING AI ANALYSIS - Don't re-analyze job description
        ai_analysis = job_data.get('ai_analysis', {})
        
        if not ai_analysis:
            # If no AI analysis exists, use fallback data
            logger.warning(f"No AI analysis found for job {job_title}, using basic data")
            required_skills = job_data.get('skills_required', [])
            education_requirements = []
            responsibilities = []
            qualifications = []
            nice_to_have = []
            job_level = 'mid'
        else:
            # Extract all structured data from existing AI analysis
            required_skills = ai_analysis.get('key_skills', [])
            education_requirements = ai_analysis.get('education_requirements', [])
            responsibilities = ai_analysis.get('responsibilities', [])
            qualifications = ai_analysis.get('qualifications', [])
            nice_to_have = ai_analysis.get('nice_to_have', [])
            job_level = ai_analysis.get('job_level', 'mid')
            
            # Combine technical and soft skills if present
            technical_skills = ai_analysis.get('technical_skills', [])
            soft_skills = ai_analysis.get('soft_skills', [])
            if technical_skills or soft_skills:
                required_skills = technical_skills + soft_skills
        
        # Prepare optimized evaluation prompt using structured data
        evaluation_prompt = self._create_optimized_evaluation_prompt(
            parsed_resume,
            job_title,
            required_skills,
            experience_required,
            education_requirements,
            responsibilities,
            job_level,
            ai_analysis
        )
        
        # Get AI evaluation
        ai_evaluation = await self.openai_service.evaluate_resume(evaluation_prompt)
        
        # Parse AI response
        evaluation_scores = self._parse_ai_evaluation(ai_evaluation)
        
        # Calculate overall score based on weights
        skills_score = evaluation_scores.get('skills_score', 0)
        experience_score = evaluation_scores.get('experience_score', 0)
        education_score = evaluation_scores.get('education_score', 0)
        
        overall_score = int(
            skills_score * self.SKILLS_WEIGHT +
            experience_score * self.EXPERIENCE_WEIGHT +
            education_score * self.EDUCATION_WEIGHT
        )
        
        # Determine recommendation level
        recommendation = self._get_recommendation_level(overall_score)
        
        return {
            'skills_score': skills_score,
            'experience_score': experience_score,
            'education_score': education_score,
            'overall_score': overall_score,
            'skills_matched': evaluation_scores.get('skills_matched', []),
            'skills_missing': evaluation_scores.get('skills_missing', []),
            'experience_details': evaluation_scores.get('experience_details', {}),
            'education_details': evaluation_scores.get('education_details', {}),
            'evaluation_summary': evaluation_scores.get('summary', ''),
            'key_strengths': evaluation_scores.get('strengths', []),
            'improvement_areas': evaluation_scores.get('improvements', []),
            'recommendation': recommendation,
            'evaluation_metadata': {
                'job_title': job_title,
                'required_experience_years': experience_required,
                'required_skills_count': len(required_skills),
                'job_level': job_level if ai_analysis else 'mid',
                'difficulty_score': ai_analysis.get('difficulty_score', 5) if ai_analysis else 5,
                'used_ai_analysis': bool(ai_analysis),
                'ai_raw_response': ai_evaluation
            }
        }
    
    def _create_optimized_evaluation_prompt(
        self,
        parsed_resume: Dict[str, Any],
        job_title: str,
        required_skills: List[str],
        experience_required: int,
        education_requirements: List[str],
        responsibilities: List[str],
        job_level: str,
        ai_analysis: Dict[str, Any]
    ) -> str:
        """
        Create optimized evaluation prompt using EXISTING AI analysis
        No re-analysis of job description - uses structured data directly
        """
        
        # Extract resume information
        resume_skills = parsed_resume.get('skills', [])
        resume_experience = parsed_resume.get('experience', [])
        resume_education = parsed_resume.get('education', [])
        resume_certifications = parsed_resume.get('certifications', [])
        resume_projects = parsed_resume.get('projects', [])
        resume_text = parsed_resume.get('raw_text', '')
        
        # Calculate total experience years from parsed data
        total_exp_years = 0
        for exp in resume_experience:
            if 'total_years' in exp:
                total_exp_years = exp['total_years']
                break
        
        # Get additional requirements from AI analysis
        qualifications = ai_analysis.get('qualifications', [])
        nice_to_have = ai_analysis.get('nice_to_have', [])
        difficulty_score = ai_analysis.get('difficulty_score', 5)
        
        prompt = f"""You are an expert recruiter evaluating a resume against ALREADY ANALYZED job requirements.
DO NOT re-analyze the job description - use the structured requirements provided below.

JOB REQUIREMENTS (FROM EXISTING AI ANALYSIS):
- Title: {job_title}
- Level: {job_level} (difficulty: {difficulty_score}/10)
- Required Experience: {experience_required} years
- Required Skills: {', '.join(required_skills) if required_skills else 'None specified'}
- Education Requirements: {', '.join(education_requirements) if education_requirements else 'Not specified'}
- Key Responsibilities: {', '.join(responsibilities[:5]) if responsibilities else 'Not specified'}
- Required Qualifications: {', '.join(qualifications[:5]) if qualifications else 'Not specified'}
- Nice to Have: {', '.join(nice_to_have[:5]) if nice_to_have else 'None specified'}

CANDIDATE RESUME DATA:
- Skills Found: {', '.join(resume_skills) if resume_skills else 'None identified'}
- Total Experience: {total_exp_years} years
- Education: {json.dumps(resume_education) if resume_education else 'Not found'}
- Certifications: {', '.join(resume_certifications) if resume_certifications else 'None'}
- Projects: {len(resume_projects)} projects found

RESUME TEXT EXCERPT (for additional context):
{resume_text[:2000]}  # Reduced to 2000 chars since we have structured requirements

EVALUATION INSTRUCTIONS:
Compare the candidate's qualifications DIRECTLY against the structured requirements above.
Use the scoring weights: 60% skills, 30% experience, 10% education

Respond in JSON format with these exact keys:
{{
    "skills_score": <0-100 based on match with required_skills>,
    "experience_score": <0-100 based on {experience_required} years requirement>,
    "education_score": <0-100 based on education_requirements match>,
    "skills_matched": [<skills from required_skills that candidate has>],
    "skills_missing": [<skills from required_skills that candidate lacks>],
    "experience_details": {{
        "years": <actual years>,
        "relevance": "<how relevant to job level: {job_level}>",
        "key_roles": [<relevant roles>]
    }},
    "education_details": {{
        "highest_degree": "<degree>",
        "relevance": "<match with education_requirements>"
    }},
    "summary": "<2-3 sentence evaluation summary>",
    "strengths": [<top 3 strengths based on qualifications match>],
    "improvements": [<top 3 gaps based on missing requirements>]
}}"""
        
        return prompt
    
    def _create_evaluation_prompt(
        self,
        parsed_resume: Dict[str, Any],
        job_title: str,
        job_description: str,
        job_requirements: str,
        required_skills: List[str],
        experience_required: int
    ) -> str:
        """
        DEPRECATED: Old evaluation prompt that re-analyzes job description
        Kept for backward compatibility only - use _create_optimized_evaluation_prompt instead
        """
        logger.warning("Using deprecated _create_evaluation_prompt - should use optimized version")
        
        # Extract resume information
        resume_skills = parsed_resume.get('skills', [])
        resume_experience = parsed_resume.get('experience', [])
        resume_education = parsed_resume.get('education', [])
        resume_certifications = parsed_resume.get('certifications', [])
        resume_projects = parsed_resume.get('projects', [])
        resume_text = parsed_resume.get('raw_text', '')
        
        # Calculate total experience years from parsed data
        total_exp_years = 0
        for exp in resume_experience:
            if 'total_years' in exp:
                total_exp_years = exp['total_years']
                break
        
        prompt = f"""You are an expert recruiter evaluating a resume for a job position. 
Please evaluate the following resume against the job requirements and provide detailed scoring.

JOB INFORMATION:
- Title: {job_title}
- Description: {job_description}
- Requirements: {job_requirements}
- Required Skills: {', '.join(required_skills) if required_skills else 'Not specified'}
- Required Experience: {experience_required} years

RESUME INFORMATION:
- Skills Found: {', '.join(resume_skills) if resume_skills else 'None identified'}
- Total Experience: {total_exp_years} years
- Education: {json.dumps(resume_education) if resume_education else 'Not found'}
- Certifications: {', '.join(resume_certifications) if resume_certifications else 'None'}
- Projects: {len(resume_projects)} projects found

FULL RESUME TEXT (for context):
{resume_text[:3000]}  # Limiting to 3000 chars to manage token usage

Please provide a detailed evaluation with the following structure:
1. SKILLS SCORE (0-100): Evaluate how well the candidate's skills match the required skills
2. EXPERIENCE SCORE (0-100): Evaluate if the candidate meets the {experience_required} years requirement and relevance of experience
3. EDUCATION SCORE (0-100): Evaluate the candidate's educational background relevance
4. SKILLS MATCHED: List of required skills that the candidate has
5. SKILLS MISSING: List of required skills that the candidate lacks
6. EXPERIENCE DETAILS: Brief analysis of work experience relevance
7. EDUCATION DETAILS: Brief analysis of education relevance
8. SUMMARY: 2-3 sentence evaluation summary
9. STRENGTHS: Top 3 key strengths of the candidate
10. IMPROVEMENTS: Top 3 areas where candidate falls short

Respond in JSON format with these exact keys:
{{
    "skills_score": <number>,
    "experience_score": <number>,
    "education_score": <number>,
    "skills_matched": [<list of matched skills>],
    "skills_missing": [<list of missing skills>],
    "experience_details": {{
        "years": <number>,
        "relevance": "<brief text>",
        "key_roles": [<list of relevant roles>]
    }},
    "education_details": {{
        "highest_degree": "<degree>",
        "relevance": "<brief text>"
    }},
    "summary": "<evaluation summary>",
    "strengths": [<list of 3 strengths>],
    "improvements": [<list of 3 improvement areas>]
}}"""
        
        return prompt
    
    def _parse_ai_evaluation(self, ai_response: str) -> Dict[str, Any]:
        """Parse the AI evaluation response"""
        try:
            # Try to extract JSON from the response
            json_match = re.search(r'\{[\s\S]*\}', ai_response)
            if json_match:
                evaluation_data = json.loads(json_match.group())
                return evaluation_data
            else:
                # Fallback parsing if JSON extraction fails
                logger.warning("Could not extract JSON from AI response, using defaults")
                return self._get_default_evaluation()
                
        except json.JSONDecodeError as e:
            logger.error(f"Error parsing AI evaluation JSON: {str(e)}")
            return self._get_default_evaluation()
        except Exception as e:
            logger.error(f"Error parsing AI evaluation: {str(e)}")
            return self._get_default_evaluation()
    
    def _get_default_evaluation(self) -> Dict[str, Any]:
        """Return default evaluation structure"""
        return {
            'skills_score': 50,
            'experience_score': 50,
            'education_score': 50,
            'skills_matched': [],
            'skills_missing': [],
            'experience_details': {'years': 0, 'relevance': 'Unable to evaluate'},
            'education_details': {'highest_degree': 'Unknown', 'relevance': 'Unable to evaluate'},
            'summary': 'Evaluation could not be completed',
            'strengths': [],
            'improvements': []
        }
    
    def _get_recommendation_level(self, overall_score: int) -> str:
        """
        Determine recommendation level based on overall score
        
        Args:
            overall_score: Overall evaluation score (0-100)
            
        Returns:
            Recommendation level string
        """
        if overall_score >= 85:
            return 'STRONG_MATCH'
        elif overall_score >= 70:
            return 'GOOD_MATCH'
        elif overall_score >= 50:
            return 'FAIR_MATCH'
        else:
            return 'NO_MATCH'
    
    async def _store_evaluation_result(self, result: Dict[str, Any]) -> None:
        """Store evaluation result in Supabase"""
        try:
            # Prepare data for insertion
            insert_data = {
                key: value for key, value in result.items()
                if key not in ['ai_raw_response']  # Exclude raw response from main fields
            }
            
            # Store in resume_results table
            response = self.supabase_service.client.table('resume_results').insert(insert_data).execute()
            
            logger.info(f"Stored evaluation result for {result.get('resume_file_name')}")
            
        except Exception as e:
            logger.error(f"Error storing evaluation result: {str(e)}")
            # Don't raise here to avoid failing the entire evaluation
