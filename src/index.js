import { GameEngine } from './game/engine.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './game/constants.js';

let engine = null;
let gameState = 'START'; // START, PLAYING, GAMEOVER
let highscore = parseInt(localStorage.getItem('deadzone_highscore') || '0');
let prevHp = 100;
let flashTimeout1, flashTimeout2;

// DOM Elements
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const pauseScreen = document.getElementById('pause-screen');
const hudOverlay = document.getElementById('hud-overlay');
const canvas = document.getElementById('game-canvas');

// HUD Elements
const hpText = document.getElementById('hp-text');
const hpBar = document.getElementById('hp-bar');
const waveText = document.getElementById('wave-text');
const deployingBox = document.getElementById('deploying-box');
const bossBox = document.getElementById('boss-box');
const scoreText = document.getElementById('score-text');
const highscoreText = document.getElementById('highscore-text');
const recordBadge = document.getElementById('record-badge');
const recordBadge2 = document.getElementById('record-badge-2');
const finalScoreText = document.getElementById('final-score-text');
const finalWaveText = document.getElementById('final-wave-text');
const newRecordBox = document.getElementById('new-record-box');

// Flash Elements
const whiteFlash = document.getElementById('flash-white');
const hitFlash = document.getElementById('flash-red');

function updateHUD() {
  if (!engine) return;

  hpText.innerHTML = `${engine.player.hp} / 100 <span class="text-xs opacity-50 font-normal">UNIT</span>`;
  hpBar.style.width = `${Math.max(0, engine.player.hp)}%`;

  waveText.textContent = `LVL-${engine.wave.toString().padStart(3, '0')}`;
  
  if (!engine.waveActive) {
    deployingBox.classList.remove('hidden');
    deployingBox.textContent = `DEPLOYING: ${Math.ceil(engine.waveCountdown)}S`;
  } else {
    deployingBox.classList.add('hidden');
  }

  if (engine.waveActive && engine.wave % 5 === 0) {
    bossBox.classList.remove('hidden');
  } else {
    bossBox.classList.add('hidden');
  }

  scoreText.innerHTML = `${engine.score.toLocaleString()} <span class="text-[8px] md:text-[10px] opacity-40">PTS</span>`;
  highscoreText.textContent = highscore.toLocaleString();

  if (engine.isPaused) {
    pauseScreen.classList.remove('hidden');
  } else {
    pauseScreen.classList.add('hidden');
  }

  if (engine.gameOver && gameState !== 'GAMEOVER') {
    setGameState('GAMEOVER');
  }

  // Flash UI Logic
  if (engine.player.hp < prevHp) {
    triggerFlash();
  }
  prevHp = engine.player.hp;
}

function triggerFlash() {
  whiteFlash.style.opacity = '0.6';
  hitFlash.style.opacity = '0.4';
  
  clearTimeout(flashTimeout1);
  clearTimeout(flashTimeout2);
  
  flashTimeout1 = setTimeout(() => {
    hitFlash.style.transition = 'opacity 0.2s';
    hitFlash.style.opacity = '0';
  }, 200);
  
  flashTimeout2 = setTimeout(() => {
    whiteFlash.style.transition = 'opacity 0.1s';
    whiteFlash.style.opacity = '0';
  }, 100);
  
  // Reset transitions
  setTimeout(() => {
    hitFlash.style.transition = '';
    whiteFlash.style.transition = '';
  }, 400);
}

function setGameState(newState) {
  gameState = newState;

  if (newState === 'START') {
    startScreen.classList.remove('hidden');
    gameOverScreen.classList.add('hidden');
    hudOverlay.classList.add('hidden');
    pauseScreen.classList.add('hidden');
    
    if (highscore > 0) {
      recordBadge.classList.remove('hidden');
      recordBadge2.textContent = `Record Detected: ${highscore}`;
    }
  } else if (newState === 'PLAYING') {
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    hudOverlay.classList.remove('hidden');
    pauseScreen.classList.add('hidden');
    
    engine = new GameEngine(canvas, updateHUD);
    engine.startWave();
    prevHp = 100;
  } else if (newState === 'GAMEOVER') {
    startScreen.classList.add('hidden');
    gameOverScreen.classList.remove('hidden');
    hudOverlay.classList.add('hidden');
    pauseScreen.classList.add('hidden');
    
    finalScoreText.textContent = engine.score;
    finalWaveText.textContent = engine.wave;
    
    if (engine.score > highscore) {
      highscore = engine.score;
      localStorage.setItem('deadzone_highscore', highscore.toString());
      newRecordBox.classList.remove('hidden');
    } else {
      newRecordBox.classList.add('hidden');
    }
  }
}

// Game Loop
let lastTime = performance.now();
function loop(time) {
  const dt = (time - lastTime) / 1000;
  lastTime = time;

  if (engine && !engine.isPaused && !engine.gameOver && gameState === 'PLAYING') {
    engine.update(dt);
    engine.draw();
  }

  requestAnimationFrame(loop);
}

// Event Listeners
document.getElementById('btn-start').addEventListener('click', () => {
  setGameState('PLAYING');
});

document.getElementById('btn-restart').addEventListener('click', () => {
  setGameState('START');
});

document.getElementById('btn-resume').addEventListener('click', () => {
  if (engine) engine.isPaused = false;
  updateHUD();
});

// Init
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;
setGameState('START');
requestAnimationFrame(loop);