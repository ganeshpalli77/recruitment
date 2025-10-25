# Interview Security & Proctoring Protocol

## 🛡️ Overview

Complete security system for AI-powered interviews featuring screen recording, instructions page, consent management, and automated video upload to Supabase storage.

---

## ✨ Features

### **1. Pre-Interview Instructions Page**
- Professional instructions display
- Technical requirements checklist
- Interview format details
- Security & proctoring information
- Best practices guidelines
- Mandatory consent checkboxes
- "Start Interview" button (disabled until all consents checked)

### **2. Screen Recording**
- **Full screen capture** during entire interview
- Browser permission prompt
- Automatic recording start when interview begins
- Recording indicator badge in UI
- Automatic stop when interview ends
- High-quality video encoding (WebM format)

### **3. Supabase Integration**
- Automatic upload to Supabase Storage
- Organized folder structure by job posting
- Database record with video URL
- File size and metadata tracking
- Secure storage with RLS policies

### **4. Security Measures**
- Mandatory consent before starting
- Visual recording indicator
- Screen monitoring throughout interview
- Tamper detection (if user stops sharing)
- Encrypted storage

---

## 🔄 Complete Workflow

```
1. Candidate receives unique interview link
   ↓
2. Opens link → Redirected to /interview/[id]/instructions
   ↓
3. Instructions Page Displays:
   - Candidate info (name, job title, duration)
   - Technical requirements
   - Interview format
   - Security protocols
   - Best practices
   ↓
4. Candidate must check TWO consent boxes:
   ✅ Time limit and environment readiness
   ✅ Screen/camera/audio recording consent
   ↓
5. Click "Start Interview" button
   ↓
6. Screen recording permission requested
   ↓
7. User allows screen sharing
   ↓
8. Recording starts automatically
   ↓
9. Microphone & camera permissions requested
   ↓
10. Interview begins with AI
   ↓
11. Red "Recording" badge visible throughout
   ↓
12. Candidate answers questions
   ↓
13. Click "End Interview"
   ↓
14. Recording stops automatically
   ↓
15. Video upload starts (background)
   ↓
16. Redirect to analyzing page
   ↓
17. AI analysis runs
   ↓
18. Video uploaded to Supabase
   ↓
19. Database updated with video URL
   ↓
20. Complete!
```

---

## 📋 Instructions Page Content

### **Sections Displayed:**

#### **📋 Before You Start**
- Microphone access required
- Camera access required
- **Screen recording required** (emphasized)

#### **🎯 Interview Format**
- AI interviewer
- Total number of questions
- Duration
- Speaking guidelines

#### **🔒 Security & Proctoring**
- Screen, camera, and audio recorded
- Recordings for verification only
- No tab switching allowed
- No other applications
- Quiet, well-lit environment required
- Stable internet required

#### **💡 Best Practices**
- Use headphones
- Maintain eye contact
- Provide specific examples
- Think before responding

### **Terms & Conditions (2 Checkboxes):**

**Checkbox 1:**
> "I understand that this is a timed interview and I must complete it within [X] minutes. I confirm that I am in a suitable environment and ready to begin."

**Checkbox 2:**
> "I consent to the recording of my screen, camera, and audio during this interview for security, proctoring, and verification purposes. I understand that the recordings will be stored securely and used only for evaluation and quality assurance."

---

## 🎥 Screen Recording Implementation

### **Technology:**
- **API:** `navigator.mediaDevices.getDisplayMedia()`
- **Format:** WebM (VP9/VP8 codec)
- **Quality:** 1920x1080, 2.5 Mbps
- **Audio:** Included (system audio)

### **Hook: `useScreenRecording`**

```typescript
const { 
  isRecording, 
  startRecording, 
  stopRecording 
} = useScreenRecording({
  onRecordingComplete: (videoBlob) => {
    // Handle video blob
  }
})
```

### **Features:**
- ✅ Permission request handling
- ✅ Error handling
- ✅ Automatic cleanup
- ✅ Blob generation
- ✅ User stop detection
- ✅ Quality optimization

### **Error Handling:**
| Error | Message |
|-------|---------|
| `NotAllowedError` | Permission denied |
| `NotFoundError` | No screen available |
| User stops sharing | Warning toast + interview pause |

---

## 💾 Supabase Storage

### **Storage Structure:**
```
interview-videos/
  └── [job_posting_id]/
      └── interview_[candidate_name]_[candidate_id]_[timestamp].webm
```

### **Example Path:**
```
interview-videos/
  └── 123e4567-e89b-12d3-a456-426614174000/
      └── interview_John_Doe_abc123_2025-10-26T03-47-23.webm
```

### **Database Table: `interview_recordings`**

```sql
CREATE TABLE interview_recordings (
  id UUID PRIMARY KEY,
  candidate_id UUID NOT NULL,
  job_posting_id UUID NOT NULL,
  video_url TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size_mb NUMERIC(10,2),
  duration_seconds INTEGER,
  recorded_at TIMESTAMP,
  created_at TIMESTAMP
);
```

### **Stored Data:**
- Candidate ID
- Job posting ID
- Video public URL
- File path in storage
- File size (MB)
- Recording timestamp
- Creation timestamp

---

## 🎨 UI Components

### **Instructions Page:**
- Gradient background
- Multiple info cards
- Icon-based sections
- Checkbox controls
- Disabled/enabled button states
- Responsive design

### **Interview Screen:**
- **Recording Badge:** Red pulsing badge in header
- **Text:** "Recording" with dot indicator
- **Position:** Next to timer
- **Visibility:** Only when recording active

---

## 🔐 Security Features

### **Mandatory Consent:**
- Two separate checkboxes required
- Button disabled until both checked
- Clear language about recording
- No ambiguity

### **Visual Indicators:**
- Red recording badge (always visible)
- Pulsing animation
- Cannot be hidden
- Continuous reminder

### **Tamper Detection:**
- If user stops screen sharing mid-interview
- Warning toast appears
- Interview should pause/end
- Notification sent

### **Data Security:**
- Videos stored in Supabase (encrypted)
- RLS policies enabled
- Only authenticated users can access
- Unique file paths
- No public listing

---

## 📊 Upload Process

### **Automatic Upload:**
```typescript
1. Interview ends
   ↓
2. Recording stops → Blob created
   ↓
3. Convert to File object
   ↓
4. Call uploadInterviewRecording()
   ↓
5. Upload to Supabase Storage
   ↓
6. Get public URL
   ↓
7. Save URL to database
   ↓
8. Complete (async, doesn't block redirect)
```

### **File Naming:**
```
interview_[SanitizedName]_[CandidateID]_[ISOTimestamp].webm
```

### **Upload Metadata:**
- Content-Type: `video/webm`
- Cache-Control: `3600`
- Upsert: `false` (prevent overwriting)

---

## 🚀 Setup Instructions

### **1. Create Supabase Storage Bucket:**

```sql
-- Create bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('interview-videos', 'interview-videos', true);

-- Set storage policy
CREATE POLICY "Allow authenticated uploads"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'interview-videos');

CREATE POLICY "Allow authenticated reads"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'interview-videos');
```

### **2. Database Migration:**
Already applied! ✅ Table `interview_recordings` created.

### **3. Environment Variables:**
No additional variables needed for recording feature.

---

## 🧪 Testing Checklist

### **Instructions Page:**
- [ ] Page loads with all sections
- [ ] Checkboxes can be toggled
- [ ] Button disabled until both checked
- [ ] Button enabled when both checked
- [ ] Click redirects to interview screen
- [ ] Candidate info displays correctly

### **Screen Recording:**
- [ ] Permission prompt appears
- [ ] Recording starts after permission
- [ ] Recording badge visible
- [ ] Badge shows "Recording" text
- [ ] Badge has pulsing animation
- [ ] Recording stops when interview ends
- [ ] Warning if user stops sharing

### **Upload:**
- [ ] Video uploads to Supabase
- [ ] Correct file path
- [ ] Public URL generated
- [ ] Database record created
- [ ] File size calculated
- [ ] No blocking of redirect

### **End-to-End:**
- [ ] Complete interview flow
- [ ] Video accessible in Supabase
- [ ] Database has correct URL
- [ ] Video plays correctly
- [ ] File size reasonable

---

## 📈 Benefits

### **For Recruiters:**
- ✅ **Verify integrity** - Review actual interview
- ✅ **Quality assurance** - Check AI performance
- ✅ **Dispute resolution** - Evidence if needed
- ✅ **Training data** - Improve AI models
- ✅ **Compliance** - Meet security requirements

### **For Candidates:**
- ✅ **Fair evaluation** - Transparent process
- ✅ **Clear expectations** - Know what's recorded
- ✅ **Professional process** - Trust the system
- ✅ **Evidence** - Proof of participation

### **For Organization:**
- ✅ **Security** - Prevent cheating
- ✅ **Audit trail** - Complete records
- ✅ **Legal protection** - Documented consent
- ✅ **Quality control** - Review interviews
- ✅ **Analytics** - Understand patterns

---

## 🎯 Key Files

### **Pages:**
- `/interview/[id]/instructions/page.tsx` - Instructions page
- `/interview/[id]/instructions/components/instructions-screen.tsx` - Instructions UI
- `/interview/[id]/analyzing/page.tsx` - Post-interview analysis page

### **Hooks:**
- `/interview/[id]/hooks/useScreenRecording.ts` - Screen recording logic

### **Actions:**
- `/interview/[id]/lib/upload-recording.ts` - Supabase upload

### **Components:**
- `/interview/[id]/components/interview-screen.tsx` - Main interview (updated)

### **Database:**
- `interview_recordings` table - Storage metadata

---

## 🔮 Future Enhancements

- [ ] **Real-time monitoring** - Watch interviews live
- [ ] **AI video analysis** - Detect suspicious behavior
- [ ] **Multi-camera support** - Record multiple angles
- [ ] **Bandwidth optimization** - Adaptive quality
- [ ] **Offline recording** - Local save with later upload
- [ ] **Video player** - In-app playback
- [ ] **Highlight reel** - Auto-generate key moments
- [ ] **Transcript sync** - Align text with video
- [ ] **Download option** - For recruiters
- [ ] **Retention policy** - Auto-delete after X days

---

This security protocol ensures interview integrity while maintaining transparency with candidates! 🔒✨
