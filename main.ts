// Gobble Dash — The Great Turkey Escape, handed in.
//
// The game is the static site under game/: open game/index.html in a desktop
// browser and it plays, offline, with no build step and no network. This
// program is the courier. It copies game/ and screenshots/ into the output
// directory and writes dossier.json — the summary the judge reads — with the
// vendored make.fun library (vendor/makefun-game.ts, the kit's file, kept
// byte for byte). Run it twice and the output bytes agree:
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// MAKEFUN_OUTPUT_DIR stands in for /output outside the grader's container.

import { existsSync, mkdirSync, readdirSync, statSync, copyFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// A small recursive copy of our own, so the courier depends on nothing but
// the standard library's plainest calls.
function copyTree(from, to) {
  mkdirSync(to, { recursive: true });
  for (const name of readdirSync(from)) {
    const src = join(from, name);
    const dst = join(to, name);
    if (statSync(src).isDirectory()) copyTree(src, dst);
    else copyFileSync(src, dst);
  }
}

mkdirSync(out, { recursive: true });
copyTree(join(here, 'game'), join(out, 'game'));
if (existsSync(join(here, 'screenshots'))) {
  copyTree(join(here, 'screenshots'), join(out, 'screenshots'));
}

// The caps below are the gate's own, from the kit: past any of them the
// scorer refuses the entry outright, so the dossier is written with the same
// limits the gate rebuilds it under, and the two agree byte for byte.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
