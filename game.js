// game.js - Echoes of You

// ============================================
// CONFIGURATION CONSTANTS (Tuneable)
// ============================================
const gameConfig = {
  gameTimeScale: 1.0,
  MAX_LIVES: 5,
  ORB_TYPE_PROBS: { normal: 0.60, speed: 0.15, shield: 0.15, slow: 0.05, health: 0.05 },
  ORB_CONFIG: {
    speed: { durMs: 4500, speedMult: 1.6 },
    shield: { durMs: 5000 },
    slow: { durMs: 3500, timeScale: 0.55 },
    health: { heal: 1 }
  },
  COMBO: { comboWindowMs: 1800, comboStep: 3, comboMaxMultiplier: 5 },
  DASH: { dashDurMs: 240, dashCooldownMs: 2000, dashSpeedMult: 3.0, invulnerable: true },
  DIFFICULTY: {
    easy: { aggro: 0.18, decisionInterval: 900, predictionMs: 220, speedMult: 1.0 },
    hard: { aggro: 0.78, decisionInterval: 320, predictionMs: 600, speedMult: 1.45 }
  },
  HEATMAP: { gridW: 40, gridH: 24 }
};

let gameTimeScale = gameConfig.gameTimeScale;
let difficultyOn = false;
let currentDifficulty = gameConfig.DIFFICULTY.easy;

// ---------------------------
// Setup, resize (DPI-safe)
// ---------------------------
const canvas = document.getElementById('game'), ctx = canvas.getContext('2d');
const pCanvas = document.getElementById('particles'), pctx = pCanvas.getContext('2d');
const batsCanvas = document.getElementById('bats'), bctx = batsCanvas.getContext('2d');
const crt = document.getElementById('crt'), crtCtx = crt.getContext('2d');
const wrap = document.getElementById('canvasWrap');
const flash = document.getElementById('flash');

let baseW = 960, baseH = 560;
function resizeAll(){
  const rect = wrap.getBoundingClientRect();
  baseW = Math.max(480, Math.round(rect.width));
  baseH = Math.max(320, Math.round(rect.height));
  const dpr = window.devicePixelRatio || 1;
  [[canvas,ctx],[pCanvas,pctx],[batsCanvas,bctx],[crt,crtCtx]].forEach(([c,cc])=>{
    c.width = Math.round(baseW * dpr);
    c.height = Math.round(baseH * dpr);
    c.style.width = baseW + 'px'; c.style.height = baseH + 'px';
    cc.setTransform(dpr,0,0,dpr,0,0);
  });
}
window.addEventListener('resize', resizeAll);
resizeAll();

// ---------------------------
// Background parallax
// ---------------------------
const bgBack = document.getElementById('bgBack'), bgMid = document.getElementById('bgMid'), bgFront = document.getElementById('bgFront');
let mx = 0, my = 0;
window.addEventListener('mousemove', e => { mx = (e.clientX/window.innerWidth - 0.5)*2; my = (e.clientY/window.innerHeight - 0.5)*2; });
(function animateBG(){
  const t = performance.now()/1000;
  const sx = 1 + Math.sin(t*0.12)*0.01;
  const sy = 1 + Math.cos(t*0.11)*0.008;
  bgBack.style.transform = `translate3d(${mx*6}px,${my*6}px,0) scale(${sx})`;
  bgMid.style.transform  = `translate3d(${mx*10}px,${my*10}px,0) scale(1.03)`;
  bgFront.style.transform= `translate3d(${mx*16}px,${my*18}px,0) scale(1.04)`;
  requestAnimationFrame(animateBG);
})();

// ---------------------------
// Game state & DPI-correct logic
// ---------------------------
let running=false, runIndex=0, score=0, lives=3;
let gamePaused = false;
window.__gameOverTriggered = false;

// Visual effects variables
let shakePower = 0;
let screenFlash = 0;
let impactRings = [];
const player = { 
  x: baseW/2, y: baseH/2, r: 14, spd: 240, color: '#bfff9a',
  vx: 0, vy: 0, // velocity tracking
  speedMultiplier: 1.0,
  shield: false,
  isDashing: false,
  dashTimerMs: 0,
  dashCooldownTimerMs: 0,
  dashReady: true
};

// Active effects tracking
const activeEffects = {
  speed: { active: false, timerMs: 0 },
  shield: { active: false, timerMs: 0 },
  slow: { active: false, timerMs: 0 }
};

// Combo system
let comboCount = 0;
let comboTimerMs = 0;

let orbs = [];

// ---------------------------
// Orb spawning with types
// ---------------------------
function getOrbType() {
  const rand = Math.random();
  const probs = gameConfig.ORB_TYPE_PROBS;
  let cumulative = 0;
  for (const [type, prob] of Object.entries(probs)) {
    cumulative += prob;
    if (rand < cumulative) return type;
  }
  return 'normal';
}

function getOrbColor(type) {
  const colors = {
    normal: '#39ff14',
    speed: '#00d4ff',
    shield: '#ffd700',
    slow: '#9d4edd',
    health: '#ff006e'
  };
  return colors[type] || '#39ff14';
}

function spawnOrbs(n=7){
  orbs = []; const now = performance.now();
  for(let i=0;i<n;i++){ 
    const type = getOrbType();
    orbs.push({ 
      x:40 + Math.random()*(baseW-80), 
      y:40 + Math.random()*(baseH-80), 
      r:9, 
      spawnAt: now - Math.random()*200,
      type: type,
      color: getOrbColor(type)
    }); 
  }
}
spawnOrbs();

// ---------------------------
// Dash Mechanic
// ---------------------------
function tryDash() {
  if (player.dashReady && !player.isDashing) {
    player.isDashing = true;
    player.dashTimerMs = gameConfig.DASH.dashDurMs;
    player.dashReady = false;
    player.dashCooldownTimerMs = gameConfig.DASH.dashCooldownMs;
    // TODO: Add dash SFX and trail particles
  }
}

// keyboard - prevent page scroll
const keys = {};
window.addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  if (['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k)) e.preventDefault();
  keys[k] = true;
  
  // Dash on Shift
  if (e.key === 'Shift') {
    tryDash();
  }
});
window.addEventListener('keyup', e => {
  const k = e.key.toLowerCase();
  if (['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k)) e.preventDefault();
  keys[k] = false;
});

// utility
function dist(a,b){ const dx=a.x-b.x, dy=a.y-b.y; return Math.sqrt(dx*dx+dy*dy); }

// ---------------------------
// Orb Effects System
// ---------------------------
function applyOrbEffect(type) {
  const cfg = gameConfig.ORB_CONFIG;
  
  switch(type) {
    case 'speed':
      player.speedMultiplier = cfg.speed.speedMult;
      activeEffects.speed.active = true;
      activeEffects.speed.timerMs = cfg.speed.durMs;
      break;
    case 'shield':
      player.shield = true;
      activeEffects.shield.active = true;
      activeEffects.shield.timerMs = cfg.shield.durMs;
      break;
    case 'slow':
      gameTimeScale = cfg.slow.timeScale;
      activeEffects.slow.active = true;
      activeEffects.slow.timerMs = cfg.slow.durMs;
      break;
    case 'health':
      if (lives < gameConfig.MAX_LIVES) {
        lives++;
        document.getElementById('lives').textContent = lives;
        showFloatingText(player.x, player.y, '+1 Life', '#ff006e');
      }
      break;
    case 'normal':
    default:
      // Just score
      break;
  }
}

function updateActiveEffects(dt) {
  const dtMs = dt * 1000;
  
  // Speed effect
  if (activeEffects.speed.active) {
    activeEffects.speed.timerMs -= dtMs;
    if (activeEffects.speed.timerMs <= 0) {
      activeEffects.speed.active = false;
      player.speedMultiplier = 1.0;
    }
  }
  
  // Shield effect
  if (activeEffects.shield.active) {
    activeEffects.shield.timerMs -= dtMs;
    if (activeEffects.shield.timerMs <= 0) {
      activeEffects.shield.active = false;
      player.shield = false;
    }
  }
  
  // Slow effect
  if (activeEffects.slow.active) {
    activeEffects.slow.timerMs -= dtMs;
    if (activeEffects.slow.timerMs <= 0) {
      activeEffects.slow.active = false;
      gameTimeScale = gameConfig.gameTimeScale;
    }
  }
}

// ---------------------------
// Combo System
// ---------------------------
function registerComboAction() {
  comboCount++;
  comboTimerMs = gameConfig.COMBO.comboWindowMs;
}

function getComboMultiplier() {
  return Math.min(
    gameConfig.COMBO.comboMaxMultiplier,
    1 + Math.floor(comboCount / gameConfig.COMBO.comboStep)
  );
}

function updateCombo(dt) {
  if (comboTimerMs > 0) {
    comboTimerMs -= dt * 1000;
    if (comboTimerMs <= 0) {
      comboCount = 0;
      comboTimerMs = 0;
    }
  }
}

// Floating text system
const floatingTexts = [];
function showFloatingText(x, y, text, color = '#39ff14') {
  floatingTexts.push({ x, y, text, color, life: 0, ttl: 1.5, vy: -60 });
}

function updateFloatingTexts(dt) {
  for (let i = floatingTexts.length - 1; i >= 0; i--) {
    const ft = floatingTexts[i];
    ft.life += dt;
    ft.y += ft.vy * dt;
    if (ft.life > ft.ttl) floatingTexts.splice(i, 1);
  }
}

function renderFloatingTexts() {
  ctx.save();
  ctx.font = 'bold 18px Inter';
  ctx.textAlign = 'center';
  for (const ft of floatingTexts) {
    const alpha = 1 - (ft.life / ft.ttl);
    ctx.fillStyle = ft.color;
    ctx.globalAlpha = alpha;
    ctx.fillText(ft.text, ft.x, ft.y);
  }
  ctx.restore();
}

// ---------------------------
// Difficulty System
// ---------------------------
function loadDifficulty() {
  try {
    const saved = localStorage.getItem('eou_difficulty');
    const level = saved ? parseInt(saved) : 0;
    setDifficultyLevel(level);
  } catch(e) { 
    console.warn(e);
    setDifficultyLevel(0);
  }
}

// Difficulty levels: 0=NORMAL(off), 1=HARD, 2=GOD
let difficultyLevel = 0;

function setDifficultyLevel(level) {
  difficultyLevel = level;
  difficultyOn = level > 0;
  
  // Set difficulty parameters and max ghosts
  if (level === 0) {
    // NORMAL - Classic replays, ghosts die on hit
    currentDifficulty = { 
      mode: 'normal',
      ghostSurviveChance: 0,
      ghostOpacity: 0.34,
      driftAmount: 0,
      speedMult: 1.0,
      maxGhosts: 6,
      homingEnabled: false
    };
  } else if (level === 1) {
    // HARD - Slight drift, 50% survive chance
    currentDifficulty = { 
      mode: 'hard',
      ghostSurviveChance: 0.5,
      ghostOpacity: 0.45,
      driftAmount: 15,
      speedMult: 1.1,
      maxGhosts: 6,
      homingEnabled: false,
      microAcceleration: true,
      aggro: 0.5,
      decisionInterval: 500,
      predictionMs: 400
    };
  } else if (level === 2) {
    // GOD - Aggressive homing, ghosts never die, more ghosts
    currentDifficulty = {
      mode: 'god',
      ghostSurviveChance: 1.0,
      ghostOpacity: 0.55,
      driftAmount: 0,
      speedMult: 1.15,
      maxGhosts: 10,
      homingEnabled: true,
      homingStrength: 0.25,
      duplicateChance: 0.15,
      aggro: 0.75,
      decisionInterval: 350,
      predictionMs: 500
    };
  }
  
  try {
    localStorage.setItem('eou_difficulty', level.toString());
  } catch(e) { console.warn(e); }
  
  // Reset ghost AI state
  for (const g of ghosts) {
    g._aiPos = null;
    g._aiTimer = 0;
    g._mode = null;
    g._wanderTarget = null;
    g._driftX = 0;
    g._driftY = 0;
  }
  
  updateDifficultyUI();
}

function updateDifficultyUI() {
  const options = document.querySelectorAll('.diff-option');
  options.forEach(opt => {
    const level = parseInt(opt.dataset.level);
    if (level === difficultyLevel) {
      opt.classList.add('active');
    } else {
      opt.classList.remove('active');
    }
  });
  
  // Update page mood based on difficulty
  const pageRoot = document.getElementById('pageRoot');
  pageRoot.classList.remove('difficulty-hard', 'difficulty-god');
  if (difficultyLevel === 1) {
    pageRoot.classList.add('difficulty-hard');
  } else if (difficultyLevel === 2) {
    pageRoot.classList.add('difficulty-god');
  }
}

// ---------------------------
// Ghosts (localStorage)
// ---------------------------
let ghosts = [];
function getMaxGhosts() {
  return currentDifficulty.maxGhosts || 6;
}
function loadGhosts(){
  ghosts = [];
  try{
    const raw = localStorage.getItem('eou_ghosts'); 
    if(!raw) return;
    const arr = JSON.parse(raw);
    const maxGhosts = getMaxGhosts();
    const baseOpacity = currentDifficulty.ghostOpacity || 0.34;
    for(let i=0;i<Math.min(arr.length,maxGhosts);i++){
      ghosts.push({ 
        id:i, 
        record: arr[arr.length-1-i], 
        color: `rgba(57,255,20,${baseOpacity - i*0.03})`, 
        _hitCooldown:0,
        _driftX: 0,
        _driftY: 0,
        flash: 0
      });
    }
  }catch(e){ console.warn(e); }
  refreshGhostList();
}
function saveGhost(rec){
  try{ const raw = localStorage.getItem('eou_ghosts'); let arr = raw?JSON.parse(raw):[]; arr.push(rec); if(arr.length>24) arr = arr.slice(arr.length-24); localStorage.setItem('eou_ghosts', JSON.stringify(arr)); loadGhosts(); }catch(e){console.warn(e)}
}
function clearGhosts(){ localStorage.removeItem('eou_ghosts'); ghosts=[]; refreshGhostList(); }
function refreshGhostList(){
  const el = document.getElementById('ghostList'); el.innerHTML='';
  ghosts.forEach((g,i)=>{ const div=document.createElement('div'); div.style.display='flex'; div.style.justifyContent='space-between'; div.style.alignItems='center'; div.style.padding='8px'; div.style.borderRadius='8px'; div.style.background='rgba(255,255,255,0.02)';
    const left = document.createElement('div'); left.textContent = `Ghost #${i+1} · ${g.record.length} samples`; left.style.color = 'var(--muted)';
    const btn = document.createElement('button'); btn.className='small'; btn.textContent='Preview'; btn.onclick = ()=>{ flashBorder(); };
    div.appendChild(left); div.appendChild(btn); el.appendChild(div);
  });
  document.getElementById('ghostCountTop').textContent = ghosts.length;
}
loadGhosts();

// recording
const sampleDt = 90; let record = []; let recStart = 0; let recTimer = null;
function sampleOnce(){ const t = performance.now() - recStart; record.push({ t, x: player.x, y: player.y }); }
function startRun(){ if(running) return; running = true; gamePaused = false; window.__gameOverTriggered = false; record = []; recStart = performance.now(); sampleOnce(); recTimer = setInterval(sampleOnce, sampleDt); document.getElementById('startBtn').textContent='Running...'; document.getElementById('startBtn').disabled=true; document.getElementById('endBtn').disabled=false; }
function endRun(wasDestroyed = false){ if(!running) return; running=false; runIndex++; clearInterval(recTimer); recTimer=null; document.getElementById('startBtn').textContent='Start Run'; document.getElementById('startBtn').disabled=false; document.getElementById('endBtn').disabled=true; 
  
  // Show game over popup if destroyed
  if(wasDestroyed) {
    showGameOverPopup();
  }
  
  // Check for run-based completion
  if (typeof checkRunCompletion === 'function') {
    checkRunCompletion();
  }
  
  saveGhost(record); lives=3; score=0; document.getElementById('score').textContent=score; document.getElementById('lives').textContent=lives; player.x = baseW/2; player.y = baseH/2; spawnOrbs(7); flashBorder(); }

function showGameOverPopup() {
  const popup = document.getElementById('gameOverPopup');
  document.getElementById('finalScore').textContent = score;
  document.getElementById('finalGhosts').textContent = ghosts.length;
  const diffNames = ['NORMAL', 'HARD', 'GOD'];
  document.getElementById('finalDifficulty').textContent = diffNames[difficultyLevel];
  popup.classList.add('active');
}

function flashBorder(){ const wrapGlow = document.querySelector('.game-glow'); wrapGlow.style.boxShadow='0 0 0 8px rgba(57,255,20,0.12)'; setTimeout(()=>wrapGlow.style.boxShadow='',360); }

// particles for collisions and pickups
const particles = [];
function emitParticle(x,y,count=6,color='green'){ for(let i=0;i<count;i++){ particles.push({ x,y, vx:(Math.random()-0.5)*120, vy:(Math.random()-0.8)*40, life:0, ttl:0.6 + Math.random()*0.9, size:3+Math.random()*6, color }); } }
function updateParticles(dt){ for(let i=particles.length-1;i>=0;i--){ const p = particles[i]; p.life += dt; p.x += p.vx*dt; p.y += p.vy*dt; p.vx *= 0.995; p.vy += 20*dt; if(p.life > p.ttl) particles.splice(i,1); } }
function renderParticles(){ pctx.clearRect(0,0,baseW,baseH); pctx.globalCompositeOperation='lighter'; for(const p of particles){ const rgb = p.color === 'red' ? '255,60,60' : '57,255,20'; const g = pctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.size*3); g.addColorStop(0, `rgba(${rgb},${0.9*(1-p.life/p.ttl)})`); g.addColorStop(1, `rgba(${rgb},0)`); pctx.fillStyle = g; pctx.beginPath(); pctx.arc(p.x,p.y,p.size,0,Math.PI*2); pctx.fill(); } pctx.globalCompositeOperation='source-over'; }

// ---------------------------
// Sprite bats (cute cartoon style with eyes)
// ---------------------------
const batFrames = [];
(function generateBatFrames(){
  const w = 90, h = 60;
  for(let f=0; f<5; f++){
    const off = document.createElement('canvas'); off.width = w; off.height = h;
    const g = off.getContext('2d');
    g.clearRect(0,0,w,h); g.translate(w/2, h/2);
    const t = (f/4) * Math.PI;
    const flapAngle = Math.sin(t) * 0.4;
    
    g.fillStyle = '#000000';
    
    // Left wing
    g.save();
    g.rotate(-0.15 + flapAngle);
    g.beginPath();
    g.moveTo(-8, 0);
    g.bezierCurveTo(-12, -8, -20, -12, -28, -10);
    g.bezierCurveTo(-34, -8, -38, -2, -38, 4);
    g.bezierCurveTo(-36, 8, -32, 10, -28, 10);
    g.bezierCurveTo(-24, 10, -20, 8, -16, 6);
    g.bezierCurveTo(-12, 4, -10, 2, -8, 0);
    g.closePath();
    g.fill();
    g.restore();
    
    // Right wing
    g.save();
    g.rotate(0.15 - flapAngle);
    g.beginPath();
    g.moveTo(8, 0);
    g.bezierCurveTo(12, -8, 20, -12, 28, -10);
    g.bezierCurveTo(34, -8, 38, -2, 38, 4);
    g.bezierCurveTo(36, 8, 32, 10, 28, 10);
    g.bezierCurveTo(24, 10, 20, 8, 16, 6);
    g.bezierCurveTo(12, 4, 10, 2, 8, 0);
    g.closePath();
    g.fill();
    g.restore();
    
    // Body (round)
    g.beginPath();
    g.ellipse(0, 2, 10, 12, 0, 0, Math.PI * 2);
    g.fill();
    
    // Left ear
    g.beginPath();
    g.moveTo(-6, -8);
    g.lineTo(-8, -16);
    g.lineTo(-4, -10);
    g.closePath();
    g.fill();
    
    // Right ear
    g.beginPath();
    g.moveTo(6, -8);
    g.lineTo(8, -16);
    g.lineTo(4, -10);
    g.closePath();
    g.fill();
    
    // White eyes
    g.fillStyle = '#FFFFFF';
    g.beginPath();
    g.arc(-3, -2, 3, 0, Math.PI * 2);
    g.fill();
    g.beginPath();
    g.arc(3, -2, 3, 0, Math.PI * 2);
    g.fill();
    
    // Black pupils
    g.fillStyle = '#000000';
    g.beginPath();
    g.arc(-3, -2, 1.5, 0, Math.PI * 2);
    g.fill();
    g.beginPath();
    g.arc(3, -2, 1.5, 0, Math.PI * 2);
    g.fill();
    
    const img = new Image(); img.src = off.toDataURL(); batFrames.push(img);
  }
})();

const bats = [];
function spawnBat(){ const y = 40 + Math.random()*(baseH-120); const dir = Math.random()>0.5 ? 1:-1; const x = dir>0 ? -80 : baseW + 80; bats.push({ x,y, vx: dir*(90 + Math.random()*100), vy: (Math.random()-0.5)*15, vyBase: (Math.random()-0.5)*15, scale: 0.7 + Math.random()*0.8, frame: 0, frameTime: 0, wobble: Math.random()*Math.PI*2 }); }
setInterval(()=>{ if(bats.length < 8 && Math.random()<0.6) spawnBat(); }, 900);
function updateBats(dt){ for(let i=bats.length-1;i>=0;i--){ const b=bats[i]; b.x += b.vx * dt; b.wobble += dt * 3; b.vy = b.vyBase + Math.sin(b.wobble) * 8; b.y += b.vy * dt; b.frameTime += dt; if(b.frameTime > 0.08){ b.frameTime = 0; b.frame = (b.frame+1) % batFrames.length; } if(b.vx>0 && b.x > baseW + 140) bats.splice(i,1); if(b.vx<0 && b.x < -140) bats.splice(i,1); } }
function renderBats(){ bctx.clearRect(0,0,baseW,baseH); bctx.save(); for(const b of bats){ const img = batFrames[b.frame]; if(!img.complete) continue; bctx.save(); bctx.globalAlpha = 0.95; bctx.shadowColor = 'rgba(0,0,0,0.5)'; bctx.shadowBlur = 8; bctx.translate(b.x, b.y); bctx.rotate(Math.sin(b.wobble) * 0.1); bctx.scale(b.vx>0 ? b.scale : -b.scale, b.scale); bctx.drawImage(img, -40, -25, 80, 50); bctx.restore(); } bctx.restore(); }

// ---------------------------
// Ghost silhouettes emerging from background (sheet ghost style)
// ---------------------------
const ghostSilhouettes = [];
function spawnGhostSilhouette(){ const x = Math.random() * baseW; const y = baseH + 80; const targetY = Math.random() * (baseH * 0.5); ghostSilhouettes.push({ x, y, targetY, alpha: 0, phase: 'rising', life: 0, speed: 25 + Math.random()*35, scale: 0.7 + Math.random()*0.5, drift: (Math.random()-0.5)*15, wobble: Math.random()*Math.PI*2 }); }
setInterval(()=>{ if(ghostSilhouettes.length < 5 && Math.random()<0.4) spawnGhostSilhouette(); }, 1800);
function updateGhostSilhouettes(dt){ for(let i=ghostSilhouettes.length-1;i>=0;i--){ const gs = ghostSilhouettes[i]; gs.life += dt; gs.wobble += dt * 2; gs.x += gs.drift * dt + Math.sin(gs.wobble) * 8 * dt; if(gs.phase === 'rising'){ gs.y -= gs.speed * dt; gs.alpha = Math.min(0.3, gs.alpha + dt * 0.4); if(gs.y <= gs.targetY){ gs.phase = 'fading'; } } else if(gs.phase === 'fading'){ gs.alpha -= dt * 0.12; if(gs.alpha <= 0) ghostSilhouettes.splice(i,1); } } }
function renderGhostSilhouettes(){ ctx.save(); for(const gs of ghostSilhouettes){ ctx.globalAlpha = gs.alpha; ctx.save(); ctx.translate(gs.x, gs.y); const sway = Math.sin(gs.wobble * 0.8) * 5; const stretch = 1 + Math.sin(gs.wobble * 1.2) * 0.08; ctx.rotate(Math.sin(gs.wobble * 0.6) * 0.08); ctx.scale(gs.scale * (1 + Math.sin(gs.wobble) * 0.05), gs.scale * stretch); const wave = Math.sin(gs.wobble) * 4; const wave2 = Math.cos(gs.wobble * 1.3) * 3; ctx.shadowColor = 'rgba(220,220,235,0.4)'; ctx.shadowBlur = 15; ctx.fillStyle = 'rgba(230,230,245,0.92)'; ctx.beginPath(); ctx.moveTo(0, -40); ctx.bezierCurveTo(-25 + sway*0.3, -35, -30, -20, -30, 0); ctx.bezierCurveTo(-30, 20, -28, 35, -25, 45); ctx.lineTo(-20 + wave, 50 + wave2); ctx.lineTo(-10 + wave*0.5, 42 + wave2*0.5); ctx.lineTo(0, 50 + wave); ctx.lineTo(10 - wave*0.5, 42 + wave2*0.5); ctx.lineTo(20 - wave, 50 + wave2); ctx.lineTo(25, 45); ctx.bezierCurveTo(28, 35, 30, 20, 30, 0); ctx.bezierCurveTo(30, -20, 25 - sway*0.3, -35, 0, -40); ctx.closePath(); ctx.fill(); ctx.shadowBlur = 0; const eyeBlink = gs.life % 3 < 0.1 ? 0.3 : 1; ctx.fillStyle = 'rgba(0,0,0,0.85)'; ctx.save(); ctx.scale(1, eyeBlink); ctx.beginPath(); ctx.ellipse(-10, -15, 5, 8, 0, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.ellipse(10, -15, 5, 8, 0, 0, Math.PI*2); ctx.fill(); ctx.restore(); ctx.beginPath(); ctx.ellipse(0, 0 + Math.sin(gs.wobble*2)*2, 6, 9, 0, 0, Math.PI*2); ctx.fill(); ctx.restore(); } ctx.restore(); }

// ---------------------------
// Lightning & thunder (fixed clean implementation)
// ---------------------------
const thunderSounds = [ new Howl({ src: ['assets/lightning-189909.mp3'], volume: 0.25 }), new Howl({ src: ['assets/scary-thunder-and-lightning-66913.mp3'], volume: 0.28 }) ];
let nextLightning = performance.now() + 4000 + Math.random()*8000;
function maybeLightning(now){ if(now > nextLightning){ flash.style.opacity = '0.85'; setTimeout(()=>{ flash.style.opacity = '0'; }, 120); if(typeof Howl !== 'undefined' && thunderSounds.length > 0){ const snd = thunderSounds[Math.floor(Math.random()*thunderSounds.length)]; try{ snd.play(); }catch(e){ console.warn('thunder play failed', e); } } nextLightning = now + 3000 + Math.random()*12000; } }

// ---------------------------
// Audio: Collision SFX only (ambient removed)
// ---------------------------
let audioCtx = null, isAudio=false;
function initAudio(){ if(isAudio) return; audioCtx = new (window.AudioContext || window.webkitAudioContext)(); isAudio = true; }
function setIntensity(v){ /* Ambient removed - no-op */ }
function playCollisionSfx(){ if(!audioCtx) return; const now = audioCtx.currentTime; const o = audioCtx.createOscillator(); const g = audioCtx.createGain(); o.type='square'; o.frequency.setValueAtTime(700, now); g.gain.setValueAtTime(0.14, now); o.connect(g); g.connect(audioCtx.destination); o.start(now); o.frequency.exponentialRampToValueAtTime(90, now+0.25); g.gain.exponentialRampToValueAtTime(0.001, now+0.4); setTimeout(()=>{ try{o.stop();}catch(e){} }, 700); }

// ---------------------------
// Ghost interpolation util with difficulty modifiers
// ---------------------------
function ghostPosAt(g, t, dt){ 
  if(!g.record || g.record.length===0) return { x:-100, y:-100 }; 
  const s = g.record; 
  if(t <= s[0].t) return { x: s[0].x, y: s[0].y }; 
  if(t >= s[s.length-1].t) return { x: s[s.length-1].x, y: s[s.length-1].y }; 
  
  let lo=0, hi=s.length-1; 
  while(hi-lo>1){ 
    const mid = Math.floor((hi+lo)/2); 
    if(s[mid].t <= t) lo = mid; else hi = mid; 
  } 
  const a = s[lo], b = s[hi]; 
  const f = (t - a.t) / (b.t - a.t || 1); 
  let x = a.x + (b.x - a.x) * f;
  let y = a.y + (b.y - a.y) * f;
  
  // Apply difficulty modifiers
  const diff = currentDifficulty;
  
  // HARD MODE: Random drift
  if (diff.driftAmount && diff.driftAmount > 0) {
    if (!g._driftX) g._driftX = 0;
    if (!g._driftY) g._driftY = 0;
    g._driftX += (Math.random() - 0.5) * diff.driftAmount * (dt || 0.016);
    g._driftY += (Math.random() - 0.5) * diff.driftAmount * (dt || 0.016);
    g._driftX *= 0.95; // Decay
    g._driftY *= 0.95;
    x += g._driftX;
    y += g._driftY;
  }
  
  // GOD MODE: Homing towards player
  if (diff.homingEnabled && diff.homingStrength) {
    const dx = player.x - x;
    const dy = player.y - y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    if (dist > 50) { // Only home if not too close
      x += (dx / dist) * diff.homingStrength * 100 * (dt || 0.016);
      y += (dy / dist) * diff.homingStrength * 100 * (dt || 0.016);
    }
  }
  
  // Speed multiplier
  if (diff.speedMult && diff.speedMult !== 1.0) {
    const centerX = baseW / 2;
    const centerY = baseH / 2;
    x = centerX + (x - centerX) * diff.speedMult;
    y = centerY + (y - centerY) * diff.speedMult;
  }
  
  return { x, y }; 
}

// ---------------------------
// Ghost AI System
// ---------------------------
function updateGhostAI(g, dt) {
  if (!g._aiPos) {
    g._aiPos = { x: baseW/2, y: baseH/2 };
    g._aiTimer = 0;
    g._mode = 'random';
    g._wanderTarget = { x: Math.random() * baseW, y: Math.random() * baseH };
    g._dashCooldown = 0;
  }
  
  const diff = currentDifficulty;
  g._aiTimer += dt * 1000;
  
  // Mode selection
  if (g._aiTimer > diff.decisionInterval) {
    g._aiTimer = 0;
    const roll = Math.random();
    if (roll < 0.4) g._mode = 'predictive';
    else if (roll < 0.7) g._mode = 'aggressive';
    else g._mode = 'random';
    
    if (g._mode === 'random') {
      g._wanderTarget = { 
        x: 40 + Math.random() * (baseW - 80), 
        y: 40 + Math.random() * (baseH - 80) 
      };
    }
  }
  
  let targetX = player.x;
  let targetY = player.y;
  
  // Behavior based on mode
  if (g._mode === 'predictive') {
    // Predict future player position
    const predTime = diff.predictionMs / 1000;
    targetX = player.x + player.vx * predTime + (Math.random() - 0.5) * 30;
    targetY = player.y + player.vy * predTime + (Math.random() - 0.5) * 30;
  } else if (g._mode === 'aggressive') {
    // Direct chase with possible dash
    targetX = player.x;
    targetY = player.y;
    
    if (g._dashCooldown) {
      g._dashCooldown -= dt * 1000;
      if (g._dashCooldown < 0) g._dashCooldown = 0;
    }
  } else if (g._mode === 'random') {
    targetX = g._wanderTarget.x;
    targetY = g._wanderTarget.y;
  }
  
  // Move towards target
  const dx = targetX - g._aiPos.x;
  const dy = targetY - g._aiPos.y;
  const distance = Math.sqrt(dx*dx + dy*dy);
  
  if (distance > 5) {
    let speed = 120 * (1 + diff.aggro) * diff.speedMult;
    
    // Dash burst for aggressive mode
    if (g._mode === 'aggressive' && g._dashCooldown === 0 && distance < 200) {
      speed *= 2.5;
      g._dashCooldown = 3000;
    }
    
    g._aiPos.x += (dx / distance) * speed * dt * gameTimeScale;
    g._aiPos.y += (dy / distance) * speed * dt * gameTimeScale;
  }
  
  // Keep in bounds
  g._aiPos.x = Math.max(20, Math.min(baseW - 20, g._aiPos.x));
  g._aiPos.y = Math.max(20, Math.min(baseH - 20, g._aiPos.y));
  
  return g._aiPos;
}

// ---------------------------
// Visual hit feedback & blood-red ripples
// ---------------------------
const ripples = [];
function createBloodRipple(x, y){ ripples.push({ x, y, r: 0, maxR: 80 + Math.random()*40, life: 0, ttl: 0.8 }); }
function updateRipples(dt){ for(let i=ripples.length-1;i>=0;i--){ const r = ripples[i]; r.life += dt; r.r = (r.life / r.ttl) * r.maxR; if(r.life > r.ttl) ripples.splice(i,1); } }
function renderRipples(){ for(const r of ripples){ const alpha = (1 - r.life/r.ttl) * 0.6; pctx.strokeStyle = `rgba(255,60,60,${alpha})`; pctx.lineWidth = 3; pctx.beginPath(); pctx.arc(r.x, r.y, r.r, 0, Math.PI*2); pctx.stroke(); pctx.strokeStyle = `rgba(255,100,100,${alpha*0.5})`; pctx.lineWidth = 1.5; pctx.beginPath(); pctx.arc(r.x, r.y, r.r + 5, 0, Math.PI*2); pctx.stroke(); } }
function flashGhostHit(){ const glow = document.querySelector('.game-glow'); glow.style.boxShadow = '0 0 50px 20px rgba(255,60,60,0.45)'; setTimeout(()=> glow.style.boxShadow = '', 200); }
function shakeCanvas(){ const wrapEl = document.getElementById('canvasWrap'); wrapEl.animate([ { transform: 'translate(0,0)' }, { transform: 'translate(5px,-4px)' }, { transform: 'translate(-4px,3px)' }, { transform: 'translate(0,0)' } ], { duration: 200, easing: 'ease-out' }); }

// ---------------------------
// CRT overlay
// ---------------------------
let crtTime = 0;
function renderCRT(){ crtCtx.clearRect(0,0,baseW,baseH); crtCtx.save(); crtCtx.globalAlpha = 0.06; for(let y=0;y<baseH;y+=2){ crtCtx.fillStyle='rgba(0,0,0,0.02)'; crtCtx.fillRect(0,y,baseW,1); } crtCtx.restore(); crtTime += 0.016; const wobble = Math.sin(crtTime*1.6)*1.2; crtCtx.save(); crtCtx.globalAlpha = 0.05; try { crtCtx.drawImage(canvas, wobble, Math.sin(crtTime*2.2)*0.6, baseW, baseH); } catch(e){} crtCtx.restore(); }

// ---------------------------
// Main loop
// ---------------------------
let last = performance.now();
function loop(){
  const now = performance.now();
  const dt = (now - last)/1000;
  last = now;

  // Skip game logic updates if game over triggered, but continue rendering
  const skipGameLogic = window.__gameOverTriggered && gamePaused;

  // Apply time scaling
  const dtScaled = dt * gameTimeScale;

  // update bats, particles, ripples, ghost silhouettes (always update for visual continuity)
  updateBats(dtScaled);
  updateParticles(dt);
  updateRipples(dt);
  updateGhostSilhouettes(dt);
  
  // Only update game logic if not paused
  if (!skipGameLogic) {
    // Update active effects and combo
    updateActiveEffects(dt);
    updateCombo(dt);
    updateFloatingTexts(dt);
    
    // Update dash
    if (player.isDashing) {
      player.dashTimerMs -= dt * 1000;
      if (player.dashTimerMs <= 0) {
        player.isDashing = false;
      }
    }
    if (!player.dashReady) {
      player.dashCooldownTimerMs -= dt * 1000;
      if (player.dashCooldownTimerMs <= 0) {
        player.dashReady = true;
      }
    }
    
    // input & movement
    let mvx=0,mvy=0; 
    if(keys['w']||keys['arrowup']) mvy -= 1; 
    if(keys['s']||keys['arrowdown']) mvy += 1; 
    if(keys['a']||keys['arrowleft']) mvx -= 1; 
    if(keys['d']||keys['arrowright']) mvx += 1;
    
    const mag = Math.sqrt(mvx*mvx + mvy*mvy) || 1;
    
    // Calculate speed with multipliers
    let currentSpeed = player.spd * player.speedMultiplier;
    if (player.isDashing) {
      currentSpeed *= gameConfig.DASH.dashSpeedMult;
    }
    
    // Update velocity for prediction
    player.vx = (mvx/mag) * currentSpeed;
    player.vy = (mvy/mag) * currentSpeed;
    
    player.x += player.vx * dtScaled;
    player.y += player.vy * dtScaled;
    player.x = Math.max(player.r, Math.min(baseW - player.r, player.x));
    player.y = Math.max(player.r, Math.min(baseH - player.r, player.y));
  } else {
    // Game is paused, keep floating texts updating for visual feedback
    updateFloatingTexts(dt);
  }

  // Only process collisions and AI if not paused
  if (!skipGameLogic) {
    // collisions with orbs (pickup)
    for(let i=orbs.length-1;i>=0;i--){ 
      const orb = orbs[i];
      if(dist(player, orb) < player.r + orb.r){ 
        orbs.splice(i,1); 
        
        // Play echo collection chime
        AudioSystem.playEchoChime();
        
        // Apply orb effect
        applyOrbEffect(orb.type);
        
        // Register combo
        registerComboAction();
        
        // Calculate score with multiplier
        const baseScore = 100;
        const multiplier = getComboMultiplier();
        const earnedScore = baseScore * multiplier;
        score += earnedScore;
        document.getElementById('score').textContent = score;
        
        // Check for game completion
        if (typeof checkGameCompletion === 'function') {
          checkGameCompletion();
        }
        if (typeof checkScoreCompletion === 'function') {
          checkScoreCompletion();
        }
        
        // Show floating text with multiplier
        if (multiplier > 1) {
          showFloatingText(player.x, player.y, `+${earnedScore} x${multiplier}`, orb.color);
        } else {
          showFloatingText(player.x, player.y, `+${earnedScore}`, orb.color);
        }
        
        emitParticle(player.x, player.y, 8, orb.type === 'normal' ? 'green' : 'special'); 
      } 
    }

    // Update ghost AI positions if difficulty is on
    if(running && ghosts.length > 0 && difficultyOn){ 
      for(const g of ghosts){ 
        updateGhostAI(g, dtScaled);
      }
    }

    // --- ghost collisions with difficulty-specific behaviors
    if(running && ghosts.length > 0){ 
    const tNow = performance.now() - recStart; 
    for(let i = ghosts.length - 1; i >= 0; i--){ 
      const g = ghosts[i];
      // Use AI position if difficulty is on, otherwise use replay with modifiers
      const pos = difficultyOn ? g._aiPos : ghostPosAt(g, tNow, dt);
      const ghostR = 12; 
      const hitDist = player.r + ghostR; 
      if(!g._hitCooldown) g._hitCooldown = 0; 
      
      // Check if player is invulnerable (dashing with invuln or has shield)
      const isInvulnerable = (player.isDashing && gameConfig.DASH.invulnerable) || player.shield;
      
      if(dist(player, pos) < hitDist && g._hitCooldown <= 0){ 
        if (player.shield) {
          // Shield blocks hit
          player.shield = false;
          activeEffects.shield.active = false;
          showFloatingText(player.x, player.y, 'SHIELD BLOCKED!', '#ffd700');
          emitParticle(player.x, player.y, 16, 'special');
          g._hitCooldown = 650;
        } else if (!isInvulnerable) {
          // Take damage
          lives--; 
          
          // Clamp lives to prevent negative values
          lives = Math.max(0, lives);
          document.getElementById('lives').textContent = lives; 
          
          emitParticle(player.x, player.y, 24, 'red'); 
          createBloodRipple(player.x, player.y); 
          flashGhostHit(); 
          shakeCanvas(); 
          playCollisionSfx(); 
          
          // PREMIUM: Hit feedback effects
          shakePower = 6;
          screenFlash = 6;
          impactRings.push({
            x: player.x,
            y: player.y,
            r: 10,
            alpha: 0.7
          });
          
          // Reset combo on hit
          comboCount = 0;
          comboTimerMs = 0;
          
          // Trigger ending screen when lives reach zero
          if (lives <= 0 && !window.__gameOverTriggered) {
            window.__gameOverTriggered = true;
            gamePaused = true;
            
            // Stop player movement
            player.vx = 0;
            player.vy = 0;
            
            // Show ending screen overlay
            const endingScreen = document.getElementById("endingScreen");
            if (endingScreen) {
              setTimeout(() => {
                endingScreen.classList.add("active");
              }, 800); // Brief delay for visual feedback
            }
            
            // Skip ghost behavior processing
            continue;
          }
          
          // Difficulty-specific ghost behavior after hit
          const diff = currentDifficulty;
          
          // NORMAL MODE: Ghost dies
          if (diff.mode === 'normal') {
            ghosts.splice(i, 1);
            showFloatingText(pos.x, pos.y, 'ELIMINATED', '#39ff14');
            continue;
          }
          
          // HARD MODE: 50% chance to survive
          if (diff.mode === 'hard') {
            if (Math.random() < diff.ghostSurviveChance) {
              g._hitCooldown = 400; // Shorter cooldown
              showFloatingText(pos.x, pos.y, 'SURVIVED!', '#ff9500');
            } else {
              ghosts.splice(i, 1);
              showFloatingText(pos.x, pos.y, 'ELIMINATED', '#39ff14');
              continue;
            }
          }
          
          // GOD MODE: Ghost always survives, possible duplication
          if (diff.mode === 'god') {
            g._hitCooldown = 300; // Very short cooldown
            showFloatingText(pos.x, pos.y, 'IMMORTAL', '#ff003c');
            
            // Chance to duplicate
            if (Math.random() < (diff.duplicateChance || 0) && ghosts.length < getMaxGhosts()) {
              const duplicate = {
                id: ghosts.length,
                record: g.record,
                color: g.color,
                _hitCooldown: 500,
                _driftX: 0,
                _driftY: 0
              };
              ghosts.push(duplicate);
              showFloatingText(pos.x, pos.y + 20, 'DUPLICATED!', '#ff6b9d');
            }
          } 
        }
      } else if(g._hitCooldown > 0) { 
        g._hitCooldown -= dt * 1000; 
      } 
    } 
    }
  } // End of skipGameLogic check

  // render main scene
  ctx.clearRect(0,0,baseW,baseH);
  ctx.fillStyle = 'rgba(0,0,0,0.08)'; ctx.fillRect(0,0,baseW,baseH);
  
  // PREMIUM: Screenshake effect
  ctx.save();
  if (shakePower > 0) {
    const dx = (Math.random() - 0.5) * shakePower;
    const dy = (Math.random() - 0.5) * shakePower;
    ctx.translate(dx, dy);
    shakePower *= 0.9;
  }
  
  // render ghost silhouettes behind everything
  renderGhostSilhouettes();

  // orbs with type-based colors (HYBRID PREMIUM)
  const nowt = performance.now();
  const time = nowt / 1000;
  
  for(const o of orbs){ 
    const age = Math.max(0, (nowt - (o.spawnAt || nowt))/800); 
    const spawnPulse = 1 - Math.min(1, age); 
    const outlineAlpha = 0.5 * spawnPulse; 
    const outlineR = o.r + 4 * (1 + Math.sin((nowt/300) + (o.x%50))*0.5) * spawnPulse; 
    
    // PREMIUM: Soft breathing glow
    const breathPulse = 0.12 * Math.sin(time * 6 + (o.x + o.y));
    
    // Parse color for gradient
    const color = o.color || '#39ff14';
    const g = ctx.createRadialGradient(o.x,o.y,0,o.x,o.y,o.r*2); 
    g.addColorStop(0, color + 'fa'); 
    g.addColorStop(0.6, color + '73'); 
    g.addColorStop(1, color + '0f'); 
    
    // Add soft glow
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = 14;
    
    ctx.beginPath(); 
    ctx.fillStyle = g; 
    ctx.globalAlpha = 0.55 + breathPulse;
    ctx.arc(o.x,o.y,o.r,0,Math.PI*2); 
    ctx.fill(); 
    
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    ctx.beginPath(); 
    ctx.strokeStyle = color + Math.floor(outlineAlpha * 255).toString(16).padStart(2, '0'); 
    ctx.lineWidth = 2; 
    ctx.arc(o.x,o.y,outlineR,0,Math.PI*2); 
    ctx.stroke(); 
    
    ctx.restore();
  }

  // ghosts rendering with difficulty-specific visuals (HYBRID PREMIUM)
  if(ghosts.length > 0 && running){ 
    const tNow = performance.now() - recStart;
    const time = performance.now() / 1000;
    
    for(const g of ghosts){ 
      // Use AI position if difficulty is on, otherwise use replay with modifiers
      let p;
      if (difficultyOn) {
        // Ensure AI position is initialized and up-to-date
        if (!g._aiPos) {
          g._aiPos = { x: baseW/2, y: baseH/2 };
        }
        p = g._aiPos;
      } else {
        p = ghostPosAt(g, tNow, dt);
      }
      
      // Different colors and opacity based on difficulty
      let ghostColor, glowColor, shadowColor;
      const baseOpacity = currentDifficulty.ghostOpacity || 0.34;
      
      if (difficultyLevel === 0) {
        // NORMAL - Green replays
        ghostColor = g.color || `rgba(57,255,20,${baseOpacity})`;
        glowColor = 'rgba(57,255,20,0.06)';
        shadowColor = 'rgba(57,255,20,0.35)';
      } else if (difficultyLevel === 1) {
        // HARD - Orange with higher opacity
        ghostColor = `rgba(255,140,60,${baseOpacity})`;
        glowColor = 'rgba(255,140,60,0.12)';
        shadowColor = 'rgba(255,140,60,0.35)';
      } else {
        // GOD - Red with highest opacity
        ghostColor = `rgba(255,20,60,${baseOpacity})`;
        glowColor = 'rgba(255,20,60,0.18)';
        shadowColor = 'rgba(255,20,60,0.35)';
      }
      
      // PREMIUM: Soft neon aura with subtle pulse
      ctx.save();
      const pulse = 0.05 * Math.sin(time * 3 + g.id);
      
      // Outer glow
      ctx.shadowColor = shadowColor;
      ctx.shadowBlur = 18;
      
      // PREMIUM: Hit flash effect
      if (g.flash && g.flash > 0) {
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 12, 0, Math.PI*2);
        ctx.fill();
        g.flash--;
      } else {
        // Main body with pulse
        ctx.beginPath(); 
        ctx.fillStyle = ghostColor; 
        ctx.arc(p.x,p.y,12,0,Math.PI*2); 
        ctx.fill(); 
      }
      
      // Inner glow layer
      ctx.shadowBlur = 0;
      ctx.beginPath(); 
      ctx.fillStyle = glowColor; 
      ctx.arc(p.x,p.y,22,0,Math.PI*2); 
      ctx.fill(); 
      
      // Extra glow for GOD mode
      if (difficultyLevel === 2) {
        ctx.beginPath();
        ctx.fillStyle = 'rgba(255,20,60,0.08)';
        ctx.arc(p.x,p.y,32,0,Math.PI*2);
        ctx.fill();
      }
      
      ctx.restore();
    } 
  }

  // player with effects
  ctx.save();
  
  // Shield visual
  if (player.shield) {
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.6 + Math.sin(nowt / 100) * 0.2;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.r + 6, 0, Math.PI*2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  
  // Dash trail
  if (player.isDashing) {
    ctx.globalAlpha = 0.5;
    for (let i = 1; i <= 3; i++) {
      ctx.beginPath();
      ctx.fillStyle = player.color;
      ctx.arc(player.x - player.vx * 0.01 * i, player.y - player.vy * 0.01 * i, player.r * (1 - i * 0.2), 0, Math.PI*2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  
  ctx.beginPath(); 
  ctx.fillStyle = player.color; 
  ctx.arc(player.x,player.y,player.r,0,Math.PI*2); 
  ctx.fill(); 
  ctx.beginPath(); 
  ctx.fillStyle='rgba(0,0,0,0.12)'; 
  ctx.arc(player.x+5,player.y-5,3,0,Math.PI*2); 
  ctx.fill();
  ctx.restore();
  
  // PREMIUM: Impact rings
  impactRings = impactRings.filter(r => r.alpha > 0);
  impactRings.forEach(r => {
    ctx.beginPath();
    ctx.strokeStyle = `rgba(57,255,20,${r.alpha})`;
    ctx.lineWidth = 4;
    ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
    ctx.stroke();
    r.r += 3;
    r.alpha -= 0.03;
  });
  
  // Restore screenshake transform
  ctx.restore();
  
  // PREMIUM: Screen flash overlay
  if (screenFlash > 0) {
    ctx.fillStyle = 'rgba(57,255,20,0.18)';
    ctx.fillRect(0, 0, baseW, baseH);
    screenFlash--;
  }
  
  // Floating texts
  renderFloatingTexts();

  // update & draw particles, ripples, bats, crt
  renderParticles(); renderRipples(); renderBats(); renderCRT();

  // maybe lightning
  maybeLightning(now);

  // audio intensity by ghost count
  setIntensity(Math.min(1, ghosts.length / getMaxGhosts()));
  
  // Update HUD
  updateHUD();

  requestAnimationFrame(loop);
}
last = performance.now(); loop();

// ---------------------------
// UI wiring
// ---------------------------
document.getElementById('startBtn').addEventListener('click', ()=>{ 
  AudioSystem.playUIClick();
  AudioSystem.playTransitionWhoosh();
  initAudio(); 
  startRun(); 
});

document.getElementById('endBtn').addEventListener('click', ()=>{ 
  AudioSystem.playUIClick();
  endRun(); 
});

document.getElementById('clearBtn').addEventListener('click', ()=>{ 
  AudioSystem.playUIClick();
  clearGhosts(); 
});

document.getElementById('quickStart').addEventListener('click', ()=>{ 
  AudioSystem.playUIClick();
  AudioSystem.playTransitionWhoosh();
  initAudio(); 
  startRun(); 
  document.getElementById('gameWrap').scrollIntoView({behavior:'smooth', block:'center'}); 
});

// Difficulty selector
const diffOptions = document.querySelectorAll('.diff-option');
diffOptions.forEach(opt => {
  opt.addEventListener('click', () => {
    AudioSystem.playUIClick();
    const level = parseInt(opt.dataset.level);
    setDifficultyLevel(level);
  });
});

// Load difficulty setting
loadDifficulty();

// ---------------------------
// Debug Keys
// ---------------------------
window.addEventListener('keydown', e=>{
  if(e.key === 'p'){
    const fake = [];
    for(let i=0;i<260;i++){ fake.push({ t: i*90, x: 100 + Math.sin(i/8)*220 + Math.random()*10, y: 100 + Math.cos(i/6)*140 + Math.random()*10 }); }
    saveGhost(fake);
  }
  if(e.key === 'r') spawnOrbs(7);
  
  // New debug keys
  if(e.key === '1') applyOrbEffect('speed');
  if(e.key === '2') applyOrbEffect('shield');
  if(e.key === '3') applyOrbEffect('slow');
  if(e.key === '4') applyOrbEffect('health');
  if(e.key === 'd' || e.key === 'D') {
    // Cycle through difficulty levels
    const nextLevel = (difficultyLevel + 1) % 3;
    setDifficultyLevel(nextLevel);
  }
  // TODO: if(e.key === 'b' || e.key === 'B') spawnBoss();
});

// ---------------------------
// HUD Updates
// ---------------------------
function updateHUD() {
  // Combo display
  const comboDisplay = document.getElementById('comboDisplay');
  if (comboDisplay) {
    if (comboCount > 0) {
      const mult = getComboMultiplier();
      comboDisplay.textContent = `Combo: ${comboCount} (x${mult})`;
    } else {
      comboDisplay.textContent = '';
    }
  }
  
  // Active effects icons
  const hudEffects = document.getElementById('hudEffects');
  if (hudEffects) {
    hudEffects.innerHTML = '';
    
    if (activeEffects.speed.active) {
      const icon = document.createElement('div');
      icon.className = 'hud-icon';
      icon.innerHTML = '⚡';
      icon.title = 'Speed Boost';
      hudEffects.appendChild(icon);
    }
    
    if (activeEffects.shield.active) {
      const icon = document.createElement('div');
      icon.className = 'hud-icon';
      icon.innerHTML = '🛡';
      icon.title = 'Shield Active';
      hudEffects.appendChild(icon);
    }
    
    if (activeEffects.slow.active) {
      const icon = document.createElement('div');
      icon.className = 'hud-icon';
      icon.innerHTML = '🕐';
      icon.title = 'Slow Time';
      hudEffects.appendChild(icon);
    }
    
    if (!player.dashReady) {
      const icon = document.createElement('div');
      icon.className = 'hud-icon';
      icon.innerHTML = '💨';
      icon.title = 'Dash Cooldown';
      icon.style.opacity = '0.5';
      hudEffects.appendChild(icon);
    }
  }
}

// expose debug helpers
window._eou = { spawnOrbs, orbs, player, ghosts, applyOrbEffect, setDifficultyLevel };

// ensure background image loads in preview/local
const bgImg = new Image(); bgImg.src = 'assets/Halloween_background.jpg'; bgImg.onload = ()=>{ bgBack.style.backgroundImage = `url('assets/Halloween_background.jpg')`; bgMid.style.backgroundImage = `url('assets/Halloween_background.jpg')`; bgFront.style.backgroundImage = `url('assets/Halloween_background.jpg')`; };

// initial spawn of bats and ghost silhouettes
for(let i=0;i<3;i++) spawnBat();
for(let i=0;i<2;i++) spawnGhostSilhouette();


// ---------------------------
// How to Play Popup
// ---------------------------
function initPopup() {
  const howToPlayPopup = document.getElementById('howToPlayPopup');
  const howToPlayBtn = document.getElementById('howToPlayBtn');
  const closePopupBtn = document.getElementById('closePopupBtn');

  if (!howToPlayPopup || !howToPlayBtn || !closePopupBtn) {
    console.warn('Popup elements not found');
    return;
  }

  const popupBox = howToPlayPopup.querySelector('.popup-box');
  let isAnimating = false;

  function showPopup() {
    if (isAnimating) return;
    isAnimating = true;
    
    howToPlayPopup.classList.remove('closing');
    howToPlayPopup.classList.add('active');
    
    if (popupBox) {
      popupBox.classList.remove('closing');
    }
    
    setTimeout(() => {
      isAnimating = false;
    }, 400);
  }

  function hidePopup() {
    if (isAnimating) return;
    isAnimating = true;
    
    howToPlayPopup.classList.add('closing');
    if (popupBox) {
      popupBox.classList.add('closing');
    }
    
    setTimeout(() => {
      howToPlayPopup.classList.remove('active', 'closing');
      if (popupBox) {
        popupBox.classList.remove('closing');
      }
      isAnimating = false;
    }, 300);
  }

  // Auto-show popup on first load
  setTimeout(showPopup, 500);

  // Button handlers
  howToPlayBtn.addEventListener('click', () => {
    AudioSystem.playUIClick();
    showPopup();
  });
  
  closePopupBtn.addEventListener('click', () => {
    AudioSystem.playUIClick();
    hidePopup();
  });

  // Close on overlay click (but not on popup box)
  howToPlayPopup.addEventListener('click', (e) => {
    if (e.target === howToPlayPopup) {
      hidePopup();
    }
  });
  
  // Prevent popup box clicks from closing
  if (popupBox) {
    popupBox.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  }

  // Close on Escape key
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && howToPlayPopup.classList.contains('active')) {
      hidePopup();
    }
  });
}

// Initialize popup - script has defer so DOM is ready
initPopup();

// Game Over Popup Handler
const gameOverPopup = document.getElementById('gameOverPopup');
const gameOverCloseBtn = document.getElementById('gameOverCloseBtn');

if (gameOverCloseBtn) {
  gameOverCloseBtn.addEventListener('click', () => {
    AudioSystem.playUIClick();
    gameOverPopup.classList.remove('active');
  });
}

// Close game over popup on overlay click
if (gameOverPopup) {
  gameOverPopup.addEventListener('click', (e) => {
    if (e.target === gameOverPopup) {
      gameOverPopup.classList.remove('active');
    }
  });
  
  // Prevent popup box clicks from closing
  const gameOverBox = gameOverPopup.querySelector('.popup-box');
  if (gameOverBox) {
    gameOverBox.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  }
}


// ---------------------------
// Title Screen Animated CRT Background
// ---------------------------
(function initTitleBackground() {
  const titleCanvas = document.getElementById('titleBgCanvas');
  if (!titleCanvas) return;
  
  const ctx = titleCanvas.getContext('2d');
  let animFrame = null;
  let time = 0;
  
  // Resize canvas to full window
  function resizeTitleCanvas() {
    const dpr = window.devicePixelRatio || 1;
    titleCanvas.width = window.innerWidth * dpr;
    titleCanvas.height = window.innerHeight * dpr;
    titleCanvas.style.width = window.innerWidth + 'px';
    titleCanvas.style.height = window.innerHeight + 'px';
    ctx.scale(dpr, dpr);
  }
  
  resizeTitleCanvas();
  window.addEventListener('resize', resizeTitleCanvas);
  
  // Animation loop
  function animate() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    
    time += 0.016;
    
    // Clear with dark base
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, w, h);
    
    // Subtle green glow gradient (shifts slowly)
    const glowY = h * 0.3 + Math.sin(time * 0.3) * h * 0.1;
    const gradient = ctx.createRadialGradient(w/2, glowY, 0, w/2, glowY, h * 0.8);
    gradient.addColorStop(0, 'rgba(57, 255, 20, 0.03)');
    gradient.addColorStop(0.5, 'rgba(57, 255, 20, 0.015)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
    
    // Horizontal scanlines (slow moving)
    ctx.globalAlpha = 0.08;
    const scanlineSpeed = time * 15;
    const scanlineSpacing = 4;
    
    for (let y = 0; y < h; y += scanlineSpacing) {
      const offset = (scanlineSpeed + y) % (scanlineSpacing * 2);
      if (offset < scanlineSpacing) {
        ctx.fillStyle = 'rgba(57, 255, 20, 0.15)';
        ctx.fillRect(0, y, w, 1);
      }
    }
    
    // Subtle vertical shimmer bars (very slow)
    ctx.globalAlpha = 0.04;
    const shimmerX = (time * 8) % w;
    const shimmerGradient = ctx.createLinearGradient(shimmerX - 100, 0, shimmerX + 100, 0);
    shimmerGradient.addColorStop(0, 'rgba(57, 255, 20, 0)');
    shimmerGradient.addColorStop(0.5, 'rgba(57, 255, 20, 0.2)');
    shimmerGradient.addColorStop(1, 'rgba(57, 255, 20, 0)');
    ctx.fillStyle = shimmerGradient;
    ctx.fillRect(shimmerX - 100, 0, 200, h);
    
    // Very subtle flicker
    ctx.globalAlpha = 0.02 + Math.sin(time * 4.7) * 0.01 + Math.sin(time * 2.3) * 0.008;
    ctx.fillStyle = 'rgba(57, 255, 20, 0.5)';
    ctx.fillRect(0, 0, w, h);
    
    // Reset alpha
    ctx.globalAlpha = 1.0;
    
    animFrame = requestAnimationFrame(animate);
  }
  
  // Start animation
  animate();
  
  // Optional: Stop animation when game starts (performance optimization)
  const startBtn = document.getElementById('startBtn');
  const quickStartBtn = document.getElementById('quickStart');
  
  function fadeOutBackground() {
    titleCanvas.style.transition = 'opacity 0.8s ease';
    titleCanvas.style.opacity = '0.2';
  }
  
  function fadeInBackground() {
    titleCanvas.style.transition = 'opacity 0.8s ease';
    titleCanvas.style.opacity = '0.7';
  }
  
  if (startBtn) {
    startBtn.addEventListener('click', fadeOutBackground);
  }
  if (quickStartBtn) {
    quickStartBtn.addEventListener('click', fadeOutBackground);
  }
  
  const endBtn = document.getElementById('endBtn');
  if (endBtn) {
    endBtn.addEventListener('click', fadeInBackground);
  }
})();


// ============================================
// AUDIO SYSTEM - Sound Design
// ============================================
const AudioSystem = (function() {
  let audioContext = null;
  let masterGain = null;
  let ambientOscillator = null;
  let ambientGain = null;
  let isAudioInitialized = false;

  // Initialize audio context
  function init() {
    if (isAudioInitialized) return;
    
    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = audioContext.createGain();
      masterGain.gain.value = 1.0;
      masterGain.connect(audioContext.destination);
      isAudioInitialized = true;
      console.log('Audio system initialized');
    } catch (e) {
      console.warn('Audio context failed to initialize:', e);
    }
  }

  // Start ambient background loop
  function startAmbient() {
    if (!audioContext || ambientOscillator) return;
    
    try {
      // Create ambient drone with multiple layers
      ambientGain = audioContext.createGain();
      ambientGain.gain.value = 0;
      ambientGain.connect(masterGain);

      // Low frequency drone
      const osc1 = audioContext.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.value = 55; // Low A
      
      const osc2 = audioContext.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.value = 82.5; // E
      
      const osc3 = audioContext.createOscillator();
      osc3.type = 'triangle';
      osc3.frequency.value = 110; // A
      
      // LFO for subtle modulation
      const lfo = audioContext.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 0.2;
      
      const lfoGain = audioContext.createGain();
      lfoGain.gain.value = 2;
      lfo.connect(lfoGain);
      lfoGain.connect(osc3.frequency);

      // Mix oscillators
      const osc1Gain = audioContext.createGain();
      osc1Gain.gain.value = 0.3;
      const osc2Gain = audioContext.createGain();
      osc2Gain.gain.value = 0.2;
      const osc3Gain = audioContext.createGain();
      osc3Gain.gain.value = 0.15;

      osc1.connect(osc1Gain).connect(ambientGain);
      osc2.connect(osc2Gain).connect(ambientGain);
      osc3.connect(osc3Gain).connect(ambientGain);

      // Start all
      osc1.start();
      osc2.start();
      osc3.start();
      lfo.start();

      // Fade in over 1 second
      const now = audioContext.currentTime;
      ambientGain.gain.setValueAtTime(0, now);
      ambientGain.gain.linearRampToValueAtTime(0.15, now + 1.0);

      ambientOscillator = { osc1, osc2, osc3, lfo };
      
      console.log('Ambient audio started');
    } catch (e) {
      console.warn('Failed to start ambient audio:', e);
    }
  }

  // Stop ambient
  function stopAmbient() {
    if (!ambientOscillator) return;
    
    try {
      const now = audioContext.currentTime;
      ambientGain.gain.linearRampToValueAtTime(0, now + 0.5);
      
      setTimeout(() => {
        if (ambientOscillator) {
          ambientOscillator.osc1.stop();
          ambientOscillator.osc2.stop();
          ambientOscillator.osc3.stop();
          ambientOscillator.lfo.stop();
          ambientOscillator = null;
        }
      }, 600);
    } catch (e) {
      console.warn('Failed to stop ambient:', e);
    }
  }

  // Echo collection chime (magical, memory-like)
  function playEchoChime() {
    if (!audioContext) return;
    
    try {
      const now = audioContext.currentTime;
      
      // Create bell-like tone with harmonics
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now); // A5
      osc.frequency.exponentialRampToValueAtTime(1760, now + 0.1); // A6
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.2);
      
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      
      // Add reverb-like effect with delay
      const delay = audioContext.createDelay();
      delay.delayTime.value = 0.05;
      const delayGain = audioContext.createGain();
      delayGain.gain.value = 0.3;
      
      osc.connect(gain);
      gain.connect(masterGain);
      gain.connect(delay);
      delay.connect(delayGain);
      delayGain.connect(masterGain);
      
      osc.start(now);
      osc.stop(now + 0.5);
    } catch (e) {
      console.warn('Failed to play echo chime:', e);
    }
  }

  // UI click sound (CRT-style)
  function playUIClick() {
    if (!audioContext) return;
    
    try {
      const now = audioContext.currentTime;
      
      // Short click with noise burst
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      
      osc.type = 'square';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.05);
      
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
      
      osc.connect(gain);
      gain.connect(masterGain);
      
      osc.start(now);
      osc.stop(now + 0.1);
    } catch (e) {
      console.warn('Failed to play UI click:', e);
    }
  }

  // Transition whoosh
  function playTransitionWhoosh() {
    if (!audioContext) return;
    
    try {
      const now = audioContext.currentTime;
      
      // Sweeping noise with filter
      const bufferSize = audioContext.sampleRate * 0.5;
      const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
      const data = buffer.getChannelData(0);
      
      // Generate white noise
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      
      const noise = audioContext.createBufferSource();
      noise.buffer = buffer;
      
      // Filter for whoosh effect
      const filter = audioContext.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(200, now);
      filter.frequency.exponentialRampToValueAtTime(2000, now + 0.4);
      filter.Q.value = 5;
      
      const gain = audioContext.createGain();
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.25, now + 0.1);
      gain.gain.linearRampToValueAtTime(0, now + 0.5);
      
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);
      
      noise.start(now);
      noise.stop(now + 0.5);
    } catch (e) {
      console.warn('Failed to play transition whoosh:', e);
    }
  }

  // Public API
  return {
    init,
    startAmbient,
    stopAmbient,
    playEchoChime,
    playUIClick,
    playTransitionWhoosh
  };
})();

// Auto-initialize audio on first user interaction
let audioAutoInitialized = false;
function autoInitAudio() {
  if (!audioAutoInitialized) {
    AudioSystem.init();
    AudioSystem.startAmbient();
    audioAutoInitialized = true;
  }
}

// Add listeners for first interaction
document.addEventListener('click', autoInitAudio, { once: true });
document.addEventListener('keydown', autoInitAudio, { once: true });


// ============================================
// CINEMATIC INTRO SCREEN
// ============================================
(function initIntroScreen() {
  const introScreen = document.getElementById('introScreen');
  if (!introScreen) return;

  // Check if intro has been shown this session
  const introShown = sessionStorage.getItem('introShown');
  
  if (introShown === 'true') {
    // Skip intro if already shown
    introScreen.classList.add('hidden');
    return;
  }

  // Hide main content initially
  const pageRoot = document.getElementById('pageRoot');
  if (pageRoot) {
    pageRoot.style.opacity = '0';
    pageRoot.style.pointerEvents = 'none';
  }

  // Total intro duration: 4.5 seconds (last line at 3.0s + 0.8s fade + 0.7s hold)
  const introDuration = 4500;

  // Start fade out sequence
  setTimeout(() => {
    introScreen.classList.add('fade-out');
    
    // Show main content as intro fades
    if (pageRoot) {
      pageRoot.style.transition = 'opacity 1.2s ease-in';
      pageRoot.style.opacity = '1';
      pageRoot.style.pointerEvents = 'all';
    }
    
    // Remove intro from DOM after fade completes
    setTimeout(() => {
      introScreen.classList.add('hidden');
      sessionStorage.setItem('introShown', 'true');
    }, 1200);
  }, introDuration);

  // Optional: Allow skip on click/keypress
  let skipEnabled = false;
  
  // Enable skip after 2 seconds (prevent accidental skips)
  setTimeout(() => {
    skipEnabled = true;
  }, 2000);

  function skipIntro() {
    if (!skipEnabled) return;
    
    introScreen.classList.add('fade-out');
    
    if (pageRoot) {
      pageRoot.style.transition = 'opacity 0.6s ease-in';
      pageRoot.style.opacity = '1';
      pageRoot.style.pointerEvents = 'all';
    }
    
    setTimeout(() => {
      introScreen.classList.add('hidden');
      sessionStorage.setItem('introShown', 'true');
    }, 600);
    
    // Remove listeners
    introScreen.removeEventListener('click', skipIntro);
    document.removeEventListener('keydown', skipIntroKey);
  }

  function skipIntroKey(e) {
    if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      skipIntro();
    }
  }

  // Add skip listeners
  introScreen.addEventListener('click', skipIntro);
  document.addEventListener('keydown', skipIntroKey);
})();


// ============================================
// ENDING SCREEN SYSTEM
// ============================================
const EndingScreen = (function() {
  const endingScreen = document.getElementById('endingScreen');
  const endingReturnBtn = document.getElementById('endingReturnBtn');
  let isEndingActive = false;

  // Show ending screen
  function show() {
    if (!endingScreen || isEndingActive) return;
    
    isEndingActive = true;
    
    // Play UI sound
    if (typeof AudioSystem !== 'undefined') {
      AudioSystem.playTransitionWhoosh();
    }
    
    // Stop game loop if running
    if (running) {
      endRun(false); // End run without showing game over
    }
    
    // Fade out game content
    const pageRoot = document.getElementById('pageRoot');
    if (pageRoot) {
      pageRoot.style.transition = 'opacity 1s ease-out';
      pageRoot.style.opacity = '0.3';
      pageRoot.style.pointerEvents = 'none';
    }
    
    // Show ending screen after brief delay
    setTimeout(() => {
      endingScreen.classList.add('active');
    }, 500);
    
    console.log('Ending screen displayed');
  }

  // Hide ending screen and return to title
  function hide() {
    if (!endingScreen) return;
    
    // Play UI sound
    if (typeof AudioSystem !== 'undefined') {
      AudioSystem.playUIClick();
    }
    
    // Fade out ending screen
    endingScreen.classList.remove('active');
    
    setTimeout(() => {
      endingScreen.classList.add('hidden');
      isEndingActive = false;
      
      // Reset game state
      resetToTitle();
    }, 1500);
  }

  // Reset game to title screen
  function resetToTitle() {
    // Fade in title screen
    const pageRoot = document.getElementById('pageRoot');
    if (pageRoot) {
      pageRoot.style.transition = 'opacity 1s ease-in';
      pageRoot.style.opacity = '1';
      pageRoot.style.pointerEvents = 'all';
    }
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Reset game state
    running = false;
    gamePaused = false;
    window.__gameOverTriggered = false;
    lives = 3;
    score = 0;
    comboCount = 0;
    comboTimerMs = 0;
    
    // Update UI
    document.getElementById('lives').textContent = lives;
    document.getElementById('score').textContent = score;
    document.getElementById('runLabel').textContent = runIndex;
    
    // Reset Start Run button state
    document.getElementById('startBtn').textContent = 'Start Run';
    document.getElementById('startBtn').disabled = false;
    document.getElementById('endBtn').disabled = true;
    
    // Reset player position
    player.x = baseW / 2;
    player.y = baseH / 2;
    player.speedMultiplier = 1.0;
    player.shield = false;
    player.isDashing = false;
    player.dashReady = true;
    
    // Reset active effects
    activeEffects.speed.active = false;
    activeEffects.shield.active = false;
    activeEffects.slow.active = false;
    gameTimeScale = gameConfig.gameTimeScale;
    
    // Respawn orbs
    spawnOrbs(7);
    
    // Clear particles
    particles.length = 0;
    ripples.length = 0;
    floatingTexts.length = 0;
    
    console.log('Returned to title screen');
  }

  // Initialize return button
  if (endingReturnBtn) {
    endingReturnBtn.addEventListener('click', hide);
  }

  // Public API
  return {
    show,
    hide,
    isActive: () => isEndingActive
  };
})();

// ============================================
// GAME COMPLETION TRIGGER
// ============================================

// Example trigger conditions (customize based on your game logic):

// Option 1: Trigger after collecting a certain number of echoes/orbs
let totalOrbsCollected = 0;
const ORBS_TO_WIN = 50; // Adjust this number

// Hook into orb collection (modify existing orb collection code)
function checkGameCompletion() {
  totalOrbsCollected++;
  
  // Check if player has collected enough orbs to complete the game
  if (totalOrbsCollected >= ORBS_TO_WIN) {
    setTimeout(() => {
      EndingScreen.show();
    }, 1000); // Brief delay before showing ending
  }
}

// Option 2: Trigger after surviving a certain number of runs
const RUNS_TO_WIN = 10; // Adjust this number

function checkRunCompletion() {
  if (runIndex >= RUNS_TO_WIN && ghosts.length >= 5) {
    setTimeout(() => {
      EndingScreen.show();
    }, 1000);
  }
}

// Option 3: Trigger after reaching a certain score
const SCORE_TO_WIN = 10000; // Adjust this number

function checkScoreCompletion() {
  if (score >= SCORE_TO_WIN) {
    setTimeout(() => {
      EndingScreen.show();
    }, 1000);
  }
}

// Option 4: Manual trigger via debug key
window.addEventListener('keydown', (e) => {
  // Press 'E' key to trigger ending (for testing)
  if (e.key === 'e' || e.key === 'E') {
    if (e.shiftKey) { // Shift+E to trigger ending
      console.log('Manual ending trigger (Shift+E)');
      EndingScreen.show();
    }
  }
});

// Expose for debugging
window._eou.EndingScreen = EndingScreen;
window._eou.triggerEnding = () => EndingScreen.show();

console.log('Ending screen system initialized. Press Shift+E to test ending.');
