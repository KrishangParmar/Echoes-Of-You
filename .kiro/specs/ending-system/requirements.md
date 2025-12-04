# Ending System Requirements

## Overview
The ending system delivers personalized conclusions based on player choices, providing narrative closure and emotional impact.

## Acceptance Criteria

### AC-1: Score-Based Endings
- Calculate final score from all player choices
- Determine ending type based on score thresholds
- Support multiple distinct endings (minimum 3)
- Ensure each ending has unique narrative content

### AC-2: Ending Presentation
- Display ending screen with appropriate visuals
- Show ending title and narrative text
- Include final score or choice summary
- Maintain horror atmosphere in presentation

### AC-3: Ending Variations
- Light ending: Hopeful/redemptive outcome (high score)
- Neutral ending: Ambiguous/bittersweet outcome (mid score)
- Dark ending: Tragic/horror outcome (low score)
- Each ending should feel meaningfully different

### AC-4: Replay Functionality
- Provide "Play Again" button
- Reset game state completely
- Return to intro screen
- Clear previous choices and score

### AC-5: Ending Persistence
- Track which endings player has seen
- Display ending achievement/collection
- Store ending history in localStorage
- Show completion percentage

## Dependencies
- Game loop must provide final score
- Choice history must be accessible
- Theme system for ending-specific styling
- Audio engine for ending-specific music/effects
