"""Recompile and resave the three legacy demo rigs in the review copy only."""
import json
from pathlib import Path
import unreal

project = Path(unreal.Paths.project_dir()).resolve()
assert project.name == "GR_AssetReview"
results = []
for name in ("CR_Mannequin_BasicFootIK", "CR_Mannequin_Body", "CR_Mannequin_Procedural"):
    package = "/Game/MotoInteractionAnims/Demo/Characters/Mannequins/Rigs/" + name
    asset = unreal.load_asset(package)
    assert asset is not None, package
    recompile = getattr(asset, "recompile_vm", None)
    assert callable(recompile), "No supported recompile_vm API on " + name
    assert recompile() is not False, "VM compilation failed: " + name
    unreal.BlueprintEditorLibrary.compile_blueprint(asset)
    assert unreal.EditorAssetLibrary.load_blueprint_class(package) is not None, name
    assert unreal.EditorAssetLibrary.save_loaded_asset(asset, only_if_is_dirty=False), name
    results.append({"package": package, "vm_recompiled": True, "class_resolved": True, "saved": True})
(project / "Rig-Check.json").write_text(json.dumps(results, indent=2), encoding="utf-8")
unreal.log("GRIDRUNNER_RIG_CHECK " + str(len(results)) + " rigs recompiled, class-resolved and saved")
