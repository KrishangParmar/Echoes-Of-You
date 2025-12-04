---
inclusion: always
---

# Code Structure Guidelines for "Echoes of You"

## File Organization
The project follows a simple, flat structure:
- `index.html` - Main HTML structure
- `game.js` - All game logic and state management
- `styles.css` - All styling and visual design
- `assets/` - Images, audio, and media files

## JavaScript Architecture

### Object-Based Organization
Use singleton objects to organize related functionality:

```javascript
const AudioEngine = {
  init() { },
  playSound(name) { },
  setVolume(level) { }
};

const GameState = {
  currentQuestion: 0,
  choices: [],
  score: 0
};
```

### Naming Conventions
- **Functions**: camelCase, verb-based (`displayQuestion`, `handleChoice`, `showEnding`)
- **Objects**: PascalCase for singletons (`AudioEngine`, `GameState`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_QUESTIONS`, `ENDING_THRESHOLDS`)
- **DOM IDs**: kebab-case (`intro-screen`, `start-button`, `question-text`)

### Code Organization in game.js
Organize code in this order:
1. Constants and configuration
2. State objects
3. Utility functions
4. Core game functions (init, display, handle)
5. Event listeners and initialization

### Function Design
- Keep functions focused on single responsibility
- Prefer pure functions where possible
- Use clear, descriptive names
- Add comments for complex logic only

## CSS Architecture

### Class Naming
Use BEM-inspired naming for clarity:
- `.intro-screen` - Block
- `.intro-screen__title` - Element
- `.button--primary` - Modifier

### Organization
Group styles by component/screen:
1. Reset and base styles
2. Layout and containers
3. Typography
4. Buttons and interactive elements
5. Screen-specific styles (intro, game, ending)
6. Animations and transitions
7. Media queries

## Best Practices

### Performance
- Minimize DOM queries (cache selectors)
- Use event delegation where appropriate
- Preload audio and images
- Avoid layout thrashing

### Maintainability
- Keep game.js under 500 lines if possible
- Extract repeated logic into functions
- Use meaningful variable names
- Comment "why" not "what"

### Browser Compatibility
- Test on Chrome, Firefox, Safari
- Use standard Web APIs (avoid experimental features)
- Provide fallbacks for audio (handle autoplay restrictions)
- Use CSS that works across modern browsers
