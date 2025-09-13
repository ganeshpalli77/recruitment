# Recruitment Dashboard Backend

A FastAPI backend service for analyzing job descriptions using Azure OpenAI GPT-4o.

## Features

- **Job Description Analysis**: Uses Azure OpenAI GPT-4o to extract key information from job postings
- **Structured Data Extraction**: Extracts skills, requirements, qualifications, and other relevant data
- **Supabase Integration**: Stores analysis results in the database
- **Background Processing**: Handles AI analysis asynchronously
- **Health Monitoring**: Includes health check endpoints

## Setup

1. **Install Dependencies**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Environment Configuration**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Required Environment Variables**
   - `AZURE_OPENAI_ENDPOINT`: Your Azure OpenAI endpoint
   - `AZURE_OPENAI_API_KEY`: Your Azure OpenAI API key
   - `AZURE_OPENAI_DEPLOYMENT_NAME`: GPT-4o deployment name
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key

4. **Run the Server**
   ```bash
   python start.py
   ```

## API Endpoints

### Health Check
- `GET /health` - Check service status and connectivity

### Job Analysis
- `POST /analyze-job` - Analyze a job description
- `GET /job/{job_id}/analysis` - Get analysis results

## Example Analysis Request

```json
{
    "job_id": "uuid",
    "title": "Senior Software Engineer",
    "description": "We are looking for a senior software engineer...",
    "requirements": "5+ years experience in Python, React..."
}
```

## Analysis Response

The AI extracts:
- Key skills and technologies
- Experience requirements
- Education requirements
- Job responsibilities
- Required qualifications
- Nice-to-have skills
- Job level assessment
- Remote work availability
- Salary information
- Company benefits
- Industry classification
- Job summary
- Difficulty score (1-10)
- AI confidence score

## Development

- The API runs on `http://localhost:8000` by default
- Interactive documentation is available at `/docs`
- Logs are stored in the `logs/` directory
