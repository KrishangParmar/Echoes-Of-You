# Audio Engine Design

## Architecture

### Core Components
1. **AudioEngine**: Main controller for all audio
2. **AudioLoader**: Handles asset loading and caching
3. **VolumeController**: Manages volume levels
4. **SoundEffectPlayer**: Plays one-shot effects

### Data Structures
```javascript
AudioEngine {
  context: AudioContext
  backgroundMusic: HTMLAudioElement
  soundEffects: Map<string, HTMLAudioElement>
  volumes: {
    master: number,
    music: number,
    effects: number
  }
  initialized: boolean
}
```

## Correctness Properties

### PROP-1: Single Initialization (AC-1)
**Property**: AudioEngine initializes exactly once per session
**Verification**: init() returns early if already initialized

### PROP-2: Continuous Background Music (AC-2)
**Property**: Background music loops without gaps
**Verification**: Audio element has loop=true, plays continuously

### PROP-3: Volume Consistency (AC-4)
**Property**: Volume changes apply immediately to all active audio
**Verification**: setVolume() updates all audio element volumes

### PROP-4: Effect Independence (AC-3)
**Property**: Sound effects play without interrupting background music
**Verification**: Multiple Audio objects can play simultaneously

### PROP-5: Resource Cleanup (AC-5)
**Property**: Audio resources released when no longer needed
**Verification**: pause() and cleanup() methods properly dispose audio

## Audio Context Unlock Strategy
```javascript
// Handle browser autoplay restrictions
document.addEventListener('click', unlockAudioContext, { once: true });
```

## Implementation Notes
- Use HTMLAudioElement for simplicity (not Web Audio API nodes)
- Preload audio with <audio> tags in HTML
- Implement exponential volume curves for natural feel
- Add error handling for failed audio loads
