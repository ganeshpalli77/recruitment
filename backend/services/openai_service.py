"""
Azure OpenAI service for job description analysis
"""

import json
import logging
from typing import Optional, Dict, Any
from openai import AzureOpenAI
from config import get_settings
from models.job_analysis import AnalysisResult

logger = logging.getLogger(__name__)

class OpenAIService:
    """Service for Azure OpenAI interactions"""
    
    def __init__(self):
        settings = get_settings()
        
        self.client = AzureOpenAI(
            api_key=settings.azure_openai_api_key,
            api_version=settings.azure_openai_api_version,
            azure_endpoint=settings.azure_openai_endpoint
        )
        
        self.deployment_name = settings.azure_openai_deployment_name
        
    async def test_connection(self) -> bool:
        """Test connection to Azure OpenAI"""
        try:
            response = self.client.chat.completions.create(
                model=self.deployment_name,
                messages=[{"role": "user", "content": "Hello"}],
                max_tokens=10
            )
            return True
        except Exception as e:
            logger.error(f"Azure OpenAI connection test failed: {str(e)}")
            raise e
    
    async def analyze_job_description(
        self, 
        title: str, 
        description: str, 
        requirements: Optional[str] = None
    ) -> AnalysisResult:
        """
        Analyze job description using GPT-4 to extract structured information
        """
        try:
            # Construct the prompt for job analysis
            prompt = self._create_analysis_prompt(title, description, requirements)
            
            # Call Azure OpenAI
            response = self.client.chat.completions.create(
                model=self.deployment_name,
                messages=[
                    {
                        "role": "system", 
                        "content": self._get_system_prompt()
                    },
                    {
                        "role": "user", 
                        "content": prompt
                    }
                ],
                temperature=0.2,
                max_tokens=2000
            )
            
            # Parse the response
            analysis_text = response.choices[0].message.content
            logger.info("Received analysis from Azure OpenAI")
            
            # Parse JSON response from GPT-4
            analysis_data = json.loads(analysis_text)
            
            # Create AnalysisResult object
            analysis_result = AnalysisResult(**analysis_data)
            
            logger.info(f"Successfully analyzed job: {title}")
            return analysis_result
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON response from GPT-4: {str(e)}")
            # Return a fallback analysis
            return self._create_fallback_analysis(title, description)
            
        except Exception as e:
            logger.error(f"Error in job description analysis: {str(e)}")
            raise e
    
    def _get_system_prompt(self) -> str:
        """Get the system prompt for job analysis"""
        return """
        You are an expert HR analyst specialized in job description analysis. 
        Your task is to analyze job postings and extract structured information.
        
        Always respond with valid JSON in the exact format specified.
        Be thorough in your analysis and provide accurate, relevant information.
        
        For difficulty_score, consider:
        1-3: Entry level, basic skills required
        4-6: Mid level, some experience required
        7-8: Senior level, extensive experience required
        9-10: Expert level, highly specialized skills required
        
        For ai_confidence_score, rate your confidence in the analysis from 0.0 to 1.0.
        """
    
    def _create_analysis_prompt(
        self, 
        title: str, 
        description: str, 
        requirements: Optional[str] = None
    ) -> str:
        """Create the analysis prompt"""
        requirements_text = f"\n\nRequirements:\n{requirements}" if requirements else ""
        
        return f"""
        Please analyze this job posting and extract the following information as JSON:

        Job Title: {title}
        
        Job Description: {description}{requirements_text}
        
        Extract and return ONLY a JSON object with this exact structure:
        {{
            "key_skills": ["skill1", "skill2", ...],
            "required_experience": "X years in relevant field",
            "education_requirements": ["Bachelor's degree", ...],
            "responsibilities": ["responsibility1", ...],
            "qualifications": ["qualification1", ...],
            "nice_to_have": ["skill1", "skill2", ...],
            "job_level": "entry|mid|senior|expert",
            "remote_work": true|false|null,
            "salary_range": "salary range if mentioned or null",
            "company_benefits": ["benefit1", "benefit2", ...],
            "industry": "industry/domain",
            "job_summary": "2-3 sentence summary of the role",
            "difficulty_score": 1-10,
            "ai_confidence_score": 0.0-1.0
        }}
        
        Important:
        - Extract skills both from technical requirements and job description
        - Include soft skills where relevant
        - Be specific about experience requirements
        - Identify the job level accurately
        - Provide a realistic difficulty score
        - Return ONLY the JSON object, no additional text
        """
    
    def _create_fallback_analysis(self, title: str, description: str) -> AnalysisResult:
        """Create a fallback analysis if GPT-4 response parsing fails"""
        return AnalysisResult(
            key_skills=["Analysis pending"],
            required_experience="To be determined",
            education_requirements=[],
            responsibilities=[],
            qualifications=[],
            nice_to_have=[],
            job_level="mid",
            remote_work=None,
            salary_range=None,
            company_benefits=[],
            industry=None,
            job_summary=f"Analysis pending for {title}",
            difficulty_score=5,
            ai_confidence_score=0.5
        )
