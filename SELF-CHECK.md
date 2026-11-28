# SELF-CHECK — Gobble Dash improvement pass (28 Nov 2026)

Graded against the judge's own criteria in the kit's RULES.txt, in the
judge's order. The judge sees one contact sheet (cover at 768×480, the
other three shots in small cells) plus a short source outline — so every
verdict below is about what that view actually shows, checked against a
contact sheet rebuilt at exactly that size.

Standing before this pass: R1 953/4,864 → R2 2,677/6,307 (score 598,257).

## 1. A complete turkey escape game, shown in screenshots — KUAT
Every element the criterion names is visible in the sheet itself:
title screen (shot 2), a run in play with HUD — score, corn, distance
bar, hearts, farmer meter, stage name (cover + shot 3) — an end screen
for escaped with stats and a restart prompt (shot 4), and in the cover
alone: the turkey, the chasing farmer, the oven and the falling carving
knife. The game is verified playable headless: zero page errors, the
play driver runs it, and the end-state driver proves escaped → restart
and caught → restart.
Lemah: the caught end screen exists and works but is not one of the
four shots (the criterion accepts caught *or* escaped; we show escaped).

## 2. Fun and depth — SEDANG, naik
Four stages (Farmyard → Barnyard → Kitchen → Home Stretch) with rising
danger density and speed; jump + feather-flutter double jump with
variable height; ducking; near-miss slow motion; a corn economy that
moves the farmer's gap; mud that slows you while he closes; a farmer
who pressures, recovers, lunges on stumbles and taunts. NEW this pass:
hiding — duck behind a hay bale and he loses the trail (gap regrows
faster than clean running; verified live: hidden=true, gap 315 → 345,
no stumble), shown in shot 3 with his "WHERE DID IT GO?!" bubble.
Lemah: at heart it is still a one-lane runner — no branching routes,
and difficulty grows by speed and density only.

## 3. Feel and polish — KUAT
Controls answer at once (jump cuts short when released); dangers are
telegraphed fairly — a knife's growing ground shadow plus a NEW
flashing warning marker at the top of its column, cleavers at duck
height; feedback everywhere: popups (+25, CLOSE! +15, OUCH!, HIDDEN!),
feather bursts, screen shake, red flash, mercy-flash invulnerability,
speech bubbles; procedural Web Audio (gobbles, knife whistles, corn
pops, a bass loop, fanfare/sting); title, caught and escaped screens.
Lemah: the audio half of this criterion is invisible in a dossier —
the judge can only take the outline's word for it.

## 4. Look and originality — SEDANG (the weakest criterion, honestly)
All-original canvas art and names, one coherent autumn palette, comic
timing in the bubbles. This pass: turkey ×1.3, farmer ×1.22 with an
angry lunging brow, knife ×1.7 with a blade gleam, cleaver ×1.3, oven /
fence / hay / pumpkins enlarged; the kitchen's dead wall band filled
with a preserve-jar shelf, a hanging-utensil rail and taller windows;
the farm's empty mid-ground filled with a fence line and bigger trees;
title and restart prompts put on contrast pills so they read at cell
size; the FREEDOM gate is no longer washed out by the sunburst.
Lemah: the art is still flat vector shapes with no shading or texture,
and the kitchen wall keeps large flat brown areas. Against a
hand-illustrated rival this criterion still loses; closing it would
take an art overhaul, not a polish pass. This is the ceiling of this
entry and it is stated before submit, not after.

## 5. Source structure (the outline) — KUAT
Ten files under game/src, one job each, named for what they do:
config (tuning + stages), world (spawning), game (state + physics),
render (backdrop, HUD, screens), sprites (every drawing), audio,
input, random, shots (screenshot staging), main (boot). The dossier
is 537,585 bytes, deterministic — two runs of main.ts byte-identical
(sha256 ecc81cd1e67c105f7ecbeab77fe96dcf51aafd5dfa25125af64612733dbe74c1).

## Verdict vs the standing entry
Better, on the evidence the judge actually receives: the cover now
sells the whole game at a glance (banner, leap over the oven, big
knife, lunging farmer, no speech bubble eating the turkey), shot 3
demonstrates a second verb (hiding) instead of an empty sky, and the
game itself gained the hide mechanic and the knife telegraph. The
known remaining weakness is criterion 4's flat art, recorded above.
