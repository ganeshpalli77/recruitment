"""
LlamaParse Service for Resume Parsing
Handles PDF/DOCX resume parsing using LlamaParse
"""

import logging
from typing import Dict, Any, List, Optional
import os
import re
from datetime import datetime
import asyncio
from pathlib import Path
import aiofiles

from llama_parse import LlamaParse
from llama_index.core import Document
import json

logger = logging.getLogger(__name__)

class LlamaParseService:
    """Service for parsing resumes using LlamaParse"""
    
    def __init__(self):
        """Initialize LlamaParse with API key"""
        self.api_key = os.getenv("LLAMA_CLOUD_API_KEY")
        if not self.api_key:
            logger.warning("LLAMA_CLOUD_API_KEY not found, using local parsing fallback")
        
        self.parser = None
        self._initialize_parser()
    
    def _initialize_parser(self):
        """Initialize the LlamaParse parser"""
        try:
            if self.api_key:
                self.parser = LlamaParse(
                    api_key=self.api_key,
                    result_type="text",  # Get plain text for easier processing
                    verbose=True,
                    language="en",  # English resumes
                    parsing_instruction="Extract all text from the resume including personal information, work experience, education, skills, certifications, and projects."
                )
                logger.info("LlamaParse initialized with API key")
            else:
                logger.info("LlamaParse API key not available, using fallback parser")
        except Exception as e:
            logger.error(f"Error initializing LlamaParse: {str(e)}")
            self.parser = None
    
    async def parse_resume_file(self, file_path: str) -> Dict[str, Any]:
        """
        Parse a resume file and extract structured information
        
        Args:
            file_path: Path to the resume file
            
        Returns:
            Dictionary containing parsed resume data
        """
        try:
            # Use LlamaParse if available
            if self.parser:
                documents = await self.parser.aload_data(file_path)
                text = "\n\n".join([doc.text for doc in documents])
            else:
                # Fallback to basic PDF parsing
                text = await self._fallback_parse(file_path)
            
            # Extract structured information from text
            parsed_data = self._extract_resume_info(text)
            parsed_data['raw_text'] = text
            
            return parsed_data
            
        except Exception as e:
            logger.error(f"Error parsing resume file: {str(e)}")
            raise
    
    async def parse_resume_batch(self, file_paths: List[str], max_concurrent: int = 5) -> List[Dict[str, Any]]:
        """
        Parse multiple resumes concurrently
        
        Args:
            file_paths: List of file paths to parse
            max_concurrent: Maximum concurrent parsing operations
            
        Returns:
            List of parsed resume data
        """
        semaphore = asyncio.Semaphore(max_concurrent)
        
        async def parse_with_semaphore(file_path):
            async with semaphore:
                try:
                    return await self.parse_resume_file(file_path)
                except Exception as e:
                    logger.error(f"Error parsing {file_path}: {str(e)}")
                    return {
                        'file_path': file_path,
                        'error': str(e),
                        'parsed': False
                    }
        
        tasks = [parse_with_semaphore(fp) for fp in file_paths]
        results = await asyncio.gather(*tasks)
        
        return results
    
    async def _fallback_parse(self, file_path: str) -> str:
        """
        Fallback PDF parsing using PyPDF
        
        Args:
            file_path: Path to the PDF file
            
        Returns:
            Extracted text
        """
        try:
            from pypdf import PdfReader
            
            reader = PdfReader(file_path)
            text = ""
            for page in reader.pages:
                text += page.extract_text() + "\n"
            
            return text
            
        except Exception as e:
            logger.error(f"Fallback parsing failed: {str(e)}")
            return ""
    
    def _extract_resume_info(self, text: str) -> Dict[str, Any]:
        """
        Extract structured information from resume text
        
        Args:
            text: Raw resume text
            
        Returns:
            Structured resume data
        """
        info = {
            'personal_info': self._extract_personal_info(text),
            'education': self._extract_education(text),
            'experience': self._extract_experience(text),
            'skills': self._extract_skills(text),
            'certifications': self._extract_certifications(text),
            'projects': self._extract_projects(text),
            'parsed_at': datetime.utcnow().isoformat()
        }
        
        return info
    
    def _extract_personal_info(self, text: str) -> Dict[str, str]:
        """Extract personal information from resume text"""
        info = {}
        
        # Extract email
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        emails = re.findall(email_pattern, text)
        if emails:
            info['email'] = emails[0]
        
        # Extract phone
        phone_pattern = r'(\+?\d{1,3}[-.\s]?)?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}'
        phones = re.findall(phone_pattern, text)
        if phones:
            info['phone'] = phones[0] if isinstance(phones[0], str) else phones[0][0]
        
        # Extract name (usually at the beginning of the resume)
        lines = text.split('\n')
        for i, line in enumerate(lines[:10]):  # Check first 10 lines
            line = line.strip()
            if line and len(line.split()) <= 4 and not any(char.isdigit() for char in line):
                # Likely a name if it's short and has no digits
                if not any(keyword in line.lower() for keyword in ['resume', 'cv', 'curriculum', 'page']):
                    info['name'] = line
                    break
        
        # Extract LinkedIn
        linkedin_pattern = r'linkedin\.com/in/[\w-]+'
        linkedin = re.search(linkedin_pattern, text.lower())
        if linkedin:
            info['linkedin'] = linkedin.group(0)
        
        # Extract GitHub
        github_pattern = r'github\.com/[\w-]+'
        github = re.search(github_pattern, text.lower())
        if github:
            info['github'] = github.group(0)
        
        return info
    
    def _extract_education(self, text: str) -> List[Dict[str, str]]:
        """Extract education information from resume text"""
        education = []
        
        # Common education keywords
        edu_keywords = [
            'education', 'academic', 'qualification', 'degree',
            'bachelor', 'master', 'phd', 'diploma', 'certificate'
        ]
        
        # Find education section
        text_lower = text.lower()
        for keyword in edu_keywords:
            if keyword in text_lower:
                # Extract lines around education keywords
                lines = text.split('\n')
                for i, line in enumerate(lines):
                    if keyword in line.lower():
                        # Extract next few lines as education info
                        edu_text = '\n'.join(lines[i:min(i+5, len(lines))])
                        
                        # Extract degree information
                        degree_patterns = [
                            r'(Bachelor|Master|PhD|B\.?S\.?|M\.?S\.?|B\.?Tech|M\.?Tech|MBA|B\.?E\.?|M\.?E\.?)',
                            r'(Computer Science|Engineering|Information Technology|Software|Data Science)',
                            r'(\d{4})'  # Year
                        ]
                        
                        edu_entry = {
                            'degree': '',
                            'field': '',
                            'institution': '',
                            'year': ''
                        }
                        
                        for pattern in degree_patterns:
                            match = re.search(pattern, edu_text, re.IGNORECASE)
                            if match:
                                if 'Bachelor' in match.group(0) or 'Master' in match.group(0):
                                    edu_entry['degree'] = match.group(0)
                                elif match.group(0).isdigit():
                                    edu_entry['year'] = match.group(0)
                        
                        if edu_entry['degree'] or edu_entry['year']:
                            education.append(edu_entry)
                        
                        break
        
        return education
    
    def _extract_experience(self, text: str) -> List[Dict[str, Any]]:
        """Extract work experience from resume text"""
        experience = []
        
        # Experience section patterns
        exp_keywords = ['experience', 'employment', 'work history', 'professional experience']
        
        text_lower = text.lower()
        
        # Find years of experience mentions
        years_pattern = r'(\d+)\+?\s*years?\s*(of)?\s*experience'
        years_matches = re.findall(years_pattern, text_lower)
        
        total_experience_years = 0
        if years_matches:
            for match in years_matches:
                try:
                    years = int(match[0])
                    total_experience_years = max(total_experience_years, years)
                except:
                    pass
        
        # Extract job titles and companies
        # Common job title patterns
        job_titles = [
            'software engineer', 'developer', 'programmer', 'analyst', 
            'manager', 'designer', 'architect', 'consultant', 'specialist',
            'lead', 'senior', 'junior', 'intern', 'associate'
        ]
        
        lines = text.split('\n')
        for line in lines:
            line_lower = line.lower()
            for title in job_titles:
                if title in line_lower:
                    experience.append({
                        'title': line.strip(),
                        'raw_text': line
                    })
                    break
        
        # Add total years
        if total_experience_years > 0:
            experience.insert(0, {
                'total_years': total_experience_years
            })
        
        return experience
    
    def _extract_skills(self, text: str) -> List[str]:
        """Extract skills from resume text"""
        skills = []
        
        # Common technical skills
        tech_skills = [
            # Programming Languages
            'python', 'java', 'javascript', 'typescript', 'c++', 'c#', 'go', 'rust',
            'ruby', 'php', 'swift', 'kotlin', 'scala', 'r', 'matlab', 'perl',
            
            # Web Technologies
            'html', 'css', 'react', 'angular', 'vue', 'node.js', 'express',
            'django', 'flask', 'fastapi', 'spring', 'asp.net', 'rails',
            
            # Databases
            'sql', 'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch',
            'oracle', 'cassandra', 'dynamodb', 'firebase', 'supabase',
            
            # Cloud & DevOps
            'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins', 'gitlab',
            'terraform', 'ansible', 'ci/cd', 'linux', 'bash', 'powershell',
            
            # AI/ML
            'machine learning', 'deep learning', 'tensorflow', 'pytorch', 'keras',
            'scikit-learn', 'pandas', 'numpy', 'opencv', 'nlp', 'computer vision',
            'langchain', 'llamaindex', 'openai', 'gpt', 'llm',
            
            # Others
            'git', 'agile', 'scrum', 'rest api', 'graphql', 'microservices',
            'blockchain', 'android', 'ios', 'unity', 'unreal engine'
        ]
        
        text_lower = text.lower()
        
        # Find skills section
        skills_section_start = -1
        skills_keywords = ['skills', 'technical skills', 'core competencies', 'technologies']
        
        lines = text.split('\n')
        for i, line in enumerate(lines):
            if any(keyword in line.lower() for keyword in skills_keywords):
                skills_section_start = i
                break
        
        # Extract skills from section or entire text
        search_text = text_lower
        if skills_section_start >= 0:
            # Focus on skills section (next 10 lines)
            search_text = '\n'.join(lines[skills_section_start:min(skills_section_start+10, len(lines))]).lower()
        
        # Find matching skills
        for skill in tech_skills:
            if skill in search_text:
                skills.append(skill)
        
        # Also extract skills from comma-separated lists
        if skills_section_start >= 0:
            skills_text = '\n'.join(lines[skills_section_start:min(skills_section_start+10, len(lines))])
            # Find comma-separated items
            comma_pattern = r'[A-Za-z][A-Za-z\s\+\#\.\-]+(?:,|$)'
            potential_skills = re.findall(comma_pattern, skills_text)
            for skill in potential_skills:
                skill = skill.strip().strip(',').lower()
                if len(skill) > 1 and len(skill) < 30:  # Reasonable skill length
                    if skill not in skills:
                        skills.append(skill)
        
        return list(set(skills))  # Remove duplicates
    
    def _extract_certifications(self, text: str) -> List[str]:
        """Extract certifications from resume text"""
        certifications = []
        
        # Common certification patterns
        cert_keywords = ['certification', 'certified', 'certificate', 'license']
        cert_names = [
            'AWS', 'Azure', 'GCP', 'CCNA', 'CCNP', 'PMP', 'CISSP',
            'CompTIA', 'Oracle', 'Microsoft', 'Google', 'Cisco',
            'Scrum Master', 'Product Owner', 'ITIL', 'Six Sigma'
        ]
        
        text_lower = text.lower()
        lines = text.split('\n')
        
        for i, line in enumerate(lines):
            line_lower = line.lower()
            # Check if line contains certification keywords
            if any(keyword in line_lower for keyword in cert_keywords):
                # Check next few lines for certification names
                for j in range(max(0, i-1), min(i+3, len(lines))):
                    for cert in cert_names:
                        if cert.lower() in lines[j].lower():
                            certifications.append(lines[j].strip())
                            break
        
        return list(set(certifications))  # Remove duplicates
    
    def _extract_projects(self, text: str) -> List[Dict[str, str]]:
        """Extract project information from resume text"""
        projects = []
        
        # Project section keywords
        project_keywords = ['projects', 'portfolio', 'personal projects', 'academic projects']
        
        lines = text.split('\n')
        project_section_start = -1
        
        for i, line in enumerate(lines):
            if any(keyword in line.lower() for keyword in project_keywords):
                project_section_start = i
                break
        
        if project_section_start >= 0:
            # Extract next 15 lines as potential project info
            project_lines = lines[project_section_start+1:min(project_section_start+15, len(lines))]
            
            current_project = None
            for line in project_lines:
                line = line.strip()
                if line and not line.startswith(' '):  # Likely a project title
                    if current_project:
                        projects.append(current_project)
                    current_project = {
                        'title': line,
                        'description': ''
                    }
                elif current_project and line:
                    current_project['description'] += ' ' + line
            
            if current_project:
                projects.append(current_project)
        
        return projects
