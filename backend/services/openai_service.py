"""
Azure OpenAI service for job description analysis
"""

import json
import logging
import re
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
    
    async def evaluate_resume(self, evaluation_prompt: str) -> str:
        """
        Evaluate a resume against job requirements using GPT-4
        
        Args:
            evaluation_prompt: Detailed prompt for resume evaluation
            
        Returns:
            JSON string with evaluation scores and details
        """
        try:
            # Call Azure OpenAI for resume evaluation
            response = self.client.chat.completions.create(
                model=self.deployment_name,
                messages=[
                    {
                        "role": "system",
                        "content": self._get_resume_evaluation_system_prompt()
                    },
                    {
                        "role": "user",
                        "content": evaluation_prompt
                    }
                ],
                temperature=0.3,  # Lower temperature for more consistent scoring
                max_tokens=2000
            )
            
            # Get the evaluation response
            evaluation_text = response.choices[0].message.content
            logger.info("Received resume evaluation from Azure OpenAI")
            
            return evaluation_text
            
        except Exception as e:
            logger.error(f"Error evaluating resume: {str(e)}")
            # Return a default evaluation on error
            return json.dumps({
                "skills_score": 50,
                "experience_score": 50,
                "education_score": 50,
                "skills_matched": [],
                "skills_missing": [],
                "experience_details": {"years": 0, "relevance": "Error in evaluation"},
                "education_details": {"highest_degree": "Unknown", "relevance": "Error in evaluation"},
                "summary": "Evaluation could not be completed due to an error",
                "strengths": [],
                "improvements": ["Unable to evaluate"]
            })
    
    def _get_resume_evaluation_system_prompt(self) -> str:
        """Get the system prompt for resume evaluation"""
        return """
        You are an expert recruiter and talent acquisition specialist with years of experience 
        in evaluating resumes against job requirements. Your task is to provide objective, 
        fair, and thorough evaluation of candidates.
        
        Evaluation Guidelines:
        
        SKILLS SCORING (0-100):
        - 90-100: Perfect match, has all required skills and more
        - 75-89: Strong match, has most required skills
        - 60-74: Good match, has many required skills
        - 40-59: Fair match, has some required skills
        - 20-39: Weak match, has few required skills
        - 0-19: No match, lacks most required skills
        
        EXPERIENCE SCORING (0-100):
        - If candidate meets or exceeds required years: 80-100 (based on relevance)
        - If candidate has 75-99% of required years: 60-79
        - If candidate has 50-74% of required years: 40-59
        - If candidate has 25-49% of required years: 20-39
        - If candidate has less than 25% of required years: 0-19
        
        EDUCATION SCORING (0-100):
        - Perfect match with advanced relevant degree: 90-100
        - Required degree in relevant field: 75-89
        - Related degree or equivalent experience: 50-74
        - Some relevant education: 25-49
        - No relevant education: 0-24
        
        Always respond with valid JSON only. Be accurate and fair in your assessment.
        Focus on actual qualifications rather than demographic factors.
        """
    
    async def extract_candidate_name(self, resume_text: str) -> str:
        """
        Extract candidate's full name from resume text using GPT-4
        
        Args:
            resume_text: Raw resume text
            
        Returns:
            Extracted candidate name
        """
        try:
            # Create prompt for name extraction
            prompt = f"""
            Extract the candidate's full name from this resume text. 
            The name is usually at the very beginning of the resume.
            
            Resume text (first 500 characters):
            {resume_text[:500]}
            
            Instructions:
            1. Look for the candidate's full name, typically at the top of the resume
            2. Ignore section headers like "SUMMARY", "EXPERIENCE", "EDUCATION", etc.
            3. Return only the person's actual name (first name + last name)
            4. If no clear name is found, return "Unknown Candidate"
            
            Respond with ONLY the candidate's name, nothing else.
            """
            
            response = self.client.chat.completions.create(
                model=self.deployment_name,
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert at extracting candidate names from resumes. Extract only the person's actual name, ignoring any section headers or other text."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.1,  # Very low temperature for consistent results
                max_tokens=50  # Name should be short
            )
            
            extracted_name = response.choices[0].message.content.strip()
            
            # Clean up the extracted name
            cleaned_name = self._clean_extracted_name(extracted_name)
            
            logger.info(f"Extracted candidate name: {cleaned_name}")
            return cleaned_name
            
        except Exception as e:
            logger.error(f"Error extracting candidate name: {str(e)}")
            # Fallback to basic extraction
            return self._extract_name_fallback(resume_text)
    
    def _clean_extracted_name(self, name: str) -> str:
        """Clean up extracted name"""
        if not name or name.lower() in ['unknown', 'candidate', 'summary', 'resume', 'cv']:
            return "Unknown Candidate"
        
        # Remove common prefixes/suffixes
        name = re.sub(r'^(name:|candidate:|mr\.|ms\.|dr\.)\s*', '', name, flags=re.IGNORECASE)
        name = re.sub(r'\s*(resume|cv)$', '', name, flags=re.IGNORECASE)
        
        # Clean up extra whitespace
        name = ' '.join(name.split())
        
        # Capitalize properly
        name = ' '.join(word.capitalize() for word in name.split())
        
        return name if len(name) > 1 else "Unknown Candidate"
    
    def _extract_name_fallback(self, resume_text: str) -> str:
        """Fallback name extraction without LLM"""
        lines = resume_text.split('\n')
        
        for line in lines[:5]:  # Check first 5 lines
            line = line.strip()
            if not line:
                continue
                
            # Skip common headers
            if any(header in line.lower() for header in ['resume', 'cv', 'curriculum', 'summary', 'objective']):
                continue
                
            # Check if line looks like a name
            words = line.split()
            if 2 <= len(words) <= 4 and all(word.isalpha() or word.replace('.', '').isalpha() for word in words):
                # Looks like a name
                return ' '.join(word.capitalize() for word in words)
        
        return "Unknown Candidate"
    
    async def generate_text(self, prompt: str, temperature: float = 0.7, max_tokens: int = 1500) -> str:
        """
        Generate text using Azure OpenAI with a custom prompt
        
        Args:
            prompt: The prompt to send to the model
            temperature: Creativity level (0.0 to 1.0)
            max_tokens: Maximum tokens to generate
            
        Returns:
            Generated text response
        """
        try:
            response = self.client.chat.completions.create(
                model=self.deployment_name,
                messages=[
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=temperature,
                max_tokens=max_tokens
            )
            
            generated_text = response.choices[0].message.content
            logger.info("Successfully generated text from Azure OpenAI")
            
            return generated_text
            
        except Exception as e:
            logger.error(f"Error generating text: {str(e)}")
            raise e