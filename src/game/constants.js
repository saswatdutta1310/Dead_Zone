export const CANVAS_WIDTH = 1200;
export const CANVAS_HEIGHT = 800;

export const PLAYER_RADIUS = 20;
export const PLAYER_SPEED = 200;
export const BULLET_SPEED = 600;
export const BULLET_RADIUS = 4;
export const FIRE_INTERVAL = 120;
export const INVINCIBILITY_DURATION = 1500;

export const ZOMBIE_TYPES = {
  WALKER: {
    radius: 18,
    speed: 60,
    hp: 30,
    damage: 10,
    color: '#ff3e3e',
    score: 10
  },
  RUNNER: {
    radius: 14,
    speed: 110,
    hp: 15,
    damage: 5,
    color: '#ff3e3e',
    score: 15
  },
  BRUTE: {
    radius: 28,
    speed: 35,
    hp: 100,
    damage: 20,
    color: '#ff3e3e',
    score: 25
  }
};

export const COLORS = {
  PLAYER: '#00ff66',
  UI_ACCENT: '#00ff66',
  BG: '#08080c',
  HUD_BG: 'rgba(10, 10, 15, 0.85)'
};