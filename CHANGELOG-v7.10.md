# GRIDRUNNER v7.10 — Backpack & roadside

- Replaces the item thumbnail placeholders with 32 individually mapped Lucide symbols, material colors, quantities and readable names. The licensed subset is bundled locally; no icon CDN is needed.
- Backpack has search, categories, sorting and one selected-item inspector. Hover or keyboard focus shows a small read-only tooltip on desktop; selection exposes full details and actions on every device.
- Item actions reuse the existing equip, salvage, consume, fuel, discard, loot and cargo transactions. Vehicle range, protected components, recipe knowledge, tools, power and storage capacity remain enforced.
- Workshop separates fabrication and upgrades from carried items. The Relay House bench opens the Workshop. Cargo tabs separate backpack, bike, trailer and nearby salvage.
- Adds seeded grass clumps, scrub patches and nearer oak groves using instanced geometry and the existing oak cutout. Grass sways in the shader. Quality settings reduce instance counts; LOW omits crown cards and their new trunks.
- Stronger distance fog and bounded world labels soften the long exposed view. Clear daylight intensity, intentional night modes, saved discoveries and gameplay coordinates remain intact.
- Regression coverage exercises category/search state, focus preservation, empty results, selected-item salvage, vehicle range, workshop prerequisites and all 32 symbols. The geometry checks cover over 9,000 scenery transforms, including the new foliage, against authored areas.

## Icon attribution
Lucide 1.8.0, ISC license. See `dist/assets/ui/LICENSE-lucide.txt`. The original supplied menu atlas remains in use for the broader field interface.
