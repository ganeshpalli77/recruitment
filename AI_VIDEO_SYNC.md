# AI Video Synchronization Feature

## 🎬 Overview

The AI avatar video on the interview screen is now **synchronized with the AI's speaking state**, creating a realistic, life-like interview experience.

---

## ✨ How It Works

### **When AI is Speaking (Asking Questions)**
- ▶️ **Video plays**
- 🎯 Avatar appears to be actively speaking
- 📊 Speaking indicator (animated bars) shows over video
- 🎤 AI voice is being transmitted

### **When AI is Listening (Candidate Responding)**
- ⏸️ **Video pauses**
- 👂 Avatar appears to be listening attentively
- 🤐 Visual feedback that it's candidate's turn to speak
- 📝 AI is processing the candidate's response

---

## 🎯 Benefits

### **For Candidates:**
1. **Clear visual feedback** - Know when to speak and when to listen
2. **Natural conversation flow** - Feels like talking to a real person
3. **Reduced anxiety** - Visual cues help understand interview state
4. **Professional experience** - Modern, polished interview interface

### **For Recruiters:**
1. **Better candidate experience** - More engaging interview process
2. **Professional brand image** - Modern, tech-forward presentation
3. **Natural interaction** - Candidates respond better to visual cues
4. **Realistic simulation** - Closer to in-person interview experience

---

## 🔧 Technical Implementation

### **Component: `interview-screen.tsx`**

```typescript
// Sync AI video with speaking state
useEffect(() => {
  const video = aiVideoRef.current
  if (!video) return

  if (isSpeaking) {
    // AI is asking a question - play the video
    video.play().catch(error => {
      console.log('Video play failed:', error)
    })
    console.log('🎬 AI video playing - AI is speaking')
  } else {
    // AI is listening to response - pause the video
    video.pause()
    console.log('⏸️ AI video paused - AI is listening')
  }
}, [isSpeaking])
```

### **Key Elements:**

1. **`aiVideoRef`** - Reference to the AI avatar video element
2. **`isSpeaking`** - State from Eleven Labs `useConversation` hook
3. **`useEffect`** - Watches speaking state and controls video playback
4. **Error handling** - Gracefully handles video play failures

---

## 🎥 Video Requirements

### **Recommended Video Specs:**
- **Format**: MP4 (H.264)
- **Loop**: Yes (seamless loop for continuous appearance)
- **Muted**: Yes (AI voice comes from Eleven Labs, not video)
- **Quality**: 720p or 1080p
- **Content**: Professional presenter/avatar in neutral pose

### **Video Behavior:**
```html
<video
  ref={aiVideoRef}
  loop          <!-- Seamless looping -->
  muted         <!-- No audio from video -->
  playsInline   <!-- Mobile compatibility -->
>
  <source src="/intervie01 (1).mp4" type="video/mp4" />
</video>
```

---

## 🔍 Console Logging

The feature includes console logs for debugging:

```
🎬 AI video playing - AI is speaking
⏸️ AI video paused - AI is listening
🎬 AI video playing - AI is speaking
⏸️ AI video paused - AI is listening
```

This helps developers monitor the sync behavior in real-time.

---

## 🎨 Visual States

### **State 1: Idle (Before Interview Starts)**
```
Video: Paused on first frame
Button: "Start AI Interview" visible
Status: No animation
```

### **State 2: AI Speaking**
```
Video: Playing (looping)
Animation: Animated speaking indicator bars
Status: "Connected" badge visible
Audio: AI voice active
```

### **State 3: AI Listening**
```
Video: Paused
Animation: No speaking indicator
Status: "Connected" badge visible
Audio: Candidate speaking
```

### **State 4: Interview Ended**
```
Video: Paused
Button: Interview ended message
Status: Disconnected
```

---

## 💡 User Experience Flow

```
1. Candidate opens interview link
   ↓
2. AI video shows first frame (paused)
   ↓
3. Candidate clicks "Start AI Interview"
   ↓
4. Video starts playing
   ↓
5. AI speaks greeting: "Welcome..." (video plays)
   ↓
6. AI waits for response (video pauses)
   ↓
7. Candidate responds (video remains paused)
   ↓
8. AI asks next question (video plays)
   ↓
9. Cycle continues through all questions
   ↓
10. Interview ends (video pauses)
```

---

## 🚀 Future Enhancements

### **Potential Improvements:**

1. **Lip Sync** (Advanced)
   - Use AI to sync avatar lips with speech
   - Requires specialized video generation

2. **Multiple Avatar Options**
   - Let recruiters choose different AI avatars
   - Professional, casual, industry-specific options

3. **Emotion Detection**
   - Subtle facial expressions based on conversation
   - Positive feedback for good answers

4. **Custom Branding**
   - Company logo on avatar background
   - Branded interview environment

5. **Avatar Gestures**
   - Hand movements during speaking
   - Natural body language simulation

---

## 🎯 Best Practices

### **For Video Selection:**
1. ✅ Use professional, neutral presenter
2. ✅ Ensure seamless loop points
3. ✅ Good lighting and quality
4. ✅ Neutral background
5. ❌ Avoid distracting movements
6. ❌ No text or branding in video (use overlay instead)

### **For Interview Experience:**
1. ✅ Test the video sync before candidate interviews
2. ✅ Ensure smooth video playback on target devices
3. ✅ Monitor console logs during testing
4. ✅ Verify speaking indicator appears correctly
5. ✅ Test on mobile devices as well

---

## 🐛 Troubleshooting

### **Video doesn't play:**
- Check browser autoplay policies
- Ensure video file is accessible
- Verify video format is supported
- Check console for errors

### **Sync is delayed:**
- Check network latency
- Verify `isSpeaking` state updates
- Test on different browsers
- Monitor console logs

### **Video stutters:**
- Reduce video file size
- Use lower resolution
- Check browser performance
- Test on different devices

---

## 📊 Performance Considerations

- **Video file size**: Keep under 10MB for fast loading
- **Memory usage**: Video element is efficiently managed
- **CPU usage**: Minimal impact due to hardware acceleration
- **Mobile**: Works on iOS and Android with `playsInline`

---

## ✅ Testing Checklist

- [ ] Video loads correctly
- [ ] Video plays when AI speaks
- [ ] Video pauses when AI listens
- [ ] Speaking indicator appears correctly
- [ ] No console errors
- [ ] Works on Chrome
- [ ] Works on Safari
- [ ] Works on mobile devices
- [ ] Seamless loop behavior
- [ ] Smooth start/stop transitions

---

This feature significantly enhances the interview experience by providing clear visual feedback and creating a more natural, engaging interaction between the AI interviewer and the candidate! 🎉
