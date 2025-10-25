# Environment Variables Configuration

This file lists all required environment variables for the recruitment dashboard application.

## Frontend Environment Variables

Add these to `.env.local` in the root directory:

```env
# Supabase Configuration (Already configured)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Eleven Labs Voice Agent (NEW - REQUIRED for AI Interview)
NEXT_PUBLIC_ELEVENLABS_AGENT_ID=your-elevenlabs-agent-id-here

# Eleven Labs API Key (for secure/signed conversations - RECOMMENDED for production)
ELEVENLABS_API_KEY=your-elevenlabs-api-key-here
```

## Backend Environment Variables

Add these to `backend/.env`:

```env
# Azure OpenAI Configuration (Already configured)
AZURE_OPENAI_ENDPOINT=your-azure-openai-endpoint
AZURE_OPENAI_API_KEY=your-azure-openai-api-key
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o
AZURE_OPENAI_API_VERSION=2024-02-01

# Supabase Configuration (Already configured)
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# FastAPI Configuration (Already configured)
API_HOST=0.0.0.0
API_PORT=8000
DEBUG=true
```

## Getting Your Eleven Labs Agent ID

1. **Sign up for Eleven Labs**: https://elevenlabs.io
2. **Navigate to Conversational AI**: https://elevenlabs.io/app/conversational-ai
3. **Create a new agent**:
   - Click "Create New Agent"
   - Choose a professional voice
   - Set language to English
   - Save the agent
4. **Copy the Agent ID**: Find it in the agent settings
5. **Add to `.env.local`**: 
   ```env
   NEXT_PUBLIC_ELEVENLABS_AGENT_ID=your-copied-agent-id
   ```

## Restart Required

After adding or modifying environment variables:

1. **Stop the development server** (Ctrl+C)
2. **Restart it**:
   ```bash
   npm run dev
   ```

## Verification

To verify environment variables are loaded:

```javascript
// In browser console (for frontend vars):
console.log(process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID)
```

## Security Notes

- ✅ `NEXT_PUBLIC_*` variables are exposed to the browser
- ❌ Never commit `.env.local` or `.env` files to git
- ✅ Backend API keys should never have `NEXT_PUBLIC_` prefix
- ✅ Use Supabase RLS policies to secure database access
