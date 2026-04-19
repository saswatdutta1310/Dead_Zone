import { Bullet, Particle, Player, Zombie } from './entities.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT, ZOMBIE_TYPES, INVINCIBILITY_DURATION, FIRE_INTERVAL } from './constants.js';

export class GameEngine {
  constructor(canvas, onStateChange) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.player = new Player(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    this.onStateChange = onStateChange;

    this.bullets = [];
    this.zombies = [];
    this.particles = [];

    this.score = 0;
    this.wave = 0;
    this.waveActive = false;
    this.waveCountdown = 0;
    this.zombiesToSpawn = 0;
    this.zombiesRemaining = 0;
    this.lastSpawnTime = 0;
    
    this.keys = new Set();
    this.mouseX = 0;
    this.mouseY = 0;
    this.isMouseDown = false;
    this.fireCooldown = 0;
    
    this.isPaused = false;
    this.gameOver = false;
    this.shakeAmount = 0;
    this.flashOpacity = 0;

    // Pre-allocate pools
    for (let i = 0; i < 100; i++) this.bullets.push(new Bullet());
    for (let i = 0; i < 50; i++) this.zombies.push(new Zombie());
    for (let i = 0; i < 200; i++) this.particles.push(new Particle());

    this.setupInput();
  }

  setupInput() {
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.code);
      if (e.code === 'Escape') {
        this.isPaused = !this.isPaused;
        this.onStateChange();
      }
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.isMouseDown = false;
    });
    window.addEventListener('blur', () => {
      this.isMouseDown = false;
      this.keys.clear();
    });
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouseX = (e.clientX - rect.left) * (CANVAS_WIDTH / rect.width);
      this.mouseY = (e.clientY - rect.top) * (CANVAS_HEIGHT / rect.height);
    });
    this.canvas.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      this.isMouseDown = true;
      this.fireCooldown = this.shoot() ? FIRE_INTERVAL : 0;
    });

    // Touch Support
    let lastTouchX = 0;
    let lastTouchY = 0;
    let isTouching = false;

    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      isTouching = true;
      const touch = e.touches[0];
      const rect = this.canvas.getBoundingClientRect();
      lastTouchX = (touch.clientX - rect.left) * (CANVAS_WIDTH / rect.width);
      lastTouchY = (touch.clientY - rect.top) * (CANVAS_HEIGHT / rect.height);
      this.mouseX = lastTouchX;
      this.mouseY = lastTouchY;
      this.shoot();
    }, { passive: false });

    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const rect = this.canvas.getBoundingClientRect();
      const currentX = (touch.clientX - rect.left) * (CANVAS_WIDTH / rect.width);
      const currentY = (touch.clientY - rect.top) * (CANVAS_HEIGHT / rect.height);
      
      // Calculate movement delta
      const dx = currentX - lastTouchX;
      const dy = currentY - lastTouchY;
      
      this.player.x += dx * 0.5; // Sensitivity
      this.player.y += dy * 0.5;
      
      lastTouchX = currentX;
      lastTouchY = currentY;
      this.mouseX = currentX;
      this.mouseY = currentY;
    }, { passive: false });

    this.canvas.addEventListener('touchend', () => {
      isTouching = false;
    });
  }

  shoot() {
    if (this.isPaused || this.gameOver || !this.waveActive) return false;

    this.player.angle = Math.atan2(this.mouseY - this.player.y, this.mouseX - this.player.x);
    const bullet = this.bullets.find(b => !b.active);
    if (bullet) {
      bullet.init(this.player.x, this.player.y, this.player.angle);
      return true;
    }

    return false;
  }

  spawnZombie() {
    if (this.zombiesToSpawn <= 0) return;
    
    const zombie = this.zombies.find(z => !z.active);
    if (zombie) {
      // Logic for Boss Wave
      const isBossWave = this.wave % 5 === 0 && this.zombiesToSpawn === 1;
      
      // Pick random type
      const rand = Math.random();
      let type = 'WALKER';
      if (rand > 0.8) type = 'BRUTE';
      else if (rand > 0.6) type = 'RUNNER';

      // Pick side
      const side = Math.floor(Math.random() * 4);
      let x = 0, y = 0;
      const offset = 50;
      if (side === 0) { x = Math.random() * CANVAS_WIDTH; y = -offset; }
      else if (side === 1) { x = CANVAS_WIDTH + offset; y = Math.random() * CANVAS_HEIGHT; }
      else if (side === 2) { x = Math.random() * CANVAS_WIDTH; y = CANVAS_HEIGHT + offset; }
      else { x = -offset; y = Math.random() * CANVAS_HEIGHT; }

      const speedMultiplier = 1 + (this.wave * 0.05);
      zombie.init(x, y, type, speedMultiplier);

      // Boss modifications
      if (isBossWave) {
        zombie.hp *= 5;
        zombie.maxHp *= 5;
        zombie.radius *= 3;
        zombie.type = 'BRUTE'; // Force boss to be a big brute
        zombie.color = '#5a0000';
      }

      this.zombiesToSpawn--;
    }
  }

  startWave() {
    this.wave++;
    this.waveActive = false;
    this.waveCountdown = 3;
    this.onStateChange();
    
    const count = 5 + (this.wave - 1) * 3;
    this.zombiesToSpawn = count;
    this.zombiesRemaining = count;
  }

  update(dt) {
    if (this.isPaused || this.gameOver) return;

    // Wave management
    if (!this.waveActive) {
      this.waveCountdown -= dt;
      if (this.waveCountdown <= 0) {
        this.waveActive = true;
        this.onStateChange();
      }
      return;
    }

    // Spawning logic
    if (this.zombiesToSpawn > 0 && Date.now() - this.lastSpawnTime > 1000 / (1 + this.wave * 0.1)) {
      this.spawnZombie();
      this.lastSpawnTime = Date.now();
    }

    // Player movement
    let dx = 0, dy = 0;
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) dy -= 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) dy += 1;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) dx -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) dx += 1;

    if (dx !== 0 || dy !== 0) {
      const mag = Math.sqrt(dx * dx + dy * dy);
      const speed = 200;
      this.player.x += (dx / mag) * speed * dt;
      this.player.y += (dy / mag) * speed * dt;
      
      // Bounds
      this.player.x = Math.max(20, Math.min(CANVAS_WIDTH - 20, this.player.x));
      this.player.y = Math.max(20, Math.min(CANVAS_HEIGHT - 20, this.player.y));
    }

    // Player aim
    this.player.angle = Math.atan2(this.mouseY - this.player.y, this.mouseX - this.player.x);

    if (this.isMouseDown) {
      this.fireCooldown -= dt * 1000;
      if (this.fireCooldown <= 0) {
        this.fireCooldown = this.shoot() ? FIRE_INTERVAL : 0;
      }
    } else {
      this.fireCooldown = 0;
    }

    // Invincibility
    if (this.player.invincibleTime > 0) {
      this.player.invincibleTime -= dt * 1000;
    }

    // Screen Shake Decay
    if (this.shakeAmount > 0) {
      this.shakeAmount -= dt * 40;
      if (this.shakeAmount < 0) this.shakeAmount = 0;
    }

    // Flash Decay
    if (this.flashOpacity > 0) {
      this.flashOpacity -= dt * 2;
      if (this.flashOpacity < 0) this.flashOpacity = 0;
    }

    if (this.shakeAmount > 0 || this.flashOpacity > 0) {
      this.onStateChange();
    }

    // Entities
    this.bullets.forEach(b => { if (b.active) b.update(dt); });
    this.zombies.forEach(z => { if (z.active) z.update(dt, this.player.x, this.player.y); });
    this.particles.forEach(p => { if (p.active) p.update(dt); });

    // Collisions
    this.checkCollisions();

    // Check wave end
    if (this.zombiesRemaining === 0) {
      this.startWave();
    }
  }

  checkCollisions() {
    // Bullet vs Zombie
    this.bullets.forEach(b => {
      if (!b.active) return;
      if (b.x < 0 || b.x > CANVAS_WIDTH || b.y < 0 || b.y > CANVAS_HEIGHT) {
        b.active = false;
        return;
      }

      for (const z of this.zombies) {
        if (!z.active) continue;
        const dist = Math.hypot(b.x - z.x, b.y - z.y);
        if (dist < z.radius + 4) {
          b.active = false;
          z.hp -= 10;
          if (z.hp <= 0) {
            const config = ZOMBIE_TYPES[z.type];
            z.active = false;
            this.zombiesRemaining--;
            this.score += config.score;
            
            // Shake on Boss Death (Boss if radius is significantly larger)
            if (z.radius > 50) {
              this.shakeAmount = 15;
              this.flashOpacity = 0.5;
            } else if (z.type === 'BRUTE') {
              this.shakeAmount = 8;
            }

            this.spawnExplosion(z.x, z.y, z.color);
            this.onStateChange();
          }
          break;
        }
      }
    });

    // Zombie vs Player
    if (this.player.invincibleTime <= 0) {
      for (const z of this.zombies) {
        if (!z.active) continue;
        const dist = Math.hypot(z.x - this.player.x, z.y - this.player.y);
        if (dist < z.radius + 20) {
          this.player.hp -= ZOMBIE_TYPES[z.type].damage;
          this.player.invincibleTime = INVINCIBILITY_DURATION;
          this.shakeAmount = 10;
          this.flashOpacity = 0.3;
          this.onStateChange();
          if (this.player.hp <= 0) {
            this.gameOver = true;
            this.onStateChange();
          }
          break;
        }
      }
    }
  }

  spawnExplosion(x, y, color) {
    for (let i = 0; i < 8; i++) {
      const p = this.particles.find(p => !p.active);
      if (p) p.init(x, y, color);
    }
  }

  draw() {
    this.ctx.save();
    
    // Apply Internal Screen Shake
    if (this.shakeAmount > 0) {
      const sx = (Math.random() - 0.5) * this.shakeAmount;
      const sy = (Math.random() - 0.5) * this.shakeAmount;
      this.ctx.translate(sx, sy);
    }

    this.ctx.fillStyle = '#08080c';
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Grid
    this.ctx.strokeStyle = 'rgba(0, 255, 102, 0.05)';
    this.ctx.lineWidth = 1;
    for (let x = 0; x < CANVAS_WIDTH; x += 40) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, CANVAS_HEIGHT);
      this.ctx.stroke();
    }
    for (let y = 0; y < CANVAS_HEIGHT; y += 40) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(CANVAS_WIDTH, y);
      this.ctx.stroke();
    }

    this.bullets.forEach(b => { if (b.active) b.draw(this.ctx); });
    this.zombies.forEach(z => { if (z.active) z.draw(this.ctx); });
    this.particles.forEach(p => { if (p.active) p.draw(this.ctx); });
    this.player.draw(this.ctx);
    
    // Draw Full Screen Flash
    if (this.flashOpacity > 0) {
      this.ctx.fillStyle = `rgba(255, 255, 255, ${this.flashOpacity})`;
      this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    this.ctx.restore();
  }
}
