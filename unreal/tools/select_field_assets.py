"""Run inside the verified review project. Select dependencies without modifying sources."""
import hashlib
import json
import shutil
from pathlib import Path
import unreal as ue

ROOT = Path(ue.Paths.project_dir()).resolve()
DEST = Path('D:/GRIDRUNNER-Unreal/unreal/GRIDRUNNERAssetLab/Content')
REPORT = Path('D:/GRIDRUNNER-Unreal/unreal/validation/field_vendor_manifest.json')
registry = ue.AssetRegistryHelpers.get_asset_registry()
registry.search_all_assets(True)
mesh_names = ['SM_FWYBarrier_Traffic_A01_N1', 'SM_FWYBarrier_Barrel_A01_N1',
 'SM_FWYTrash_TireDestroyed_A01_N1', 'SM_FWYSignWarn_Slippery_A01_N1',
 'SM_FWYTrash_Bag_A01_N1', 'SM_FWYTrash_Container_A01_N1', 'SM_Sandbags_A01_N1']
seeds = ['/Game/Deko_MatrixDemo/Freeway/Meshes/' + n for n in mesh_names]
seeds += ['/Game/Bike/BikeBP/BikeBP',
 '/Game/MotoInteractionAnims/Animations/Mounted/Idle/AS_Idle_Riding',
 '/Game/MotoInteractionAnims/Demo/Characters/Mannequins/Meshes/SKM_Manny_Simple',
 '/Game/Free_Sounds_Pack/cue/Ambient_Wind_Loop_1_Cue',
 '/Game/Free_Sounds_Pack/cue/Ambient_Birds_Loop_04_Cue',
 '/Game/Free_Sounds_Pack/cue/Ambient_Rain_Moderate_Loop_1_Cue',
 '/Game/Sparks_Embers/Niagara/NS_Sparks01',
 '/Game/Sparks_Embers/Niagara/NS_Sparks08']
options = ue.AssetRegistryDependencyOptions(True, True, False, False, False)
seen, pending, external = set(), list(seeds), set()
while pending:
    package = pending.pop()
    if package in seen:
        continue
    if not package.startswith('/Game/'):
        external.add(package)
        continue
    if not ue.EditorAssetLibrary.does_asset_exist(package):
        raise RuntimeError('Missing dependency: ' + package)
    seen.add(package)
    pending.extend(str(p) for p in registry.get_dependencies(package, options))

files = []
for package in sorted(seen):
    rel = package[len('/Game/'):]
    sources = [ROOT / 'Content' / (rel + ext) for ext in ('.uasset', '.umap', '.uexp', '.ubulk')]
    found = False
    for src in sources:
        if not src.exists():
            continue
        found = True
        target = DEST / src.relative_to(ROOT / 'Content')
        sha = hashlib.sha256(src.read_bytes()).hexdigest()
        if target.exists() and hashlib.sha256(target.read_bytes()).hexdigest() != sha:
            raise RuntimeError('Refuse overwrite: ' + str(target))
        target.parent.mkdir(parents=True, exist_ok=True)
        if not target.exists():
            shutil.copy2(src, target)
        if hashlib.sha256(target.read_bytes()).hexdigest() != sha:
            raise RuntimeError('Copy verification failed: ' + str(target))
        files.append({'path': target.relative_to(DEST).as_posix(), 'sha256': sha, 'bytes': src.stat().st_size})
    if not found:
        raise RuntimeError('No package file: ' + package)
report = {'source_project': str(ROOT), 'seeds': seeds, 'packages': sorted(seen),
          'external_dependencies': sorted(external), 'files': files,
          'total_bytes': sum(f['bytes'] for f in files)}
REPORT.parent.mkdir(exist_ok=True)
REPORT.write_text(json.dumps(report, indent=2), encoding='utf-8')
ue.log('GR_FIELD_ASSETS_COPIED ' + str(len(files)) + ' files ' + str(report['total_bytes']) + ' bytes')

inspection = {}
try:
    cls = ue.EditorAssetLibrary.load_blueprint_class('/Game/Bike/BikeBP/BikeBP')
    inspection['bike_class'] = str(cls)
    cdo = ue.get_default_object(cls)
    inspection['cdo'] = str(cdo)
    inspection['components'] = []
    for c in cdo.get_components_by_class(ue.ActorComponent):
        item = {'class': c.get_class().get_name(), 'name': c.get_name()}
        if isinstance(c, ue.SkeletalMeshComponent):
            item['mesh'] = str(c.get_editor_property('skeletal_mesh_asset'))
        for prop in ('wheel_setups', 'engine_setup', 'transmission_setup'):
            try:
                item[prop] = str(c.get_editor_property(prop))
            except Exception:
                pass
        inspection['components'].append(item)
except Exception as exc:
    inspection['error'] = str(exc)
(REPORT.parent / 'field_bike_inspection.json').write_text(json.dumps(inspection, indent=2), encoding='utf-8')
ue.SystemLibrary.quit_editor()
