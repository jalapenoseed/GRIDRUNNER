"""Fail fast if the saved Ghost Signal map or core runtime dependencies regress."""
import json
from pathlib import Path
import unreal as ue

PROJECT = Path(ue.Paths.project_dir()).resolve()
REPORT = PROJECT.parent / "validation" / "gameplay.json"
MAP = "/Game/GRIDRUNNER/Maps/L_GhostSignal_Prototype"
LIB = ue.EditorAssetLibrary
LEVEL = ue.get_editor_subsystem(ue.LevelEditorSubsystem)
ACTORS = ue.get_editor_subsystem(ue.EditorActorSubsystem)

required = [
    MAP,
    "/Game/ThirdPerson/Blueprints/BP_ThirdPersonCharacter",
    "/Game/ThirdPerson/Blueprints/BP_ThirdPersonGameMode",
    "/Game/Input/IMC_Default",
    "/Game/Characters/Mannequins/Meshes/SKM_Quinn_Simple",
    "/Game/GRIDRUNNER/Materials/M_GR_ElectricArc",
]
missing = [path for path in required if not LIB.does_asset_exist(path)]
if missing:
    raise RuntimeError("Missing runtime assets: " + ", ".join(missing))
if not LEVEL.load_level(MAP):
    raise RuntimeError("Saved Ghost Signal map did not reopen")
labels = {a.get_actor_label() for a in ACTORS.get_all_level_actors()}
expected = {"GhostSignal_PlayerStart", "Mission_Start", "Objective_01", "Objective_02", "Objective_03", "Signal_Source", "Camera_GhostSignal_Wide"}
expected.add("TerrainBase_00")
absent = expected - labels
if absent:
    raise RuntimeError("Saved map actors missing: " + ", ".join(sorted(absent)))
data = json.loads(REPORT.read_text(encoding="utf-8"))
if data["highway_segments"] != 10 or data["route_beacons"] != 5 or data["terrain_tiles"] != 10:
    raise RuntimeError("Gameplay manifest counts regressed")
ue.log("GRIDRUNNER_GHOST_SIGNAL_VERIFY_OK " + json.dumps({"actors": len(labels), "required_assets": len(required)}))
ue.SystemLibrary.quit_editor()
