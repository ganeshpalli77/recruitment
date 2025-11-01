# Multi-Level Interview Questions Implementation

## Overview
Implemented a new question generation system that creates interview questions with **3 difficulty levels** (Easy, Medium, Difficult) for each base question.

---

## What Changed

### **Before:**
- 20 min interview → 7 questions generated
- Single difficulty level

### **After:**
- 20 min interview → 7 base questions → **21 total questions** (7 × 3 difficulty levels)
- Each question has 3 variations: Easy, Medium, Difficult

---

## Database Schema

### New Table: `interview_questions_multi_level`

```sql
CREATE TABLE interview_questions_multi_level (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id UUID NOT NULL,
  candidate_name TEXT NOT NULL,
  job_posting_id UUID REFERENCES job_postings(id),
  interview_duration INTEGER NOT NULL,
  
  -- Question distribution
  screening_percentage INTEGER DEFAULT 30,
  technical_percentage INTEGER DEFAULT 50,
  hr_percentage INTEGER DEFAULT 20,
  
  -- Base questions count (e.g., 7 for 20 min)
  base_questions_count INTEGER NOT NULL,
  
  -- Total questions with variations (e.g., 21 = 7 * 3)
  total_questions INTEGER NOT NULL,
  
  greeting_message TEXT NOT NULL,
  
  -- Multi-level questions (JSONB arrays)
  screening_questions JSONB DEFAULT '[]'::jsonb,
  technical_questions JSONB DEFAULT '[]'::jsonb,
  hr_questions JSONB DEFAULT '[]'::jsonb,
  
  -- Metadata
  generation_prompt TEXT,
  ai_model TEXT DEFAULT 'gpt-4o',
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## Question Structure

### JSONB Format:

```json
{
  "screening_questions": [
    {
      "base_question": "Tell me about yourself",
      "variations": [
        {
          "difficulty": "easy",
          "question": "Please introduce yourself briefly",
          "expected_duration_seconds": 75
        },
        {
          "difficulty": "medium",
          "question": "Tell me about yourself and your professional background",
          "expected_duration_seconds": 105
        },
        {
          "difficulty": "difficult",
          "question": "Describe your professional journey and how your experiences align with this role",
          "expected_duration_seconds": 150
        }
      ]
    }
  ],
  "technical_questions": [...],
  "hr_questions": [...]
}
```

---

## Duration to Questions Mapping

| Duration | Base Questions | Total Questions (with variations) |
|----------|---------------|-----------------------------------|
| 10 min   | 3             | 9 (3 × 3)                        |
| 20 min   | 7             | 21 (7 × 3)                       |
| 30 min   | 10            | 30 (10 × 3)                      |
| 45 min   | 15            | 45 (15 × 3)                      |
| 60 min   | 20            | 60 (20 × 3)                      |

---

## API Endpoint

### **POST** `/api/generate-multi-level-questions`

**Request:**
```json
{
  "candidate_id": "uuid",
  "candidate_name": "John Doe",
  "job_posting_id": "uuid",
  "job_title": "Senior Software Engineer",
  "job_description": "...",
  "job_requirements": "...",
  "skills_required": ["Python", "React", "AWS"],
  "ai_analysis": "...",
  "duration_minutes": 20,
  "screening_percentage": 30,
  "technical_percentage": 50,
  "hr_percentage": 20
}
```

**Response:**
```json
{
  "candidate_id": "uuid",
  "candidate_name": "John Doe",
  "job_posting_id": "uuid",
  "interview_duration": 20,
  "screening_percentage": 30,
  "technical_percentage": 50,
  "hr_percentage": 20,
  "base_questions_count": 7,
  "total_questions": 21,
  "greeting_message": "Welcome John Doe...",
  "screening_questions": [
    {
      "base_question": "...",
      "variations": [
        {"difficulty": "easy", "question": "...", "expected_duration_seconds": 75},
        {"difficulty": "medium", "question": "...", "expected_duration_seconds": 105},
        {"difficulty": "difficult", "question": "...", "expected_duration_seconds": 150}
      ]
    }
  ],
  "technical_questions": [...],
  "hr_questions": [...],
  "model": "gpt-4o",
  "generation_time_ms": 5420,
  "generated_at": "2025-11-01T06:00:00Z"
}
```

---

## Files Created/Modified

### **Backend:**
1. ✅ **Database Migration:** `interview_questions_multi_level` table
2. ✅ **Service:** `backend/services/multi_level_question_service.py`
3. ✅ **Models:** `backend/models/multi_level_questions.py`
4. ✅ **Endpoint:** Added to `backend/main.py`

### **Frontend (TODO):**
- Update interview setup to call new endpoint
- Handle multi-level question display
- Implement adaptive difficulty selection during interview

---

## Expected Answer Durations

| Difficulty | Duration (seconds) | Description                    |
|------------|-------------------|--------------------------------|
| Easy       | 75s (1:15)        | Simple, straightforward answer |
| Medium     | 105s (1:45)       | Moderate thought required      |
| Difficult  | 150s (2:30)       | Complex, comprehensive answer  |

---

## Question Distribution Example

**20-minute interview with default percentages:**
- Screening (30%): 2 base questions → 6 total
- Technical (50%): 4 base questions → 12 total  
- HR (20%): 1 base question → 3 total
- **Total: 7 base → 21 questions**

---

## How to Use

### **From Frontend:**

```typescript
const response = await fetch('http://localhost:8000/api/generate-multi-level-questions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    candidate_id: candidateId,
    candidate_name: candidateName,
    job_posting_id: jobId,
    job_title: "Senior Developer",
    job_description: "...",
    job_requirements: "...",
    skills_required: ["React", "Node.js"],
    ai_analysis: "...",
    duration_minutes: 20,
    screening_percentage: 30,
    technical_percentage: 50,
    hr_percentage: 20
  })
});

const data = await response.json();
console.log(`Generated ${data.total_questions} questions!`);
```

### **Querying from Database:**

```sql
-- Get multi-level questions for a candidate
SELECT 
  candidate_name,
  interview_duration,
  base_questions_count,
  total_questions,
  screening_questions,
  technical_questions,
  hr_questions
FROM interview_questions_multi_level
WHERE candidate_id = 'your-uuid';
```

---

## Benefits

1. ✅ **Adaptive Difficulty:** Can adjust question difficulty based on candidate performance
2. ✅ **Better Assessment:** More nuanced evaluation across skill levels
3. ✅ **Time Management:** Expected durations help manage interview timing
4. ✅ **Flexibility:** Can choose appropriate difficulty per candidate
5. ✅ **Comprehensive Coverage:** 3x more questions to choose from

---

## Next Steps

1. Update frontend to call new endpoint
2. Implement UI for displaying multi-level questions
3. Add logic to select difficulty dynamically during interview
4. Update interview analysis to consider difficulty levels
5. Add metrics tracking for difficulty selection

---

## Rate Limits

- **20 requests per minute** per IP address
- Designed for concurrent candidate question generation

---

## Migration Notes

- Old table `interview_questions` still exists (backward compatibility)
- New system uses `interview_questions_multi_level` table
- Both systems can coexist during transition period
