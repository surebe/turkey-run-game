// Every character and prop in Gobble Dash is drawn here with canvas paths —
// no image files. Each function draws around a feet-at-(x, y) anchor so the
// world code can place things without knowing how they look.
//
// The art pass: nothing here is a flat fill any more. Bodies are shaded with
// gradients (lit from the upper left, warm sun), wood carries grain, metal
// carries a bevel and a gleam, feathers carry a shaft and barbs, and straw,
// straw-hats and corn kernels are built from many small strokes. All texture
// placement comes from a hash of an index, never the game's RNG, so a given
// moment renders the same way every time.

import { COLORS } from './config.js';

function hash(n) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

// Multiply a #rrggbb colour by f (<1 darker, >1 lighter), clamped.
export function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  const c = (v) => Math.max(0, Math.min(255, Math.round(v * f)));
  return `rgb(${c(n >> 16)},${c((n >> 8) & 255)},${c(n & 255)})`;
}

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

// A soft contact shadow: layered ellipses, dark warm core fading out.
export function softShadow(ctx, x, y, rx, ry, alpha = 0.26) {
  for (const [s, a] of [[1, 0.45], [0.78, 0.65], [0.52, 1]]) {
    ctx.fillStyle = `rgba(26,12,4,${(alpha * a).toFixed(3)})`;
    ctx.beginPath();
    ctx.ellipse(x, y, rx * s, ry * s, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

// A vertical gradient fill for a path the caller has already begun.
function vgrad(ctx, y0, y1, stops) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  for (const [o, c] of stops) g.addColorStop(o, c);
  return g;
}

// Sun-lit radial shading for a round body centred near (cx, cy).
function bodyGrad(ctx, cx, cy, r, light, mid, dark) {
  const g = ctx.createRadialGradient(cx - r * 0.38, cy - r * 0.42, r * 0.15, cx, cy, r * 1.25);
  g.addColorStop(0, light);
  g.addColorStop(0.55, mid);
  g.addColorStop(1, dark);
  return g;
}

// One feather, drawn pointing up from the origin: a tapered vane with a
// gradient along its length, a paler tip band, a centre shaft and barbs.
function featherVane(ctx, len, wid, base, seed) {
  const tip = shade(base, 1.28);
  const deep = shade(base, 0.72);
  const g = ctx.createLinearGradient(0, 0, 0, -len);
  g.addColorStop(0, deep);
  g.addColorStop(0.45, base);
  g.addColorStop(0.82, tip);
  g.addColorStop(1, shade(base, 1.45));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(-wid, -len * 0.45, 0, -len);
  ctx.quadraticCurveTo(wid, -len * 0.45, 0, 0);
  ctx.fill();
  // Barbs: short strokes angling up from the shaft.
  ctx.strokeStyle = 'rgba(60,30,10,0.28)';
  ctx.lineWidth = 1.1;
  for (let i = 0; i < 4; i++) {
    const fy = -len * (0.25 + i * 0.16);
    const fw = wid * (0.85 - i * 0.16);
    ctx.beginPath();
    ctx.moveTo(0, fy);
    ctx.lineTo(-fw, fy - len * 0.09);
    ctx.moveTo(0, fy);
    ctx.lineTo(fw, fy - len * 0.09);
    ctx.stroke();
  }
  // Shaft.
  ctx.strokeStyle = 'rgba(255,240,210,0.55)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(0, 1);
  ctx.lineTo(0, -len * 0.94);
  ctx.stroke();
  void seed;
}

// Wavy grain lines down a plank between (x, y) and (x, y+h), width w.
function woodGrain(ctx, x, y, w, h, seed, dark = 'rgba(70,40,14,0.35)', light = 'rgba(255,220,160,0.20)') {
  for (let i = 0; i < 3; i++) {
    const gx = x + (0.25 + i * 0.25) * w + (hash(seed + i * 7) - 0.5) * 3;
    ctx.strokeStyle = i % 2 ? light : dark;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(gx, y + 2);
    ctx.bezierCurveTo(gx + 2.5, y + h * 0.35, gx - 2.5, y + h * 0.65, gx + 1, y + h - 2);
    ctx.stroke();
  }
  // A knot, when the hash says this plank has one.
  if (hash(seed + 31) > 0.45) {
    const kx = x + w * (0.3 + hash(seed + 37) * 0.4);
    const ky = y + h * (0.3 + hash(seed + 41) * 0.4);
    ctx.strokeStyle = dark;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(kx, ky, 3.2, 4.4, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(kx, ky, 1.4, 2, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
}

// A plank of wood: vertical gradient, grain, lit top edge, shaded foot.
function plank(ctx, x, y, w, h, base, seed) {
  ctx.fillStyle = vgrad(ctx, y, y + h, [[0, shade(base, 1.22)], [0.5, base], [1, shade(base, 0.74)]]);
  ctx.fillRect(x, y, w, h);
  woodGrain(ctx, x, y, w, h, seed);
  ctx.fillStyle = 'rgba(255,230,170,0.35)';
  ctx.fillRect(x, y, w, 2);
  ctx.fillStyle = 'rgba(30,15,5,0.28)';
  ctx.fillRect(x, y + h - 2, w, 2);
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

  // Legs: two orange sticks trading places with the run cycle, shaded
  // along their length with a little foot at the end.
  ctx.lineCap = 'round';
  for (let i = 0; i < 2; i++) {
    const phase = run + i * Math.PI;
    const lift = Math.max(0, Math.sin(phase)) * 13 * (1 - duck);
    const swing = Math.cos(phase) * 13;
    const lx = -4 + i * 9;
    const fy = 34 * squash - lift + bob;
    ctx.strokeStyle = '#c96a1e';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(lx, 16 * squash);
    ctx.lineTo(lx + swing, fy);
    ctx.stroke();
    ctx.strokeStyle = '#f08c30';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(lx, 16 * squash);
    ctx.lineTo(lx + swing, fy);
    ctx.stroke();
    ctx.strokeStyle = '#e07b28';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(lx + swing - 3, fy);
    ctx.lineTo(lx + swing + 5, fy);
    ctx.stroke();
  }

  // Tail fan: five true feathers fanned behind the body, each with a
  // shaft, barbs and a sunlit tip.
  const fan = [-0.85, -0.42, 0, 0.42, 0.85];
  const fanColors = [COLORS.featherRed, COLORS.featherGold, COLORS.featherCream, COLORS.featherGold, COLORS.featherRed];
  for (let i = 0; i < fan.length; i++) {
    ctx.save();
    ctx.translate(-26, -4);
    ctx.rotate(fan[i] - 0.5 + duck * 0.2);
    featherVane(ctx, 52, 10.5, fanColors[i], i);
    ctx.restore();
  }

  // Body: sun-lit shading, darker under the belly, a warm rim of light
  // along the back where the low sun catches it.
  ctx.fillStyle = bodyGrad(ctx, 0, 0, 34, light, body, dark);
  ctx.beginPath();
  ctx.ellipse(0, 0, 34, 26 * squash, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,214,150,0.5)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, 0, 32.5, 24.5 * squash, 0, Math.PI * 1.15, Math.PI * 1.62);
  ctx.stroke();
  // Breast, pale and forward.
  ctx.fillStyle = bodyGrad(ctx, 14, 4 * squash, 17, shade(light, 1.18), light, body);
  ctx.beginPath();
  ctx.ellipse(14, 4 * squash, 17, 14 * squash, 0, 0, Math.PI * 2);
  ctx.fill();

  // Wing: a shaded base with three scalloped covert feathers along its
  // lower edge and flight feathers fanning out while flapping.
  ctx.save();
  ctx.translate(-2, -2);
  ctx.rotate(flap > 0 ? -0.9 * flap : Math.sin(run * 2) * 0.06);
  if (flap > 0) {
    for (let i = 0; i < 3; i++) {
      ctx.save();
      ctx.rotate(-0.35 - i * 0.3);
      featherVane(ctx, 30 + i * 3, 6.5, dark, 20 + i);
      ctx.restore();
    }
  }
  ctx.fillStyle = bodyGrad(ctx, -6, 4, 20, body, dark, shade(dark, 0.7));
  ctx.beginPath();
  ctx.ellipse(-6, 4, 20, 11, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(46,26,10,0.45)';
  ctx.lineWidth = 1.4;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.arc(-16 + i * 9, 9.5, 5.4, Math.PI * 0.12, Math.PI * 0.88);
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(255,220,160,0.4)';
  ctx.beginPath();
  ctx.ellipse(-6, 1.5, 16, 7.5, 0, Math.PI * 1.08, Math.PI * 1.7);
  ctx.stroke();
  ctx.restore();

  // Neck and head, stretched forward in a run, tucked when ducking.
  const neckX = 26 - duck * 8;
  const headY = -26 * squash - 4;
  const neckGrad = ctx.createLinearGradient(14, -14, 34, 4);
  neckGrad.addColorStop(0, dark);
  neckGrad.addColorStop(0.55, body);
  neckGrad.addColorStop(1, light);
  ctx.strokeStyle = neckGrad;
  ctx.lineWidth = 11;
  ctx.beginPath();
  ctx.moveTo(18, -8 * squash);
  ctx.quadraticCurveTo(neckX + 4, -16 * squash, neckX + 6, headY + 6);
  ctx.stroke();
  ctx.fillStyle = bodyGrad(ctx, neckX + 9, headY, 12.5, shade(light, 1.2), light, body);
  ctx.beginPath();
  ctx.ellipse(neckX + 9, headY, 12.5, 11, 0, 0, Math.PI * 2);
  ctx.fill();
  // Beak: shaded horn, darker at the tip.
  const beakGrad = ctx.createLinearGradient(neckX + 19, 0, neckX + 33, 0);
  beakGrad.addColorStop(0, '#f7b955');
  beakGrad.addColorStop(1, '#d97e14');
  ctx.fillStyle = beakGrad;
  ctx.beginPath();
  ctx.moveTo(neckX + 19, headY - 3);
  ctx.lineTo(neckX + 33, headY + 1);
  ctx.lineTo(neckX + 19, headY + 5);
  ctx.closePath();
  ctx.fill();
  // Wattle and snood, glossy red, darker underneath.
  ctx.fillStyle = vgrad(ctx, headY, headY + 17, [[0, '#d94f3d'], [1, '#96281b']]);
  ctx.beginPath();
  ctx.ellipse(neckX + 14, headY + 8, 4.5, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ellipse(ctx, neckX + 20, headY - 8, 3, 5.5, '#cf4433');
  ellipse(ctx, neckX + 15.5, headY + 4, 1.6, 3, 'rgba(255,180,160,0.65)');
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

  // Legs in denim, pumping; seams down the front, boots with a worn sheen.
  ctx.lineCap = 'round';
  for (let i = 0; i < 2; i++) {
    const phase = run + i * Math.PI;
    const lift = Math.max(0, Math.sin(phase)) * 15;
    const swing = Math.cos(phase) * 17;
    ctx.strokeStyle = shade(COLORS.farmerDenim, 0.82);
    ctx.lineWidth = 11;
    ctx.beginPath();
    ctx.moveTo(-6 + i * 13, 34);
    ctx.lineTo(-6 + i * 13 + swing, 62 - lift + bob);
    ctx.stroke();
    ctx.strokeStyle = COLORS.farmerDenim;
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(-6 + i * 13, 34);
    ctx.lineTo(-6 + i * 13 + swing, 62 - lift + bob);
    ctx.stroke();
  }
  for (let i = 0; i < 2; i++) {
    const phase = run + i * Math.PI;
    const lift = Math.max(0, Math.sin(phase)) * 15;
    const swing = Math.cos(phase) * 17;
    const bx = -14 + i * 13 + swing;
    const by = 58 - lift + bob;
    ctx.fillStyle = vgrad(ctx, by, by + 7, [[0, '#6b452a'], [0.4, '#4a2f1a'], [1, '#33200f']]);
    ctx.fillRect(bx, by, 17, 7);
    ctx.fillStyle = 'rgba(255,220,170,0.28)';
    ctx.fillRect(bx + 1, by + 1, 9, 2);
  }

  // Belly and overalls: shirt shaded round, denim bib with stitched seams
  // and brass buttons catching the light.
  ctx.fillStyle = bodyGrad(ctx, 0, 6, 32, shade(COLORS.farmerDenim, 1.25), COLORS.farmerDenim, shade(COLORS.farmerDenim, 0.62));
  ctx.beginPath();
  ctx.ellipse(0, 6, 30, 32, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = bodyGrad(ctx, 0, -2, 31, shade(COLORS.farmerShirt, 1.3), COLORS.farmerShirt, shade(COLORS.farmerShirt, 0.6));
  ctx.beginPath();
  ctx.ellipse(0, -2, 31, 24, 0, 0, Math.PI * 2);
  ctx.fill();
  // Shirt shading: a soft shadow where the belly rolls under the bib.
  ctx.fillStyle = 'rgba(60,10,5,0.18)';
  ctx.beginPath();
  ctx.ellipse(0, 12, 24, 9, 0, 0, Math.PI);
  ctx.fill();
  ctx.fillStyle = vgrad(ctx, -2, 30, [[0, shade(COLORS.farmerDenim, 1.12)], [1, shade(COLORS.farmerDenim, 0.7)]]);
  ctx.beginPath();
  ctx.roundRect(-20, -2, 40, 32, 8);
  ctx.fill();
  ctx.strokeStyle = 'rgba(240,200,120,0.65)';
  ctx.lineWidth = 1.3;
  ctx.setLineDash([3.5, 2.5]);
  ctx.beginPath();
  ctx.roundRect(-17.5, 0.5, 35, 27, 6);
  ctx.stroke();
  ctx.setLineDash([]);
  for (const bx of [-16, 10]) {
    ellipse(ctx, bx + 3, 7, 3.4, 3.4, '#c9973f');
    ellipse(ctx, bx + 1.8, 5.8, 1.2, 1.2, '#ffe9a8');
  }

  // Arms: the back one pumps, the front one reaches for the turkey.
  // Sleeves shaded, hands sun-browned with a lit top.
  const armGrad = (x0, y0, x1, y1) => {
    const g = ctx.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, shade(COLORS.farmerShirt, 1.15));
    g.addColorStop(1, shade(COLORS.farmerShirt, 0.62));
    return g;
  };
  ctx.lineWidth = 10;
  ctx.strokeStyle = armGrad(-20, -12, -34, 14);
  ctx.beginPath();
  ctx.moveTo(-20, -12);
  ctx.lineTo(-34, 6 + Math.sin(run) * 8);
  ctx.stroke();
  const reach = 30 + lunge * 26 + Math.sin(run * 2) * 4;
  ctx.strokeStyle = armGrad(20, -12, 20 + reach, -6);
  ctx.beginPath();
  ctx.moveTo(20, -12);
  ctx.lineTo(20 + reach, -6 + Math.sin(run * 2) * 3);
  ctx.stroke();
  ctx.fillStyle = bodyGrad(ctx, 22 + reach, -6 + Math.sin(run * 2) * 3, 6.5, shade(COLORS.farmerSkin, 1.15), COLORS.farmerSkin, shade(COLORS.farmerSkin, 0.72));
  ctx.beginPath();
  ctx.ellipse(22 + reach, -6 + Math.sin(run * 2) * 3, 6.5, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Head: sun-browned skin with round shading, a textured grey beard,
  // and the hat's shadow falling across his brow.
  ctx.fillStyle = bodyGrad(ctx, 2, -38, 17, shade(COLORS.farmerSkin, 1.18), COLORS.farmerSkin, shade(COLORS.farmerSkin, 0.7));
  ctx.beginPath();
  ctx.ellipse(2, -38, 17, 16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = bodyGrad(ctx, 6, -27, 12, '#f4ecdc', '#e0d4bc', '#b3a284');
  ctx.beginPath();
  ctx.ellipse(6, -28, 12, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(120,105,80,0.5)';
  ctx.lineWidth = 1.1;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.arc(6, -31 + i * 2.5, 8 - i * 1.6, Math.PI * 0.25, Math.PI * 0.8);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(90,50,20,0.20)';
  ctx.beginPath();
  ctx.ellipse(3, -45, 14.5, 5, 0, 0, Math.PI);
  ctx.fill();
  ellipse(ctx, 10, -40, 3.2, 3.6, COLORS.ink);
  ellipse(ctx, 11.1, -41.2, 1.2, 1.3, 'rgba(255,255,255,0.8)');
  // An angry brow when he lunges: dinner is getting away.
  if (lunge > 0.4) {
    ctx.strokeStyle = '#5d3a1e';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(3, -47);
    ctx.lineTo(15, -43);
    ctx.stroke();
  }
  // Straw hat: woven rings and spokes over a shaded crown, a lit brim.
  ctx.fillStyle = vgrad(ctx, -56, -44, [[0, shade(COLORS.farmerHat, 1.28)], [0.55, COLORS.farmerHat], [1, shade(COLORS.farmerHat, 0.78)]]);
  ctx.beginPath();
  ctx.ellipse(2, -50, 27, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(140,100,30,0.45)';
  ctx.lineWidth = 1;
  for (const rr of [10, 17, 23]) {
    ctx.beginPath();
    ctx.ellipse(2, -50, rr, rr * 0.22, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = vgrad(ctx, -66, -51, [[0, shade(COLORS.farmerHat, 1.32)], [1, shade(COLORS.farmerHat, 0.92)]]);
  ctx.beginPath();
  ctx.roundRect(-11, -66, 26, 15, 6);
  ctx.fill();
  ctx.strokeStyle = 'rgba(140,100,30,0.4)';
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(-8 + i * 6.5, -65);
    ctx.lineTo(-8 + i * 6.5, -52);
    ctx.stroke();
  }
  ctx.fillStyle = COLORS.red;
  ctx.fillRect(-11, -54, 26, 4);
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.fillRect(-11, -54, 26, 1.6);

  ctx.restore();
}

// A carving knife, drawn pointing down, blade first — big enough to read
// as a threat from across the room (and across a contact sheet). The blade
// is polished steel: bright at the spine, darkening to the edge, with a
// bevel line and a gleam; the handle is grained wood with two rivets.
export function drawKnife(ctx, x, y, angle = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(1.7, 1.7);
  const blade = ctx.createLinearGradient(-6, 0, 7, 0);
  blade.addColorStop(0, '#eef2f5');
  blade.addColorStop(0.45, '#c9d1d8');
  blade.addColorStop(0.8, '#98a2ab');
  blade.addColorStop(1, '#7e8891');
  ctx.fillStyle = blade;
  ctx.beginPath();
  ctx.moveTo(-5, -26);
  ctx.lineTo(6, -26);
  ctx.lineTo(3, 14);
  ctx.quadraticCurveTo(0, 22, -3, 14);
  ctx.closePath();
  ctx.fill();
  // The bevel: a paler facet along the cutting edge.
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.beginPath();
  ctx.moveTo(3.2, -20);
  ctx.lineTo(1.8, 12);
  ctx.quadraticCurveTo(0.4, 18, -0.6, 13);
  ctx.lineTo(0.6, -20);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.fillRect(3.6, -22, 1.4, 30);
  // Handle: grained wood over a steel bolster.
  ctx.fillStyle = '#8d99a1';
  ctx.fillRect(-5, -28.5, 11, 3);
  ctx.fillStyle = vgrad(ctx, -44, -26, [[0, '#7c4f28'], [0.5, '#5d3a1e'], [1, '#452a13']]);
  ctx.beginPath();
  ctx.roundRect(-4.5, -44, 9, 16, 4);
  ctx.fill();
  ctx.strokeStyle = 'rgba(30,18,6,0.5)';
  ctx.lineWidth = 0.8;
  for (const gy of [-40, -35.5, -31]) {
    ctx.beginPath();
    ctx.moveTo(-3.6, gy);
    ctx.quadraticCurveTo(0, gy + 1.2, 3.6, gy);
    ctx.stroke();
  }
  ellipse(ctx, 0, -38.5, 1.3, 1.3, '#c8ced4');
  ellipse(ctx, 0, -31.5, 1.3, 1.3, '#c8ced4');
  ctx.restore();
}

// A meat cleaver flying flat, for ducking under: brushed steel with a dark
// spine, a bright edge and a grained handle.
export function drawCleaver(ctx, x, y, spin = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(spin);
  ctx.scale(1.3, 1.3);
  const blade = ctx.createLinearGradient(0, -15, 0, 15);
  blade.addColorStop(0, '#aeb8bf');
  blade.addColorStop(0.3, '#dde3e8');
  blade.addColorStop(0.75, '#bfc8cf');
  blade.addColorStop(1, '#f2f5f7');
  ctx.fillStyle = blade;
  ctx.fillRect(-22, -15, 40, 30);
  ctx.fillStyle = 'rgba(70,80,88,0.55)';
  ctx.fillRect(-22, -15, 40, 4);
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-20, 4);
  ctx.lineTo(16, 4);
  ctx.stroke();
  ctx.fillStyle = '#78838b';
  ctx.beginPath();
  ctx.arc(-14, -8, 3.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e8edf0';
  ctx.beginPath();
  ctx.arc(-14.8, -8.8, 1.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = vgrad(ctx, -4.5, 4.5, [[0, '#7c4f28'], [1, '#452a13']]);
  ctx.beginPath();
  ctx.roundRect(18, -4.5, 17, 9, 4);
  ctx.fill();
  ctx.strokeStyle = 'rgba(30,18,6,0.5)';
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.moveTo(20, -1.5);
  ctx.quadraticCurveTo(26, 0.5, 33, -1);
  ctx.stroke();
  ctx.restore();
}

// A corn cob pickup; golden ones gleam and are worth four times as much.
// The cob is shaded and paved with kernel bumps in offset rows.
export function drawCorn(ctx, x, y, golden = false, t = 0) {
  ctx.save();
  ctx.translate(x, y + Math.sin(t * 3) * 3);
  ctx.rotate(-0.5);
  if (golden) {
    const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, 26);
    glow.addColorStop(0, 'rgba(245,185,33,0.42)');
    glow.addColorStop(1, 'rgba(245,185,33,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.ellipse(0, 0, 26, 26, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  const cobGrad = ctx.createLinearGradient(-9, 0, 9, 0);
  if (golden) {
    cobGrad.addColorStop(0, '#d99a16');
    cobGrad.addColorStop(0.4, '#ffd94d');
    cobGrad.addColorStop(1, '#e0a81e');
  } else {
    cobGrad.addColorStop(0, '#d99a16');
    cobGrad.addColorStop(0.4, '#f7c948');
    cobGrad.addColorStop(1, '#e3a81c');
  }
  ctx.fillStyle = cobGrad;
  ctx.beginPath();
  ctx.ellipse(0, 0, 9, 17, 0, 0, Math.PI * 2);
  ctx.fill();
  // Kernels: little lit bumps in offset rows.
  for (let row = 0; row < 5; row++) {
    for (let colI = 0; colI < 3; colI++) {
      const kx = -5 + colI * 5 + (row % 2 ? 1.6 : -0.6);
      const ky = -12 + row * 6;
      if (kx * kx / 81 + ky * ky / 289 > 0.82) continue;
      ellipse(ctx, kx, ky, 2.1, 2.7, golden ? '#ffe680' : '#ffdf7e');
      ellipse(ctx, kx - 0.7, ky - 1, 0.8, 1, 'rgba(255,255,255,0.55)');
    }
  }
  // Husk leaves at the base, veined and shaded.
  for (const s of [-1, 1]) {
    const husk = ctx.createLinearGradient(0, 8, s * 14, 24);
    husk.addColorStop(0, '#6fa047');
    husk.addColorStop(1, '#42612a');
    ctx.fillStyle = husk;
    ctx.beginPath();
    ctx.moveTo(s * 8, 10);
    ctx.quadraticCurveTo(s * 16, 22, s * 6, 24);
    ctx.quadraticCurveTo(s * 2, 16, 0, 12);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(30,55,18,0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(s * 5, 13);
    ctx.quadraticCurveTo(s * 10, 19, s * 7, 22);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawHayBale(ctx, x, groundY) {
  ctx.save();
  ctx.translate(x, groundY);
  ctx.scale(1.2, 1.2);
  ctx.translate(-x, -groundY);
  // Round bale: radial straw shading, darker at the foot.
  const g = ctx.createRadialGradient(x - 10, groundY - 36, 6, x, groundY - 24, 40);
  g.addColorStop(0, '#f0cd76');
  g.addColorStop(0.55, '#dfb254');
  g.addColorStop(1, '#b9822e');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(x, groundY - 24, 34, 25, 0, 0, Math.PI * 2);
  ctx.fill();
  // Straw: dozens of short strokes in three straw shades, laid by hash.
  const strawCols = ['#c1913a', '#ecca74', '#a87724', '#f4dc96'];
  ctx.lineWidth = 1.4;
  ctx.lineCap = 'round';
  for (let i = 0; i < 44; i++) {
    const a = hash(i * 3 + 1) * Math.PI * 2;
    const rr = Math.sqrt(hash(i * 7 + 2));
    const sx = x + Math.cos(a) * rr * 28;
    const sy = groundY - 24 + Math.sin(a) * rr * 19;
    const ang = a + 1.2 + (hash(i * 11) - 0.5) * 0.7;
    ctx.strokeStyle = strawCols[i % 4];
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + Math.cos(ang) * 7, sy + Math.sin(ang) * 7);
    ctx.stroke();
  }
  // The spiral winding at the bale's heart, and its twine bands.
  ctx.strokeStyle = '#a06e22';
  ctx.lineWidth = 2.4;
  for (const r of [15, 6]) {
    ctx.beginPath();
    ctx.ellipse(x, groundY - 24, r, r * 0.68, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(120,80,20,0.6)';
  ctx.lineWidth = 2;
  for (const bx of [-20, 20]) {
    ctx.beginPath();
    ctx.ellipse(x + bx, groundY - 24, 3.5, 24, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawFence(ctx, x, groundY) {
  ctx.save();
  ctx.translate(x, groundY);
  ctx.scale(1.15, 1.15);
  ctx.translate(-x, -groundY);
  plank(ctx, x - 30, groundY - 52, 8, 52, '#9a6a38', 3);
  plank(ctx, x + 22, groundY - 52, 8, 52, '#9a6a38', 17);
  // Rails drawn as horizontal planks: gradient across their height, grain
  // running along them, a lit top edge.
  for (const ry of [groundY - 46, groundY - 26]) {
    ctx.fillStyle = vgrad(ctx, ry, ry + 9, [[0, '#c08d4e'], [0.45, '#b07f42'], [1, '#7d5527']]);
    ctx.fillRect(x - 36, ry, 72, 9);
    ctx.strokeStyle = 'rgba(70,40,14,0.35)';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(x - 33, ry + 4.5);
    ctx.bezierCurveTo(x - 12, ry + 3, x + 10, ry + 6, x + 33, ry + 4);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,230,170,0.4)';
    ctx.fillRect(x - 36, ry, 72, 1.6);
    ellipse(ctx, x - 26, ry + 4.5, 1.6, 1.6, '#5d3a1e');
    ellipse(ctx, x + 26, ry + 4.5, 1.6, 1.6, '#5d3a1e');
  }
  ctx.restore();
}

export function drawPumpkins(ctx, x, groundY, rng) {
  ctx.save();
  ctx.translate(x, groundY);
  ctx.scale(1.2, 1.2);
  ctx.translate(-x, -groundY);
  const big = 15 + (rng ? rng.range(0, 5) : 3);
  // The small one first, tucked behind.
  ctx.fillStyle = vgrad(ctx, groundY - 16, groundY, [[0, '#eda33e'], [1, '#c06a1c']]);
  ctx.beginPath();
  ctx.ellipse(x - big - 8, groundY - 8, 10, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  // The big pumpkin: lit from above, ribs curving down its sides, a soft
  // sheen on its shoulder.
  ctx.fillStyle = vgrad(ctx, groundY - big * 2 + 4, groundY + 4, [[0, '#f09a35'], [0.5, '#dd7f24'], [1, '#b85f1a']]);
  ctx.beginPath();
  ctx.ellipse(x, groundY - big + 4, big + 5, big, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(150,70,15,0.55)';
  ctx.lineWidth = 2;
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.ellipse(x + i * (big / 1.6), groundY - big + 4, big / 2.4, big - 1, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(255,225,170,0.4)';
  ctx.beginPath();
  ctx.ellipse(x - big * 0.38, groundY - big * 1.35, big * 0.34, big * 0.2, -0.5, 0, Math.PI * 2);
  ctx.fill();
  // Stem: shaded, with a curl of vine.
  ctx.fillStyle = vgrad(ctx, groundY - big * 2 - 1, groundY - big * 2 + 8, [[0, '#74904a'], [1, '#4c652b']]);
  ctx.fillRect(x - 3, groundY - big * 2 - 1, 6, 8);
  ctx.strokeStyle = '#5d7a35';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + 2, groundY - big * 2);
  ctx.quadraticCurveTo(x + 10, groundY - big * 2 - 6, x + 13, groundY - big * 2 + 1);
  ctx.stroke();
  ctx.restore();
}

export function drawMud(ctx, x, groundY, w) {
  // Wet mud: a dark pool with a graded middle, gloss where the sky
  // reflects, and a couple of slow bubbles.
  const g = ctx.createRadialGradient(x, groundY + 2, 4, x, groundY + 3, w / 2);
  g.addColorStop(0, '#7d5830');
  g.addColorStop(0.6, '#5d3d1e');
  g.addColorStop(1, '#472c12');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(x, groundY + 3, w / 2, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,246,220,0.20)';
  ctx.beginPath();
  ctx.ellipse(x + w / 6, groundY, w / 7, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x - w / 4, groundY + 2, w / 10, 2.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,240,210,0.28)';
  ctx.lineWidth = 1.2;
  for (const [bx, br] of [[-w / 3.4, 3], [w / 3.8, 2.2]]) {
    ctx.beginPath();
    ctx.arc(x + bx, groundY + 2, br, 0, Math.PI * 2);
    ctx.stroke();
  }
}

// The kitchen's horror: a cast-iron oven with a flickering fire inside.
// Brushed iron shading, rivets, and a fire that glows out of its window
// onto the floorboards.
export function drawOven(ctx, x, groundY, t = 0) {
  ctx.save();
  ctx.translate(x, groundY);
  ctx.scale(1.12, 1.12);
  ctx.translate(-x, -groundY);
  const w = 96;
  const h = 118;
  // Warm light spilling from the fire window onto the floor.
  const flick0 = Math.sin(t * 11) * 0.5 + Math.sin(t * 23) * 0.5;
  const spill = ctx.createRadialGradient(x, groundY - 30, 6, x, groundY - 16, 86);
  spill.addColorStop(0, `rgba(255,140,50,${0.20 + flick0 * 0.04})`);
  spill.addColorStop(1, 'rgba(255,140,50,0)');
  ctx.fillStyle = spill;
  ctx.beginPath();
  ctx.ellipse(x, groundY - 12, 86, 26, 0, 0, Math.PI * 2);
  ctx.fill();
  // Iron body: brushed gradient, lit top edge, riveted corners.
  ctx.fillStyle = vgrad(ctx, groundY - h, groundY, [[0, '#596068'], [0.35, '#454b52'], [1, '#23262a']]);
  ctx.beginPath();
  ctx.roundRect(x - w / 2, groundY - h, w, h, 10);
  ctx.fill();
  ctx.fillStyle = vgrad(ctx, groundY - h + 7, groundY - 7, [[0, '#525963'], [1, '#2c3036']]);
  ctx.beginPath();
  ctx.roundRect(x - w / 2 + 7, groundY - h + 7, w - 14, h - 14, 8);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.20)';
  ctx.fillRect(x - w / 2 + 8, groundY - h + 3, w - 16, 2.5);
  for (const [rx, ry] of [[-w / 2 + 13, -h + 13], [w / 2 - 13, -h + 13], [-w / 2 + 13, -13], [w / 2 - 13, -13]]) {
    ellipse(ctx, x + rx, groundY + ry, 2.6, 2.6, '#17191c');
    ellipse(ctx, x + rx - 0.8, groundY + ry - 0.8, 1, 1, 'rgba(230,238,244,0.7)');
  }
  // Fire window: a radial glow with layered flames over ember coals.
  ctx.fillStyle = '#160b05';
  ctx.beginPath();
  ctx.roundRect(x - 30, groundY - 84, 60, 48, 7);
  ctx.fill();
  const fire = ctx.createRadialGradient(x, groundY - 42, 3, x, groundY - 46, 40);
  fire.addColorStop(0, 'rgba(255,214,90,0.95)');
  fire.addColorStop(0.45, 'rgba(240,110,30,0.75)');
  fire.addColorStop(1, 'rgba(120,30,5,0)');
  ctx.fillStyle = fire;
  ctx.beginPath();
  ctx.roundRect(x - 29, groundY - 83, 58, 46, 6);
  ctx.fill();
  const flick = flick0;
  const flame = (fx, fw, fh, c0, c1) => {
    const fg = ctx.createLinearGradient(0, groundY - 38, 0, groundY - 38 - fh);
    fg.addColorStop(0, c0);
    fg.addColorStop(1, c1);
    ctx.fillStyle = fg;
    ctx.beginPath();
    ctx.moveTo(fx - fw, groundY - 38);
    ctx.quadraticCurveTo(fx - fw * 0.7, groundY - 38 - fh * 0.5, fx + Math.sin(t * 13 + fx) * 2.5, groundY - 38 - fh);
    ctx.quadraticCurveTo(fx + fw * 0.7, groundY - 38 - fh * 0.5, fx + fw, groundY - 38);
    ctx.closePath();
    ctx.fill();
  };
  flame(x - 10, 11, 26 + flick * 4, '#e25822', '#f5a623');
  flame(x + 8, 9, 20 - flick * 3, '#e25822', '#f5a623');
  flame(x, 6.5, 15 + flick * 2, '#f5a623', '#ffd94d');
  // Embers along the grate.
  for (let i = 0; i < 5; i++) {
    const ex = x - 20 + i * 10 + (hash(i * 13) - 0.5) * 4;
    ellipse(ctx, ex, groundY - 39 + hash(i * 7) * 2, 2.4, 1.6, i % 2 ? '#ff9a3c' : '#ffcf5e');
  }
  // Door handle, dials and chimney.
  ctx.fillStyle = vgrad(ctx, groundY - 94, groundY - 89, [[0, '#eef2f5'], [0.5, '#b9c1c8'], [1, '#7e8891']]);
  ctx.fillRect(x - 34, groundY - 94, 68, 5);
  for (let i = -1; i <= 1; i++) {
    ellipse(ctx, x + i * 24, groundY - h + 16, 6, 6, '#20242a');
    ellipse(ctx, x + i * 24, groundY - h + 16, 4.2, 4.2, '#c8ced4');
    ctx.strokeStyle = '#20242a';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(x + i * 24, groundY - h + 16);
    ctx.lineTo(x + i * 24 + Math.cos(i * 2.1 + 0.6) * 3.4, groundY - h + 16 + Math.sin(i * 2.1 + 0.6) * 3.4);
    ctx.stroke();
  }
  ctx.fillStyle = vgrad(ctx, groundY - h - 26, groundY - h + 2, [[0, '#4a5058'], [1, '#26292e']]);
  ctx.beginPath();
  ctx.roundRect(x + 22, groundY - h - 26, 16, 28, 4);
  ctx.fill();
  ctx.restore();
}

export function drawCounter(ctx, x, groundY) {
  ctx.save();
  ctx.translate(x, groundY);
  ctx.scale(1.1, 1.1);
  ctx.translate(-x, -groundY);
  // Cabinet: two panelled doors in grained wood under a stone top.
  ctx.fillStyle = vgrad(ctx, groundY - 64, groundY, [[0, '#8a5a30'], [1, '#5f3a1c']]);
  ctx.beginPath();
  ctx.roundRect(x - 52, groundY - 64, 104, 64, 5);
  ctx.fill();
  for (const px of [x - 46, x + 4]) {
    ctx.strokeStyle = 'rgba(46,26,10,0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(px, groundY - 54, 42, 44, 4);
    ctx.stroke();
    woodGrain(ctx, px + 4, groundY - 52, 34, 40, px, 'rgba(46,26,10,0.30)', 'rgba(255,220,160,0.13)');
  }
  ellipse(ctx, x - 8, groundY - 32, 2.6, 2.6, '#c9973f');
  ellipse(ctx, x + 42 - 4, groundY - 32, 2.6, 2.6, '#c9973f');
  // Stone top: cool gradient with speckles and a lit front edge.
  ctx.fillStyle = vgrad(ctx, groundY - 72, groundY - 60, [[0, '#cfc9bd'], [0.5, '#a8a29a'], [1, '#7e786c']]);
  ctx.beginPath();
  ctx.roundRect(x - 58, groundY - 72, 116, 12, 5);
  ctx.fill();
  for (let i = 0; i < 9; i++) {
    ellipse(ctx, x - 50 + hash(i * 17) * 100, groundY - 69 + hash(i * 23) * 6, 1.3, 0.9, i % 2 ? 'rgba(90,84,74,0.5)' : 'rgba(240,236,226,0.6)');
  }
  // A pie cooling on top, cruelly out of reach: lattice crust, a wisp of
  // steam, a shaded tin.
  ellipse(ctx, x + 8, groundY - 74, 17, 5, '#6e6a61');
  ctx.fillStyle = vgrad(ctx, groundY - 84, groundY - 72, [[0, '#e0aa62'], [1, '#b57a36']]);
  ctx.beginPath();
  ctx.ellipse(x + 8, groundY - 77, 16, 6.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#a8622e';
  ctx.lineWidth = 2.2;
  for (const off of [-8, 0, 8]) {
    ctx.beginPath();
    ctx.moveTo(x + 8 + off - 4, groundY - 81.5);
    ctx.lineTo(x + 8 + off + 4, groundY - 73.5);
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(255,250,240,0.4)';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  for (const sx of [x + 1, x + 13]) {
    ctx.beginPath();
    ctx.moveTo(sx, groundY - 88);
    ctx.quadraticCurveTo(sx + 3, groundY - 94, sx, groundY - 100);
    ctx.stroke();
  }
  ctx.restore();
}

// The forest gate: two pines and a wooden arch that says FREEDOM.
export function drawGate(ctx, x, groundY) {
  ctx.save();
  ctx.translate(x, groundY);
  ctx.scale(1.08, 1.08);
  ctx.translate(-x, -groundY);
  // Posts and sign board: grained planks, the board shaded like old wood
  // that has weathered a few Thanksgivings.
  plank(ctx, x - 64, groundY - 190, 13, 190, '#77552f', 51);
  plank(ctx, x + 51, groundY - 190, 13, 190, '#77552f', 67);
  ctx.fillStyle = vgrad(ctx, groundY - 204, groundY - 187, [[0, '#8d683c'], [0.5, '#77552f'], [1, '#573e1f']]);
  ctx.fillRect(x - 78, groundY - 204, 156, 17);
  ctx.strokeStyle = 'rgba(46,26,10,0.4)';
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.moveTo(x - 74, groundY - 195.5);
  ctx.bezierCurveTo(x - 30, groundY - 197, x + 30, groundY - 194, x + 74, groundY - 196);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,230,170,0.35)';
  ctx.fillRect(x - 78, groundY - 204, 156, 2);
  ellipse(ctx, x - 68, groundY - 195, 2, 2, '#3d2712');
  ellipse(ctx, x + 68, groundY - 195, 2, 2, '#3d2712');
  ctx.fillStyle = 'rgba(43,26,16,0.45)';
  ctx.font = 'bold 21px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('FREEDOM', x, groundY - 178);
  ctx.fillStyle = COLORS.cream;
  ctx.fillText('FREEDOM', x, groundY - 179.5);
  // Pines: three shaded tiers apiece, lit on the sun side, with a trunk
  // that has bark in it.
  for (const side of [-1, 1]) {
    const px = x + side * 96;
    for (let i = 0; i < 3; i++) {
      const w = 52 - i * 11;
      const y = groundY - 40 - i * 42;
      const tier = ctx.createLinearGradient(px - w / 2, 0, px + w / 2, 0);
      tier.addColorStop(0, '#3d7a4c');
      tier.addColorStop(0.55, '#2e5d3a');
      tier.addColorStop(1, '#1f4228');
      ctx.fillStyle = tier;
      ctx.beginPath();
      ctx.moveTo(px - w / 2, y);
      ctx.lineTo(px + w / 2, y);
      ctx.lineTo(px, y - 52);
      ctx.closePath();
      ctx.fill();
      // Snow of needles: short strokes along the tier's lower edge.
      ctx.strokeStyle = 'rgba(18,40,22,0.5)';
      ctx.lineWidth = 1.4;
      for (let s = 0; s < 4; s++) {
        const nx = px - w / 2 + 6 + s * (w - 12) / 3;
        ctx.beginPath();
        ctx.moveTo(nx, y - 2);
        ctx.lineTo(nx + 2, y + 3);
        ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(190,230,180,0.35)';
      ctx.beginPath();
      ctx.moveTo(px - w * 0.28, y - 12);
      ctx.lineTo(px - 2, y - 44);
      ctx.stroke();
    }
    plank(ctx, px - 4, groundY - 42, 8, 42, '#5d3a1e', px);
  }
  ctx.restore();
}
