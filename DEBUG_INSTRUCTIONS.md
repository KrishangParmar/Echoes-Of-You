# Debug Instructions

## To fix the issues:

### 1. Clear Browser Cache
- Press `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac) to hard refresh
- Or open DevTools (F12) and right-click the refresh button, select "Empty Cache and Hard Reload"

### 2. Check Console for Debug Info
Open browser console (F12) and look for these messages:
- "Loading X ghosts from Y saved" - shows if ghosts are loaded
- "Difficulty changed to level X" - shows difficulty changes
- "Rendering X ghosts" - shows if ghosts are being rendered
- "Ghost pos: X Y" - shows ghost positions

### 3. Create Test Ghosts
If you don't have any ghosts:
1. Click "Start Run"
2. Move around for a few seconds
3. Click "End Run"
4. OR press 'P' key to create a demo ghost instantly

### 4. Test Difficulty Modes
- Click NORMAL, HARD, or GOD buttons at the top
- Or press 'D' key to cycle through difficulties
- Console should show "Difficulty changed to level X"

### 5. Check if Ghosts Exist
Open console and type:
```javascript
localStorage.getItem('eou_ghosts')
```
If it returns `null`, you have no saved ghosts.

### 6. Force Create a Ghost
Open console and type:
```javascript
window._eou.ghosts
```
This shows current loaded ghosts.

## Expected Behavior:
- **NORMAL mode**: Green ghosts that replay your movements, die when hit
- **HARD mode**: Orange ghosts with AI, 50% survive hits with drift
- **GOD mode**: Red ghosts with homing AI, never die, can duplicate

## Sound Issue:
The ambient sound code has been removed. If you still hear it:
1. Hard refresh (Ctrl+Shift+R)
2. Check if another tab is playing audio
3. Close and reopen the browser
