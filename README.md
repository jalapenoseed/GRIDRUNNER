# GRIDRUNNER v7.15 — Camp movement and collision (`grok`)

**[Play GRIDRUNNER](https://gridrunner.goodyartist.chatgpt.site)**

Rapier now resolves rider movement against buildings and sweeps drone hulls through their full movement each tick. Mara and six camp residents follow Recast navigation routes, animate their walk, and stop for conversations. Mara stays in place during Quiet Start. Flight equations, all four airframes, the three campaign legs and existing saves are retained.

New expeditions start on foot. Mount → salvage → scout hop → Mara. Then follow the line. Tab opens the field menu; Escape pauses or resumes. Flight Yard is in the menu or G. K toggles scan overlays, N night vision, O light/weather, H camera view.

Planning, supplies and equipment use five menu groups. Riding instruments remain on the bike's dashboard, with compact chase-view and drone telemetry. Later supplied chapter starts are under Chapters.

Run `npm ci` and `npm test`. Serve `dist/` for the playable game, or use `npm run dev`. Existing saves migrate; Flight Yard never replaces campaign saves.

[v7.15 integration notes and next libraries](INTEGRATIONS-v7.15.md). The pinned engines are committed under `dist/vendor/`; regenerate with `npm run vendor:engines`. No CDN or runtime package install is required.

[Field Edition changelog](CHANGELOG-v7.10.md) · [Quiet Start](QUIET-START-v7.8.md) · [Previous changelog](CHANGELOG-v7.8.md)

Opening story, handbook and surface rendering notes: [CHANGELOG-v7.11.md](CHANGELOG-v7.11.md).
