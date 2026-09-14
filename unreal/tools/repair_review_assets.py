"""Resave only known stale demo references, inside GR_AssetReview only.

Requires asset_review_redirects.ini installed as this review's DefaultEngine.ini
before startup. Keeps original copies outside Content for recovery.
"""
import json
from pathlib import Path
import shutil
import unreal

project = Path(unreal.Paths.project_dir()).resolve()
assert project.name == "GR_AssetReview", "Repair is restricted to the evaluation copy"
report = json.loads((project / "Asset-Audit.json").read_text(encoding="utf-8"))
targets = sorted({detail["referenced_by"] for pack in report["packs"]
                  for detail in pack.get("missing_details", [])})
assert targets and all(p.startswith("/Game/MotoInteractionAnims/Demo/Characters/Mannequins/") for p in targets)
saved = []
for package in targets:
    relative = Path("Content") / (package.removeprefix("/Game/") + ".uasset")
    backup = project / "ReferenceRepairBackup" / relative
    if not backup.exists():
        backup.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(project / relative, backup)
    asset = unreal.load_asset(package)
    assert asset is not None, "Failed to load " + package
    assert unreal.EditorAssetLibrary.save_loaded_asset(asset, only_if_is_dirty=False), "Failed to save " + package
    saved.append(package)
(project / "Reference-Repair.json").write_text(json.dumps({"resaved_packages": saved}, indent=2), encoding="utf-8")
unreal.log("GRIDRUNNER_REFERENCE_REPAIR resaved " + str(len(saved)) + " packages")
