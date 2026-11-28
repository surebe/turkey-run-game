// The renderer: stage backdrops with parallax, the kitchen interior, the HUD,
// the title and end screens, speech bubbles and popups. Decoration that must
// look the same in every render of the same moment (clouds, dirt speckles,
// drifting leaves) is placed by a hash of its index, never by the game's RNG.

import { COLORS, ESCAPE_METERS, GROUND_Y, PX_PER_METER, STAGES, TUNING, TURKEY_X, VIEW_H, VIEW_W } from './config.js';
import { drawCleaver, drawCorn, drawCounter, drawFarmer, drawFence, drawGate, drawHayBale, drawKnife, drawMud, drawOven, drawPumpkins, drawTurkey } from './sprites.js';

function hash(n) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function text(ctx, str, x, y, font, color, align = 'left', alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
  ctx.restore();
}

function panel(ctx, x, y, w, h, color, radius = 14) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
  ctx.fill();
}

export class Renderer {
  draw(ctx, game) {
    ctx.save();
    if (game.shakeT > 0) {
      const m = game.shakeT * 22;
      ctx.translate((hash(game.time * 60) - 0.5) * m, (hash(game.time * 60 + 9) - 0.5) * m);
    }
    if (game.state === 'title') this.drawTitle(ctx, game);
    else if (game.state === 'caught') this.drawCaught(ctx, game);
    else if (game.state === 'escaped') this.drawEscaped(ctx, game);
    else {
      this.drawScene(ctx, game);
      this.drawHud(ctx, game);
    }
    ctx.restore();
    if (game.flashT > 0) {
      ctx.fillStyle = `rgba(192,57,43,${(game.flashT / 0.16) * 0.22})`;
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    }
  }

  // ------------------------------------------------------------- the scene
  drawScene(ctx, game) {
    const stage = game.world.stage(game.distanceM);
    this.drawBackdrop(ctx, game, stage);
    this.drawGround(ctx, game, stage);

    // The freedom gate scrolls in over the last stretch, standing exactly
    // where the turkey crosses the 1,000 m line.
    const gateScreenX = TURKEY_X + (ESCAPE_METERS * PX_PER_METER - game.cameraX);
    if (gateScreenX < VIEW_W + 160) drawGate(ctx, gateScreenX, GROUND_Y);

    for (const item of game.world.items) this.drawItem(ctx, game, item);

    // The farmer, forever behind.
    const farmerX = TURKEY_X - game.farmer.gap;
    const lunging = game.farmer.lunge > 0 || game.farmer.gap < 110;
    drawFarmer(ctx, farmerX, GROUND_Y, { run: game.farmer.runPhase, lunge: lunging ? 1 : 0.25 });

    // The turkey, blinking while mercy lasts.
    const t = game.turkey;
    const blink = t.invuln > 0 && Math.floor(game.time * 14) % 2 === 0;
    drawTurkey(ctx, TURKEY_X, t.feetY, {
      run: t.runPhase,
      tilt: t.tilt,
      duck: t.duck,
      flap: !t.grounded && t.jumps >= 2 ? 1 : 0,
      hurt: blink,
    });

    // Hidden behind a hay bale: the bale's front goes over the bird, so
    // only its head and tail peek out while the farmer searches.
    if (t.hidden && t.hideItem) drawHayBale(ctx, t.hideItem.x - game.cameraX, GROUND_Y);

    // His shout goes on top of everything, or the turkey's tail eats it.
    if (game.farmer.bubbleT > 0 && game.farmer.bubble) {
      this.drawBubble(ctx, farmerX + 30, GROUND_Y - 218, game.farmer.bubble);
    }

    this.drawParticles(ctx, game);
    for (const p of game.popups) {
      text(ctx, p.text, p.x, p.y, 'bold 25px Georgia, serif', p.color, 'center', 1 - p.t / 0.95);
    }

    // Stage banner.
    if (game.world.stageBannerT > 0) {
      const a = Math.min(1, game.world.stageBannerT / 0.5);
      text(ctx, stage.shout, VIEW_W / 2, 190, 'bold 44px Georgia, serif', COLORS.cream, 'center', a);
    }

    this.drawLeaves(ctx, game.time);
  }

  drawBackdrop(ctx, game, stage) {
    if (stage.indoor) return this.drawKitchen(ctx, game);
    const sky = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    sky.addColorStop(0, stage.skyTop);
    sky.addColorStop(1, stage.skyBottom);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, VIEW_W, GROUND_Y);

    // Sun, low and golden.
    ctx.fillStyle = 'rgba(255,236,170,0.9)';
    ctx.beginPath();
    ctx.arc(1080, 128, 46, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,236,170,0.25)';
    ctx.beginPath();
    ctx.arc(1080, 128, 74, 0, Math.PI * 2);
    ctx.fill();

    // Clouds, drifting slowly against the run.
    ctx.fillStyle = 'rgba(255,250,238,0.85)';
    for (let i = 0; i < 6; i++) {
      const cx = ((hash(i * 7) * 1500 - game.cameraX * 0.05 - game.time * 4) % 1500 + 1500) % 1500 - 110;
      const cy = 52 + hash(i * 13) * 130;
      const s = 0.7 + hash(i * 3) * 0.7;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 52 * s, 17 * s, 0, 0, Math.PI * 2);
      ctx.ellipse(cx + 30 * s, cy + 5, 38 * s, 13 * s, 0, 0, Math.PI * 2);
      ctx.ellipse(cx - 34 * s, cy + 6, 32 * s, 11 * s, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Far hills and a barn silhouette, then nearer tree line.
    ctx.fillStyle = stage.hillFar;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    for (let x = 0; x <= VIEW_W; x += 40) {
      const wx = x + game.cameraX * 0.18;
      ctx.lineTo(x, GROUND_Y - 120 - Math.sin(wx * 0.004) * 42 - hash(Math.floor(wx / 300)) * 26);
    }
    ctx.lineTo(VIEW_W, GROUND_Y);
    ctx.fill();

    const barnX = 700 - (game.cameraX * 0.18) % 2600;
    if (game.world.stageIndex(game.distanceM) <= 1 && barnX > -260 && barnX < VIEW_W + 60) {
      ctx.fillStyle = '#8e3b2c';
      ctx.fillRect(barnX, GROUND_Y - 168, 150, 108);
      ctx.beginPath();
      ctx.moveTo(barnX - 12, GROUND_Y - 168);
      ctx.lineTo(barnX + 75, GROUND_Y - 224);
      ctx.lineTo(barnX + 162, GROUND_Y - 168);
      ctx.closePath();
      ctx.fillStyle = '#6e2a1f';
      ctx.fill();
      ctx.fillStyle = '#f2e2c4';
      ctx.fillRect(barnX + 58, GROUND_Y - 128, 34, 68);
    }

    ctx.fillStyle = stage.hillNear;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    for (let x = 0; x <= VIEW_W; x += 40) {
      const wx = x + game.cameraX * 0.42;
      ctx.lineTo(x, GROUND_Y - 44 - Math.sin(wx * 0.006 + 2) * 24 - hash(Math.floor(wx / 210)) * 18);
    }
    ctx.lineTo(VIEW_W, GROUND_Y);
    ctx.fill();

    // A mid-ground fence line running the length of the farm, between the
    // hills and the road: it fills the empty band under the sky and gives
    // the run something to race past.
    const fenceOff = -(game.cameraX * 0.62) % 110;
    ctx.strokeStyle = 'rgba(122,79,40,0.55)';
    ctx.lineWidth = 5;
    for (const railY of [GROUND_Y - 118, GROUND_Y - 94]) {
      ctx.beginPath();
      ctx.moveTo(-12, railY);
      ctx.lineTo(VIEW_W + 12, railY);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(110,70,36,0.6)';
    for (let x = fenceOff - 110; x < VIEW_W + 110; x += 110) {
      ctx.fillRect(x, GROUND_Y - 128, 8, 44);
    }

    // Autumn trees on the near line.
    for (let i = 0; i < 9; i++) {
      const spacing = 300;
      const base = Math.floor((game.cameraX * 0.42) / spacing);
      const tx = (base + i) * spacing - game.cameraX * 0.42 + hash(base + i) * 90;
      if (tx < -70 || tx > VIEW_W + 70) continue;
      const s = (0.8 + hash(base + i * 3) * 0.5) * 1.25;
      ctx.fillStyle = '#5d3a1e';
      ctx.fillRect(tx - 4 * s, GROUND_Y - 66 * s, 8 * s, 66 * s);
      const cols = ['#c96a2e', '#d98e3a', '#b84a2e'];
      for (let j = 0; j < 3; j++) {
        ctx.fillStyle = cols[j % 3];
        ctx.beginPath();
        ctx.arc(tx + (j - 1) * 17 * s, GROUND_Y - (84 + j * 13) * s, (25 - j * 4) * s, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  drawKitchen(ctx, game) {
    // Inside the farmhouse kitchen: warm walls, a window on the yard you are
    // escaping, hanging pans, and a checkered floor underfoot.
    ctx.fillStyle = '#7a4a2c';
    ctx.fillRect(0, 0, VIEW_W, GROUND_Y);
    ctx.fillStyle = '#8a5733';
    ctx.fillRect(0, 0, VIEW_W, 300);
    ctx.fillStyle = '#6e4023';
    ctx.fillRect(0, 470, VIEW_W, GROUND_Y - 470);

    const off = -(game.cameraX * 0.3) % 420;
    for (let i = -1; i < 5; i++) {
      const wx = off + i * 420;
      // Window with the green world outside.
      ctx.fillStyle = '#5d3a1e';
      ctx.fillRect(wx + 56, 60, 158, 204);
      const grad = ctx.createLinearGradient(0, 70, 0, 254);
      grad.addColorStop(0, '#7ec8e3');
      grad.addColorStop(1, '#cfe8b8');
      ctx.fillStyle = grad;
      ctx.fillRect(wx + 66, 70, 138, 184);
      ctx.fillStyle = '#3f7d4e';
      ctx.beginPath();
      ctx.ellipse(wx + 100, 254, 60, 26, 0, Math.PI, Math.PI * 2);
      ctx.ellipse(wx + 165, 254, 52, 20, 0, Math.PI, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#5d3a1e';
      ctx.fillRect(wx + 132, 70, 7, 184);
      ctx.fillRect(wx + 66, 158, 138, 7);
      // Hanging pans and a string of garlic beside it.
      ctx.fillStyle = '#3c3f45';
      ctx.beginPath();
      ctx.ellipse(wx + 300, 150, 26, 32, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(wx + 296, 96, 7, 26);
      ctx.fillStyle = '#22252a';
      ctx.beginPath();
      ctx.ellipse(wx + 356, 138, 19, 24, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(wx + 353, 92, 6, 22);
      ctx.fillStyle = '#e8e0cc';
      for (let g = 0; g < 4; g++) {
        ctx.beginPath();
        ctx.ellipse(wx + 262 + (g % 2) * 9, 108 + g * 21, 7.5, 10, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // A shelf of preserve jars across the middle of the wall, and a rail
      // of hanging utensils under it: the band the chase runs through
      // should read as a working kitchen, not an empty wall.
      ctx.fillStyle = '#5d3a1e';
      ctx.fillRect(wx + 36, 330, 348, 10);
      const jarFills = ['#b84a2e', '#e09f3e', '#7ec850'];
      for (let j = 0; j < 3; j++) {
        const jx = wx + 84 + j * 96;
        ctx.fillStyle = 'rgba(238,230,210,0.92)';
        ctx.beginPath();
        ctx.roundRect(jx, 288, 38, 42, 6);
        ctx.fill();
        ctx.fillStyle = jarFills[j];
        ctx.beginPath();
        ctx.roundRect(jx + 4, 302, 30, 24, 5);
        ctx.fill();
        ctx.fillStyle = '#8a5a2e';
        ctx.fillRect(jx + 3, 282, 32, 8);
      }
      ctx.fillStyle = '#3c2417';
      ctx.fillRect(wx + 36, 402, 348, 6);
      ctx.strokeStyle = '#2e2a26';
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      for (const ux of [wx + 96, wx + 200, wx + 304]) {
        ctx.beginPath();
        ctx.moveTo(ux, 408);
        ctx.lineTo(ux, 436);
        ctx.stroke();
      }
      // Ladle bowl, spatula head and a little saucepan, hanging in a row.
      ctx.fillStyle = '#454b52';
      ctx.beginPath();
      ctx.ellipse(wx + 96, 446, 11, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(wx + 190, 436, 20, 24);
      ctx.beginPath();
      ctx.ellipse(wx + 304, 448, 17, 11, 0, Math.PI, Math.PI * 2);
      ctx.fill();
    }

    // Checkered floor.
    const tile = 64;
    const startX = -(game.cameraX % (tile * 2));
    for (let row = 0; row < 3; row++) {
      for (let col = -1; col < VIEW_W / tile + 1; col++) {
        ctx.fillStyle = (row + col) % 2 === 0 ? '#9c6b42' : '#845631';
        ctx.fillRect(startX + col * tile, GROUND_Y + row * 45, tile, 45);
      }
    }
  }

  drawGround(ctx, game, stage) {
    if (stage.indoor) return; // the kitchen floor is drawn with the room
    ctx.fillStyle = stage.ground;
    ctx.fillRect(0, GROUND_Y, VIEW_W, VIEW_H - GROUND_Y);
    ctx.fillStyle = 'rgba(0,0,0,0.10)';
    const stripe = 92;
    const off = -(game.cameraX % stripe);
    for (let x = off; x < VIEW_W; x += stripe) ctx.fillRect(x, GROUND_Y, 34, VIEW_H - GROUND_Y);
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.fillRect(0, GROUND_Y, VIEW_W, 5);
    // Dirt speckles placed by world position, so they stream past honestly.
    ctx.fillStyle = 'rgba(0,0,0,0.20)';
    const cell = 130;
    const base = Math.floor(game.cameraX / cell);
    for (let i = 0; i < 12; i++) {
      const wx = (base + i) * cell + hash(base + i) * 80;
      const sx = wx - game.cameraX;
      const sy = GROUND_Y + 18 + hash(base + i * 7) * 90;
      ctx.fillRect(sx, sy, 9, 4);
    }
  }

  drawItem(ctx, game, item) {
    const screenX = item.x - game.cameraX;
    if (screenX < -180 || screenX > VIEW_W + 180) return;
    switch (item.type) {
      case 'mud': drawMud(ctx, screenX, GROUND_Y, 120); break;
      case 'hay': drawHayBale(ctx, screenX, GROUND_Y); break;
      case 'fence': drawFence(ctx, screenX, GROUND_Y); break;
      case 'pumpkin': drawPumpkins(ctx, screenX, GROUND_Y, null); break;
      case 'oven': drawOven(ctx, screenX, GROUND_Y, game.time); break;
      case 'counter': drawCounter(ctx, screenX, GROUND_Y); break;
      case 'corn': if (!item.taken) drawCorn(ctx, screenX, item.y, false, game.time + item.x); break;
      case 'goldcorn': if (!item.taken) drawCorn(ctx, screenX, item.y, true, game.time + item.x); break;
      case 'cleaver': drawCleaver(ctx, screenX, item.y, item.spin); break;
      case 'knife': {
        // The shadow on the ground is the warning; watch it grow.
        const h = Math.max(0, Math.min(1, (item.y + 60) / (GROUND_Y - 60)));
        ctx.fillStyle = `rgba(20,10,5,${0.12 + h * 0.3})`;
        ctx.beginPath();
        ctx.ellipse(screenX, GROUND_Y + 6, 8 + h * 20, 3.5 + h * 3.5, 0, 0, Math.PI * 2);
        ctx.fill();
        if (item.state !== 'armed' || screenX < 1100) drawKnife(ctx, screenX, item.y + 46, item.state === 'falling' ? Math.sin(game.time * 30) * 0.05 : 0);
        // A flashing marker at the top of the knife's column: the fair
        // warning that something sharp is about to arrive there.
        if (item.state !== 'stuck' && screenX > 30 && screenX < VIEW_W - 30) {
          const pulse = 0.62 + Math.sin(game.time * 10) * 0.38;
          ctx.save();
          ctx.globalAlpha = pulse;
          ctx.fillStyle = COLORS.red;
          ctx.beginPath();
          ctx.moveTo(screenX, 96);
          ctx.lineTo(screenX + 13, 120);
          ctx.lineTo(screenX - 13, 120);
          ctx.closePath();
          ctx.fill();
          text(ctx, '!', screenX, 111, 'bold 15px system-ui, sans-serif', COLORS.cream, 'center');
          ctx.restore();
        }
        break;
      }
    }
  }

  drawParticles(ctx, game) {
    for (const p of game.particles) {
      ctx.globalAlpha = Math.max(0, 1 - p.t / p.life);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  drawLeaves(ctx, time) {
    for (let i = 0; i < 16; i++) {
      const fall = 26 + hash(i * 5) * 30;
      const sway = 24 + hash(i * 9) * 30;
      const x = ((hash(i * 3) * 1400 + Math.sin(time * 0.7 + i) * sway) % 1400 + 1400) % 1400 - 60;
      const y = ((hash(i * 11) * 900 + time * fall) % 880) - 40;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(time * (0.6 + hash(i)) + i);
      ctx.fillStyle = ['#c96a2e', '#d98e3a', '#b84a2e'][i % 3];
      ctx.globalAlpha = 0.75;
      ctx.beginPath();
      ctx.ellipse(0, 0, 8, 4.4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  drawBubble(ctx, x, y, str) {
    ctx.font = 'bold 19px Georgia, serif';
    const w = ctx.measureText(str).width + 30;
    ctx.fillStyle = COLORS.cream;
    ctx.beginPath();
    ctx.roundRect(x - w / 2, y - 21, w, 42, 15);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x - 8, y + 19);
    ctx.lineTo(x + 10, y + 19);
    ctx.lineTo(x - 14, y + 38);
    ctx.closePath();
    ctx.fill();
    text(ctx, str, x, y + 1, 'bold 19px Georgia, serif', COLORS.ink, 'center');
  }

  // ------------------------------------------------------------------ HUD
  drawHud(ctx, game) {
    panel(ctx, 18, 16, 300, 64, 'rgba(30,17,8,0.62)');
    text(ctx, 'SCORE', 36, 36, 'bold 15px system-ui, sans-serif', '#e8c88a');
    text(ctx, String(Math.floor(game.score)).padStart(6, '0'), 36, 62, 'bold 30px Georgia, serif', COLORS.cream);
    text(ctx, `🌽 ${game.cornCount}`, 218, 50, 'bold 24px Georgia, serif', '#ffd94d');

    // Distance and the road to freedom.
    panel(ctx, 424, 16, 432, 64, 'rgba(30,17,8,0.62)');
    const m = Math.min(999, Math.floor(game.distanceM));
    text(ctx, `${m} m  /  ${ESCAPE_METERS} m`, VIEW_W / 2, 38, 'bold 21px Georgia, serif', COLORS.cream, 'center');
    ctx.fillStyle = 'rgba(255,246,227,0.25)';
    ctx.beginPath();
    ctx.roundRect(448, 58, 384, 9, 5);
    ctx.fill();
    ctx.fillStyle = '#7ec850';
    ctx.beginPath();
    ctx.roundRect(448, 58, 384 * Math.min(1, game.distanceM / ESCAPE_METERS), 9, 5);
    ctx.fill();
    text(ctx, '⚑', 842, 63, '17px Georgia, serif', '#ffd94d', 'center');

    // Hearts and the farmer meter.
    panel(ctx, 962, 16, 300, 64, 'rgba(30,17,8,0.62)');
    for (let i = 0; i < TUNING.hearts; i++) {
      text(ctx, i < game.hearts ? '❤️' : '🖤', 986 + i * 33, 40, '21px Georgia, serif', COLORS.cream, 'center');
    }
    const danger = 1 - Math.max(0, Math.min(1, (game.farmer.gap - TUNING.catchGap) / (TUNING.farmerMaxGap - TUNING.catchGap)));
    text(ctx, 'FARMER', 1096, 40, 'bold 13px system-ui, sans-serif', '#e8c88a');
    ctx.fillStyle = 'rgba(255,246,227,0.25)';
    ctx.beginPath();
    ctx.roundRect(1150, 30, 92, 13, 6);
    ctx.fill();
    ctx.fillStyle = danger > 0.72 ? '#e74c3c' : danger > 0.45 ? '#f5a623' : '#7ec850';
    ctx.beginPath();
    ctx.roundRect(1150, 30, 92 * danger, 13, 6);
    ctx.fill();
    const stage = game.world.stage(game.distanceM);
    text(ctx, stage.name.toUpperCase(), 1244, 66, 'bold 13px system-ui, sans-serif', '#e8c88a', 'right');
    text(ctx, 'SPACE jump x2 · DOWN duck · M mute', VIEW_W / 2, VIEW_H - 16, '14px system-ui, sans-serif', 'rgba(43,26,16,0.55)', 'center');
  }

  // --------------------------------------------------------------- screens
  drawTitle(ctx, game) {
    const fake = { ...game, distanceM: 40, cameraX: game.time * 24 };
    this.drawBackdrop(ctx, fake, STAGES[0]);
    this.drawGround(ctx, fake, STAGES[0]);

    // A hay bale for the farmer to lurk behind, and the stars of the show.
    drawHayBale(ctx, 1010, GROUND_Y);
    drawFarmer(ctx, 1052, GROUND_Y, { run: game.time * 2, lunge: 0 });
    drawTurkey(ctx, 560, GROUND_Y, { run: game.turkey.runPhase, tilt: 0, duck: 0, flap: 0 });
    this.drawLeaves(ctx, game.time);

    // Title block.
    ctx.save();
    ctx.translate(VIEW_W / 2, 196);
    ctx.rotate(-0.025);
    text(ctx, 'GOBBLE DASH', 5, 5, 'bold 118px Georgia, serif', 'rgba(90,40,10,0.55)', 'center');
    text(ctx, 'GOBBLE DASH', 0, 0, 'bold 118px Georgia, serif', '#fff3d6', 'center');
    text(ctx, '— THE GREAT TURKEY ESCAPE —', 0, 76, 'bold 30px Georgia, serif', '#7a2d16', 'center');
    ctx.restore();

    panel(ctx, 340, 356, 600, 128, 'rgba(30,17,8,0.66)', 18);
    text(ctx, 'Thanksgiving is coming. The farmer is hungry.', VIEW_W / 2, 388, 'bold 22px Georgia, serif', COLORS.cream, 'center');
    text(ctx, 'Run 1,000 m to the forest gate: jump the fences,', VIEW_W / 2, 420, '19px Georgia, serif', '#f2e2c4', 'center');
    text(ctx, 'duck the cleavers, dodge the falling knives, grab the corn.', VIEW_W / 2, 448, '19px Georgia, serif', '#f2e2c4', 'center');

    const pulse = 0.72 + Math.sin(game.time * 4) * 0.28;
    panel(ctx, 165, 512, 950, 102, 'rgba(30,17,8,0.44)', 16);
    text(ctx, 'PRESS SPACE OR CLICK TO RUN FOR YOUR LIFE', VIEW_W / 2, 540, 'bold 27px Georgia, serif', '#ffd94d', 'center', pulse);
    text(ctx, 'SPACE / CLICK — jump (again mid-air for a feather-flutter)      DOWN — duck      M — mute', VIEW_W / 2, 584, '17px system-ui, sans-serif', '#f7e3b8', 'center');
    if (game.best > 0) text(ctx, `BEST SCORE  ${game.best}`, VIEW_W / 2, 626, 'bold 19px Georgia, serif', '#7a2d16', 'center');
  }

  drawCaught(ctx, game) {
    const fake = { ...game, distanceM: Math.min(game.distanceM, 300), cameraX: game.cameraX };
    this.drawBackdrop(ctx, fake, STAGES[0]);
    this.drawGround(ctx, fake, STAGES[0]);
    ctx.fillStyle = 'rgba(24,8,4,0.32)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    this.drawStats(ctx, game);

    // The farmer, triumphant, turkey held high by the legs.
    drawFarmer(ctx, 520, GROUND_Y, { run: 0, lunge: 1 });
    ctx.save();
    ctx.translate(592, GROUND_Y - 196);
    ctx.rotate(Math.PI + Math.sin(game.time * 2.2) * 0.08);
    drawTurkey(ctx, 0, 0, { run: 0, tilt: 0, duck: 0, flap: 0 });
    ctx.restore();
    this.drawBubble(ctx, 520, GROUND_Y - 330, 'GOTCHA!');

    text(ctx, 'CAUGHT!', VIEW_W / 2, 128, 'bold 96px Georgia, serif', '#ff8a75', 'center');
    text(ctx, 'The farmer got his Thanksgiving dinner after all…', VIEW_W / 2, 196, '24px Georgia, serif', COLORS.cream, 'center');
    const pulse = 0.72 + Math.sin(game.time * 4) * 0.28;
    text(ctx, 'PRESS SPACE TO RUN AGAIN', VIEW_W / 2, 560, 'bold 26px Georgia, serif', '#ffd94d', 'center', pulse);
  }

  drawEscaped(ctx, game) {
    const fake = { ...game, distanceM: ESCAPE_METERS, cameraX: ESCAPE_METERS * PX_PER_METER - 700 };
    this.drawBackdrop(ctx, fake, STAGES[3]);
    this.drawGround(ctx, fake, STAGES[3]);

    // Sunburst behind the free bird.
    ctx.save();
    ctx.translate(880, GROUND_Y - 150);
    ctx.rotate(game.time * 0.14);
    ctx.fillStyle = 'rgba(255,217,77,0.20)';
    for (let i = 0; i < 12; i++) {
      ctx.rotate(Math.PI / 6);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(330, -26);
      ctx.lineTo(330, 26);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // The gate goes over the sunburst, so FREEDOM stays readable.
    drawGate(ctx, 700, GROUND_Y);

    drawTurkey(ctx, 880, GROUND_Y, { run: game.time * 10, tilt: -0.06, duck: 0, flap: 0.6 + Math.sin(game.time * 6) * 0.3 });
    this.drawParticles(ctx, game);
    this.drawLeaves(ctx, game.time);

    text(ctx, 'ESCAPED!', VIEW_W / 2, 118, 'bold 96px Georgia, serif', '#2e5d3a', 'center');
    text(ctx, 'Free as a bird — no dinner tonight, farmer!', VIEW_W / 2, 184, '24px Georgia, serif', COLORS.ink, 'center');
    this.drawStats(ctx, game, 232);
    const pulse = 0.72 + Math.sin(game.time * 4) * 0.28;
    panel(ctx, 415, 570, 450, 50, 'rgba(30,17,8,0.45)', 14);
    text(ctx, 'PRESS SPACE TO RUN AGAIN', VIEW_W / 2, 595, 'bold 26px Georgia, serif', '#ffd94d', 'center', pulse);
  }

  drawStats(ctx, game, topY = 258) {
    panel(ctx, 440, topY, 400, 168, 'rgba(30,17,8,0.66)', 18);
    const rows = [
      ['SCORE', String(game.score)],
      ['DISTANCE', `${Math.floor(game.distanceM)} m`],
      ['CORN', `${game.cornCount}`],
      ['CLOSE CALLS', `${game.nearMisses}`],
      ['BEST', `${game.best}`],
    ];
    rows.forEach(([k, v], i) => {
      text(ctx, k, 478, topY + 36 + i * 31, 'bold 17px system-ui, sans-serif', '#e8c88a');
      text(ctx, v, 802, topY + 36 + i * 31, 'bold 20px Georgia, serif', COLORS.cream, 'right');
    });
  }
}
