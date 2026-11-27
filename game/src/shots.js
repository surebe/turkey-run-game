// Screenshot staging. The game reads ?shot=<name>&seed=<n> from its URL and
// composes one exact, deterministic scene — the same scene on every load —
// so the maker's screenshots are real renders of the game's own code, taken
// at the moments that show it best. Live play never passes through here.

import { ESCAPE_METERS, GROUND_Y, PX_PER_METER } from './config.js';
import { Rng } from './random.js';
import { World } from './world.js';

function freshWorld(game, seed) {
  game.rng = new Rng(seed);
  game.world = new World(game.rng);
  game.world.nextSpawnX = Number.MAX_SAFE_INTEGER; // the scene is hand-placed
  game.particles = [];
  game.popups = [];
}

function feather(game, x, y, color, size) {
  game.particles.push({ x, y, vx: 0, vy: 0, t: 0, life: 99, size, color, gravity: 0 });
}

export function stageShot(game, name) {
  if (name === 'title') {
    game.state = 'title';
    return;
  }

  if (name === 'end') {
    freshWorld(game, 11);
    game.state = 'escaped';
    game.score = 23150;
    game.best = 23150;
    game.distanceM = ESCAPE_METERS;
    game.cornCount = 41;
    game.nearMisses = 9;
    game.endT = 1;
    const cols = ['#ffd94d', '#7ec850', '#f2e2c4', '#e09f3e'];
    for (let i = 0; i < 22; i++) {
      feather(game, 700 + (i % 11) * 42, GROUND_Y - 190 - Math.floor(i / 11) * 60, cols[i % 4], 4 + (i % 3));
    }
    return;
  }

  if (name === 'play') {
    freshWorld(game, 5);
    game.state = 'play';
    game.distanceM = 128;
    game.cameraX = 128 * PX_PER_METER;
    game.score = 2840;
    game.hearts = 3;
    game.cornCount = 7;
    game.turkey.feetY = GROUND_Y;
    game.turkey.grounded = true;
    game.turkey.runPhase = 1.5;
    game.farmer.gap = 305;
    game.farmer.runPhase = 1.1;
    const c = game.cameraX;
    game.world.items = [
      { type: 'mud', x: c + 120 },
      { type: 'fence', x: c + 580 },
      { type: 'corn', x: c + 712, y: 588 },
      { type: 'corn', x: c + 756, y: 566 },
      { type: 'corn', x: c + 800, y: 588 },
      { type: 'hay', x: c + 990 },
    ];
    game.world.lastStage = 0;
    return;
  }

  // cover: the kitchen at full drama — the turkey mid-leap over a flaming
  // oven, a knife on its way down, the farmer lunging close behind.
  freshWorld(game, 7);
  game.state = 'play';
  game.distanceM = 812;
  game.cameraX = 812 * PX_PER_METER;
  game.score = 12480;
  game.hearts = 2;
  game.cornCount = 23;
  game.nearMisses = 5;
  game.turkey.feetY = GROUND_Y - 158;
  game.turkey.grounded = false;
  game.turkey.vy = 140;
  game.turkey.jumps = 1;
  game.turkey.tilt = 0.10;
  game.turkey.runPhase = 2.3;
  game.farmer.gap = 128;
  game.farmer.lunge = 1;
  game.farmer.runPhase = 3.2;
  game.say('COME BACK, DINNER!', 99);
  const c = game.cameraX;
  game.world.items = [
    { type: 'pumpkin', x: c + 130 },
    { type: 'oven', x: c + 478 },
    { type: 'knife', x: c + 618, state: 'falling', y: 268, vy: 420 },
    { type: 'corn', x: c + 742, y: 520 },
    { type: 'corn', x: c + 786, y: 492 },
    { type: 'corn', x: c + 830, y: 520 },
    { type: 'counter', x: c + 1022 },
  ];
  game.world.lastStage = 2;
  feather(game, 330, GROUND_Y - 190, '#f2e2c4', 5);
  feather(game, 300, GROUND_Y - 150, '#e09f3e', 4);
  feather(game, 356, GROUND_Y - 128, '#b84a2e', 4.5);
}
