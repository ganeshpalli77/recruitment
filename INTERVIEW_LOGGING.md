# Interview Logging & Transcript Capture

This document explains how to capture and use interview transcripts during AI-powered voice interviews.

## 🎯 Overview

The interview system automatically logs all conversation between the AI interviewer and the candidate in the browser console. This includes:

- **Real-time message logging** as the conversation happens
- **Complete transcript export** when the interview ends
- **JSON format** ready for database storage

---

## 📋 Console Logs You'll See

### **1. Connection Status**
```
🟢 INTERVIEW CONNECTED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 Interview Details:
   Candidate: John Doe
   Position: Senior Developer
   Duration: 30 minutes
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### **2. Real-time Messages**
Each message appears as it happens:

```
💬 NEW MESSAGE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 Role: 🤖 AI INTERVIEWER
📝 Message: Tell me about your experience with React.
⏰ Timestamp: 10:30:45 AM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 AI QUESTION: Tell me about your experience with React.
```

```
💬 NEW MESSAGE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 Role: 👤 CANDIDATE
📝 Message: I've been working with React for 5 years...
⏰ Timestamp: 10:31:02 AM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ CANDIDATE RESPONSE: I've been working with React for 5 years...
```

### **3. Complete Transcript (When Interview Ends)**

When you click "End Interview", you'll see:

```
═══════════════════════════════════════════════════════
📊 COMPLETE INTERVIEW TRANSCRIPT
═══════════════════════════════════════════════════════
Candidate: John Doe
Position: Senior Developer
Total Messages: 24
═══════════════════════════════════════════════════════

[1] 🤖 AI INTERVIEWER - 10:30:12 AM
───────────────────────────────────────────────────────
Welcome to the interview, John! Thank you for...
───────────────────────────────────────────────────────

[2] 👤 CANDIDATE - 10:30:25 AM
───────────────────────────────────────────────────────
Thank you for having me...
───────────────────────────────────────────────────────

...

═══════════════════════════════════════════════════════
END OF TRANSCRIPT
═══════════════════════════════════════════════════════
```

### **4. JSON Export (For Database Storage)**

After the transcript, you'll also get a JSON version:

```javascript
📋 TRANSCRIPT AS JSON (for database storage):
{
  "candidate": "John Doe",
  "position": "Senior Developer",
  "duration": 30,
  "transcript": [
    {
      "role": "ai",
      "message": "Welcome to the interview...",
      "timestamp": "10:30:12 AM"
    },
    {
      "role": "user",
      "message": "Thank you for having me...",
      "timestamp": "10:30:25 AM"
    }
    // ... more messages
  ],
  "interviewDate": "2025-01-25T05:00:00.000Z"
}
```

---

## 🔧 Manual Console Commands

### **Get Current Transcript Anytime**

While the interview is running, you can check the current transcript:

```javascript
// In browser console, type:
getInterviewTranscript()
```

This will show all messages captured so far without ending the interview.

**Example output:**
```
📋 CURRENT INTERVIEW TRANSCRIPT
═══════════════════════════════════════════════════════
Messages so far: 8
═══════════════════════════════════════════════════════

1. [10:30:12 AM] 🤖 AI: Welcome to the interview...
2. [10:30:25 AM] 👤 CANDIDATE: Thank you...
3. [10:30:40 AM] 🤖 AI: Tell me about your experience...
4. [10:31:02 AM] 👤 CANDIDATE: I've been working...
...
```

---

## 💾 Saving Transcripts

### **Method 1: Copy from Console**

1. When interview ends, the full transcript appears
2. Right-click on the JSON output in console
3. Select "Copy object" or "Store as global variable"
4. Save to file or send to your backend

### **Method 2: Store in Database (Future Enhancement)**

The JSON format is ready for database storage:

```typescript
// Future implementation - save to Supabase
await supabase
  .from('interview_transcripts')
  .insert({
    candidate_id: candidateId,
    job_posting_id: jobId,
    transcript: transcriptData,
    interview_date: new Date().toISOString()
  })
```

---

## 🎯 Use Cases

### **For Recruiters:**
- **Review candidate responses** after the interview
- **Compare multiple candidates** for the same position
- **Identify strong/weak answers** to specific questions

### **For Analysis:**
- **Train AI models** on successful interview patterns
- **Improve question quality** based on response patterns
- **Analyze interview duration** and conversation flow

### **For Compliance:**
- **Record keeping** for hiring decisions
- **Audit trail** of interview questions asked
- **Fair hiring** documentation

---

## 📊 Transcript Data Structure

Each transcript entry contains:

| Field | Type | Description |
|-------|------|-------------|
| `role` | `'ai' \| 'user'` | Who sent the message |
| `message` | `string` | The actual message text |
| `timestamp` | `string` | Time the message was sent |

Complete transcript object:

```typescript
interface InterviewTranscript {
  candidate: string        // Candidate name
  position: string         // Job position
  duration: number         // Interview duration in minutes
  transcript: Array<{
    role: 'ai' | 'user'
    message: string
    timestamp: string
  }>
  interviewDate: string    // ISO format date
}
```

---

## 🔍 Debugging Tips

### **If logs aren't appearing:**

1. **Check console is open**: Press F12 or Cmd+Option+I
2. **Check console filter**: Ensure no filters are active
3. **Check log level**: Set to "All" or "Verbose"

### **If transcript is empty:**

- Ensure interview was started successfully
- Check microphone permissions were granted
- Verify Eleven Labs connection established

### **To preserve logs:**

- Right-click in console → "Save as..."
- Or enable "Preserve log" in console settings

---

## 🚀 Future Enhancements

Planned features for transcript management:

- [ ] **Auto-save to database** on interview completion
- [ ] **Download as PDF** button in UI
- [ ] **Real-time transcript display** in interview screen
- [ ] **AI analysis** of responses with scoring
- [ ] **Sentiment analysis** of candidate tone
- [ ] **Keyword extraction** from responses
- [ ] **Export to multiple formats** (CSV, JSON, PDF)

---

## 💡 Pro Tips

1. **Always keep console open** during interviews to monitor in real-time
2. **Copy transcript immediately** after interview ends
3. **Use `getInterviewTranscript()`** to check progress mid-interview
4. **Save the JSON format** for easy database integration later
5. **Compare transcripts** across multiple candidates for better insights

---

## 🆘 Support

If you need help with transcript capture:

1. Check this documentation
2. Verify console is working (test with `console.log('test')`)
3. Review the `interview-screen.tsx` component
4. Check browser compatibility (Chrome/Edge recommended)
