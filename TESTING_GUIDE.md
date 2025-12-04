# Echoes of You - Feature Testing Guide

## ✅ Implemented Features

### 1. Configuration System
- All tuneable constants at top of `game.js` in `gameConfig` object
- Easy to modify spawn rates, durations, multipliers

### 2. New Orb Types ✅
**Status: FULLY IMPLEMENTED**

Test:
1. Start a run and collect orbs
2. Notice different colored orbs:
   - Green (#39ff14) = Normal (70%)
   - Cyan (#00d4ff) = Speed (15%)
   - Gold (#ffd700) = Shield (10%)
   - Purple (#9d4edd) = Slow Time (4%)
   - Pink (#ff006e) = Health (1%)

Debug keys:
- Press `1` = Speed boost (1.6x speed for 4.5s)
- Press `2` = Shield (blocks one hit for 5s)
- Press `3` = Slow time (0.55x time for 3.5s)
- Press `4` = Health (+1 life, max 5)

Expected behavior:
- Speed: Player moves faster, see speed icon in HUD
- Shield: Golden ring around player, blocks next ghost hit
- Slow: Everything moves slower (ghosts, bats, particles)
- Health: Life counter increases (if below max)

### 3. Combo System ✅
**Status: FULLY IMPLEMENTED**

Test:
1. Start a run
2. Collect orbs quickly (within 1.8 seconds)
3. Watch combo counter appear: "Combo: X (xY)"
4. Every 3 orbs = +1 multiplier (max 5x)
5. Score shows with multiplier: "+500 x5"

Expected behavior:
- Combo resets if you wait too long between orbs
- Combo resets if you get hit by a ghost
- Higher multiplier = more points per orb

### 4. Dash Mechanic ✅
**Status: FULLY IMPLEMENTED**

Test:
1. Press `Shift` key to dash
2. Player moves 3x faster for 240ms
3. See afterimage trail effect
4. 2 second cooldown before next dash
5. Dash icon appears in HUD during cooldown

Expected behavior:
- Dash makes you invulnerable (configurable)
- Can't dash while on cooldown
- Visual trail shows dash direction

### 5. Difficulty Toggle ✅
**Status: FULLY IMPLEMENTED**

Test:
1. Click "Difficulty: OFF" button in header (or press `D`)
2. Button turns red: "Difficulty: ON"
3. Start a run
4. Ghosts now use AI instead of replays
5. AI ghosts are RED instead of green
6. Ghosts chase, predict, and wander intelligently

Expected behavior:
- OFF: Classic replay ghosts (green)
- ON: AI ghosts (red) with smart behaviors
- Setting persists across page reloads

### 6. Ghost AI Modes ✅
**Status: FULLY IMPLEMENTED**

When Difficulty is ON, ghosts use 3 AI modes:
- **Predictive** (40%): Anticipates where you'll be
- **Aggressive** (30%): Chases directly, can dash
- **Random** (30%): Wanders randomly

Test:
1. Turn difficulty ON
2. Start run with several ghosts
3. Observe different behaviors:
   - Some predict your movement
   - Some chase aggressively
   - Some wander aimlessly
4. Ghosts switch modes every ~320-900ms

### 7. Active Effects HUD ✅
**Status: FULLY IMPLEMENTED**

Test:
1. Collect special orbs or use debug keys (1-4)
2. See icons appear in top-right:
   - ⚡ = Speed active
   - 🛡 = Shield active
   - 🕐 = Slow time active
   - 💨 = Dash on cooldown (dimmed)

### 8. Shield Blocking ✅
**Status: FULLY IMPLEMENTED**

Test:
1. Press `2` to get shield
2. See golden ring around player
3. Let a ghost hit you
4. Shield blocks hit, shows "SHIELD BLOCKED!"
5. Shield disappears after blocking

### 9. Time Scaling ✅
**Status: FULLY IMPLEMENTED**

Test:
1. Press `3` for slow-time orb
2. Everything moves at 0.55x speed:
   - Ghosts
   - Bats
   - Particles
   - Ghost silhouettes
3. Effect lasts 3.5 seconds

### 10. Floating Score Text ✅
**Status: FULLY IMPLEMENTED**

Test:
1. Collect orbs
2. See floating text rise from player:
   - "+100" for normal orbs
   - "+300 x3" with combo multiplier
   - "+1 Life" for health orbs
   - "SHIELD BLOCKED!" when shield activates

## 🚧 Partially Implemented / TODO

### Boss Ghost System
**Status: NOT IMPLEMENTED**
- Heatmap learning system not added
- Boss spawn not implemented
- Press `B` key does nothing yet

**To implement:**
- Boss heatmap grid (40x24)
- Learning from player patterns
- Boss AI with ambush/patrol
- Boss health bar UI
- localStorage persistence

### Audio & SFX
**Status: STUBBED**
- Thunder/lightning works (existing)
- New SFX not added:
  - Dash sound
  - Shield break
  - Pickup sounds per orb type
  - Combo level-up
  - Boss roar

**To implement:**
- Add audio files to `assets/`
- Hook Howler.js calls
- Add playDashSFX(), playShieldBreakSFX(), etc.

## Debug Keys Summary

| Key | Action |
|-----|--------|
| `1` | Give speed orb effect |
| `2` | Give shield orb effect |
| `3` | Give slow-time orb effect |
| `4` | Give health (+1 life) |
| `D` | Toggle difficulty mode |
| `P` | Create demo ghost (existing) |
| `R` | Respawn orbs (existing) |
| `B` | Spawn boss (NOT IMPLEMENTED) |
| `Shift` | Dash |

## Configuration Tuning

Edit `gameConfig` at top of `game.js`:

```javascript
// Orb spawn probabilities (must sum to 1.0)
ORB_TYPE_PROBS: { 
  normal: 0.70,  // 70% chance
  speed: 0.15,   // 15% chance
  shield: 0.10,  // 10% chance
  slow: 0.04,    // 4% chance
  health: 0.01   // 1% chance
}

// Orb effect durations
ORB_CONFIG: {
  speed: { durMs: 4500, speedMult: 1.6 },
  shield: { durMs: 5000 },
  slow: { durMs: 3500, timeScale: 0.55 },
  health: { heal: 1 }
}

// Combo settings
COMBO: { 
  comboWindowMs: 1800,      // 1.8s to maintain combo
  comboStep: 3,             // Every 3 orbs = +1 multiplier
  comboMaxMultiplier: 5     // Max 5x multiplier
}

// Dash settings
DASH: { 
  dashDurMs: 240,           // Dash lasts 240ms
  dashCooldownMs: 2000,     // 2s cooldown
  dashSpeedMult: 3.0,       // 3x speed during dash
  invulnerable: true        // Invuln during dash
}

// AI Difficulty presets
DIFFICULTY: {
  easy: { 
    aggro: 0.18,            // Low aggression
    decisionInterval: 900,  // Slow decisions
    predictionMs: 220,      // Poor prediction
    speedMult: 1.0          // Normal speed
  },
  hard: { 
    aggro: 0.78,            // High aggression
    decisionInterval: 320,  // Fast decisions
    predictionMs: 600,      // Good prediction
    speedMult: 1.45         // 45% faster
  }
}
```

## Known Issues

1. Boss system not implemented
2. Audio SFX not added (only thunder works)
3. HUD timer rings not animated (just icons)
4. No visual feedback for combo level-up
5. Dash trail could be more pronounced

## Next Steps

To complete the full feature set:

1. **Boss System**: Implement heatmap learning and boss AI
2. **Audio**: Add SFX files and hook them up
3. **Polish**: Add more visual feedback, animations
4. **HUD**: Add radial timer rings for active effects
5. **Particles**: Enhanced dash trail particles

## Performance Notes

- Time scaling affects all movement systems correctly
- No localStorage writes during gameplay (only on save)
- AI updates are efficient (no pathfinding, just direct movement)
- Combo system is lightweight
- All new features tested with no performance issues
