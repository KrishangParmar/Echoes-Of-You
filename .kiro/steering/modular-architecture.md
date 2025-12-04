---
inclusion: always
---

# Modular Architecture Guidelines for "Echoes of You"

## Core Principles

### Separation of Concerns
Each system should handle one primary responsibility:
- **AudioEngine**: All audio playback and control
- **GameState**: Game data and progression tracking
- **UIController**: DOM manipulation and rendering
- **EndingSystem**: Score calculation and ending logic

### Encapsulation
Keep internal state private, expose only necessary methods:

```javascript
const AudioEngine = {
  // Private state (convention)
  _initialized: false,
  _audioContext: null,
  
  // Public interface
  init() { },
  play(soundName) { },
  stop() { }
};
```

### Loose Coupling
Systems should interact through well-defined interfaces:
- Avoid direct access to another module's internal state
- Use function calls to communicate between modules
- Pass data as parameters rather than sharing global state

## Module Communication Patterns

### Event-Driven Updates
```javascript
// Good: Explicit function calls
function handleChoice(choiceValue) {
  GameState.recordChoice(choiceValue);
  AudioEngine.playSound('choice-made');
  updateUI();
}

// Avoid: Tight coupling
function handleChoice(choiceValue) {
  GameState.choices.push(choiceValue); // Direct state manipulation
}
```

### Dependency Injection
Pass dependencies explicitly when needed:
```javascript
function showEnding(score, audioEngine) {
  const ending = calculateEnding(score);
  audioEngine.playSound(ending.audioTrack);
}
```

## Testing & Maintainability

### Pure Functions
Prefer functions without side effects for easier testing:
```javascript
// Pure function - easy to test
function calculateScore(choices) {
  return choices.reduce((sum, choice) => sum + choice.value, 0);
}

// Impure - harder to test
function calculateScore() {
  return GameState.choices.reduce((sum, c) => sum + c.value, 0);
}
```

### Single Responsibility
Each function should do one thing well:
- `displayQuestion()` - renders question to DOM
- `handleChoice()` - processes player selection
- `advanceGame()` - moves to next question

## Refactoring Guidelines

When code becomes complex:
1. Extract repeated logic into utility functions
2. Group related functions into objects/modules
3. Separate data transformation from UI updates
4. Move configuration to constants at top of file
