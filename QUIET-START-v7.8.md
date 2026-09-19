# Quiet Start (v7.8.1)

The tutorial applies to new Leg 1 expeditions. Flight Yard is independent
practice and can be entered at any stage, including from the main menu.

## Play

- Live site (v7.6, no tutorial): https://jalapenoseed.github.io/GRIDRUNNER/
- v8 tutorial build: https://cdn.jsdelivr.net/gh/jalapenoseed/GRIDRUNNER@grok/dist/index.html

Use a **new expedition**. Continue-save from an older version skips the yard.

## Player path

| Stage | You are | Do this |
|---|---|
| Approach | On foot | Walk north to the bike ahead. **F** |
| Yard | On the bike | **E** crate at 38, −94 |
| Yard | Bike + scout | **Q** launch, climb/look, **Q** recall; stop and wait for docking |
| Yard | Bike | **E** Mara at 54, −94 |
| Line | Full game | Charge west, tower north |

The objective stays visible during onboarding even with the objective panel
disabled in settings. It shows the next destination's distance and direction.
Prompts follow keyboard rebindings, Xbox input (B mount, A use, RB drone), or
touch input (BIKE, USE, DRONE). Radio supports the current step.

## Design rules

- Same map. No extra pre-level.
- One new verb at a time.
- Hide chrome instead of adding a help screen.
- Fatal combat stays off until Line Open.
- Only Mara completes the final step. Other contacts cannot bypass it.
- Practice holds the complete expedition, including an unfinished tutorial.
- Supplied Leg 2 and Leg 3 starts skip this tutorial.

## State

`s.intro = { stage, mounted, salvaged, scouted, talked, launched }`

`stage` is `approach` | `yard` | `line`.

## Test

1. New game → not sitting on the bike.
2. Cannot salvage before mount.
3. Cannot fly before first crate.
4. Cannot finish Mara talk before scout recall.
5. After Mara, map / journal / combat unlock and normal HUD preferences return.
6. Load an old save → no tutorial lock.
7. Main menu → Flight Yard → launch each airframe; G reopens the hangar.
8. Enter practice midway through the tutorial, switch flights, return → identical
   inventory, positions, progress and tutorial flags; no practice autosave.
9. Supplied Leg 2 / Leg 3 → launch drone and enter/leave Flight Yard normally.

Run `npm ci` and `npm test` with Node.js 24. `verify-intro.mjs` supplies migration
checks and the tutorial integration scenarios run by `verify-runtime.mjs`.
The integration suite uses real Three.js objects and DOM events with a stub
renderer; it does not measure GPU performance or visually inspect materials.
