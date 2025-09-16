# Resume Evaluation System Documentation

## Overview

This document describes the advanced resume evaluation system implemented for the recruitment dashboard. The system uses **LlamaParse** for document parsing and **Azure OpenAI GPT-4** for intelligent resume evaluation against job requirements.

## Key Features

### 1. Intelligent Resume Parsing
- **LlamaParse Integration**: Advanced PDF/DOCX parsing for accurate text extraction
- **Fallback Support**: PyPDF fallback when LlamaParse API is unavailable
- **Structured Data Extraction**: Automatically extracts:
  - Personal information (name, email, phone, LinkedIn, GitHub)
  - Education history
  - Work experience and years
  - Technical and soft skills
  - Certifications
  - Projects

### 2. AI-Powered Evaluation
- **Azure OpenAI GPT-4 Turbo (GPT-4.1)**: Sophisticated resume evaluation
- **Weighted Scoring System**:
  - Skills Match: 60% weight
  - Experience: 30% weight
  - Education: 10% weight
- **Detailed Analysis**:
  - Matched vs missing skills
  - Experience relevance assessment
  - Education alignment evaluation
  - Key strengths identification
  - Improvement areas
  - Overall recommendation (STRONG_MATCH, GOOD_MATCH, FAIR_MATCH, NO_MATCH)

### 3. High-Volume Processing
- **Batch Processing**: Handle 15k-20k resumes efficiently
- **Rate Limiting**: Prevents API overload
  - Single resume: 100/minute
  - Batch upload: 10/minute
- **Background Processing**: Large batches processed asynchronously
- **Chunked Processing**: 50 resumes per chunk with delays to avoid rate limits
- **Concurrent Evaluation**: Up to 10 concurrent evaluations in background

### 4. Database Storage
- **New `resume_results` Table**: Comprehensive evaluation storage
- **Indexed for Performance**: Multiple indexes for fast queries
- **Row-Level Security**: Secure access control
- **Complete Audit Trail**: Processing times, errors, and metadata

## Architecture

### Backend Components

#### 1. **LlamaParse Service** (`services/llamaparse_service.py`)
```python
- parse_resume_file(): Parse single resume
- parse_resume_batch(): Batch parsing with concurrency control
- Extract: personal info, education, experience, skills, certifications, projects
```

#### 2. **Resume Evaluation Service** (`services/resume_evaluation_service.py`)
```python
- evaluate_resume(): Single resume evaluation
- evaluate_batch(): Batch evaluation with semaphore control
- Scoring weights: 60% skills, 30% experience, 10% education
- Integration with Azure OpenAI for intelligent scoring
```

#### 3. **API Endpoints** (`main.py`)
```python
POST /evaluate-resume       # Single resume evaluation
POST /evaluate-batch        # Batch processing (15k-20k resumes)
POST /search-resumes        # Search evaluated resumes
GET  /job/{id}/rankings     # Get ranked candidates for a job
GET  /evaluation-stats      # Statistics dashboard
```

#### 4. **Models** (`models/resume_evaluation.py`)
- `ResumeUploadRequest`
- `BatchResumeUploadRequest`
- `ResumeEvaluationResult`
- `ResumeEvaluationResponse`
- `BatchEvaluationResponse`
- `ResumeRankingResponse`
- `EvaluationStatistics`

### Database Schema

#### `resume_results` Table
```sql
- id: UUID (Primary Key)
- job_posting_id: UUID (Foreign Key)
- candidate_name: TEXT
- candidate_email: TEXT
- candidate_phone: TEXT
- resume_file_name: TEXT
- resume_file_url: TEXT
- parsed_resume_text: TEXT
- skills_score: INTEGER (0-100)
- experience_score: INTEGER (0-100)
- education_score: INTEGER (0-100)
- overall_score: INTEGER (0-100)
- skills_matched: JSONB
- skills_missing: JSONB
- experience_details: JSONB
- education_details: JSONB
- evaluation_summary: TEXT
- key_strengths: TEXT[]
- improvement_areas: TEXT[]
- recommendation: TEXT
- processing_status: TEXT
- processing_error: TEXT
- processing_time_ms: INTEGER
- ai_model: TEXT
- evaluation_metadata: JSONB
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
- evaluated_at: TIMESTAMP
```

### Frontend Integration

#### Updated Actions (`src/app/job-postings/[id]/candidates/actions.ts`)
- Connects to backend API for real evaluation
- Falls back to mock data for demo/testing
- Handles file upload to Supabase Storage
- Creates candidate and evaluation records

## Configuration

### Environment Variables

Create a `.env` file in the backend directory:

```env
# Azure OpenAI Configuration (GPT-4 Turbo)
AZURE_OPENAI_API_KEY=your_key
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_API_VERSION=2024-02-01
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4-turbo

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# LlamaParse Configuration (Optional)
LLAMA_CLOUD_API_KEY=your_llama_key

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
DEBUG=True
```

### Frontend Environment

Add to `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Installation

### Backend Setup

```bash
cd recruitment-dashboard/backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the backend
python start.py
```

### Dependencies Added

```txt
llama-parse==0.5.2
llama-index==0.11.23
llama-index-readers-file==0.3.0
pypdf==4.3.1
aiofiles==24.1.0
slowapi==0.1.9
pandas==2.2.3
numpy==1.26.4
```

## Usage

### 1. Single Resume Evaluation

```bash
curl -X POST http://localhost:8000/evaluate-resume \
  -F "job_posting_id=uuid-here" \
  -F "resume_file=@path/to/resume.pdf"
```

### 2. Batch Evaluation

```javascript
const batch = {
  job_posting_id: "uuid-here",
  resumes: [
    { name: "resume1.pdf", content: "base64_content" },
    { name: "resume2.pdf", url: "https://url/to/resume.pdf" }
  ]
}

fetch('http://localhost:8000/evaluate-batch', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(batch)
})
```

### 3. Get Rankings

```bash
curl http://localhost:8000/job/{job_id}/rankings?limit=100
```

### 4. Search Resumes

```javascript
const searchParams = {
  job_posting_id: "uuid",
  min_score: 70,
  recommendation: "STRONG_MATCH",
  sort_by: "overall_score",
  sort_order: "desc"
}
```

## Performance Considerations

### Processing Capacity
- **Single Resume**: ~2-5 seconds
- **Batch (100 resumes)**: ~3-5 minutes
- **Large Batch (1000 resumes)**: ~30-50 minutes
- **Maximum Batch (20k resumes)**: ~10-16 hours

### Optimization Strategies
1. **Concurrent Processing**: 5-10 concurrent evaluations
2. **Chunked Batches**: Process in 50-resume chunks
3. **Rate Limiting**: Prevents API throttling
4. **Background Jobs**: Large batches processed asynchronously
5. **Caching**: Resume parsing results can be cached
6. **Database Indexing**: Optimized queries for rankings

## Security

1. **Row-Level Security (RLS)**: Enabled on resume_results table
2. **Authentication Required**: All endpoints require authenticated users
3. **Rate Limiting**: Prevents abuse and DoS attacks
4. **Input Validation**: File type and size validation
5. **Secure Storage**: Resumes stored in Supabase Storage with access control

## Error Handling

- **Graceful Fallbacks**: Falls back to basic parsing if LlamaParse fails
- **Default Scores**: Returns default evaluation if AI fails
- **Error Logging**: Comprehensive error tracking
- **Failed Processing Storage**: Failed evaluations stored with error details
- **Retry Logic**: Automatic retries for transient failures

## Monitoring

### Key Metrics to Track
1. **Processing Time**: Average time per resume
2. **Success Rate**: Successful vs failed evaluations
3. **API Usage**: OpenAI and LlamaParse API calls
4. **Queue Length**: Pending resumes in processing queue
5. **Score Distribution**: Overall score patterns

### Available Statistics Endpoint
```bash
GET /evaluation-stats?job_posting_id=uuid
```

Returns:
- Total evaluations
- Average scores
- Score distribution
- Top matched skills
- Recommendation distribution
- Processing times

## Future Enhancements

1. **Real-time Updates**: WebSocket for live processing status
2. **Advanced Parsing**: Support for more file formats
3. **ML Model Fine-tuning**: Custom models for specific industries
4. **Bulk Export**: Export evaluation results to CSV/Excel
5. **Comparison Matrix**: Compare multiple candidates side-by-side
6. **Interview Scheduling**: Auto-schedule based on scores
7. **Email Notifications**: Notify recruiters of high-scoring candidates
8. **Analytics Dashboard**: Advanced visualization of hiring metrics

## Troubleshooting

### Common Issues

1. **LlamaParse API Key Missing**
   - System falls back to PyPDF
   - Set LLAMA_CLOUD_API_KEY for better parsing

2. **Rate Limit Errors**
   - Reduce concurrent evaluations
   - Increase delay between chunks
   - Use smaller batch sizes

3. **Memory Issues with Large Batches**
   - Process in smaller chunks
   - Increase server memory
   - Use background processing

4. **Slow Processing**
   - Check Azure OpenAI quotas
   - Optimize concurrent processing
   - Consider caching repeated evaluations

## Support

For issues or questions about the resume evaluation system:
1. Check error logs in `backend/logs/`
2. Review Supabase logs for database issues
3. Monitor Azure OpenAI usage and quotas
4. Ensure all environment variables are set correctly
