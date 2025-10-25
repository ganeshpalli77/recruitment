# Eleven Labs Voice Agent Setup

This guide explains how to set up Eleven Labs Conversational AI for the interview feature.

## Prerequisites

1. **Eleven Labs Account**
   - Sign up at https://elevenlabs.io
   - Navigate to the Conversational AI section

## Step 1: Create an AI Agent

1. Go to https://elevenlabs.io/app/conversational-ai
2. Click **"Create New Agent"**
3. Configure your agent:
   - **Name**: Interview Agent
   - **Voice**: Choose a professional voice (e.g., Rachel, Adam)
   - **Language**: English
   - **Instructions**: The system will override this with interview-specific instructions
4. Click **"Create Agent"**
5. **Copy the Agent ID** from the agent settings

## Step 2: Get Your API Key (Recommended for Production)

1. In Eleven Labs dashboard, go to **Profile Settings**
2. Navigate to **API Keys** section
3. Click **"Create New API Key"** or copy existing key
4. **Keep this key secure** - Never commit to git

## Step 3: Configure Environment Variables

### Option A: Secure Mode (Recommended for Production)

Add both Agent ID and API Key to `.env.local`:

```env
NEXT_PUBLIC_ELEVENLABS_AGENT_ID=your-agent-id-here
ELEVENLABS_API_KEY=your-api-key-here
```

This enables **signed conversations** with better security and usage tracking.

### Option B: Public Agent Mode (For Testing)

Add only Agent ID to `.env.local`:

```env
NEXT_PUBLIC_ELEVENLABS_AGENT_ID=your-agent-id-here
```

This works for testing but is **not recommended for production**.

## Step 4: Test the Integration

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Generate interview questions for a candidate
3. Copy the interview link and open it
4. Click **"Start AI Interview"**
5. Allow microphone permissions
6. The AI agent will greet the candidate and begin asking questions

## How It Works

### Question Flow

1. **Greeting**: AI starts with the personalized greeting message
2. **Screening Questions**: Asks all screening questions
3. **Technical Questions**: Asks all technical questions  
4. **HR Questions**: Asks all HR/behavioral questions
5. **Conclusion**: Thanks the candidate

### Features

- **Voice-based interviews**: AI asks questions using natural voice
- **Real-time conversation**: WebRTC for low-latency audio
- **Automatic question flow**: AI follows the generated interview questions
- **Professional interaction**: Natural, conversational interviewing style
- **Synchronized AI video**: Avatar video plays when AI speaks, pauses when listening to candidate
- **Realistic experience**: Life-like interview interaction with visual feedback

### Visual Indicators

- **Speaking Indicator**: Animated bars when AI is speaking
- **Connection Status**: Green badge when connected
- **Microphone Status**: Shows if candidate's mic is active

## Troubleshooting

### "Eleven Labs Agent ID not configured"
- Make sure you've added `NEXT_PUBLIC_ELEVENLABS_AGENT_ID` to `.env.local`
- Restart your dev server after adding environment variables

### "Failed to start interview"
- Check microphone permissions in browser
- Ensure your Eleven Labs agent is active
- Verify your Eleven Labs account has sufficient credits

### No audio from AI
- Check browser audio settings
- Ensure your Eleven Labs agent has a voice selected
- Try refreshing the page

## Agent Configuration

The system automatically configures the agent with:

```javascript
{
  prompt: "You are an AI interviewer conducting a [duration]-minute interview...",
  firstMessage: "[Personalized greeting from database]",
  language: "en",
  questions: [
    // All screening, technical, and HR questions from database
  ]
}
```

## Best Practices

1. **Choose Clear Voices**: Select voices that are easy to understand
2. **Test Before Live Use**: Test the interview flow with sample candidates
3. **Monitor Credits**: Keep track of your Eleven Labs usage
4. **Provide Instructions**: Tell candidates to speak clearly
5. **Quiet Environment**: Recommend candidates use a quiet space

## Pricing

- Eleven Labs charges per character of audio generated
- Check current pricing at: https://elevenlabs.io/pricing
- Typical 30-minute interview uses approximately 5,000-10,000 characters

## Security Modes Explained

### Signed Conversations (Secure Mode)
**When**: `ELEVENLABS_API_KEY` is configured

**How it works:**
1. Frontend requests a signed conversation token from your backend API
2. Backend calls Eleven Labs API with your API key
3. Eleven Labs returns a secure, time-limited conversation token
4. Frontend uses this token to start the conversation

**Benefits:**
- ✅ API key never exposed to browser
- ✅ Better usage tracking and analytics
- ✅ More control over who can use your agent
- ✅ Recommended for production

### Public Agent Mode
**When**: Only `NEXT_PUBLIC_ELEVENLABS_AGENT_ID` is configured

**How it works:**
1. Frontend directly connects to the public agent using Agent ID
2. No backend authentication required

**Limitations:**
- ⚠️ Less secure for production use
- ⚠️ Anyone with the Agent ID can use your agent
- ⚠️ Limited usage tracking
- ✅ Good for testing and development

**The system automatically uses Secure Mode when available and falls back to Public Mode if API key is not configured.**

## Support

For issues with:
- **Eleven Labs**: https://elevenlabs.io/docs
- **Voice Agent**: This application's GitHub issues
- **Audio Quality**: Check Eleven Labs voice settings
