"""
Interview Analysis Service
Analyzes candidate interview transcripts using Azure OpenAI
"""

import logging
from typing import List, Dict, Any
from services.openai_service import OpenAIService
from models.interview_analysis import (
    InterviewAnalysisRequest,
    InterviewAnalysisResponse,
    QuestionAnalysis,
    OverallAnalysis,
    QuestionAnswerPair
)

logger = logging.getLogger(__name__)

class InterviewAnalysisService:
    def __init__(self, openai_service: OpenAIService):
        self.openai_service = openai_service
    
    def extract_qa_pairs(self, transcript: List[Dict]) -> List[QuestionAnswerPair]:
        """Extract question-answer pairs from transcript, skipping greetings"""
        qa_pairs = []
        current_question = None
        is_first_ai_message = True
        
        for entry in transcript:
            if entry['role'] == 'ai':
                # Skip the first AI message (greeting)
                if is_first_ai_message:
                    is_first_ai_message = False
                    continue
                
                # This is a question from the AI
                if current_question:
                    # If there was a previous question without an answer, add it with empty answer
                    qa_pairs.append(QuestionAnswerPair(
                        question=current_question['message'],
                        answer="[No response provided]",
                        timestamp=current_question['timestamp']
                    ))
                current_question = entry
            elif entry['role'] == 'user' and current_question:
                # This is the candidate's answer
                qa_pairs.append(QuestionAnswerPair(
                    question=current_question['message'],
                    answer=entry['message'],
                    timestamp=entry['timestamp']
                ))
                current_question = None
        
        # Add last question if it doesn't have an answer
        if current_question:
            qa_pairs.append(QuestionAnswerPair(
                question=current_question['message'],
                answer="[Interview ended before response]",
                timestamp=current_question['timestamp']
            ))
        
        return qa_pairs
    
    async def analyze_single_question(
        self,
        question: str,
        answer: str,
        job_title: str
    ) -> QuestionAnalysis:
        """Analyze a single question-answer pair"""
        
        prompt = f"""You are an expert technical interviewer analyzing a candidate's response for a {job_title} position.

Question Asked: {question}

Candidate's Answer: {answer}

Analyze this response and provide:
1. A score from 1-5 using this rubric:
   1 – Poor: Off-topic, incomplete, very unclear
   2 – Fair: Somewhat relevant, but major gaps or low clarity
   3 – Average: Answers the question, but lacks depth or examples
   4 – Good: Clear, relevant, structured, with at least one example
   5 – Excellent: Complete, clear, confident, well-structured, strong example(s)

2. Detailed feedback (2-3 sentences)
3. 2-3 specific strengths (what they did well)
4. 2-3 specific improvements (what could be better)

Respond in JSON format:
{{
  "score": <1-5>,
  "feedback": "<detailed feedback>",
  "strengths": ["<strength1>", "<strength2>"],
  "improvements": ["<improvement1>", "<improvement2>"]
}}"""

        try:
            response_text = await self.openai_service.generate_text(
                prompt=prompt,
                temperature=0.3,
                max_tokens=500
            )
            
            # Parse JSON response
            import json
            analysis_data = json.loads(response_text)
            
            return QuestionAnalysis(
                question=question,
                answer=answer,
                score=analysis_data['score'],
                feedback=analysis_data['feedback'],
                strengths=analysis_data.get('strengths', []),
                improvements=analysis_data.get('improvements', [])
            )
        
        except Exception as e:
            logger.error(f"Error analyzing question: {str(e)}")
            # Return default analysis if parsing fails
            return QuestionAnalysis(
                question=question,
                answer=answer,
                score=3,
                feedback="Unable to analyze this response automatically.",
                strengths=["Response provided"],
                improvements=["Could provide more detail"]
            )
    
    async def analyze_overall_performance(
        self,
        qa_pairs: List[QuestionAnswerPair],
        question_analyses: List[QuestionAnalysis],
        job_title: str,
        candidate_name: str
    ) -> OverallAnalysis:
        """Generate overall interview analysis"""
        
        # Calculate average score
        avg_score = sum(qa.score for qa in question_analyses) / len(question_analyses) if question_analyses else 0
        overall_score_value = round(avg_score)
        
        # Prepare context
        qa_summary = "\n\n".join([
            f"Q{i+1}: {qa.question}\nA{i+1}: {qa.answer}\nScore: {analysis.score}/5"
            for i, (qa, analysis) in enumerate(zip(qa_pairs, question_analyses))
        ])
        
        prompt = f"""You are a senior hiring manager reviewing an interview for a {job_title} position.

Candidate: {candidate_name}
Total Questions: {len(qa_pairs)}
Average Score: {avg_score:.2f}/5

Question-Answer Summary:
{qa_summary}

Provide an overall assessment using this rubric:
1 – Poor: Struggled with most questions. Unclear, incomplete responses. Not interview-ready.
2 – Fair: Some understanding, but lacks depth/structure. Limited confidence. Needs improvement.
3 – Average: Adequate performance. Correct answers but limited detail. Room for growth.
4 – Good: Clear, structured answers. Good knowledge and confidence. Minor gaps.
5 – Excellent: Outstanding. Confident, well-structured, highly relevant with strong examples.

Respond in JSON format:
{{
  "overall_score": <1-5 matching the rubric>,
  "summary": "<2-3 sentence performance summary>",
  "key_strengths": ["<strength1>", "<strength2>", "<strength3>"],
  "key_weaknesses": ["<weakness1>", "<weakness2>"],
  "recommendation": "<Clear hiring recommendation: 'Strongly Recommend', 'Recommend', 'Consider with Reservations', or 'Do Not Recommend'>",
  "confidence_level": "<High/Medium/Low>",
  "communication_quality": "<Excellent/Good/Average/Fair/Poor>"
}}"""

        try:
            response_text = await self.openai_service.generate_text(
                prompt=prompt,
                temperature=0.3,
                max_tokens=700
            )
            
            import json
            overall_data = json.loads(response_text)
            
            return OverallAnalysis(
                overall_score=overall_data['overall_score'],
                summary=overall_data['summary'],
                key_strengths=overall_data['key_strengths'],
                key_weaknesses=overall_data['key_weaknesses'],
                recommendation=overall_data['recommendation'],
                confidence_level=overall_data['confidence_level'],
                communication_quality=overall_data['communication_quality']
            )
        
        except Exception as e:
            logger.error(f"Error in overall analysis: {str(e)}")
            # Return default overall analysis
            return OverallAnalysis(
                overall_score=overall_score_value,
                summary=f"Interview completed with an average score of {avg_score:.1f}/5.",
                key_strengths=["Completed all questions", "Provided responses"],
                key_weaknesses=["Detailed analysis unavailable"],
                recommendation="Requires manual review",
                confidence_level="Medium",
                communication_quality="Average"
            )
    
    async def analyze_interview(
        self,
        request: InterviewAnalysisRequest
    ) -> InterviewAnalysisResponse:
        """Main method to analyze complete interview"""
        
        logger.info(f"Starting analysis for candidate: {request.candidate_name}")
        
        # Extract Q&A pairs
        qa_pairs = self.extract_qa_pairs(request.transcript)
        logger.info(f"Extracted {len(qa_pairs)} Q&A pairs")
        
        # Analyze each question
        question_analyses = []
        for qa in qa_pairs:
            analysis = await self.analyze_single_question(
                question=qa.question,
                answer=qa.answer,
                job_title=request.job_title
            )
            question_analyses.append(analysis)
        
        logger.info(f"Completed individual question analysis")
        
        # Overall analysis
        overall_analysis = await self.analyze_overall_performance(
            qa_pairs=qa_pairs,
            question_analyses=question_analyses,
            job_title=request.job_title,
            candidate_name=request.candidate_name
        )
        
        logger.info(f"Completed overall analysis")
        
        # Calculate average score
        avg_score = sum(qa.score for qa in question_analyses) / len(question_analyses) if question_analyses else 0
        
        return InterviewAnalysisResponse(
            candidate_id=request.candidate_id,
            question_analyses=question_analyses,
            overall_analysis=overall_analysis,
            total_questions=len(qa_pairs),
            average_score=round(avg_score, 2),
            analysis_model="gpt-4o"
        )
