# GRIDRUNNER v7.16 — Physical world and fleet control (`grok`)

**[Play GRIDRUNNER](https://gridrunner.goodyartist.chatgpt.site)**

Rapier now resolves rider movement against buildings, terrain grades, rocks, oak trunks, towers, solar hardware, crates and campaign facilities, while sweeping drone hulls through their full movement each tick. Mara and six camp residents retain their Recast routes. All four aircraft can fly Wedge, Trail, Line and Orbit formations or receive squad-wide orders without replacing single-aircraft FPV.

New expeditions start on foot. Mount → salvage → scout hop → Mara. Then follow the line. Tab opens the field menu; Escape pauses or resumes. Flight Yard is in the menu or G. K toggles scan overlays, N night vision, O light/weather, H camera view. Shift+1–4 selects an aircraft, Shift+5 selects the fleet, 7–0 selects formations, and F8 displays nearby collision volumes for QA.

Planning, supplies and equipment use five menu groups. Riding instruments remain on the bike's dashboard, with compact chase-view and drone telemetry. Later supplied chapter starts are under Chapters.

Run `npm ci` and `npm test`. Serve `dist/` for the playable game, or use `npm run dev`. Existing saves migrate; Flight Yard never replaces campaign saves.

[v7.16 changelog](CHANGELOG-v7.16.md) · [v7.15 engine integration notes](INTEGRATIONS-v7.15.md). The pinned engines are committed under `dist/vendor/`; regenerate with `npm run vendor:engines`. No CDN or runtime package install is required.

[Field Edition changelog](CHANGELOG-v7.10.md) · [Quiet Start](QUIET-START-v7.8.md) · [Previous changelog](CHANGELOG-v7.8.md)

Opening story, handbook and surface rendering notes: [CHANGELOG-v7.11.md](CHANGELOG-v7.11.md).
