# GRIDRUNNER v7.11 — The Line Remembers

- Three-page opening story, shown before the first main menu and available before a fresh expedition. Skip, page selection, keyboard and controller navigation are supported. Returning players can replay it in the Story archive; reading never mutates their expedition or saves.
- Field manual with six sections, current keyboard bindings, first-mile instructions, bike power, drone operations, backpack/crafting, exploration and save guidance. Later story entries appear only when reached. Puzzle solutions are kept out of the general manual.
- Engraved folio borders, brass rules, large condensed headings and literary intro text. Desktop and phone layouts share the same menu shell.
- Shared world-space surface shader reuses the supplied damp-concrete and galvanized material textures on merged geometry. Texture relief, large-scale variation and rain-responsive road roughness improve the existing meshes without changing collisions or asset placement.
- Ground normal and roughness maps reuse the supplied CC0 Ground037 material. Existing foliage, equipment and settlements cast shadows. Grass remains a receive-only batch.
- Medium/High/Ultra sun shadows use 1024/2048/4096 maps, with light-space texel stabilization and tighter normal bias. Low disables shadows and the additional surface texture samples. Daylight fill and intentional blackout behavior remain unchanged.
- Existing gameplay, saves, tutorial, crafting, missions, controller and scenery-clearance checks pass. Added flow checks cover story replay, skip/new expedition, spoiler gating and remapped manual labels. Real WebGL appearance is checked separately in the browser.

Texture provenance remains in `dist/assets/kit/PROVENANCE.txt` and the existing drone material export metadata. No additional external runtime services or dependencies.
