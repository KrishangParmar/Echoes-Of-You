# Neon Difficulty Slider Guide

## 🎮 Three Difficulty Levels

### 🍃 NORMAL (Level 0)
- **AI**: OFF - Classic replay ghosts
- **Ghost Color**: Green
- **Behavior**: Ghosts replay your recorded movements
- **Best for**: Learning the game, practicing patterns

### 🌿 HARD (Level 1)
- **AI**: ON - Smart AI ghosts
- **Ghost Color**: Orange
- **Behavior**: 
  - 78% aggression
  - 45% faster movement
  - Predicts 600ms ahead
  - Switches tactics every 320ms
- **Best for**: Challenge and variety

### 💀 GOD (Level 2)
- **AI**: ON - Extreme AI ghosts
- **Ghost Color**: Bright Red with extra glow
- **Behavior**:
  - 95% aggression (nearly perfect)
  - 80% faster movement
  - Predicts 800ms ahead
  - Switches tactics every 180ms
  - Relentless pursuit
- **Best for**: Masochists and speedrunners

## 🎨 Visual Features

- **Neon Green Glow**: Toxic #00FF66 with bloom effect
- **Pulsing Thumb**: Circular slider with animated glow
- **Active Markers**: Selected difficulty pulses and glows
- **CRT Grain**: Subtle scanline texture overlay
- **Holographic Edge**: Soft border glow
- **Responsive**: Hover and click feedback

## 🕹️ How to Use

1. **Drag** the slider thumb left/right
2. **Click** on difficulty labels (NORMAL/HARD/GOD)
3. **Press D** key to cycle through levels
4. Setting **auto-saves** to localStorage

## 🎯 Ghost Colors by Difficulty

- **Green** = NORMAL (replays)
- **Orange** = HARD (AI)
- **Red** = GOD (extreme AI)

## ⚙️ Technical Details

### GOD Mode Parameters
```javascript
{
  aggro: 0.95,           // 95% aggression
  decisionInterval: 180, // Switches every 180ms
  predictionMs: 800,     // Predicts 800ms ahead
  speedMult: 1.8         // 80% faster
}
```

### Customization
Edit `setDifficultyLevel()` in game.js to adjust GOD mode:
- Increase `aggro` for more aggressive chasing
- Decrease `decisionInterval` for faster reactions
- Increase `predictionMs` for better prediction
- Increase `speedMult` for faster ghosts

## 🎪 Easter Eggs

- Slider thumb pulses with neon glow
- Active difficulty icon scales and glows
- GOD mode ghosts have triple glow rings
- Hover effects on all interactive elements

Enjoy the premium Halloween UI! 👻✨
