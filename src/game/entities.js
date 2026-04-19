import { BULLET_RADIUS, BULLET_SPEED, COLORS, PLAYER_RADIUS, ZOMBIE_TYPES } from './constants.js';

export class Bullet {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.active = false;
  }

  init(x, y, angle) {
    this.x = x;
    this.y = y;
    this.vx = Math.cos(angle) * BULLET_SPEED;
    this.vy = Math.sin(angle) * BULLET_SPEED;
    this.active = true;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }

  draw(ctx) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, BULLET_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.closePath();
  }
}

export class Particle {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.life = 0;
    this.maxLife = 0.4;
    this.color = '';
    this.active = false;
  }

  init(x, y, color) {
    this.x = x;
    this.y = y;
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 100 + 50;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.life = this.maxLife;
    this.color = color;
    this.active = true;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.life -= dt;
    if (this.life <= 0) this.active = false;
  }

  draw(ctx) {
    ctx.globalAlpha = this.life / this.maxLife;
    ctx.beginPath();
    ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.closePath();
    ctx.globalAlpha = 1.0;
  }
}

export class Zombie {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.hp = 0;
    this.maxHp = 0;
    this.type = 'WALKER';
    this.active = false;
    this.speed = 0;
    this.radius = 0;
    this.color = '';
  }

  init(x, y, type, speedMultiplier) {
    const config = ZOMBIE_TYPES[type];
    this.x = x;
    this.y = y;
    this.type = type;
    this.radius = config.radius;
    this.speed = config.speed * speedMultiplier;
    this.hp = config.hp;
    this.maxHp = config.hp;
    this.color = config.color;
    this.active = true;
  }

  update(dt, playerX, playerY) {
    const angle = Math.atan2(playerY - this.y, playerX - this.x);
    this.x += Math.cos(angle) * this.speed * dt;
    this.y += Math.sin(angle) * this.speed * dt;
  }

  draw(ctx) {
    // Body
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 10;
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.closePath();

    // HP Bar
    const barWidth = this.radius * 2;
    const barHeight = 4;
    ctx.fillStyle = '#333';
    ctx.fillRect(this.x - this.radius, this.y - this.radius - 10, barWidth, barHeight);
    ctx.fillStyle = '#f00';
    ctx.fillRect(this.x - this.radius, this.y - this.radius - 10, barWidth * (this.hp / this.maxHp), barHeight);
  }
}

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.hp = 100;
    this.maxHp = 100;
    this.angle = 0;
    this.invincibleTime = 0;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    // Fade if invincible
    if (this.invincibleTime > 0) {
      ctx.globalAlpha = 0.5 + Math.sin(Date.now() / 50) * 0.2;
    }

    // Barrel
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, -5, 30, 10);

    // Body
    ctx.beginPath();
    ctx.arc(0, 0, PLAYER_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.PLAYER;
    ctx.fill();
    ctx.shadowColor = COLORS.PLAYER;
    ctx.shadowBlur = 15;
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.closePath();

    ctx.restore();

    // HP Bar above player (not rotated)
    const barWidth = 40;
    const barHeight = 4;
    ctx.fillStyle = '#333';
    ctx.fillRect(this.x - barWidth / 2, this.y - PLAYER_RADIUS - 15, barWidth, barHeight);
    ctx.fillStyle = '#52b788';
    ctx.fillRect(this.x - barWidth / 2, this.y - PLAYER_RADIUS - 15, barWidth * (this.hp / this.maxHp), barHeight);
  }
}