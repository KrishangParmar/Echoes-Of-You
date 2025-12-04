# Quick Start Guide - New Features

## Try the New Features in 60 Seconds

### 1. Test Orb Types (10 seconds)
```
1. Start a run
2. Collect different colored orbs
3. Watch for effects in top-right HUD
```

### 2. Test Combo System (10 seconds)
```
1. Collect orbs quickly
2. Watch combo counter: "Combo: 3 (x2)"
3. See multiplied score: "+200 x2"
```

### 3. Test Dash (10 seconds)
```
1. Press Shift key
2. See speed burst and trail
3. Wait 2 seconds for cooldown
```

### 4. Test Difficulty AI (15 seconds)
```
1. Click "Difficulty: OFF" button (turns red)
2. Start a run
3. Watch RED AI ghosts chase you intelligently
```

### 5. Test Debug Keys (15 seconds)
```
Press these keys:
- 1 = Speed boost (move faster)
- 2 = Shield (golden ring)
- 3 = Slow time (everything slows)
- 4 = Health (+1 life)
```

## What Changed?

### Visual Changes
- **Colored orbs**: Green, cyan, gold, purple, pink
- **AI ghosts**: RED instead of green when difficulty ON
- **HUD icons**: Top-right shows active effects
- **Floating text**: Score pops up with multipliers
- **Shield ring**: Golden circle when protected
- **Dash trail**: Afterimages when dashing

### Gameplay Changes
- **5 orb types** with different effects
- **Combo system** for higher scores
- **Dash ability** for quick escapes
- **AI ghosts** that hunt you intelligently
- **Time manipulation** with slow-time orbs
- **Shield protection** blocks one hit

## Configuration

Want to tweak the game? Edit `gameConfig` at the top of `game.js`:

```javascript
// Make speed orbs more common
ORB_TYPE_PROBS: { normal: 0.50, speed: 0.35, ... }

// Make dash faster
DASH: { dashSpeedMult: 5.0, ... }

// Make AI easier
DIFFICULTY.hard: { aggro: 0.3, ... }

// Longer combo window
COMBO: { comboWindowMs: 3000, ... }
```

## Troubleshooting

**Orbs all look the same?**
- Hard refresh: Ctrl+F5

**Difficulty button not working?**
- Check browser console for errors
- Make sure localStorage is enabled

**Dash not working?**
- Press Shift key (not Space)
- Wait for 2s cooldown between dashes

**AI ghosts not moving?**
- Make sure difficulty is ON (button should be red)
- Start a new run after toggling

## What's Not Implemented?

- Boss ghost system (press B does nothing)
- Audio SFX for new features (only thunder works)
- Radial timer animations on HUD icons

These are polish features that don't affect gameplay.

## Have Fun!

The game is significantly more dynamic now with:
- Strategic orb collection for combos
- Tactical dash usage for escapes
- Challenging AI ghosts
- Multiple power-ups to master

Enjoy the enhanced Echoes of You! 👻
