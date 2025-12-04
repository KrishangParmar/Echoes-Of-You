# Game Loop Design

## Architecture

### Core Components
1. **GameState**: Manages current question, choices, score
2. **QuestionRenderer**: Displays current question and options
3. **ChoiceHandler**: Processes player selections
4. **ProgressTracker**: Updates UI with progress information

### Data Structures
```javascript
GameState {
  currentQuestionIndex: number
  totalQuestions: number
  choices: Array<number>
  score: number
  isGameActive: boolean
}

Question {
  id: number
  text: string
  options: Array<{text: string, value: number}>
}
```

## Correctness Properties

### PROP-1: Sequential Question Flow (AC-1, AC-3)
**Property**: Questions display in order from 0 to totalQuestions-1
**Verification**: currentQuestionIndex increments by 1 after each choice

### PROP-2: Choice Immutability (AC-2)
**Property**: Once a choice is made, it cannot be changed
**Verification**: Choice buttons disabled after selection, choice recorded in array

### PROP-3: Score Calculation (AC-2, AC-5)
**Property**: Score accurately reflects sum of all choice values
**Verification**: score = sum(choices[i].value) for all i

### PROP-4: Ending Trigger (AC-3, AC-5)
**Property**: Game transitions to ending when all questions answered
**Verification**: When currentQuestionIndex === totalQuestions, showEnding() called

### PROP-5: Progress Accuracy (AC-3, AC-4)
**Property**: Progress indicator matches actual completion percentage
**Verification**: progress = (currentQuestionIndex / totalQuestions) * 100

## State Transitions
```
INTRO → GAME_ACTIVE → GAME_ENDING → ENDING_SCREEN
```

## Implementation Notes
- Use event delegation for choice buttons
- Implement debouncing to prevent rapid clicks
- Store game state for potential save/resume feature
- Ensure smooth animations don't block interaction
