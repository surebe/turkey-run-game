# Gobble Dash — The Great Turkey Escape

![make.fun bounty](https://make.fun/badge/turkey-run-game-01.svg)
![rank](https://make.fun/badge/turkey-run-game-01/surebe/turkey-run-game/rank.svg)
![reward](https://make.fun/badge/turkey-run-game-01/surebe/turkey-run-game/reward.svg)

An original turkey escape game for the make.fun bounty
[Make the best turkey escape game](https://make.fun/bounty/turkey-run-game-01).

Thanksgiving is coming and the farmer is hungry. You are the turkey. Run
1,000 metres — through the farmyard, the barnyard and the farmer's own
kitchen — to the forest gate and freedom, while he stays one lunge behind
you the whole way, shouting about gravy.

- **Jump** the fences, hay bales and pumpkins — press again mid-air for a
  feather-flutter double jump.
- **Duck** the flying cleavers; never be standing where a falling carving
  knife lands (watch its shadow).
- **Grab the corn**: every cob distracts the farmer and buys you ground;
  golden corn is worth four times as much.
- **Stumble and he lunges.** Three hearts, one ever-closing gap, and a
  narrow-escape slow-motion bonus for clearing dangers by a feather.

Four stages that grow harder as you go, a farmer who chases, taunts and
corners, speech bubbles, squash-and-stretch animation, feather bursts, and a
fully procedural Web Audio soundtrack — gobbles, knife whistles, corn pops
and a barnyard bass loop. No audio files, no images, no libraries: every
pixel is drawn and every note is synthesised by the game's own code.

## Play

```sh
node serve.ts   # then open http://localhost:8080
```

Or serve `game/` with any static server and open `game/index.html`. No build
step, no network: every file the game loads lives under `game/`.

**Controls** — `Space` / click: jump (again in the air to double jump);
`↓` / `S`: duck; `Enter`: start; `M`: mute.

## Hand in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` (Node 22, standard library only) copies `game/` and `screenshots/`
to the output directory and writes `dossier.json` with the vendored make.fun
library (`vendor/makefun-game.ts`, copied from the competition kit
unchanged). Two runs write the same bytes.

## Layout

- `game/src/config.js` — every tuning number, the palette, the stage table
- `game/src/world.js` — stages, spawning and the difficulty ramp
- `game/src/game.js` — the state machine, physics, the farmer, collisions
- `game/src/sprites.js` — the turkey, the farmer and every prop, drawn in code
- `game/src/render.js` — backdrops, the kitchen, HUD, title and end screens
- `game/src/audio.js` — procedural Web Audio sound and music
- `game/src/input.js`, `game/src/random.js`, `game/src/shots.js`, `game/src/main.js`

MIT licensed — see `LICENSE`.
