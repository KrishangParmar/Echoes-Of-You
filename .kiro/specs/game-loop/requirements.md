# Game Loop Requirements

## Overview
The core game loop manages the interactive horror experience, presenting choices and tracking player decisions that lead to different endings.

## Acceptance Criteria

### AC-1: Question Presentation
- Display questions one at a time with clear readability
- Show question counter (e.g., "Question 1 of 10")
- Present multiple choice options (typically 2-4 choices)
- Maintain horror atmosphere in presentation

### AC-2: Choice Tracking
- Record each player choice accurately
- Calculate running score/morality metric
- Store choices for ending determination
- Prevent choice modification after selection

### AC-3: Progress Management
- Advance to next question after choice selection
- Display progress indicator
- Handle final question transition to ending
- Maintain smooth pacing between questions

### AC-4: Visual Feedback
- Highlight selected choice
- Show brief feedback before advancing
- Animate transitions between questions
- Update progress bar/counter

### AC-5: Game State Persistence
- Track current question index
- Maintain choice history
- Calculate cumulative score
- Determine ending path based on choices

## Dependencies
- Question data structure must be defined
- Ending system must be integrated
- Audio engine for ambient sounds
- Theme system for consistent styling
