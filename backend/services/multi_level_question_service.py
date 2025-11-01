"""
Multi-Level Interview Question Generation Service
Generates interview questions with easy, medium, and difficult variations
"""

import logging
from typing import List, Dict, Any
from datetime import datetime
import json

logger = logging.getLogger(__name__)


class MultiLevelQuestionService:
    """Service for generating multi-level interview questions"""
    
    def __init__(self, openai_service, supabase_service):
        self.openai_service = openai_service
        self.supabase_service = supabase_service
    
    def calculate_question_distribution(self, duration_minutes: int, screening_pct: int, technical_pct: int, hr_pct: int) -> Dict[str, int]:
        """
        Calculate how many base questions to generate for each category
        
        Duration mapping:
        - 10 min → 3 base questions (9 total with variations)
        - 20 min → 7 base questions (21 total)
        - 30 min → 10 base questions (30 total)
        - 45 min → 15 base questions (45 total)
        - 60 min → 20 base questions (60 total)
        """
        duration_to_base_questions = {
            10: 3,
            20: 7,
            30: 10,
            45: 15,
            60: 20
        }
        
        base_count = duration_to_base_questions.get(duration_minutes, 7)
        
        # Distribute base questions across categories
        screening_base = max(1, int(base_count * (screening_pct / 100)))
        technical_base = max(1, int(base_count * (technical_pct / 100)))
        hr_base = max(1, int(base_count * (hr_pct / 100)))
        
        # Adjust to match total
        total = screening_base + technical_base + hr_base
        if total < base_count:
            # Add remaining to technical (usually largest category)
            technical_base += (base_count - total)
        elif total > base_count:
            # Remove from largest category
            if technical_base > screening_base and technical_base > hr_base:
                technical_base -= (total - base_count)
            else:
                screening_base = max(1, screening_base - (total - base_count))
        
        return {
            'screening': screening_base,
            'technical': technical_base,
            'hr': hr_base,
            'base_total': screening_base + technical_base + hr_base,
            'total_with_variations': (screening_base + technical_base + hr_base) * 3
        }
    
    async def generate_multi_level_questions(
        self,
        candidate_id: str,
        candidate_name: str,
        job_posting_id: str,
        job_title: str,
        job_description: str,
        job_requirements: str,
        skills_required: List[str],
        ai_analysis: str,
        duration_minutes: int,
        screening_pct: int = 30,
        technical_pct: int = 50,
        hr_pct: int = 20
    ) -> Dict[str, Any]:
        """
        Generate multi-level interview questions with difficulty variations
        
        Returns structure:
        {
            'screening_questions': [
                {
                    'base_question': 'Tell me about yourself',
                    'variations': [
                        {'difficulty': 'easy', 'question': '...', 'expected_duration_seconds': 60},
                        {'difficulty': 'medium', 'question': '...', 'expected_duration_seconds': 90},
                        {'difficulty': 'difficult', 'question': '...', 'expected_duration_seconds': 120}
                    ]
                }
            ],
            'technical_questions': [...],
            'hr_questions': [...]
        }
        """
        
        try:
            logger.info(f"Generating multi-level questions for {candidate_name} (Job: {job_title})")
            
            # Calculate question distribution
            distribution = self.calculate_question_distribution(
                duration_minutes, screening_pct, technical_pct, hr_pct
            )
            
            logger.info(f"Question distribution: {distribution}")
            
            # Build job context
            job_context = f"""
Job Title: {job_title}

Job Description:
{job_description}

Requirements:
{job_requirements}

Required Skills: {', '.join(skills_required)}

AI Analysis Insights:
{ai_analysis}
"""
            
            # Generate screening questions with variations
            screening_questions = await self._generate_category_questions(
                category="screening",
                base_count=distribution['screening'],
                job_context=job_context,
                duration_minutes=duration_minutes
            )
            
            # Generate technical questions with variations
            technical_questions = await self._generate_category_questions(
                category="technical",
                base_count=distribution['technical'],
                job_context=job_context,
                duration_minutes=duration_minutes
            )
            
            # Generate HR questions with variations
            hr_questions = await self._generate_category_questions(
                category="hr",
                base_count=distribution['hr'],
                job_context=job_context,
                duration_minutes=duration_minutes
            )
            
            # Generate greeting message
            greeting_prompt = f"""Create a warm, professional greeting message for an AI interviewer starting a {duration_minutes}-minute interview for the position of {job_title}.
            
The greeting should:
1. Welcome the candidate by name ({candidate_name})
2. Introduce the AI interviewer
3. Explain the interview structure briefly
4. Set a positive, encouraging tone
5. Be concise (2-3 sentences)

Generate the greeting message now:"""
            
            greeting_message = await self.openai_service.generate_text(greeting_prompt, temperature=0.7)
            greeting_message = greeting_message.strip()
            
            # Prepare result
            result = {
                'candidate_id': candidate_id,
                'candidate_name': candidate_name,
                'job_posting_id': job_posting_id,
                'interview_duration': duration_minutes,
                'screening_percentage': screening_pct,
                'technical_percentage': technical_pct,
                'hr_percentage': hr_pct,
                'base_questions_count': distribution['base_total'],
                'total_questions': distribution['total_with_variations'],
                'greeting_message': greeting_message,
                'screening_questions': screening_questions,
                'technical_questions': technical_questions,
                'hr_questions': hr_questions,
                'generated_at': datetime.utcnow().isoformat()
            }
            
            # Store in database
            await self._store_questions_in_db(result)
            
            logger.info(f"Successfully generated {distribution['total_with_variations']} total questions ({distribution['base_total']} base questions × 3 difficulty levels)")
            
            return result
            
        except Exception as e:
            logger.error(f"Error generating multi-level questions: {str(e)}")
            raise
    
    async def _generate_category_questions(
        self,
        category: str,
        base_count: int,
        job_context: str,
        duration_minutes: int
    ) -> List[Dict[str, Any]]:
        """Generate questions for a specific category with difficulty variations"""
        
        category_config = {
            'screening': {
                'focus': 'Basic qualifications, background, cultural fit, motivation, communication skills, and general understanding of the role',
                'style': 'open-ended questions to get to know the candidate'
            },
            'technical': {
                'focus': 'Technical skills and expertise, problem-solving abilities, relevant experience with required technologies, and depth of knowledge in key areas',
                'style': 'specific questions about job requirements, mixing theoretical and practical aspects'
            },
            'hr': {
                'focus': 'Leadership and teamwork, conflict resolution, career goals and aspirations, work ethic and values, adaptability and learning mindset',
                'style': 'behavioral interview techniques (STAR method compatible) to reveal personality and soft skills'
            }
        }
        
        config = category_config[category]
        
        # Generate base questions
        base_prompt = f"""You are an expert interviewer creating {category.upper()} interview questions.

{job_context}

Generate EXACTLY {base_count} base {category} questions that assess:
{config['focus']}

Requirements:
1. Questions should be {config['style']}
2. Each question should be clear and direct
3. Return ONLY the questions, one per line
4. Do not number the questions
5. Do not add any explanations or commentary
6. Make questions progressively challenging

Generate {base_count} base questions now:"""
        
        base_response = await self.openai_service.generate_text(base_prompt, temperature=0.7)
        base_questions = [q.strip() for q in base_response.split('\n') if q.strip() and not q.strip().startswith('#')]
        base_questions = base_questions[:base_count]
        
        # For each base question, generate 3 difficulty variations
        questions_with_variations = []
        
        for base_q in base_questions:
            # Generate variations
            variation_prompt = f"""Given this base interview question for a {category} round:
"{base_q}"

Create 3 variations of this question with different difficulty levels:

1. EASY version:
   - Simpler phrasing
   - More straightforward to answer
   - Suitable for entry-level or nervous candidates
   - Expected answer time: 60-90 seconds

2. MEDIUM version:
   - Standard professional phrasing
   - Requires moderate thought and explanation
   - Suitable for mid-level candidates
   - Expected answer time: 90-120 seconds

3. DIFFICULT version:
   - Complex, multi-layered question
   - Requires deep thinking and comprehensive answer
   - Suitable for senior-level candidates
   - Expected answer time: 120-180 seconds

Format your response EXACTLY as:
EASY: [question]
MEDIUM: [question]
DIFFICULT: [question]

Do not add any extra text or explanations."""
            
            variation_response = await self.openai_service.generate_text(variation_prompt, temperature=0.6)
            
            # Parse variations
            variations = self._parse_variations(variation_response)
            
            questions_with_variations.append({
                'base_question': base_q,
                'variations': variations
            })
        
        return questions_with_variations
    
    def _parse_variations(self, response: str) -> List[Dict[str, Any]]:
        """Parse the difficulty variations from AI response"""
        
        variations = []
        lines = response.strip().split('\n')
        
        difficulty_map = {
            'easy': 75,      # 75 seconds
            'medium': 105,   # 105 seconds  
            'difficult': 150 # 150 seconds
        }
        
        for line in lines:
            line = line.strip()
            if line.startswith('EASY:'):
                question = line.replace('EASY:', '').strip()
                variations.append({
                    'difficulty': 'easy',
                    'question': question,
                    'expected_duration_seconds': difficulty_map['easy']
                })
            elif line.startswith('MEDIUM:'):
                question = line.replace('MEDIUM:', '').strip()
                variations.append({
                    'difficulty': 'medium',
                    'question': question,
                    'expected_duration_seconds': difficulty_map['medium']
                })
            elif line.startswith('DIFFICULT:'):
                question = line.replace('DIFFICULT:', '').strip()
                variations.append({
                    'difficulty': 'difficult',
                    'question': question,
                    'expected_duration_seconds': difficulty_map['difficult']
                })
        
        # Ensure we have all 3 variations (fallback if parsing fails)
        if len(variations) < 3:
            logger.warning("Failed to parse all 3 variations, using defaults")
            base_q = "Please describe your relevant experience"
            variations = [
                {'difficulty': 'easy', 'question': base_q, 'expected_duration_seconds': 75},
                {'difficulty': 'medium', 'question': base_q, 'expected_duration_seconds': 105},
                {'difficulty': 'difficult', 'question': base_q, 'expected_duration_seconds': 150}
            ]
        
        return variations[:3]  # Ensure exactly 3 variations
    
    async def _store_questions_in_db(self, data: Dict[str, Any]):
        """Store multi-level questions in Supabase database"""
        
        try:
            # Prepare data for database
            db_record = {
                'candidate_id': data['candidate_id'],
                'candidate_name': data['candidate_name'],
                'job_posting_id': data['job_posting_id'],
                'interview_duration': data['interview_duration'],
                'screening_percentage': data['screening_percentage'],
                'technical_percentage': data['technical_percentage'],
                'hr_percentage': data['hr_percentage'],
                'base_questions_count': data['base_questions_count'],
                'total_questions': data['total_questions'],
                'greeting_message': data['greeting_message'],
                'screening_questions': json.dumps(data['screening_questions']),
                'technical_questions': json.dumps(data['technical_questions']),
                'hr_questions': json.dumps(data['hr_questions']),
                'generation_prompt': f"Multi-level question generation for {data['interview_duration']} min interview",
                'ai_model': 'gpt-4o',
                'generated_at': data['generated_at']
            }
            
            # Upsert into database (prevents duplicates)
            response = self.supabase_service.client.table('interview_questions_multi_level')\
                .upsert(db_record, on_conflict='candidate_id,job_posting_id').execute()
            
            logger.info(f"Successfully stored multi-level questions in database for candidate {data['candidate_id']}")
            
            return response.data
            
        except Exception as e:
            logger.error(f"Error storing questions in database: {str(e)}")
            raise
