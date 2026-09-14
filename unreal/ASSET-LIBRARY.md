# GRIDRUNNER asset library

The Windows asset hub is `D:\UNREAL-GRIDRUNNER-ASSETS`.
The game remains `D:\GRIDRUNNER-Unreal\unreal\GRIDRUNNERAssetLab` on the
GitHub `unreal` branch. The asset inbox is a separate content-only UE 5.8
project: `D:\UNREAL-GRIDRUNNER-ASSETS\Projects\GR_AssetInbox`.

| Location or shortcut | Purpose |
| --- | --- |
| `Open-GRIDRUNNER.cmd` | Open the existing Ghost Signal game project |
| `Open-Asset-Inbox.cmd` | Open the staging project for future Fab **Add to Project** downloads |
| `Open-Asset-Review.cmd` | Inspect copied bike, freeway, riding-animation, audio and effects packs on D: |
| `Catalog.html` / `Open-Catalog.cmd` | Search installed collections by pack, role or source folder |
| `Shortcuts` | Clearly named Browse commands for the existing mixed source projects |
| `Refresh-Catalog.cmd` | Rescan source projects and record additions or changes |
| `Downloads` | Store raw FBX/GLB/texture/audio downloads, one subfolder per pack |
| `SourceProjects` | Destination for future **Create Project** packs, one intact project per pack |

Existing C: projects retain their names and locations while downloads continue.
The catalog labels them by their actual contents. This avoids disrupting the
Launcher or renaming C++ modules and Unreal package references. No collections
have been deleted or deduplicated. Factory and MetaHuman copies have unique
additions and must not be treated as interchangeable.

For new **Add to Project** assets, select `GR_AssetInbox`. Open that project once
if it does not appear in the Launcher's project picker. If the Launcher still
does not list it, restart the Launcher after downloads finish. Keep each pack's
original Content folder names. For **Create Project**, select `SourceProjects`
as the parent location and retain the pack's project name. Download matching
engine content where available; inspect older projects through **Open a Copy**.

Inside the game, GRIDRUNNER work belongs in `/Game/GRIDRUNNER`:
`Characters`, `Vehicles`, `Drone`, `Electrical`, `Environment`, `Audio`, `UI`,
`Maps`, and `Data`. These are naming conventions, not claims that each gameplay
system is implemented. Vendor package paths remain intact during migration.
Select assets and their dependencies in Unreal's Migrate workflow; check for
collisions with existing names before accepting any overwrite. Reorganize
packages only in Unreal's Content Browser and fix redirectors afterward.

The catalog scans file metadata and identifies known pack roots. It does not
prove downloads complete, licenses acquired, meshes functional, or dependencies
valid. A changed timestamp is a reason to recheck; it is not a completion flag.
Editor load, dependency, material, collision, rig and gameplay checks follow.

`GR_AssetReview` is a separate inspection snapshot made by `gr_stage_assets.py`.
It preserves the selected packs' `/Game` folder paths and checks SHA-256 equality
against their originals. Its `Copy-Manifest.json` records every file. This is
not a completed game import. `audit_review_assets.py`, run inside Unreal on this
review project, lists asset classes and unresolved `/Game` package references.
Other plugin dependencies and visual/gameplay correctness require further checks.
The copy tool refuses to overwrite an existing review project and retains any
incomplete copy for diagnosis. It does not delete source files.

The older motorcycle demo had stale references inside its original packages.
`repair_review_assets.py` resaves only the affected evaluation copies, using the
temporary mappings in `asset_review_redirects.ini`. The original files and config
must be backed up before applying those mappings. Restore the prior config after
resaving, then rerun the audit without redirects. `verify_review_rigs.py` checks
that the three demo rigs can recompile, resolve their classes, and save in UE 5.8.
The review project's `ReferenceRepairBackup` preserves the source versions.

See [ASSET-STATUS.md](ASSET-STATUS.md) for this pass's findings. The game integration
and visual tests are a separate next step.

The Python tool is `unreal/tools/gr_asset_library.py`. Run it with Unreal's
bundled Python and `--refresh` to create/update the generated hub. With no
`--refresh`, it prints a read-only inventory. Source roots and output locations
can be supplied as command-line options. The hub's `Projects` and `SourceProjects`
are scanned too. Two refreshes cannot write concurrently.
The preceding catalog is retained as `Catalog.previous.json`.

Only organization tools and documentation are intended for Git. The source
collections, Launcher cache and generated catalog live outside the repository.
Do not commit entire downloaded packs as part of an organization change.
