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

This v7 candidate passed the included logic and DOM integration tests. The available test browser could not create a WebGL context, so GPU rendering, manual campaign playthrough and frame-rate certification are pending. The live v6 game has not been replaced. Read `QA-v7.md`, `CHANGELOG-v7.md` and `DEVELOPER-GUIDE.md`.

The source ZIP includes the untouched canonical archive under `original/`. Its SHA-256 is recorded in `QA-v7.md`.
