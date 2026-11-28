# SELF-CHECK — Gobble Dash improvement pass + art overhaul + depth pass (28 Nov 2026)

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

## 2. Fun and depth — KUAT (naik dari SEDANG; the depth pass)
Four stages (Farmyard → Barnyard → Kitchen → Home Stretch) with rising
danger density and speed; jump + feather-flutter double jump with
variable height; ducking; near-miss slow motion; a corn economy that
moves the farmer's gap; mud that slows you while he closes; a farmer
who pressures, recovers, lunges on stumbles and taunts; hiding — duck
behind a hay bale and he loses the trail (gap regrows faster than
clean running; verified live: hidden=true, gap 315 → 345, no stumble).
NEW in the depth pass, three systems that make the run a series of
choices instead of a single reflex:
- **Corn combo streaks.** Cobs grabbed within 2.4 s of each other chain
  into a streak that multiplies every pickup up to ×5; the HUD grows a
  COMBO pill with a draining clock bar, popups pay out "+150 ×3", a
  stumble breaks the streak ("STREAK LOST"), and the end screen keeps
  a BEST COMBO row — a score to chase on the next run. Routing through
  an arc instead of around it is now the fast way home, not greed.
  Verified live in-browser: streak 1→2→3→4 paying ×1/×2/×3/×4, then
  cooling back to zero when the cobs stop.
- **The farmer rally.** Once a stage (170 / 490 / 770 / 950 m) he finds
  a second wind: a "FARMER RALLY!" banner, a hunting-horn sound, his
  meter label flipping to RALLY and pulsing red, and 4.2 s of triple
  pressure with no ground won back — unless you hide, which blunts it
  outright. Then he is winded for 2.4 s ("…wheeze…") and the gap is
  yours again. The chase now has peaks to survive and valleys to cash
  in, and the farmer corners as well as chases. Verified live: calm →
  rally at exactly 170 m → winded → calm, rally counter advancing.
- **Golden corn on the knife line.** The richest cob already asked for
  a jump; in knife country it now usually (65%) hangs on the falling
  knife's own column, under its warning marker — grab it flying at up
  to +500 at the top of a streak, or leave it. Verified by a spawn
  audit over a full run: stage 1 (no knives) never pairs, the kitchen
  pairs, stage 4 shows both cases.
All three are on the judge's sheet: the cover shows the ×5 combo pill,
the RALLY meter, and the turkey snatching the golden corn beside the
falling knife under a "+500 GOLD ×5!" popup; shot 3 shows the rally
banner over the hide that breaks it, streak alive at ×3; the escaped
shot's stats carry BEST COMBO. Contact sheets at the judge's exact
size, old vs new, were read side by side: the new sheet shows systems
the old one simply does not contain.
Lemah (honest remainder): it is still a one-lane runner — no branching
routes, and the base difficulty still grows by speed and density. What
this pass adds is decisions *inside* the lane: chase the streak or
play safe, take the golden gamble or skip it, hide out the rally or
outrun it. On the criterion's own words — skill and choices, a farmer
who chases, searches and corners, a reason to run again — that is the
ceiling this game's shape allows.

## 3. Feel and polish — KUAT
Controls answer at once (jump cuts short when released); dangers are
telegraphed fairly — a knife's growing ground shadow plus a NEW
flashing warning marker at the top of its column, cleavers at duck
height; feedback everywhere: popups (+25, CLOSE! +15, OUCH!, HIDDEN!),
feather bursts, screen shake, red flash, mercy-flash invulnerability,
speech bubbles; procedural Web Audio (gobbles, knife whistles, corn
pops, a bass loop, fanfare/sting); title, caught and escaped screens.
The depth pass speaks this language too: the streak has a draining
clock bar and escalating popups, and the rally is announced by banner,
horn, bubble and a pulsing meter before its pressure lands.
Lemah: the audio half of this criterion is invisible in a dossier —
the judge can only take the outline's word for it.

## 4. Look and originality — KUAT (naik dari SEDANG; the art overhaul)
All-original canvas art and names, one coherent autumn palette, comic
timing in the bubbles. The earlier pass enlarged everything (turkey
×1.3, farmer ×1.22, knife ×1.7) and filled the empty bands. THIS pass
is the art overhaul the previous check said was needed — no flat fills
remain anywhere the judge looks:
- Characters are shaded: the turkey's body and breast are sun-lit
  radial gradients with a warm rim along the back; its tail is five
  true feather vanes with shafts, barbs and lit tips; the wing carries
  scalloped coverts and fans real flight feathers on the double jump.
  The farmer has a round-shaded shirt and belly, stitched denim seams
  with brass buttons, a woven straw hat (rings and spokes) whose brim
  shadows his brow, and a textured beard.
- Everything stands on soft contact shadows that shrink and fade as
  the turkey climbs; props sit on theirs too.
- Surfaces carry texture: wood grain and knots in the fence, gate and
  counter; straw strokes and twine on the hay bale; kernel bumps in
  offset rows on the corn; brushed, riveted iron on the oven with
  layered flames and light spilling onto the floor; a bevelled,
  gleaming knife blade with a grained, riveted handle.
- The kitchen's old flat brown band is gone: plank wainscot with a
  chair rail, glass preserve jars with shaded contents and ridged
  lids, gradient pans, and daylight falling in shafts from the windows
  with dust motes drifting in the light. The floor is grouted tiles,
  each shaded a little differently, under a warm sheen.
- Outdoors: a sun with glow, halo and soft rays; clouds with warm
  shadowed undersides; gradient ridges; a planked barn with a lit
  window; trees with lit crowns, shaded undersides and bark lines;
  graded dirt with stones and grass tufts.
Evidence: contact sheets rebuilt at the judge's exact size (cover
768×480, three cells beneath) for the old and new versions and read
side by side — the difference is visible at that size, not only at
full size: the kitchen band, the jars, the oven fire, the feather
fan and the gate pines all read richer at a glance.
Lemah (honest remainder): the character silhouettes are still simple
rounded shapes by design — this is shaded vector art, not hand-drawn
raster illustration, and a rival with painted art still wins on raw
draughtsmanship. What this pass closes is the named weakness of the
last check: flatness. No large flat area survives in any shot.

## 5. Source structure (the outline) — KUAT
Ten files under game/src, one job each, named for what they do:
config (tuning + stages), world (spawning), game (state + physics),
render (backdrop, HUD, screens), sprites (every drawing), audio,
input, random, shots (screenshot staging), main (boot). The dossier
is 705,868 bytes, deterministic — two runs of main.ts byte-identical
(sha256 f2fc2170545a6615b5f985bf3ce5258b575dafa52e55cc3f11d4158d48ebc32c).
The art overhaul lives inside the same two files (sprites.js,
render.js), so the outline's structure is unchanged. The depth pass
keeps the same ten files; its systems land where their jobs already
live — the streak and the rally in game.js, the golden gamble in
world.js, their tuning in config.js, their faces in render.js — and
the outline gains declarations that name them (combo, rally, RALLY_AT).

## Verdict vs the previous version (70c63293)
Better, on the evidence the judge actually receives — and the gain is
again on the criterion that was weakest. The art-overhaul version had
closed criterion 4 and left criterion 2 (fun and depth) as the last
SEDANG on the sheet: a polished one-lane runner whose only decisions
were jump, duck and hide. This version keeps every pixel and mechanic
of that build — same art, same hide, same telegraphs, verified again:
headless playtest zero page errors, end-state driver escaped →
restart and caught → restart, dossier byte-identical across two
runs — and adds the three choice systems criterion 2 names: a streak
to chase and lose, a rally to survive or hide out, and a golden
gamble hanging on the knife line. All three are visible on the
judge's contact sheet and named in the source outline. Criterion 2
rises from SEDANG to KUAT; criteria 1, 3, 4 and 5 are unchanged or
lightly strengthened (the rally and streak feedback feeds criterion
3; the stats screen's new row feeds criterion 1's completeness).
With all five criteria at KUAT, this version should replace
70c63293 — and with it the standing entry — at the final submit.
