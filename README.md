# GRIDRUNNER v7.6 — Flight Yard

[Play GRIDRUNNER](https://jalapenoseed.github.io/GRIDRUNNER/)

Four reference-pack drones, Flight Yard missions, scan HUD toggle, night vision, moving sun/weather and a settlement/NPC pass. **G** hangar · **K** scan overlay · **N** night vision · **O** atmosphere. Xbox **View + X/Y** toggles scan / night vision.

[Changes and controls](CHANGELOG-v7.6.md) · [Validation](QA-v7.6.md)

# GRIDRUNNER v7.5 — The Relay House

[Play GRIDRUNNER](https://jalapenoseed.github.io/GRIDRUNNER/)

Rebuilt bike cockpit, attitude-based drone flight, Xbox controls, field-terminal menus, audio improvements, reused equipment assets and a complete 3D mystery compound. Follow the service track west near the opening road. **J** journal · **I** pack · **M** map. Flight mode and controller settings are in Settings.

[Changes, controls and puzzle route](CHANGELOG-v7.5.md) · [Validation and device checks](QA-v7.5.md)

# GRIDRUNNER v7.4 — Perspectives

Play: https://jalapenoseed.github.io/GRIDRUNNER/

Press H or tap the view badge to cycle cameras. See [PERSPECTIVES-v7.4.md](PERSPECTIVES-v7.4.md) for controls, architecture, validation and limitations.

# GRIDRUNNER v7.3 — Settlements

Play: https://charltonty.github.io/GRIDRUNNER/

See [SETTLEMENTS-v7.3.md](SETTLEMENTS-v7.3.md) for new buildings, NPCs, audio, styling, tests and limitations.

# GRIDRUNNER v7.2 — Fieldwork

Play: https://charltonty.github.io/GRIDRUNNER/

See [FIELDWORK-GUIDE.md](FIELDWORK-GUIDE.md) for changes, controls, architecture, content examples, tests and known limitations. This is the first playable foundations pass from the Compact Work Handoff.

# GRIDRUNNER v7 — Ghost Signal, Legs 1–3

An in-place upgrade of the supplied GRIDRUNNER prototype. Complete editable browser source is in `dist/`; no production compilation is required.

## Play locally

Install Python 3, then run from this folder:

```sh
python3 -m http.server 8000 --directory dist
```

On Windows, `py -m http.server 8000 --directory dist` also works. Open **http://localhost:8000** in a WebGL-capable desktop browser. Do not open index.html directly with a file URL. Click New Expedition to begin and unlock audio. Start with HIGH or MEDIUM; use LOW for mobile or slower hardware.

## Develop and test

With Node.js 24 and npm:

```sh
npm ci
npm run dev
npm test
```

Vite prints the development address. `/_qa` is a clearly labeled development-only CPU/HUD diagnostic; it does not render 3D and is not included in the static hosted game.

## Controls

WASD ride/move; mouse look; S brake; P+W pedal; F mount/dismount; E use; R scan; Q launch/recall; Space ascend; Shift descend; I inventory; M map; Tab quick menu; Escape pause; F5 save slot 1.

Drone commands: **1 Follow, 2 Hold, 3 Dock, 4 FPV, 5 Scout Ahead, 6 Orbit**. Follow returns you to the bike while the drone accompanies you. Return and docking take flight time. Menus pause flight. Aircraft repairs are in Drones; recharge is in Pack/Craft. Park within 9 m of a landed aircraft to recover it with Q.

The left touch joystick, right-side look drag, rise/descend buttons and pedal toggle remain available.

## Release status

This v7 candidate passed the included logic and DOM integration tests. The available test browser could not create a WebGL context, so GPU rendering, manual campaign playthrough and frame-rate certification are pending. The v7 game is live at https://gridrunner.goodyartist.chatgpt.site. GitHub Pages setup is described in GITHUB-PAGES.md. Read `QA-v7.md`, `CHANGELOG-v7.md` and `DEVELOPER-GUIDE.md`.

The original source archive is preserved separately; its SHA-256 is recorded in QA-v7.md.
