"""Run in UnrealEditor-Cmd against GR_AssetReview, not the original sources."""
import json
from pathlib import Path
import unreal

registry = unreal.AssetRegistryHelpers.get_asset_registry()
registry.search_all_assets(True)
roots = ["/Game/Bike", "/Game/Deko_MatrixDemo", "/Game/Free_Sounds_Pack", "/Game/MotoInteractionAnims", "/Game/Sparks_Embers"]
dependency_options = unreal.AssetRegistryDependencyOptions(
    include_soft_package_references=True, include_hard_package_references=True,
    include_searchable_names=False, include_soft_management_references=False,
    include_hard_management_references=False)
result = {"project": str(unreal.Paths.project_dir()), "packs": []}
for root in roots:
    assets = registry.get_assets_by_path(root, recursive=True) or []
    classes, missing, examples, missing_details = {}, set(), {}, []
    for asset in assets:
        kind = str(asset.asset_class_path.asset_name)
        classes[kind] = classes.get(kind, 0) + 1
        examples.setdefault(kind, [])
        if len(examples[kind]) < 8:
            examples[kind].append(str(asset.package_name))
        hard = set(str(p) for p in (registry.get_dependencies(asset.package_name,
                   unreal.AssetRegistryDependencyOptions(include_hard_package_references=True)) or []))
        for dependency in (registry.get_dependencies(asset.package_name, dependency_options) or []):
            path = str(dependency)
            if path.startswith("/Game/") and not registry.get_assets_by_package_name(dependency):
                missing.add(path)
                missing_details.append(dict(package=path, referenced_by=str(asset.package_name),
                                            kind="hard" if path in hard else "soft"))
    result["packs"].append(dict(root=root, assets=len(assets), classes=classes,
                               missing_game_dependencies=sorted(missing), missing_details=missing_details, examples=examples))
output = Path(unreal.Paths.project_dir()) / "Asset-Audit.json"
output.write_text(json.dumps(result, indent=2), encoding="utf-8")
unreal.log("GRIDRUNNER_ASSET_AUDIT " + str(output))
