# AI-Powered Job Analysis Backend Setup

This guide will help you set up the complete AI-powered job analysis system using Azure OpenAI GPT-4o and FastAPI backend.

## 🎯 What Was Built

### Backend Components
- **FastAPI Backend** with Azure OpenAI integration
- **Job Analysis Service** using GPT-4o for intelligent job description parsing
- **Supabase Integration** for storing AI analysis results
- **Background Processing** for non-blocking AI analysis
- **Health Monitoring** and error handling

### Frontend Integration
- **API Client** for backend communication
- **Enhanced Job Posting Table** with AI analysis display
- **Automated Analysis Trigger** when creating new job postings
- **Rich AI Insights** including difficulty scores, skills extraction, and job level classification

## 🏗️ Architecture

```
Frontend (Next.js)
    ↓ HTTP Requests
FastAPI Backend
    ↓ AI Analysis
Azure OpenAI (GPT-4o)
    ↓ Store Results
Supabase Database
```

## 🛠️ Setup Instructions

### 1. Backend Setup

#### Prerequisites
- Python 3.8+
- Azure OpenAI resource with GPT-4o deployment
- Supabase project with service role key

#### Install Dependencies
```bash
cd recruitment-dashboard/backend
pip install -r requirements.txt
```

#### Environment Configuration
```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your actual values:
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_API_KEY=your-api-key-here
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o
AZURE_OPENAI_API_VERSION=2024-02-01

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

API_HOST=0.0.0.0
API_PORT=8000
DEBUG=true
```

#### Start the Backend
```bash
python start.py
```

The backend will be available at `http://localhost:8000`

### 2. Frontend Configuration

#### Environment Variables
Add to your `.env.local` file:
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

#### Install Dependencies (if needed)
```bash
cd recruitment-dashboard
npm install
```

#### Start the Frontend
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

### 3. Database Migration

The database migration was already applied, which added these AI analysis columns to the `job_postings` table:
- `ai_key_skills` - Extracted skills
- `ai_experience_level` - Experience requirements
- `ai_job_level` - Job level classification
- `ai_difficulty_score` - Difficulty rating (1-10)
- `ai_confidence_score` - AI confidence (0.0-1.0)
- `ai_job_summary` - AI-generated summary
- And many more...

## 🎮 How It Works

### Job Creation Flow
1. User creates a job posting through the frontend form
2. Job is saved to Supabase database
3. Frontend automatically triggers AI analysis via backend API
4. Backend processes job description using Azure OpenAI GPT-4
5. AI extracts structured information (skills, requirements, difficulty, etc.)
6. Results are stored back in Supabase
7. Frontend displays AI insights in the job table

### AI Analysis Features
- **Smart Skill Extraction** - Identifies both technical and soft skills
- **Difficulty Assessment** - Rates job complexity (1-10 scale)
- **Job Level Classification** - Categorizes as entry/mid/senior/expert
- **Experience Analysis** - Determines required experience level
- **Remote Work Detection** - Identifies remote work opportunities
- **Salary Information** - Extracts salary ranges when mentioned
- **Responsibility Mapping** - Lists key job responsibilities
- **Education Requirements** - Identifies required qualifications

## 🔍 API Endpoints

### Backend Endpoints
- `GET /health` - Health check and service status
- `POST /analyze-job` - Trigger job analysis
- `GET /job/{job_id}/analysis` - Get analysis results
- `GET /docs` - Interactive API documentation (development only)

### Example API Usage
```javascript
// Analyze a job posting
const response = await fetch('http://localhost:8000/analyze-job', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    job_id: 'uuid',
    title: 'Senior Software Engineer',
    description: 'Job description here...',
    requirements: 'Requirements here...'
  })
})

const analysis = await response.json()
```

## 🎨 Frontend Features

### Enhanced Job Table
- **AI Analysis Column** - Shows analysis status and difficulty score
- **Rich Job Details** - Expanded dialog with AI insights
- **Smart Badges** - Visual indicators for analyzed vs pending jobs
- **Skill Visualization** - Both manual and AI-extracted skills displayed

### AI Insights Display
- Confidence score badges
- Difficulty ratings with star icons
- Job level indicators
- Remote work status
- Salary information (when available)
- Key responsibilities
- AI-extracted skills

## 🔧 Development

### Backend Development
```bash
cd backend
# Run in development mode with auto-reload
python start.py
```

### Frontend Development
```bash
# Standard Next.js development
npm run dev
```

### Logs and Monitoring
- Backend logs are stored in `backend/logs/`
- Health endpoint provides service connectivity status
- AI analysis errors are logged but don't break job creation

## 🚀 Production Deployment

### Backend
- Use a production ASGI server like Gunicorn with Uvicorn workers
- Set `DEBUG=false` in environment
- Use proper environment variable management
- Set up logging and monitoring

### Frontend
- Build and deploy as usual with Next.js
- Ensure `NEXT_PUBLIC_API_URL` points to your production backend

## 🎯 Key Benefits

1. **Automated Analysis** - No manual job parsing required
2. **Consistent Data** - Standardized job information extraction
3. **Better Matching** - Enhanced candidate-job matching capabilities
4. **Time Saving** - Instant analysis vs manual categorization
5. **Scalable** - Handles high volumes of job postings
6. **Intelligent** - Leverages GPT-4o's advanced understanding
7. **Non-Blocking** - Job creation doesn't wait for analysis

## 🔍 Troubleshooting

### Backend Issues
- Check Azure OpenAI credentials and quotas
- Verify Supabase connection and permissions
- Review logs in `backend/logs/`
- Test health endpoint for service status

### Frontend Issues
- Ensure backend is running on correct port
- Check browser console for API errors
- Verify environment variables are set
- Check network connectivity to backend

### AI Analysis Issues
lve - Verify GPT-4o deployment is available
- Check API quotas and rate limits
- Review prompt engineering in OpenAI service
- Monitor confidence scores for quality

## 📊 Monitoring

Use the health check endpoint to monitor:
- Azure OpenAI connectivity
- Supabase database connection
- Overall system health

Example health check response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00Z",
  "services": {
    "azure_openai": "connected",
    "supabase": "connected"
  }
}
```

Your AI-powered recruitment dashboard is now ready! 🎉
