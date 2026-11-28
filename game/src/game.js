// The game itself: the state machine (title, run, caught, escaped), the
// turkey's physics, the farmer who never stops coming, collisions, scoring
// and every burst of feathers when things go wrong.

import { ESCAPE_METERS, GROUND_Y, PX_PER_METER, TUNING, TURKEY_X } from './config.js';
import { Rng } from './random.js';
import { FOOTPRINTS, World } from './world.js';

const FARMER_LINES = [
  'Come back, dinner!',
  'I just need ONE bird!',
  'The gravy is already on!',
  'You are the guest of honour!',
  'Hold still, you feathery roast!',
  'Mashed potatoes wait for no one!',
];

const STUMBLE_LINES = ['Gotcha— no!', 'Ow! My apron!', 'Slippery little—!'];

// Once a stage, at these distances, the farmer finds his second wind: a
// rally of a few seconds when he claws the gap back three times as fast.
// Hiding blunts it; afterwards he is winded and the gap is yours to win.
const RALLY_AT = [170, 490, 770, 950];

export class Game {
  constructor(sound) {
    this.sound = sound;
    this.state = 'title';
    this.time = 0;
    this.best = 0;
    this.reset();
  }

  reset() {
    this.rng = new Rng((Date.now() % 2147483646) + 1);
    this.world = new World(this.rng);
    this.cameraX = 0;
    this.distanceM = 0;
    this.speed = TUNING.startSpeed;
    this.score = 0;
    this.hearts = TUNING.hearts;
    this.cornCount = 0;
    this.nearMisses = 0;
    this.combo = 0; // cobs chained without a pause — the streak
    this.comboT = 0; // seconds left before the streak cools off
    this.bestCombo = 0; // the longest streak of the run, for the stats
    this.rallyPhase = 'calm'; // calm, rally or winded
    this.rallyT = 0;
    this.rallyNext = 0; // index into RALLY_AT
    this.rallyBannerT = 0;
    this.turkey = {
      feetY: GROUND_Y,
      vy: 0,
      grounded: true,
      jumps: 0,
      duck: 0,
      runPhase: 0,
      invuln: 0,
      tilt: 0,
      inMud: false,
      hidden: false, // ducked behind a hay bale, out of the farmer's sight
      hideItem: null, // the bale doing the hiding (the renderer re-draws it in front)
    };
    this.farmer = {
      gap: TUNING.farmerStartGap,
      runPhase: 0,
      lunge: 0,
      bubble: '',
      bubbleT: 0,
      cleanTime: 0,
    };
    this.particles = [];
    this.popups = [];
    this.shakeT = 0;
    this.slowT = 0;
    this.dustT = 0;
    this.bubbleT = 3.5;
    this.endT = 0;
    this.flashT = 0;
  }

  startRun() {
    this.reset();
    this.state = 'play';
    this.sound.wake();
    this.sound.gobble();
    this.sound.startMusic();
    this.say('Come back, dinner!');
  }

  say(text, seconds = 2.2) {
    this.farmer.bubble = text;
    this.farmer.bubbleT = seconds;
  }

  popup(x, y, text, color = '#fff6e3') {
    this.popups.push({ x, y, text, color, t: 0 });
  }

  burst(x, y, colors, count, power = 220) {
    for (let i = 0; i < count; i++) {
      const a = this.rng.range(0, Math.PI * 2);
      const v = this.rng.range(power * 0.3, power);
      this.particles.push({
        x, y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v - 90,
        t: 0,
        life: this.rng.range(0.35, 0.8),
        size: this.rng.range(2.5, 6),
        color: this.rng.pick(colors),
        gravity: 620,
      });
    }
  }

  update(dt, input) {
    this.time += dt;
    if (this.slowT > 0) {
      this.slowT -= dt;
      dt *= 0.45; // a near miss buys a heartbeat of slow motion
    }

    if (this.state === 'title') {
      this.turkey.runPhase += dt * 9;
      this.farmer.runPhase += dt * 9;
      if (input.confirmPressed()) this.startRun();
      input.endFrame();
      return;
    }

    if (this.state === 'caught' || this.state === 'escaped') {
      this.endT += dt;
      this.updateParticles(dt);
      if (this.endT > 0.6 && input.confirmPressed()) this.startRun();
      input.endFrame();
      return;
    }

    this.updateRun(dt, input);
    input.endFrame();
  }

  updateRun(dt, input) {
    const t = this.turkey;
    const f = this.farmer;

    // --- the run itself -------------------------------------------------
    this.speed = Math.min(TUNING.maxSpeed, this.speed + TUNING.speedRamp * dt * 10);
    const mudFactor = t.inMud ? 0.7 : 1;
    const advance = this.speed * mudFactor * dt;
    this.cameraX += advance;
    this.distanceM = this.cameraX / PX_PER_METER;
    this.score += TUNING.scorePerMeter * (advance / PX_PER_METER);
    t.runPhase += dt * (7 + this.speed / 42);
    f.runPhase += dt * (7 + this.speed / 40) * (this.rallyPhase === 'rally' ? 1.35 : 1);

    // --- jumping and ducking ---------------------------------------------
    const wantDuck = input.duckHeld() && t.grounded;
    t.duck += ((wantDuck ? 1 : 0) - t.duck) * Math.min(1, dt / TUNING.duckTime);
    if (input.jumpPressed()) {
      if (t.grounded) {
        t.vy = -TUNING.jumpVelocity;
        t.grounded = false;
        t.jumps = 1;
        this.sound.squawk();
        this.burst(TURKEY_X - 10, GROUND_Y - 4, ['#cbb590', '#a98f63'], 5, 120);
      } else if (t.jumps < 2) {
        t.vy = -TUNING.doubleJumpVelocity;
        t.jumps = 2;
        this.sound.flutter();
        this.burst(TURKEY_X - 16, t.feetY - 30, ['#f2e2c4', '#e09f3e', '#b84a2e'], 7, 150);
      }
    }
    if (!t.grounded) {
      // Letting go early cuts the jump short: a turkey, not a balloon.
      if (!input.jumpHeld() && t.vy < -300) t.vy = -300;
      t.vy += TUNING.gravity * dt;
      t.feetY += t.vy * dt;
      t.tilt = Math.max(-0.22, Math.min(0.38, t.vy / 2400));
      if (t.feetY >= GROUND_Y) {
        t.feetY = GROUND_Y;
        t.vy = 0;
        t.grounded = true;
        t.jumps = 0;
        t.tilt = 0;
        this.burst(TURKEY_X - 6, GROUND_Y - 2, ['#cbb590', '#a98f63'], 4, 100);
      }
    }

    if (t.invuln > 0) t.invuln -= dt;
    if (this.shakeT > 0) this.shakeT -= dt;
    if (this.flashT > 0) this.flashT -= dt;

    // --- the combo streak cools -------------------------------------------
    if (this.comboT > 0) {
      this.comboT -= dt;
      if (this.comboT <= 0) this.combo = 0;
    }

    // --- the farmer's rally: a second wind, once a stage -------------------
    if (this.rallyBannerT > 0) this.rallyBannerT -= dt;
    if (this.rallyPhase === 'calm' && this.rallyNext < RALLY_AT.length && this.distanceM >= RALLY_AT[this.rallyNext]) {
      this.rallyPhase = 'rally';
      this.rallyT = TUNING.rallySeconds;
      this.rallyBannerT = 1.5;
      this.say("I'M GETTING MY BIRD!", 2.0);
      this.sound.rally();
    } else if (this.rallyPhase === 'rally') {
      this.rallyT -= dt;
      if (this.rallyT <= 0) {
        // Spent. He bends double, wheezing, and the road is yours again.
        this.rallyPhase = 'winded';
        this.rallyT = TUNING.rallyWindedSeconds;
        this.rallyNext++;
        this.say('…wheeze…', 1.4);
      }
    } else if (this.rallyPhase === 'winded') {
      this.rallyT -= dt;
      if (this.rallyT <= 0) this.rallyPhase = 'calm';
    }

    // --- the farmer -------------------------------------------------------
    f.cleanTime += dt;
    if (t.inMud) f.cleanTime = 0;
    if (t.hidden) {
      // Ducked behind a hay bale, he loses the trail entirely: the gap
      // grows back faster than clean running ever wins it — even mid-rally,
      // which makes the bale the rally's counter.
      f.gap = Math.min(TUNING.farmerMaxGap, f.gap + TUNING.farmerRecovery * 1.6 * dt);
    } else if (this.rallyPhase === 'rally') {
      // His second wind: no winning ground back until it burns out.
      f.gap -= TUNING.farmerPressure * TUNING.rallyPressure * dt * (t.inMud ? 6 : 1);
    } else if (this.rallyPhase === 'winded' && !t.inMud) {
      f.gap = Math.min(TUNING.farmerMaxGap, f.gap + TUNING.farmerRecovery * 1.8 * dt);
    } else if (f.cleanTime > 1.6) {
      f.gap = Math.min(TUNING.farmerMaxGap, f.gap + TUNING.farmerRecovery * dt);
    } else {
      f.gap -= TUNING.farmerPressure * dt * (t.inMud ? 6 : 1);
    }
    if (f.lunge > 0) f.lunge = Math.max(0, f.lunge - dt * 2.2);
    if (f.bubbleT > 0) f.bubbleT -= dt;
    this.bubbleT -= dt;
    if (this.bubbleT <= 0) {
      this.say(this.rng.pick(FARMER_LINES), 2.4);
      this.bubbleT = this.rng.range(5.5, 9);
    }

    // --- the world and its dangers ----------------------------------------
    this.world.update(this.cameraX, this.speed, this.distanceM);
    this.updateItems(dt);

    // --- dust at the turkey's heels ----------------------------------------
    this.dustT -= dt;
    if (t.grounded && this.dustT <= 0) {
      this.dustT = 0.09;
      this.particles.push({
        x: TURKEY_X - 26, y: GROUND_Y - 3,
        vx: this.rng.range(-60, -20), vy: this.rng.range(-46, -8),
        t: 0, life: this.rng.range(0.3, 0.55), size: this.rng.range(3, 6.5),
        color: 'rgba(190,160,115,0.55)', gravity: -30,
      });
    }
    this.updateParticles(dt);
    for (const p of this.popups) {
      p.t += dt;
      p.y -= dt * 44;
    }
    this.popups = this.popups.filter((p) => p.t < 0.95);

    // --- the two ways a run ends -------------------------------------------
    if (this.distanceM >= ESCAPE_METERS) return this.finish(true);
    if (f.gap <= TUNING.catchGap || this.hearts <= 0) return this.finish(false);
  }

  updateItems(dt) {
    const t = this.turkey;
    const turkeyWorldX = this.cameraX + TURKEY_X;
    t.inMud = false;
    t.hidden = false;
    t.hideItem = null;

    for (const item of this.world.items) {
      const screenX = item.x - this.cameraX;
      const fp = FOOTPRINTS[item.type];
      if (!fp) {
        // Pickups.
        if (item.taken) continue;
        const cy = t.feetY - 46 + t.duck * 18;
        if (Math.abs(screenX - TURKEY_X) < 42 && Math.abs(item.y - cy) < 58) {
          item.taken = true;
          const golden = item.type === 'goldcorn';
          // The streak: chain cobs without a pause and each one pays the
          // multiplier — up to five times. Routing through an arc instead
          // of around it stops being greed and becomes the fast way home.
          this.combo++;
          this.comboT = TUNING.comboWindow;
          this.bestCombo = Math.max(this.bestCombo, this.combo);
          const mult = Math.min(this.combo, TUNING.comboMaxMult);
          const points = (golden ? TUNING.goldCornScore : TUNING.cornScore) * mult;
          this.score += points;
          this.cornCount++;
          this.farmer.gap = Math.min(TUNING.farmerMaxGap, this.farmer.gap + TUNING.cornGapGift);
          const label = golden
            ? (mult > 1 ? `+${points} GOLD ×${mult}!` : '+100 GOLD CORN!')
            : (mult > 1 ? `+${points} ×${mult}` : '+25');
          this.popup(screenX, item.y - 34, label, golden || mult > 1 ? '#ffd94d' : '#fff6e3');
          this.burst(screenX, item.y, golden ? ['#ffd94d', '#fff3b0'] : ['#f5b921', '#ffe9a8'], 8, 160);
          if (golden) this.sound.goldPop(); else this.sound.pop();
        }
        continue;
      }

      if (fp.kind === 'knife') {
        if (item.state === 'armed' && screenX < 940) {
          item.state = 'falling';
          item.vy = 60;
          this.sound.whistle();
        } else if (item.state === 'falling') {
          item.vy += 2600 * dt;
          item.y += item.vy * dt;
          if (item.y >= GROUND_Y - 46) {
            item.state = 'stuck';
            item.y = GROUND_Y - 46;
            this.sound.thunk();
            this.burst(screenX, GROUND_Y - 6, ['#cbb590', '#8a6a42'], 6, 130);
            if (Math.abs(screenX - TURKEY_X) < 40 && t.feetY > GROUND_Y - 60) this.stumble(screenX);
          }
        }
        continue;
      }

      if (fp.kind === 'cleaver') {
        item.x -= item.vx * dt;
        item.spin += dt * 9;
        if (!item.passed && screenX < TURKEY_X - 30) {
          item.passed = true;
          if (t.duck > 0.6) this.nearMiss(screenX, item.y - 30);
        }
        if (!item.hit && Math.abs(screenX - TURKEY_X) < 40 && t.duck < 0.6 && t.feetY > GROUND_Y - 128) {
          item.hit = true;
          this.stumble(screenX);
        }
        continue;
      }

      if (fp.kind === 'mud') {
        if (t.grounded && Math.abs(screenX - TURKEY_X) < fp.w / 2) t.inMud = true;
        continue;
      }

      // Ground obstacles: clear them or stumble over them.
      const top = GROUND_Y - fp.h;
      if (Math.abs(screenX - TURKEY_X) < fp.w / 2 + 44) {
        item.minFeetY = Math.min(item.minFeetY ?? Infinity, t.feetY);
      }
      if (!item.passed && screenX + fp.w / 2 < TURKEY_X - 26) {
        item.passed = true;
        if (item.minFeetY !== undefined) {
          const clearance = top - item.minFeetY;
          if (clearance >= -4 && clearance < TUNING.nearMissPx) {
            this.nearMiss(TURKEY_X, top - 26);
          }
        }
      }
      // Hiding: duck low behind a hay bale and the farmer loses you. The
      // bale is cover, not a hurdle, while you are ducked into it.
      if (
        item.type === 'hay' &&
        t.grounded &&
        t.duck > 0.6 &&
        Math.abs(screenX - TURKEY_X) < fp.w / 2 + 26
      ) {
        t.hidden = true;
        t.hideItem = item;
        if (!item.hideShown) {
          item.hideShown = true;
          this.popup(TURKEY_X + 12, GROUND_Y - 122, 'HIDDEN!', '#ffd94d');
          this.say('Where did it go?!', 1.6);
        }
      }

      if (
        !item.hit &&
        Math.abs(screenX - TURKEY_X) < fp.w / 2 + 20 &&
        t.feetY > top + 16 &&
        !(item.type === 'hay' && t.duck > 0.6)
      ) {
        item.hit = true;
        this.stumble(screenX);
      }
    }
    void turkeyWorldX;
  }

  nearMiss(x, y) {
    this.nearMisses++;
    this.score += TUNING.nearMissScore;
    this.slowT = 0.28;
    this.sound.whoosh();
    this.popup(x, y, 'CLOSE! +15', '#ffd94d');
  }

  stumble(atX) {
    const t = this.turkey;
    if (t.invuln > 0 || this.state !== 'play') return;
    this.hearts--;
    // A stumble breaks the streak as surely as it breaks your stride.
    if (this.combo >= 3) this.popup(TURKEY_X, GROUND_Y - 172, 'STREAK LOST', '#ff9d8a');
    this.combo = 0;
    this.comboT = 0;
    this.farmer.gap -= TUNING.stumbleGapLoss;
    this.farmer.lunge = 1;
    this.farmer.cleanTime = 0;
    t.invuln = TUNING.invulnTime;
    this.shakeT = 0.32;
    this.flashT = 0.16;
    this.sound.thud();
    this.say(this.rng.pick(STUMBLE_LINES), 1.5);
    this.burst(atX, GROUND_Y - 50, ['#f2e2c4', '#e09f3e', '#b84a2e', '#8a5a33'], 13, 260);
    this.popup(TURKEY_X, GROUND_Y - 130, 'OUCH!', '#ff9d8a');
  }

  finish(escaped) {
    this.state = escaped ? 'escaped' : 'caught';
    this.endT = 0;
    this.score = Math.floor(this.score);
    this.best = Math.max(this.best, this.score);
    this.sound.stopMusic();
    if (escaped) {
      this.sound.fanfare();
      this.burst(TURKEY_X + 120, GROUND_Y - 120, ['#ffd94d', '#7ec850', '#f2e2c4', '#e09f3e'], 34, 330);
    } else {
      this.sound.sting();
      this.say('GOTCHA!', 3);
    }
  }

  updateParticles(dt) {
    for (const p of this.particles) {
      p.t += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.gravity * dt;
    }
    this.particles = this.particles.filter((p) => p.t < p.life);
  }
}
