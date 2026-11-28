# SELF-CHECK — Gobble Dash improvement pass + art overhaul (28 Nov 2026)

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
is 679,932 bytes, deterministic — two runs of main.ts byte-identical
(sha256 0c743031daed5b3889e00be77fdec199c05d05cfdf6d34436c259b261e1e3f50).
The art overhaul lives inside the same two files (sprites.js,
render.js), so the outline's structure is unchanged.

## Verdict vs the standing entry (3c33323b)
Better, on the evidence the judge actually receives — and this time
the gain is on the criterion that was weakest. The previous version
already sold the whole game at a glance (banner, leap over the oven,
big knife, lunging farmer, hiding shown in shot 3); this version
keeps all of that and removes the flatness the last check named as
the entry's ceiling: shaded characters with feather, straw, wood and
metal texture, contact shadows, a lamplit plank-and-glass kitchen
with light shafts and dust, and a sunlit, textured farm. Criteria
1, 2, 3 and 5 are unchanged in substance (the same game, mechanics
and structure — verified again: headless playtest zero page errors,
end-state driver escaped → restart and caught → restart); criterion
4 rises from SEDANG to KUAT. This version should replace 3c33323b.
