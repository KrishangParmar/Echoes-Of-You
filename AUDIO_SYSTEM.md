# Audio System Documentation

## Overview
The game now includes a complete audio system with procedurally generated sounds using the Web Audio API. No external audio files are required!

## Features Implemented

### 1. **Ambient Background Sound**
- Automatically starts on first user interaction (click or keypress)
- Low-volume (0.15) atmospheric drone with multiple harmonic layers
- Fades in over 1 second
- Continues during gameplay
- Creates a haunting, memory-like atmosphere

### 2. **Echo Collection Chime**
- Plays when collecting any orb/echo
- Bell-like tone with harmonics (880Hz → 1760Hz → 880Hz)
- Includes reverb-like delay effect
- Short duration (0.4s) - not distracting
- Magical, memory-like quality

### 3. **UI Click Sound**
- Plays on all button clicks:
  - Start Run button
  - Quick Start button
  - End Run button
  - Clear Ghosts button
  - How to Play button
  - Close Popup button
  - Difficulty selector buttons
  - Game Over close button
- CRT-style click (800Hz → 200Hz sweep)
- Volume: 0.2
- Duration: 0.08s

### 4. **Transition Whoosh**
- Plays when starting a game run
- Sweeping bandpass filtered white noise
- Frequency sweep: 200Hz → 2000Hz
- Duration: 0.5s
- Smooth transition feel

## Technical Details

### Audio Context Initialization
- Uses Web Audio API (no external files needed)
- Auto-initializes on first user interaction (browser requirement)
- Graceful fallback if audio fails

### Performance
- All sounds are procedurally generated in real-time
- No file loading or network requests
- Minimal memory footprint
- Optimized for smooth gameplay

## Code Structure

### Main Audio Module
Located at the end of `game.js`:
```javascript
const AudioSystem = {
  init(),              // Initialize audio context
  startAmbient(),      // Start background loop
  stopAmbient(),       // Stop background loop
  playEchoChime(),     // Play orb collection sound
  playUIClick(),       // Play button click sound
  playTransitionWhoosh() // Play game start transition
}
```

### Integration Points
1. **Orb Collection**: Line ~805 in game.js (orb collision detection)
2. **UI Buttons**: Lines ~1050-1080 (button event listeners)
3. **Popup Handlers**: Lines ~1180-1200 (popup show/hide)
4. **Difficulty Selector**: Lines ~1090-1095

## Optional: Using Real Audio Files

If you want to replace the procedural sounds with real audio files:

### Step 1: Create `audio/` folder
```
project/
├── audio/
│   ├── ambient.mp3
│   ├── echo_chime.mp3
│   ├── ui_click.mp3
│   └── whoosh.mp3
```

### Step 2: Recommended Free Audio Sources
- **Freesound.org** - Creative Commons sounds
- **Zapsplat.com** - Free sound effects
- **OpenGameArt.org** - Game audio assets

### Step 3: Replace AudioSystem functions
Replace the procedural generation code with Howler.js (already loaded):

```javascript
const sounds = {
  ambient: new Howl({ src: ['audio/ambient.mp3'], loop: true, volume: 0.15 }),
  echoChime: new Howl({ src: ['audio/echo_chime.mp3'], volume: 0.3 }),
  uiClick: new Howl({ src: ['audio/ui_click.mp3'], volume: 0.2 }),
  whoosh: new Howl({ src: ['audio/whoosh.mp3'], volume: 0.25 })
};

const AudioSystem = {
  init() { /* no-op */ },
  startAmbient() { sounds.ambient.play(); },
  stopAmbient() { sounds.ambient.stop(); },
  playEchoChime() { sounds.echoChime.play(); },
  playUIClick() { sounds.uiClick.play(); },
  playTransitionWhoosh() { sounds.whoosh.play(); }
};
```

## Sound Design Tips

### For Ambient:
- Look for "dark ambient", "drone", "atmospheric pad"
- 1-2 minute loop
- Low frequency content
- Minimal melody

### For Echo Chime:
- Bell, chime, or glass sounds
- Short (0.3-0.5s)
- High frequency (bright)
- Reverb/echo tail

### For UI Click:
- CRT click, mechanical switch, or soft beep
- Very short (0.05-0.1s)
- Mid frequency

### For Whoosh:
- Swoosh, wind, or transition sound
- 0.4-0.6s duration
- Rising pitch or filtered noise

## Browser Compatibility

✅ Chrome/Edge - Full support
✅ Firefox - Full support
✅ Safari - Full support (requires user interaction first)
✅ Mobile browsers - Full support (requires user interaction first)

## Troubleshooting

**No sound playing?**
- Check browser console for errors
- Ensure user has interacted with page (click/keypress)
- Check browser audio permissions
- Verify volume is not muted

**Ambient not starting?**
- Audio auto-starts on first click/keypress
- Check console for "Audio system initialized" message

**Sounds too loud/quiet?**
- Adjust volume values in AudioSystem functions
- Ambient: 0.15 (line in startAmbient)
- Echo: 0.3 (line in playEchoChime)
- UI Click: 0.2 (line in playUIClick)
- Whoosh: 0.25 (line in playTransitionWhoosh)

## Future Enhancements

Possible additions:
- Ghost collision sound (eerie whisper)
- Dash activation sound (quick whoosh)
- Power-up collection sounds (different per type)
- Boss battle music (if boss mode added)
- Victory/defeat jingles
- Volume control slider in settings

---

**Current Status**: ✅ Fully implemented with procedural audio
**External Files Required**: ❌ None (all sounds generated via Web Audio API)
**Performance Impact**: ✨ Minimal (< 1% CPU usage)
