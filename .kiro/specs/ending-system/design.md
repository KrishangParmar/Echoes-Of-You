# Ending System Design

## Architecture

### Components
1. **EndingCalculator**: Determines which ending to show
2. **EndingRenderer**: Displays ending content
3. **EndingTracker**: Records endings achieved
4. **ReplayController**: Handles game reset

### Data Structures
```javascript
Ending {
  id: string
  title: string
  description: string
  minScore: number
  maxScore: number
  imageUrl: string
  audioTrack: string
}

EndingState {
  currentEnding: Ending
  achievedEndings: Set<string>
  finalScore: number
  choiceHistory: Array<number>
}
```

## Correctness Properties

### PROP-1: Deterministic Ending Selection (AC-1)
**Property**: Same score always produces same ending
**Verification**: getEnding(score) is pure function with consistent output

### PROP-2: Complete Score Coverage (AC-1, AC-3)
**Property**: Every possible score maps to exactly one ending
**Verification**: Score ranges [min, max] cover all integers without gaps/overlaps

### PROP-3: Ending Display (AC-2)
**Property**: Ending screen shows all required elements
**Verification**: Title, description, score, and replay button all rendered

### PROP-4: Clean Reset (AC-4)
**Property**: Replay resets game to initial state
**Verification**: After reset, currentQuestionIndex=0, choices=[], score=0

### PROP-5: Achievement Persistence (AC-5)
**Property**: Achieved endings persist across sessions
**Verification**: localStorage contains achieved ending IDs, restored on load

## Score Thresholds
```javascript
ENDINGS = {
  DARK: { minScore: 0, maxScore: 3 },
  NEUTRAL: { minScore: 4, maxScore: 6 },
  LIGHT: { minScore: 7, maxScore: 10 }
}
```

## Implementation Notes
- Use CSS classes for ending-specific theming
- Implement fade transitions between game and ending
- Consider adding ending-specific sound effects
- Store ending data in structured format for easy expansion
