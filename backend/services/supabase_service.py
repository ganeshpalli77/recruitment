"""
Supabase service for database operations
"""

import logging
from typing import Optional, Dict, Any
from datetime import datetime
from supabase import create_client, Client
from config import get_settings
from models.job_analysis import AnalysisResult, JobAnalysisDB

logger = logging.getLogger(__name__)

class SupabaseService:
    """Service for Supabase database operations"""
    
    def __init__(self):
        settings = get_settings()
        
        self.client: Client = create_client(
            settings.supabase_url,
            settings.supabase_service_role_key  # Using service role key for backend operations
        )
    
    async def test_connection(self) -> bool:
        """Test connection to Supabase"""
        try:
            # Simple query to test connection
            result = self.client.table('job_postings').select('id').limit(1).execute()
            return True
        except Exception as e:
            logger.error(f"Supabase connection test failed: {str(e)}")
            raise e
    
    async def update_job_analysis(self, job_id: str, analysis: AnalysisResult) -> Dict[str, Any]:
        """Update job posting with AI analysis results"""
        try:
            # Prepare consolidated AI analysis data
            ai_analysis_data = {
                'key_skills': analysis.key_skills,
                'required_experience': analysis.required_experience,
                'education_requirements': analysis.education_requirements,
                'responsibilities': analysis.responsibilities,
                'qualifications': analysis.qualifications,
                'nice_to_have': analysis.nice_to_have,
                'job_level': analysis.job_level,
                'remote_work': analysis.remote_work,
                'salary_range': analysis.salary_range,
                'company_benefits': analysis.company_benefits,
                'industry': analysis.industry,
                'job_summary': analysis.job_summary,
                'difficulty_score': analysis.difficulty_score,
                'confidence_score': analysis.ai_confidence_score,
                'analysis_date': datetime.utcnow().isoformat()
            }
            
            # Prepare data for update
            update_data = {
                'ai_analysis': ai_analysis_data,
                'updated_at': datetime.utcnow().isoformat()
            }
            
            # Update the job posting
            result = self.client.table('job_postings').update(update_data).eq('id', job_id).execute()
            
            if not result.data:
                raise ValueError(f"No job posting found with ID: {job_id}")
            
            logger.info(f"Successfully updated job analysis for job ID: {job_id}")
            return result.data[0]
            
        except Exception as e:
            logger.error(f"Error updating job analysis in Supabase: {str(e)}")
            raise e
    
    async def get_job_analysis(self, job_id: str) -> Optional[Dict[str, Any]]:
        """Get job analysis from database"""
        try:
            result = self.client.table('job_postings').select(
                'id, title, ai_analysis'
            ).eq('id', job_id).execute()
            
            if not result.data:
                return None
            
            return result.data[0]
            
        except Exception as e:
            logger.error(f"Error fetching job analysis from Supabase: {str(e)}")
            raise e
    
    async def get_job_posting(self, job_id: str) -> Optional[Dict[str, Any]]:
        """Get job posting details"""
        try:
            result = self.client.table('job_postings').select('*').eq('id', job_id).execute()
            
            if not result.data:
                return None
            
            return result.data[0]
            
        except Exception as e:
            logger.error(f"Error fetching job posting from Supabase: {str(e)}")
            raise e
