// The renderer: stage backdrops with parallax, the kitchen interior, the HUD,
// the title and end screens, speech bubbles and popups. Decoration that must
// look the same in every render of the same moment (clouds, dirt speckles,
// drifting leaves) is placed by a hash of its index, never by the game's RNG.

import { COLORS, ESCAPE_METERS, GROUND_Y, PX_PER_METER, STAGES, TUNING, TURKEY_X, VIEW_H, VIEW_W } from './config.js';
import { drawCleaver, drawCorn, drawCounter, drawFarmer, drawFence, drawGate, drawHayBale, drawKnife, drawMud, drawOven, drawPumpkins, drawTurkey, shade, softShadow } from './sprites.js';

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
  // A smoked-glass panel: darker at the foot, with a warm lit top edge so
  // the HUD reads as one crafted piece, not three flat boxes.
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, 'rgba(52,30,14,0.72)');
  g.addColorStop(1, 'rgba(22,12,5,0.72)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,214,150,0.28)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.roundRect(x + 0.6, y + 0.6, w - 1.2, h - 1.2, radius);
  ctx.stroke();
  void color;
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
    if (gateScreenX < VIEW_W + 160) {
      softShadow(ctx, gateScreenX, GROUND_Y + 5, 96, 9, 0.20);
      drawGate(ctx, gateScreenX, GROUND_Y);
    }

    for (const item of game.world.items) this.drawItem(ctx, game, item);

    // The farmer, forever behind — planted on a soft contact shadow.
    const farmerX = TURKEY_X - game.farmer.gap;
    const lunging = game.farmer.lunge > 0 || game.farmer.gap < 110;
    softShadow(ctx, farmerX + 4, GROUND_Y + 6, 50, 9, 0.30);
    drawFarmer(ctx, farmerX, GROUND_Y, { run: game.farmer.runPhase, lunge: lunging ? 1 : 0.25 });

    // The turkey, blinking while mercy lasts. Its shadow stays on the
    // ground and shrinks and fades as the bird climbs.
    const t = game.turkey;
    const airH = Math.max(0, GROUND_Y - t.feetY);
    softShadow(ctx, TURKEY_X, GROUND_Y + 6, Math.max(20, 42 - airH * 0.05), Math.max(4, 8 - airH * 0.012), Math.max(0.10, 0.30 - airH * 0.0006));
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

    // Rally banner: the farmer's second wind gets its own shout, in red.
    if (game.rallyBannerT > 0) {
      const a = Math.min(1, game.rallyBannerT / 0.4);
      text(ctx, 'FARMER RALLY!', VIEW_W / 2 + 2, 192, 'bold 46px Georgia, serif', 'rgba(90,20,8,0.6)', 'center', a);
      text(ctx, 'FARMER RALLY!', VIEW_W / 2, 190, 'bold 46px Georgia, serif', '#e74c3c', 'center', a);
    }

    this.drawLeaves(ctx, game.time);
  }

  drawBackdrop(ctx, game, stage) {
    if (stage.indoor) return this.drawKitchen(ctx, game);
    const sky = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    sky.addColorStop(0, stage.skyTop);
    sky.addColorStop(0.62, stage.skyBottom);
    sky.addColorStop(1, stage.skyBottom);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, VIEW_W, GROUND_Y);
    // A warm haze band where the sky meets the land.
    const haze = ctx.createLinearGradient(0, GROUND_Y - 190, 0, GROUND_Y);
    haze.addColorStop(0, 'rgba(255,240,205,0)');
    haze.addColorStop(1, 'rgba(255,240,205,0.35)');
    ctx.fillStyle = haze;
    ctx.fillRect(0, GROUND_Y - 190, VIEW_W, 190);

    // Sun, low and golden: a wide breathing glow, a halo, a bright core,
    // and a few soft rays fanning through the haze.
    const glow = ctx.createRadialGradient(1080, 128, 10, 1080, 128, 300);
    glow.addColorStop(0, 'rgba(255,226,150,0.55)');
    glow.addColorStop(0.4, 'rgba(255,214,130,0.18)');
    glow.addColorStop(1, 'rgba(255,214,130,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(780, 0, 600, 430);
    ctx.save();
    ctx.translate(1080, 128);
    ctx.rotate(0.5);
    ctx.fillStyle = 'rgba(255,238,180,0.10)';
    for (let i = 0; i < 5; i++) {
      ctx.rotate(Math.PI * 2 / 5);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(330, -17);
      ctx.lineTo(330, 17);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    ctx.fillStyle = 'rgba(255,240,190,0.35)';
    ctx.beginPath();
    ctx.arc(1080, 128, 76, 0, Math.PI * 2);
    ctx.fill();
    const core = ctx.createRadialGradient(1066, 114, 4, 1080, 128, 48);
    core.addColorStop(0, '#fffbe8');
    core.addColorStop(0.7, '#ffecaa');
    core.addColorStop(1, '#ffd76e');
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(1080, 128, 46, 0, Math.PI * 2);
    ctx.fill();

    // Clouds, drifting slowly against the run: a warm shadow under each
    // puff first, then the lit body, then a bright top.
    for (let i = 0; i < 6; i++) {
      const cx = ((hash(i * 7) * 1500 - game.cameraX * 0.05 - game.time * 4) % 1500 + 1500) % 1500 - 110;
      const cy = 52 + hash(i * 13) * 130;
      const s = 0.7 + hash(i * 3) * 0.7;
      const puff = (dy, style) => {
        ctx.fillStyle = style;
        ctx.beginPath();
        ctx.ellipse(cx, cy + dy, 52 * s, 17 * s, 0, 0, Math.PI * 2);
        ctx.ellipse(cx + 30 * s, cy + 5 + dy, 38 * s, 13 * s, 0, 0, Math.PI * 2);
        ctx.ellipse(cx - 34 * s, cy + 6 + dy, 32 * s, 11 * s, 0, 0, Math.PI * 2);
        ctx.fill();
      };
      puff(7 * s, 'rgba(216,164,110,0.40)');
      puff(0, 'rgba(255,250,238,0.88)');
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.beginPath();
      ctx.ellipse(cx - 6 * s, cy - 6 * s, 30 * s, 9 * s, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Far hills and a barn silhouette, then nearer tree line. Each ridge
    // is gradient-shaded: lit along its crest, deepening to its foot.
    const hillGrad = (top, colTop, colBot) => {
      const g = ctx.createLinearGradient(0, top, 0, GROUND_Y);
      g.addColorStop(0, colTop);
      g.addColorStop(1, colBot);
      return g;
    };
    ctx.fillStyle = hillGrad(GROUND_Y - 190, shade(stage.hillFar, 1.12), shade(stage.hillFar, 0.8));
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
      // Weathered red boards, a shaded roof, one lit window.
      const wall = ctx.createLinearGradient(0, GROUND_Y - 168, 0, GROUND_Y - 60);
      wall.addColorStop(0, '#a04534');
      wall.addColorStop(1, '#74301f');
      ctx.fillStyle = wall;
      ctx.fillRect(barnX, GROUND_Y - 168, 150, 108);
      ctx.strokeStyle = 'rgba(60,20,10,0.35)';
      ctx.lineWidth = 1.5;
      for (let bx = barnX + 18; bx < barnX + 148; bx += 18) {
        ctx.beginPath();
        ctx.moveTo(bx, GROUND_Y - 166);
        ctx.lineTo(bx, GROUND_Y - 62);
        ctx.stroke();
      }
      ctx.fillStyle = '#f7c948';
      ctx.fillRect(barnX + 108, GROUND_Y - 150, 20, 20);
      ctx.strokeStyle = '#5d2718';
      ctx.strokeRect(barnX + 108, GROUND_Y - 150, 20, 20);
      ctx.beginPath();
      ctx.moveTo(barnX - 12, GROUND_Y - 168);
      ctx.lineTo(barnX + 75, GROUND_Y - 224);
      ctx.lineTo(barnX + 162, GROUND_Y - 168);
      ctx.closePath();
      const roof = ctx.createLinearGradient(0, GROUND_Y - 224, 0, GROUND_Y - 168);
      roof.addColorStop(0, '#8a4636');
      roof.addColorStop(1, '#5d2718');
      ctx.fillStyle = roof;
      ctx.fill();
      ctx.fillStyle = '#f2e2c4';
      ctx.fillRect(barnX + 58, GROUND_Y - 128, 34, 68);
      ctx.strokeStyle = '#5d2718';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(barnX + 58, GROUND_Y - 128);
      ctx.lineTo(barnX + 92, GROUND_Y - 60);
      ctx.moveTo(barnX + 92, GROUND_Y - 128);
      ctx.lineTo(barnX + 58, GROUND_Y - 60);
      ctx.stroke();
    }

    ctx.fillStyle = hillGrad(GROUND_Y - 90, shade(stage.hillNear, 1.1), shade(stage.hillNear, 0.78));
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    for (let x = 0; x <= VIEW_W; x += 40) {
      const wx = x + game.cameraX * 0.42;
      ctx.lineTo(x, GROUND_Y - 44 - Math.sin(wx * 0.006 + 2) * 24 - hash(Math.floor(wx / 210)) * 18);
    }
    ctx.lineTo(VIEW_W, GROUND_Y);
    ctx.fill();

    // A mid-ground fence line running the length of the farm, between the
    // hills and the road: shaded rails and posts now, so the band has
    // depth instead of two flat strokes.
    const fenceOff = -(game.cameraX * 0.62) % 110;
    for (const railY of [GROUND_Y - 118, GROUND_Y - 94]) {
      const rg = ctx.createLinearGradient(0, railY - 3, 0, railY + 3);
      rg.addColorStop(0, 'rgba(146,102,56,0.62)');
      rg.addColorStop(1, 'rgba(96,62,28,0.62)');
      ctx.fillStyle = rg;
      ctx.fillRect(-12, railY - 3, VIEW_W + 24, 6);
    }
    for (let x = fenceOff - 110; x < VIEW_W + 110; x += 110) {
      const pg = ctx.createLinearGradient(x, 0, x + 8, 0);
      pg.addColorStop(0, 'rgba(128,84,40,0.66)');
      pg.addColorStop(1, 'rgba(88,56,24,0.66)');
      ctx.fillStyle = pg;
      ctx.fillRect(x, GROUND_Y - 128, 8, 44);
    }

    // Autumn trees on the near line: bark-lined trunks and canopies with
    // a lit crown, a shaded underside and flecks of brighter leaves.
    for (let i = 0; i < 9; i++) {
      const spacing = 300;
      const base = Math.floor((game.cameraX * 0.42) / spacing);
      const tx = (base + i) * spacing - game.cameraX * 0.42 + hash(base + i) * 90;
      if (tx < -70 || tx > VIEW_W + 70) continue;
      const s = (0.8 + hash(base + i * 3) * 0.5) * 1.25;
      const trunk = ctx.createLinearGradient(tx - 4 * s, 0, tx + 4 * s, 0);
      trunk.addColorStop(0, '#77522c');
      trunk.addColorStop(0.5, '#5d3a1e');
      trunk.addColorStop(1, '#422812');
      ctx.fillStyle = trunk;
      ctx.fillRect(tx - 4 * s, GROUND_Y - 66 * s, 8 * s, 66 * s);
      ctx.strokeStyle = 'rgba(30,17,7,0.5)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(tx - 1 * s, GROUND_Y - 60 * s);
      ctx.lineTo(tx - 2 * s, GROUND_Y - 8 * s);
      ctx.moveTo(tx + 2 * s, GROUND_Y - 52 * s);
      ctx.lineTo(tx + 1 * s, GROUND_Y - 14 * s);
      ctx.stroke();
      const cols = ['#c96a2e', '#d98e3a', '#b84a2e'];
      for (let j = 0; j < 3; j++) {
        const ccx = tx + (j - 1) * 17 * s;
        const ccy = GROUND_Y - (84 + j * 13) * s;
        const cr = (25 - j * 4) * s;
        const cg = ctx.createRadialGradient(ccx - cr * 0.35, ccy - cr * 0.4, cr * 0.15, ccx, ccy, cr * 1.2);
        cg.addColorStop(0, shade(cols[j % 3], 1.3));
        cg.addColorStop(0.55, cols[j % 3]);
        cg.addColorStop(1, shade(cols[j % 3], 0.62));
        ctx.fillStyle = cg;
        ctx.beginPath();
        ctx.arc(ccx, ccy, cr, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,214,140,0.35)';
        for (let f = 0; f < 3; f++) {
          ctx.beginPath();
          ctx.arc(ccx + (hash(base + i * 31 + j * 7 + f) - 0.5) * cr * 1.1, ccy + (hash(base + i * 37 + j * 3 + f) - 0.5) * cr * 1.1, 2.2 * s, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }

  drawKitchen(ctx, game) {
    // Inside the farmhouse kitchen: lamplit walls with a plank wainscot, a
    // window on the yard you are escaping with daylight falling in across
    // the room, hanging pans, and a grouted checkered floor underfoot.
    const wall = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    wall.addColorStop(0, '#96683e');
    wall.addColorStop(0.45, '#7d4e2b');
    wall.addColorStop(1, '#5f3a1e');
    ctx.fillStyle = wall;
    ctx.fillRect(0, 0, VIEW_W, GROUND_Y);
    // Wainscot: vertical planks below the chair rail, shaded per plank.
    ctx.fillStyle = '#54331a';
    ctx.fillRect(0, 470, VIEW_W, GROUND_Y - 470);
    const plankOff = -(game.cameraX * 0.3) % 46;
    for (let x = plankOff - 46; x < VIEW_W + 46; x += 46) {
      const pg = ctx.createLinearGradient(x, 0, x + 46, 0);
      pg.addColorStop(0, 'rgba(255,205,140,0.10)');
      pg.addColorStop(0.5, 'rgba(0,0,0,0)');
      pg.addColorStop(1, 'rgba(0,0,0,0.22)');
      ctx.fillStyle = pg;
      ctx.fillRect(x, 470, 46, GROUND_Y - 470);
      ctx.fillStyle = 'rgba(24,12,4,0.55)';
      ctx.fillRect(x, 470, 2, GROUND_Y - 470);
    }
    const rail = ctx.createLinearGradient(0, 460, 0, 474);
    rail.addColorStop(0, '#a4713f');
    rail.addColorStop(0.5, '#7d5227');
    rail.addColorStop(1, '#54331a');
    ctx.fillStyle = rail;
    ctx.fillRect(0, 460, VIEW_W, 13);

    const off = -(game.cameraX * 0.3) % 420;
    for (let i = -1; i < 5; i++) {
      const wx = off + i * 420;
      // Window with the green world outside: a shaded frame, sunlit glass,
      // and the yard's hill rolling across the bottom pane.
      ctx.fillStyle = '#4a2c14';
      ctx.fillRect(wx + 52, 56, 166, 212);
      const frame = ctx.createLinearGradient(wx + 56, 0, wx + 214, 0);
      frame.addColorStop(0, '#6e4525');
      frame.addColorStop(0.5, '#5d3a1e');
      frame.addColorStop(1, '#452812');
      ctx.fillStyle = frame;
      ctx.fillRect(wx + 56, 60, 158, 204);
      const grad = ctx.createLinearGradient(0, 70, 0, 254);
      grad.addColorStop(0, '#8fd0ea');
      grad.addColorStop(0.55, '#b8e0c8');
      grad.addColorStop(1, '#d8edb8');
      ctx.fillStyle = grad;
      ctx.fillRect(wx + 66, 70, 138, 184);
      const sunOut = ctx.createRadialGradient(wx + 168, 92, 4, wx + 168, 92, 60);
      sunOut.addColorStop(0, 'rgba(255,246,200,0.95)');
      sunOut.addColorStop(1, 'rgba(255,246,200,0)');
      ctx.fillStyle = sunOut;
      ctx.fillRect(wx + 108, 70, 96, 110);
      ctx.fillStyle = '#3f7d4e';
      ctx.beginPath();
      ctx.ellipse(wx + 100, 254, 60, 26, 0, Math.PI, Math.PI * 2);
      ctx.ellipse(wx + 165, 254, 52, 20, 0, Math.PI, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.20)';
      ctx.beginPath();
      ctx.moveTo(wx + 76, 250);
      ctx.lineTo(wx + 128, 74);
      ctx.lineTo(wx + 152, 74);
      ctx.lineTo(wx + 100, 250);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#4a2c14';
      ctx.fillRect(wx + 132, 70, 7, 184);
      ctx.fillRect(wx + 66, 158, 138, 7);

      // Daylight falling in: a soft shaft slanting from the window down
      // across the wall and floor, with dust motes drifting in it.
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(wx + 70, 250);
      ctx.lineTo(wx + 200, 250);
      ctx.lineTo(wx + 330, GROUND_Y + 40);
      ctx.lineTo(wx + 130, GROUND_Y + 40);
      ctx.closePath();
      ctx.clip();
      const shaft = ctx.createLinearGradient(wx + 80, 250, wx + 260, GROUND_Y);
      shaft.addColorStop(0, 'rgba(255,240,196,0.16)');
      shaft.addColorStop(1, 'rgba(255,240,196,0.03)');
      ctx.fillStyle = shaft;
      ctx.fillRect(wx + 40, 240, 340, GROUND_Y - 200);
      for (let m = 0; m < 14; m++) {
        const mx = wx + 92 + hash(m * 17 + i * 3) * 190 + Math.sin(game.time * 0.4 + m * 1.7) * 7;
        const my = 268 + hash(m * 23 + i * 5) * 330 + ((game.time * (3 + hash(m * 7) * 4) + m * 53) % 60);
        const tw = 0.25 + 0.55 * (0.5 + 0.5 * Math.sin(game.time * 1.3 + m * 2.3));
        ctx.fillStyle = `rgba(255,246,214,${tw.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(mx, my, 1.4 + hash(m * 29) * 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // Hanging pans and a string of garlic beside the window: brushed
      // metal with a lit rim, garlic bulbs shaded round.
      const pan = (px, py, prx, pry) => {
        const pg = ctx.createRadialGradient(px - prx * 0.3, py - pry * 0.35, 2, px, py, prx * 1.15);
        pg.addColorStop(0, '#6a7076');
        pg.addColorStop(0.6, '#3c3f45');
        pg.addColorStop(1, '#22252a');
        ctx.fillStyle = pg;
        ctx.beginPath();
        ctx.ellipse(px, py, prx, pry, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(230,238,244,0.4)';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.ellipse(px, py, prx * 0.82, pry * 0.82, 0, Math.PI * 1.05, Math.PI * 1.55);
        ctx.stroke();
      };
      ctx.fillStyle = '#2c2f34';
      ctx.fillRect(wx + 296, 96, 7, 26);
      ctx.fillRect(wx + 353, 92, 6, 22);
      pan(wx + 300, 150, 26, 32);
      pan(wx + 356, 138, 19, 24);
      for (let g = 0; g < 4; g++) {
        const gx = wx + 262 + (g % 2) * 9;
        const gy = 108 + g * 21;
        const gg = ctx.createRadialGradient(gx - 2.5, gy - 3.5, 1, gx, gy, 11);
        gg.addColorStop(0, '#fdf6e3');
        gg.addColorStop(0.6, '#e8e0cc');
        gg.addColorStop(1, '#b8ab8d');
        ctx.fillStyle = gg;
        ctx.beginPath();
        ctx.ellipse(gx, gy, 7.5, 10, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // A shelf of preserve jars across the middle of the wall, and a rail
      // of hanging utensils under it: the band the chase runs through
      // should read as a working kitchen, not an empty wall. The shelf is
      // a shaded plank on two brackets; the jars are glass over their
      // preserves, with a highlight stripe and a ridged lid.
      ctx.fillStyle = '#54331a';
      for (const bx of [wx + 52, wx + 368]) ctx.fillRect(bx, 340, 8, 16);
      const shelf = ctx.createLinearGradient(0, 330, 0, 340);
      shelf.addColorStop(0, '#8d683c');
      shelf.addColorStop(1, '#54331a');
      ctx.fillStyle = shelf;
      ctx.fillRect(wx + 36, 330, 348, 10);
      const jarFills = ['#b84a2e', '#e09f3e', '#7ec850'];
      for (let j = 0; j < 3; j++) {
        const jx = wx + 84 + j * 96;
        ctx.fillStyle = 'rgba(30,16,6,0.25)';
        ctx.beginPath();
        ctx.ellipse(jx + 19, 331, 21, 3.4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(238,230,210,0.30)';
        ctx.beginPath();
        ctx.roundRect(jx, 288, 38, 42, 6);
        ctx.fill();
        const contents = ctx.createLinearGradient(0, 302, 0, 326);
        contents.addColorStop(0, shade(jarFills[j], 1.3));
        contents.addColorStop(1, shade(jarFills[j], 0.7));
        ctx.fillStyle = contents;
        ctx.beginPath();
        ctx.roundRect(jx + 4, 302, 30, 24, 5);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        ctx.fillRect(jx + 7, 291, 5, 36);
        const lid = ctx.createLinearGradient(0, 282, 0, 290);
        lid.addColorStop(0, '#b98c4e');
        lid.addColorStop(1, '#77552a');
        ctx.fillStyle = lid;
        ctx.fillRect(jx + 3, 282, 32, 8);
        ctx.strokeStyle = 'rgba(60,38,14,0.5)';
        ctx.lineWidth = 1;
        for (let r = 0; r < 3; r++) {
          ctx.beginPath();
          ctx.moveTo(jx + 9 + r * 10, 283);
          ctx.lineTo(jx + 9 + r * 10, 289);
          ctx.stroke();
        }
      }
      ctx.fillStyle = '#33200f';
      ctx.fillRect(wx + 36, 402, 348, 6);
      ctx.fillStyle = 'rgba(255,214,150,0.25)';
      ctx.fillRect(wx + 36, 402, 348, 1.6);
      ctx.strokeStyle = '#23262b';
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      for (const ux of [wx + 96, wx + 200, wx + 304]) {
        ctx.beginPath();
        ctx.moveTo(ux, 408);
        ctx.lineTo(ux, 436);
        ctx.stroke();
      }
      // Ladle bowl, spatula head and a little saucepan, hanging in a row.
      const steel = (x0, y0, x1, y1) => {
        const g = ctx.createLinearGradient(x0, y0, x1, y1);
        g.addColorStop(0, '#788089');
        g.addColorStop(0.5, '#454b52');
        g.addColorStop(1, '#26292e');
        return g;
      };
      ctx.fillStyle = steel(wx + 85, 438, wx + 107, 454);
      ctx.beginPath();
      ctx.ellipse(wx + 96, 446, 11, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = steel(wx + 190, 436, wx + 210, 460);
      ctx.fillRect(wx + 190, 436, 20, 24);
      ctx.fillStyle = steel(wx + 287, 437, wx + 321, 459);
      ctx.beginPath();
      ctx.ellipse(wx + 304, 448, 17, 11, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(235,240,244,0.5)';
      ctx.beginPath();
      ctx.ellipse(wx + 298, 443, 7, 4, -0.4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Checkered floor: grout lines in shadow, each tile shaded by its own
    // hash so no two are quite the same bake of clay, and a warm sheen
    // falling across the whole floor.
    const tile = 64;
    const startX = -(game.cameraX % (tile * 2));
    ctx.fillStyle = '#4a2c14';
    ctx.fillRect(0, GROUND_Y, VIEW_W, VIEW_H - GROUND_Y);
    for (let row = 0; row < 3; row++) {
      for (let col = -1; col < VIEW_W / tile + 1; col++) {
        const base = (row + col) % 2 === 0 ? '#9c6b42' : '#845631';
        const v = 0.94 + hash(row * 41 + col * 7) * 0.12;
        ctx.fillStyle = shade(base, v);
        ctx.fillRect(startX + col * tile + 1.5, GROUND_Y + row * 45 + 1.5, tile - 3, 42);
        ctx.fillStyle = 'rgba(255,220,160,0.10)';
        ctx.fillRect(startX + col * tile + 1.5, GROUND_Y + row * 45 + 1.5, tile - 3, 3);
      }
    }
    const sheen = ctx.createLinearGradient(0, GROUND_Y, 0, VIEW_H);
    sheen.addColorStop(0, 'rgba(255,214,150,0.13)');
    sheen.addColorStop(0.5, 'rgba(0,0,0,0)');
    sheen.addColorStop(1, 'rgba(0,0,0,0.20)');
    ctx.fillStyle = sheen;
    ctx.fillRect(0, GROUND_Y, VIEW_W, VIEW_H - GROUND_Y);
  }

  drawGround(ctx, game, stage) {
    if (stage.indoor) return; // the kitchen floor is drawn with the room
    // The dirt itself is graded: sunlit at the running line, deepening
    // toward the bottom of the frame, with a darker tread band where a
    // thousand feet have run before.
    const g = ctx.createLinearGradient(0, GROUND_Y, 0, VIEW_H);
    g.addColorStop(0, shade(stage.ground, 1.14));
    g.addColorStop(0.3, stage.ground);
    g.addColorStop(1, shade(stage.ground, 0.66));
    ctx.fillStyle = g;
    ctx.fillRect(0, GROUND_Y, VIEW_W, VIEW_H - GROUND_Y);
    ctx.fillStyle = 'rgba(0,0,0,0.07)';
    const stripe = 92;
    const off = -(game.cameraX % stripe);
    for (let x = off; x < VIEW_W; x += stripe) ctx.fillRect(x, GROUND_Y, 34, VIEW_H - GROUND_Y);
    ctx.fillStyle = 'rgba(255,230,170,0.20)';
    ctx.fillRect(0, GROUND_Y, VIEW_W, 2);
    ctx.fillStyle = 'rgba(0,0,0,0.20)';
    ctx.fillRect(0, GROUND_Y + 2, VIEW_W, 3.5);
    // Texture placed by world position, so it streams past honestly:
    // speckles, small stones with a lit top, and tufts of dry grass.
    const cell = 130;
    const base = Math.floor(game.cameraX / cell);
    for (let i = 0; i < 12; i++) {
      const wx = (base + i) * cell + hash(base + i) * 80;
      const sx = wx - game.cameraX;
      const sy = GROUND_Y + 18 + hash(base + i * 7) * 90;
      ctx.fillStyle = 'rgba(0,0,0,0.20)';
      ctx.fillRect(sx, sy, 9, 4);
      if (hash(base + i * 13) > 0.45) {
        ctx.fillStyle = 'rgba(60,40,22,0.55)';
        ctx.beginPath();
        ctx.ellipse(sx + 26, sy + 22, 5.5, 3.6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,235,200,0.30)';
        ctx.beginPath();
        ctx.ellipse(sx + 24.5, sy + 20.8, 3.4, 1.8, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      if (hash(base + i * 19) > 0.4) {
        const tx = sx + 52;
        const ty = sy + 34;
        ctx.strokeStyle = stage.indoor ? '' : 'rgba(104,116,44,0.65)';
        ctx.lineWidth = 1.8;
        ctx.lineCap = 'round';
        for (let b = -1; b <= 1; b++) {
          ctx.beginPath();
          ctx.moveTo(tx, ty);
          ctx.quadraticCurveTo(tx + b * 3.4, ty - 6, tx + b * 6, ty - 10 - hash(base + i + b) * 3);
          ctx.stroke();
        }
      }
    }
  }

  drawItem(ctx, game, item) {
    const screenX = item.x - game.cameraX;
    if (screenX < -180 || screenX > VIEW_W + 180) return;
    // Ground-standing props sit on a contact shadow; flying and floating
    // things (cleaver, corn, the falling knife) cast none here.
    const shadowW = { hay: 44, fence: 46, pumpkin: 36, oven: 56, counter: 62 }[item.type];
    if (shadowW) softShadow(ctx, screenX, GROUND_Y + 5, shadowW, 8, 0.24);
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
      ctx.strokeStyle = 'rgba(90,40,10,0.45)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-7, 0);
      ctx.lineTo(7, 0);
      ctx.stroke();
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  drawBubble(ctx, x, y, str) {
    ctx.font = 'bold 19px Georgia, serif';
    const w = ctx.measureText(str).width + 30;
    ctx.fillStyle = 'rgba(43,26,16,0.18)';
    ctx.beginPath();
    ctx.roundRect(x - w / 2 + 2, y - 21 + 3, w, 42, 15);
    ctx.fill();
    const bg = ctx.createLinearGradient(0, y - 21, 0, y + 21);
    bg.addColorStop(0, '#fffdf4');
    bg.addColorStop(1, '#f2e2c4');
    ctx.fillStyle = bg;
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

    // The combo pill, under the score while a streak is alive: the
    // multiplier in gold and a bar that drains with the streak's clock,
    // so the next cob always has a visible deadline.
    if (game.combo >= 2) {
      const mult = Math.min(game.combo, TUNING.comboMaxMult);
      panel(ctx, 18, 88, 196, 38, 'rgba(30,17,8,0.62)');
      text(ctx, `COMBO ×${mult}`, 32, 103, 'bold 19px Georgia, serif', '#ffd94d');
      ctx.fillStyle = 'rgba(255,246,227,0.25)';
      ctx.beginPath();
      ctx.roundRect(32, 114, 168, 6, 3);
      ctx.fill();
      ctx.fillStyle = '#f5a623';
      ctx.beginPath();
      ctx.roundRect(32, 114, 168 * Math.max(0, Math.min(1, game.comboT / TUNING.comboWindow)), 6, 3);
      ctx.fill();
    }

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
    const rallying = game.rallyPhase === 'rally';
    text(ctx, rallying ? 'RALLY!' : 'FARMER', 1096, 40, 'bold 13px system-ui, sans-serif', rallying ? '#ff8a75' : '#e8c88a');
    ctx.fillStyle = 'rgba(255,246,227,0.25)';
    ctx.beginPath();
    ctx.roundRect(1150, 30, 92, 13, 6);
    ctx.fill();
    // Mid-rally the meter itself pulses red: the surge is on the HUD too.
    ctx.fillStyle = rallying
      ? (Math.floor(game.time * 6) % 2 === 0 ? '#e74c3c' : '#ff8a75')
      : danger > 0.72 ? '#e74c3c' : danger > 0.45 ? '#f5a623' : '#7ec850';
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
    softShadow(ctx, 1010, GROUND_Y + 5, 44, 8, 0.24);
    drawHayBale(ctx, 1010, GROUND_Y);
    softShadow(ctx, 1056, GROUND_Y + 6, 50, 9, 0.30);
    drawFarmer(ctx, 1052, GROUND_Y, { run: game.time * 2, lunge: 0 });
    softShadow(ctx, 560, GROUND_Y + 6, 42, 8, 0.30);
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
    softShadow(ctx, 524, GROUND_Y + 6, 50, 9, 0.30);
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

    // Sunburst behind the free bird, over a warm radial glow.
    const glowE = ctx.createRadialGradient(880, GROUND_Y - 150, 20, 880, GROUND_Y - 150, 380);
    glowE.addColorStop(0, 'rgba(255,232,150,0.5)');
    glowE.addColorStop(1, 'rgba(255,232,150,0)');
    ctx.fillStyle = glowE;
    ctx.fillRect(480, GROUND_Y - 530, 800, 560);
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
    softShadow(ctx, 700, GROUND_Y + 5, 96, 9, 0.20);
    drawGate(ctx, 700, GROUND_Y);

    softShadow(ctx, 880, GROUND_Y + 6, 42, 8, 0.28);
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
    panel(ctx, 440, topY, 400, 218, 'rgba(30,17,8,0.66)', 18);
    const rows = [
      ['SCORE', String(game.score)],
      ['DISTANCE', `${Math.floor(game.distanceM)} m`],
      ['CORN', `${game.cornCount}`],
      ['BEST COMBO', `${game.bestCombo} in a row`],
      ['CLOSE CALLS', `${game.nearMisses}`],
      ['BEST', `${game.best}`],
    ];
    rows.forEach(([k, v], i) => {
      text(ctx, k, 478, topY + 36 + i * 31, 'bold 17px system-ui, sans-serif', '#e8c88a');
      text(ctx, v, 802, topY + 36 + i * 31, 'bold 20px Georgia, serif', COLORS.cream, 'right');
    });
  }
}
