// Boot: size the canvas, wire the pieces together and run the loop. When the
// URL carries ?shot=<name> the game instead composes that one staged scene,
// renders it a few frames so every animation settles, and raises
// window.__shotReady for the screenshot tool.

import { VIEW_H, VIEW_W } from './config.js';
import { SoundBoard } from './audio.js';
import { Game } from './game.js';
import { Input } from './input.js';
import { Renderer } from './render.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const status = document.getElementById('status');

const sound = new SoundBoard();
const game = new Game(sound);
const input = new Input(canvas);
const renderer = new Renderer();

window.__game = game;

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

window.addEventListener('keydown', () => sound.wake());
window.addEventListener('pointerdown', () => sound.wake());

function frame() {
  const scale = Math.min(canvas.width / VIEW_W, canvas.height / VIEW_H);
  const ox = (canvas.width - VIEW_W * scale) / 2;
  const oy = (canvas.height - VIEW_H * scale) / 2;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#1c1108';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.setTransform(scale, 0, 0, scale, ox, oy);
  renderer.draw(ctx, game);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

const params = new URLSearchParams(window.location.search);
if (params.has('shot')) {
  stageShot(game, params.get('shot'));
  for (let i = 0; i < 4; i++) {
    game.time += 1 / 30;
    frame();
  }
  window.__shotReady = true;
} else {
  let last = performance.now();
  let lastState = '';
  const loop = (now) => {
    const dt = Math.min(0.05, Math.max(0.0005, (now - last) / 1000));
    last = now;
    if (input.mutePressed()) sound.setMuted(!sound.muted);
    game.update(dt, input);
    frame();
    if (game.state !== lastState) {
      lastState = game.state;
      status.textContent = {
        title: 'Gobble Dash. Press space to run.',
        play: 'Running. Jump the obstacles, duck the cleavers, reach the forest gate.',
        caught: 'Caught! Press space to run again.',
        escaped: 'Escaped! Press space to run again.',
      }[game.state] ?? '';
    }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}
