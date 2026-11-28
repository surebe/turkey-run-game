// The world: which stage the run is in, what scrolls past in the background,
// and what dangers and pickups spawn ahead of the turkey. Everything is laid
// out in world pixels; the renderer subtracts the camera to place it.

import { PX_PER_METER, STAGES, stageAt } from './config.js';

// Obstacle footprints: width along the ground, height the turkey must clear,
// and how the collision code should treat each kind.
export const FOOTPRINTS = {
  hay: { w: 62, h: 48, kind: 'ground' },
  fence: { w: 66, h: 50, kind: 'ground' },
  pumpkin: { w: 52, h: 34, kind: 'ground' },
  oven: { w: 92, h: 116, kind: 'ground' },
  counter: { w: 108, h: 70, kind: 'ground' },
  mud: { w: 120, h: 6, kind: 'mud' },
  knife: { w: 30, h: 0, kind: 'knife' }, // falls from the sky; see game.js
  cleaver: { w: 40, h: 30, kind: 'cleaver' }, // flies at standing height
};

export class World {
  constructor(rng) {
    this.rng = rng;
    this.items = []; // {type, x (world px), ...} obstacles and pickups
    this.nextSpawnX = 1500; // world px of the next spawn decision
    this.lastStage = 0;
    this.stageBannerT = 0;
    this.gateX = null; // set once, when the escape gate scrolls in
  }

  stageIndex(meters) {
    return stageAt(meters);
  }

  stage(meters) {
    return STAGES[this.stageIndex(meters)];
  }

  // Keep the road ahead stocked: decide the next obstacle or treat, spaced by
  // the current speed so faster running never means an unfair wall.
  update(cameraX, speed, meters) {
    const horizon = cameraX + 1500;
    while (this.nextSpawnX < horizon) {
      const stage = this.stage(this.nextSpawnX / PX_PER_METER);
      const roll = this.rng.next();
      if (roll < 0.16) {
        this.spawnCornArc(this.nextSpawnX);
        this.nextSpawnX += this.rng.range(430, 640);
      } else if (roll < 0.22) {
        // Golden corn hangs high, so it already asks for a jump — and in
        // knife country it usually hangs on the knife's own column: the
        // richest grab on the road sits exactly where a carving knife is
        // about to land. Take it flying, or leave it. That is the gamble.
        const goldX = this.nextSpawnX + 60;
        this.items.push({ type: 'goldcorn', x: goldX, y: 470 });
        if (stage.dangers.includes('knife') && this.rng.chance(0.65)) {
          this.items.push({ type: 'knife', x: goldX, state: 'armed', t: 0, y: -60 });
        }
        this.nextSpawnX += this.rng.range(430, 640);
      } else {
        const type = this.rng.pick(stage.dangers);
        this.spawnDanger(type, this.nextSpawnX, meters);
        const tightness = Math.min(1, meters / 900); // the road crowds as you go
        this.nextSpawnX += this.rng.range(560 - tightness * 130, 800 - tightness * 160) + speed * 0.28;
      }
    }
    // Forget what has scrolled well behind.
    while (this.items.length && this.items[0].x < cameraX - 320) this.items.shift();

    const idx = this.stageIndex(meters);
    if (idx !== this.lastStage) {
      this.lastStage = idx;
      this.stageBannerT = 2.4;
    }
    if (this.stageBannerT > 0) this.stageBannerT -= 1 / 60;
  }

  spawnDanger(type, x, meters) {
    if (type === 'knife') {
      // A knife drops on the turkey's near future, not on a fixed spot.
      this.items.push({ type: 'knife', x: x + 260, state: 'armed', t: 0, y: -60 });
    } else if (type === 'cleaver') {
      this.items.push({ type: 'cleaver', x: x + 420, y: 566, vx: 210 + meters * 0.06, spin: 0 });
    } else {
      this.items.push({ type, x });
    }
  }

  spawnCornArc(x) {
    const count = this.rng.rangeInt(4, 6);
    const high = this.rng.chance(0.45); // some arcs reward a jump
    for (let i = 0; i < count; i++) {
      const px = x + i * 44;
      const lift = Math.sin((i / (count - 1)) * Math.PI) * (high ? 120 : 26);
      this.items.push({ type: 'corn', x: px, y: 600 - lift });
    }
  }
}
