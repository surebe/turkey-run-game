// Every character and prop in Gobble Dash is drawn here with canvas paths —
// no image files. Each function draws around a feet-at-(x, y) anchor so the
// world code can place things without knowing how they look.

import { COLORS } from './config.js';

function ellipse(ctx, x, y, rx, ry, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function roundRect(ctx, x, y, w, h, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}

// The turkey: a round brown body, a fanned tail of autumn feathers, a long
// neck, a red wattle and two fast little legs. `run` is the run cycle phase,
// `tilt` leans the body in the air, `duck` squashes it low, `flap` spreads a
// wing for the double jump, `hurt` flashes it pale.
export function drawTurkey(ctx, x, feetY, opts = {}) {
  const run = opts.run ?? 0;
  const tilt = opts.tilt ?? 0;
  const duck = opts.duck ?? 0;
  const flap = opts.flap ?? 0;
  const body = opts.hurt ? '#d8c8b0' : COLORS.turkeyBody;
  const dark = opts.hurt ? '#b8a888' : COLORS.turkeyDark;
  const light = opts.hurt ? '#e8dcc4' : COLORS.turkeyLight;
  const squash = 1 - duck * 0.34;
  const bob = Math.abs(Math.sin(run)) * 4 * (1 - duck);
  const hipY = feetY - 34 * squash - bob;

  ctx.save();
  ctx.translate(x, hipY);
  // Drawn 1.3x around the ground-contact point, so the bird reads at a
  // glance in a thumbnail while its feet stay planted on the dirt line.
  ctx.translate(0, 34 * squash + bob);
  ctx.scale(1.3, 1.3);
  ctx.translate(0, -(34 * squash + bob));
  ctx.rotate(tilt);

  // Legs: two orange sticks trading places with the run cycle.
  ctx.strokeStyle = '#e07b28';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  for (let i = 0; i < 2; i++) {
    const phase = run + i * Math.PI;
    const lift = Math.max(0, Math.sin(phase)) * 13 * (1 - duck);
    const swing = Math.cos(phase) * 13;
    ctx.beginPath();
    ctx.moveTo(-4 + i * 9, 16 * squash);
    ctx.lineTo(-4 + i * 9 + swing, 34 * squash - lift + bob);
    ctx.stroke();
  }

  // Tail fan: five feathers fanned behind the body.
  const fan = [-0.85, -0.42, 0, 0.42, 0.85];
  const fanColors = [COLORS.featherRed, COLORS.featherGold, COLORS.featherCream, COLORS.featherGold, COLORS.featherRed];
  for (let i = 0; i < fan.length; i++) {
    ctx.save();
    ctx.translate(-26, -6);
    ctx.rotate(fan[i] - 0.5 + duck * 0.2);
    ellipse(ctx, 0, -24, 9, 27, fanColors[i]);
    ellipse(ctx, 0, -30, 4.5, 15, dark);
    ctx.restore();
  }

  // Body and breast.
  ellipse(ctx, 0, 0, 34, 26 * squash, body);
  ellipse(ctx, 14, 4 * squash, 17, 14 * squash, light);

  // Wing: folded at rest, spread wide while flapping.
  ctx.save();
  ctx.translate(-2, -2);
  ctx.rotate(flap > 0 ? -0.9 * flap : Math.sin(run * 2) * 0.06);
  ellipse(ctx, -6, 4, 20, 11, dark);
  ellipse(ctx, -10, 6, 12, 6, body);
  ctx.restore();

  // Neck and head, stretched forward in a run, tucked when ducking.
  const neckX = 26 - duck * 8;
  const headY = -26 * squash - 4;
  ctx.strokeStyle = body;
  ctx.lineWidth = 11;
  ctx.beginPath();
  ctx.moveTo(18, -8 * squash);
  ctx.quadraticCurveTo(neckX + 4, -16 * squash, neckX + 6, headY + 6);
  ctx.stroke();
  ellipse(ctx, neckX + 9, headY, 12.5, 11, light);
  // Beak.
  ctx.fillStyle = '#f0a028';
  ctx.beginPath();
  ctx.moveTo(neckX + 19, headY - 3);
  ctx.lineTo(neckX + 33, headY + 1);
  ctx.lineTo(neckX + 19, headY + 5);
  ctx.closePath();
  ctx.fill();
  // Wattle and snood, the red bits every turkey wears.
  ellipse(ctx, neckX + 14, headY + 8, 4.5, 8, COLORS.red);
  ellipse(ctx, neckX + 20, headY - 8, 3, 5.5, COLORS.red);
  // Eye: wide and worried.
  ellipse(ctx, neckX + 11, headY - 3, 3.4, 3.8, COLORS.ink);
  ellipse(ctx, neckX + 12.2, headY - 4.4, 1.3, 1.5, '#ffffff');

  ctx.restore();
}

// The farmer: round belly in denim overalls, a red shirt, a straw hat and
// long reaching arms. `lunge` stretches him toward the turkey; his speech
// bubble is drawn by the renderer so it can carry text.
export function drawFarmer(ctx, x, feetY, opts = {}) {
  const run = opts.run ?? 0;
  const lunge = opts.lunge ?? 0;
  const bob = Math.abs(Math.sin(run)) * 5;
  const hipY = feetY - 62 - bob;

  ctx.save();
  ctx.translate(x, hipY);
  // 1.22x around the ground-contact point: a bigger, closer farmer.
  ctx.translate(0, 62 + bob);
  ctx.scale(1.22, 1.22);
  ctx.translate(0, -(62 + bob));
  ctx.rotate(lunge * 0.10);

  // Legs in denim, pumping.
  ctx.strokeStyle = COLORS.farmerDenim;
  ctx.lineWidth = 11;
  ctx.lineCap = 'round';
  for (let i = 0; i < 2; i++) {
    const phase = run + i * Math.PI;
    const lift = Math.max(0, Math.sin(phase)) * 15;
    const swing = Math.cos(phase) * 17;
    ctx.beginPath();
    ctx.moveTo(-6 + i * 13, 34);
    ctx.lineTo(-6 + i * 13 + swing, 62 - lift + bob);
    ctx.stroke();
  }
  // Boots.
  ctx.fillStyle = '#4a2f1a';
  for (let i = 0; i < 2; i++) {
    const phase = run + i * Math.PI;
    const lift = Math.max(0, Math.sin(phase)) * 15;
    const swing = Math.cos(phase) * 17;
    ctx.fillRect(-14 + i * 13 + swing, 58 - lift + bob, 17, 7);
  }

  // Belly and overalls.
  ellipse(ctx, 0, 6, 30, 32, COLORS.farmerDenim);
  ellipse(ctx, 0, -2, 31, 24, COLORS.farmerShirt);
  roundRect(ctx, -20, -2, 40, 32, 8, COLORS.farmerDenim);
  ctx.fillStyle = COLORS.gold;
  ctx.fillRect(-16, 4, 6, 6);
  ctx.fillRect(10, 4, 6, 6);

  // Arms: the back one pumps, the front one reaches for the turkey.
  ctx.strokeStyle = COLORS.farmerShirt;
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(-20, -12);
  ctx.lineTo(-34, 6 + Math.sin(run) * 8);
  ctx.stroke();
  const reach = 30 + lunge * 26 + Math.sin(run * 2) * 4;
  ctx.beginPath();
  ctx.moveTo(20, -12);
  ctx.lineTo(20 + reach, -6 + Math.sin(run * 2) * 3);
  ctx.stroke();
  ellipse(ctx, 22 + reach, -6 + Math.sin(run * 2) * 3, 6.5, 6, COLORS.farmerSkin);

  // Head, beard and straw hat.
  ellipse(ctx, 2, -38, 17, 16, COLORS.farmerSkin);
  ellipse(ctx, 6, -28, 12, 9, '#e8e0d0');
  ellipse(ctx, 10, -40, 3.2, 3.6, COLORS.ink);
  // An angry brow when he lunges: dinner is getting away.
  if (lunge > 0.4) {
    ctx.strokeStyle = '#5d3a1e';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(3, -47);
    ctx.lineTo(15, -43);
    ctx.stroke();
  }
  ctx.fillStyle = COLORS.farmerHat;
  ctx.beginPath();
  ctx.ellipse(2, -50, 27, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  roundRect(ctx, -11, -66, 26, 15, 6, COLORS.farmerHat);
  ctx.fillStyle = COLORS.red;
  ctx.fillRect(-11, -54, 26, 4);

  ctx.restore();
}

// A carving knife, drawn pointing down, blade first — big enough to read
// as a threat from across the room (and across a contact sheet).
export function drawKnife(ctx, x, y, angle = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(1.7, 1.7);
  ctx.fillStyle = '#d7dde3';
  ctx.beginPath();
  ctx.moveTo(-5, -26);
  ctx.lineTo(6, -26);
  ctx.lineTo(3, 14);
  ctx.quadraticCurveTo(0, 22, -3, 14);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#aeb6bd';
  ctx.fillRect(-5, -26, 3.5, 40);
  // A gleam down the blade's edge.
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.fillRect(3.4, -22, 1.6, 30);
  roundRect(ctx, -4.5, -44, 9, 19, 4, '#5d3a1e');
  ctx.restore();
}

// A meat cleaver flying flat, for ducking under.
export function drawCleaver(ctx, x, y, spin = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(spin);
  ctx.scale(1.3, 1.3);
  ctx.fillStyle = '#ccd3d9';
  ctx.fillRect(-22, -15, 40, 30);
  ctx.fillStyle = '#9aa4ab';
  ctx.beginPath();
  ctx.arc(-14, -8, 3.4, 0, Math.PI * 2);
  ctx.fill();
  roundRect(ctx, 18, -4.5, 17, 9, 4, '#5d3a1e');
  ctx.restore();
}

// A corn cob pickup; golden ones gleam and are worth four times as much.
export function drawCorn(ctx, x, y, golden = false, t = 0) {
  ctx.save();
  ctx.translate(x, y + Math.sin(t * 3) * 3);
  ctx.rotate(-0.5);
  if (golden) {
    ctx.fillStyle = 'rgba(245,185,33,0.30)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 24, 24, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ellipse(ctx, 0, 0, 9, 17, golden ? '#ffd94d' : '#f5b921');
  ctx.strokeStyle = golden ? '#d99a16' : '#d99a16';
  ctx.lineWidth = 1.4;
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.moveTo(i * 5.5, -15);
    ctx.lineTo(i * 5.5, 15);
    ctx.stroke();
  }
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.moveTo(-8, i * 7);
    ctx.lineTo(8, i * 7);
    ctx.stroke();
  }
  // Husk leaves at the base.
  ctx.fillStyle = '#5d8a3c';
  ctx.beginPath();
  ctx.moveTo(-8, 10);
  ctx.quadraticCurveTo(-16, 22, -6, 24);
  ctx.quadraticCurveTo(-2, 16, 0, 12);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(8, 10);
  ctx.quadraticCurveTo(16, 22, 6, 24);
  ctx.quadraticCurveTo(2, 16, 0, 12);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function drawHayBale(ctx, x, groundY) {
  ctx.save();
  ctx.translate(x, groundY);
  ctx.scale(1.2, 1.2);
  ctx.translate(-x, -groundY);
  ellipse(ctx, x, groundY - 24, 34, 25, '#d9a441');
  ellipse(ctx, x, groundY - 24, 25, 18, '#e5b95c');
  ctx.strokeStyle = '#b9822e';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(x, groundY - 24, 15, 10, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(x, groundY - 24, 6, 4, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

export function drawFence(ctx, x, groundY) {
  ctx.save();
  ctx.translate(x, groundY);
  ctx.scale(1.15, 1.15);
  ctx.translate(-x, -groundY);
  ctx.fillStyle = '#9a6a38';
  ctx.fillRect(x - 30, groundY - 52, 8, 52);
  ctx.fillRect(x + 22, groundY - 52, 8, 52);
  ctx.fillStyle = '#b07f42';
  ctx.fillRect(x - 36, groundY - 46, 72, 9);
  ctx.fillRect(x - 36, groundY - 26, 72, 9);
  ctx.fillStyle = '#8a5a2e';
  ctx.fillRect(x - 36, groundY - 46, 72, 3);
  ctx.fillRect(x - 36, groundY - 26, 72, 3);
  ctx.restore();
}

export function drawPumpkins(ctx, x, groundY, rng) {
  ctx.save();
  ctx.translate(x, groundY);
  ctx.scale(1.2, 1.2);
  ctx.translate(-x, -groundY);
  const big = 15 + (rng ? rng.range(0, 5) : 3);
  ellipse(ctx, x, groundY - big + 4, big + 5, big, '#d97c26');
  ellipse(ctx, x - big - 8, groundY - 8, 10, 8, '#e08a30');
  ctx.strokeStyle = '#b85f1a';
  ctx.lineWidth = 2;
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.ellipse(x + i * (big / 1.6), groundY - big + 4, big / 2.4, big - 1, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = '#5d7a35';
  ctx.fillRect(x - 3, groundY - big * 2 - 1, 6, 8);
  ctx.restore();
}

export function drawMud(ctx, x, groundY, w) {
  ctx.fillStyle = '#5d3d1e';
  ctx.beginPath();
  ctx.ellipse(x, groundY + 3, w / 2, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#71502a';
  ctx.beginPath();
  ctx.ellipse(x - w / 5, groundY + 1, w / 5, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.16)';
  ctx.beginPath();
  ctx.ellipse(x + w / 6, groundY, w / 7, 3, 0, 0, Math.PI * 2);
  ctx.fill();
}

// The kitchen's horror: a cast-iron oven with a flickering fire inside.
export function drawOven(ctx, x, groundY, t = 0) {
  ctx.save();
  ctx.translate(x, groundY);
  ctx.scale(1.12, 1.12);
  ctx.translate(-x, -groundY);
  const w = 96;
  const h = 118;
  roundRect(ctx, x - w / 2, groundY - h, w, h, 10, '#33383e');
  roundRect(ctx, x - w / 2 + 7, groundY - h + 7, w - 14, h - 14, 8, '#454b52');
  // Fire window.
  const flick = Math.sin(t * 11) * 0.5 + Math.sin(t * 23) * 0.5;
  roundRect(ctx, x - 30, groundY - 84, 60, 48, 7, '#1c0f08');
  ctx.fillStyle = '#e25822';
  ctx.beginPath();
  ctx.ellipse(x, groundY - 44, 24 + flick * 3, 13, 0, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f5a623';
  ctx.beginPath();
  ctx.ellipse(x - 6, groundY - 42, 13 + flick * 2, 8, 0, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffd94d';
  ctx.beginPath();
  ctx.ellipse(x + 3, groundY - 40, 6, 4.5, 0, Math.PI, Math.PI * 2);
  ctx.fill();
  // Door handle, dials and chimney.
  ctx.fillStyle = '#c8ced4';
  ctx.fillRect(x - 34, groundY - 92, 68, 5);
  for (let i = -1; i <= 1; i++) ellipse(ctx, x + i * 24, groundY - h + 16, 6, 6, '#c8ced4');
  roundRect(ctx, x + 22, groundY - h - 26, 16, 28, 4, '#33383e');
  ctx.restore();
}

export function drawCounter(ctx, x, groundY) {
  ctx.save();
  ctx.translate(x, groundY);
  ctx.scale(1.1, 1.1);
  ctx.translate(-x, -groundY);
  roundRect(ctx, x - 52, groundY - 64, 104, 64, 5, '#7a4a26');
  roundRect(ctx, x - 58, groundY - 72, 116, 12, 5, '#a8a29a');
  ctx.fillStyle = '#5d3a1e';
  ctx.fillRect(x - 30, groundY - 52, 3, 40);
  ctx.fillRect(x + 27, groundY - 52, 3, 40);
  // A pie cooling on top, cruelly out of reach.
  ellipse(ctx, x + 8, groundY - 76, 17, 6, '#c98f54');
  ellipse(ctx, x + 8, groundY - 79, 13, 4.5, '#a8622e');
  ctx.restore();
}

// The forest gate: two pines and a wooden arch that says FREEDOM.
export function drawGate(ctx, x, groundY) {
  ctx.save();
  ctx.translate(x, groundY);
  ctx.scale(1.08, 1.08);
  ctx.translate(-x, -groundY);
  ctx.fillStyle = '#5d3a1e';
  ctx.fillRect(x - 64, groundY - 190, 13, 190);
  ctx.fillRect(x + 51, groundY - 190, 13, 190);
  ctx.fillRect(x - 78, groundY - 204, 156, 17);
  ctx.fillStyle = COLORS.cream;
  ctx.font = 'bold 21px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('FREEDOM', x, groundY - 179);
  for (const side of [-1, 1]) {
    const px = x + side * 96;
    ctx.fillStyle = '#2e5d3a';
    for (let i = 0; i < 3; i++) {
      const w = 52 - i * 11;
      const y = groundY - 40 - i * 42;
      ctx.beginPath();
      ctx.moveTo(px - w / 2, y);
      ctx.lineTo(px + w / 2, y);
      ctx.lineTo(px, y - 52);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = '#5d3a1e';
    ctx.fillRect(px - 4, groundY - 42, 8, 42);
  }
  ctx.restore();
}
