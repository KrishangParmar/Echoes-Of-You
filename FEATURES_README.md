# Echoes of You - New Features Implementation Guide

## Configuration Constants (Top of game.js)

All tuneable parameters are in the `gameConfig` object:

```javascript
- gameTimeScale: 1.0 (global time multiplier)
- MAX_LIVES: 5
- ORB_TYPE_PROBS: Spawn probabilities for each orb type
- ORB_CONFIG: Duration and multipliers for power-ups
- COMBO: Combo window and multiplier settings
- DASH: Dash mechanics parameters
- DIFFICULTY: Easy/Hard AI presets
- HEATMAP: Boss learning grid dimensions (40x24)
```

## Debug Keys

- **B**: Spawn boss ghost
- **1**: Give speed orb effect
- **2**: Give shield orb effect
- **3**: Give slow-time orb effect
- **4**: Give health pickup (+1 life)
- **P**: Create demo ghost (existing)
- **R**: Respawn orbs (existing)
- **D**: Toggle difficulty mode

## Features Overview

### 1. Difficulty Toggle
- Button in header to toggle AI difficulty
- OFF: Classic replay ghosts
- ON: AI-controlled ghosts with predictive/aggressive/random behaviors
- Persists to localStorage

### 2. Ghost AI Modes
When difficulty is ON, ghosts use AI instead of replays:
- **Predictive**: Anticipates player movement
- **Aggressive**: Chases player with dash bursts
- **Random**: Wanders randomly
- Modes switch based on decision intervals

### 3. New Orb Types
- **Normal** (70%): Standard score orb
- **Speed** (15%): 1.6x speed for 4.5s
- **Shield** (10%): Blocks one ghost hit for 5s
- **Slow** (4%): Slows time to 0.55x for 3.5s
- **Health** (1%): Restores 1 life (max 5)

### 4. Boss Ghost
- Learns from player patterns via heatmap
- Patrols hotspots where player frequents
- Can ambush and intercept
- Spawn with 'B' key
- Heatmap persists across sessions

### 5. Combo System
- Collect orbs within 1.8s window to build combo
- Every 3 combo: +1x multiplier (max 5x)
- Score multiplied by combo multiplier
- Shows floating text with multiplier

### 6. Dash Mechanic
- Press Shift to dash
- 3x speed for 240ms
- 2s cooldown
- Optional invulnerability during dash
- Visual trail and SFX

### 7. HUD Additions
- Active effect icons with radial countdown timers
- Combo counter and multiplier display
- Dash cooldown indicator
- Boss warning bar

### 8. Audio & SFX
- Dash, shield break, pickups, health, boss roar
- Combo level-up sounds
- Adaptive ambient intensity

## Testing Each Feature

1. **Difficulty**: Click button or press 'D', ghosts should move intelligently
2. **Orbs**: Collect different colored orbs, see effects in HUD
3. **Combo**: Collect orbs quickly, watch multiplier increase
4. **Dash**: Press Shift, see speed burst and trail
5. **Boss**: Press 'B', boss spawns and hunts player
6. **Health**: Press '4' or find rare health orb, life increases

## Tuning Tips

- Adjust `ORB_TYPE_PROBS` to change orb spawn rates
- Modify `DIFFICULTY.hard.aggro` (0-1) for ghost aggression
- Change `dashSpeedMult` for faster/slower dash
- Adjust `comboWindowMs` for easier/harder combos
- Modify `predictionMs` for ghost prediction accuracy

## localStorage Keys

- `eou_ghosts`: Ghost recordings (existing)
- `eou_difficulty`: Difficulty on/off state
- `eou_boss_heatmap`: Boss learning data

## Performance Notes

- Heatmap writes are debounced to avoid lag
- Time scaling affects all movement systems
- Boss AI updates are throttled
