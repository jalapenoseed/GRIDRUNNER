# Quiet Start (v7.8)

## Play

- Live site (v7.6, no tutorial): https://jalapenoseed.github.io/GRIDRUNNER/
- v8 tutorial build: https://cdn.jsdelivr.net/gh/jalapenoseed/GRIDRUNNER@grok/dist/index.html

Use a **new expedition**. Continue-save from an older version skips the yard.

## Player path

| Stage | You are | Do this |
|---|---|---|
| Approach | On foot | Walk to the bike. **F** |
| Yard | On the bike | **E** crate at 38, −94 |
| Yard | Bike + scout | **Q** up, look, **Q** dock |
| Yard | Bike | **E** Mara at 54, −94 |
| Line | Full game | Charge west, tower north |

Radio (`CHARGER` / `MARA`) repeats the current verb.

## Design rules

- Same map. No extra pre-level.
- One new verb at a time.
- Hide chrome instead of adding a help screen.
- Fatal combat stays off until Line Open.

## State

`s.intro = { stage, mounted, salvaged, scouted, talked, launched }`

`stage` is `approach` | `yard` | `line`.

## Test

1. New game → not sitting on the bike.
2. Cannot salvage before mount.
3. Cannot fly before first crate.
4. Cannot finish Mara talk before scout recall.
5. After Mara, map / hangar / raiders return.
6. Load an old save → no tutorial lock.
