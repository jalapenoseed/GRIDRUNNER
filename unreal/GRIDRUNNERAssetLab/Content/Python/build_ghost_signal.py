"""Build the first playable GRIDRUNNER: Ghost Signal exploration map in UE 5.8."""
import json
import math
from pathlib import Path

import unreal as ue

ROOT = "/Game/GRIDRUNNER"
SOURCE_MAP = ROOT + "/Maps/L_AssetLab_Showcase"
GAME_MAP = ROOT + "/Maps/L_GhostSignal_Prototype"
LIB = ue.EditorAssetLibrary
MAT = ue.MaterialEditingLibrary
LEVEL = ue.get_editor_subsystem(ue.LevelEditorSubsystem)
ACTORS = ue.get_editor_subsystem(ue.EditorActorSubsystem)
TOOLS = ue.AssetToolsHelpers.get_asset_tools()
PROJECT = Path(ue.Paths.project_dir()).resolve()
VALIDATION = PROJECT.parent / "validation"


def spawn(cls, label, xyz, rotation=(0, 0, 0), folder="GRIDRUNNER_GhostSignal"):
    actor = ACTORS.spawn_actor_from_class(
        cls, ue.Vector(*xyz),
        ue.Rotator(pitch=rotation[0], yaw=rotation[1], roll=rotation[2]))
    if not actor:
        raise RuntimeError("Could not spawn " + label)
    actor.set_actor_label(label)
    actor.set_folder_path(folder)
    return actor


def load(path):
    asset = LIB.load_asset(path)
    if not asset:
        raise RuntimeError("Required asset is missing: " + path)
    return asset


def material(name):
    return load(ROOT + "/Materials/MI_GR_" + name)


def primitive(label, xyz, scale, mat, shape="Cube", rotation=(0, 0, 0), folder="GRIDRUNNER_GhostSignal/World"):
    actor = spawn(ue.StaticMeshActor, label, xyz, rotation, folder)
    component = actor.get_component_by_class(ue.StaticMeshComponent)
    component.set_static_mesh(load("/Engine/BasicShapes/" + shape))
    component.set_material(0, mat)
    component.set_collision_enabled(ue.CollisionEnabled.QUERY_AND_PHYSICS)
    actor.set_actor_scale3d(ue.Vector(*scale))
    return actor


def text_marker(label, text, xyz, rotation=(0, 0, 0), size=58.0, color=(0.05, 0.75, 1.0, 1.0)):
    actor = spawn(ue.TextRenderActor, label, xyz, rotation, "GRIDRUNNER_GhostSignal/Wayfinding")
    component = actor.get_component_by_class(ue.TextRenderComponent)
    component.set_text(text)
    component.set_editor_property("world_size", size)
    component.set_text_render_color(ue.Color(int(color[0] * 255), int(color[1] * 255), int(color[2] * 255), 255))
    return actor


def electric_material():
    path = ROOT + "/Materials/M_GR_ElectricArc"
    if LIB.does_asset_exist(path):
        return LIB.load_asset(path)
    asset = TOOLS.create_asset("M_GR_ElectricArc", ROOT + "/Materials", ue.Material, ue.MaterialFactoryNew())
    color = MAT.create_material_expression(asset, ue.MaterialExpressionVectorParameter, -500, -80)
    color.set_editor_property("parameter_name", "ArcColor")
    color.set_editor_property("default_value", ue.LinearColor(0.02, 0.55, 1.0, 1.0))
    strength = MAT.create_material_expression(asset, ue.MaterialExpressionScalarParameter, -500, 80)
    strength.set_editor_property("parameter_name", "Intensity")
    strength.set_editor_property("default_value", 55.0)
    multiply = MAT.create_material_expression(asset, ue.MaterialExpressionMultiply, -180, 0)
    MAT.connect_material_expressions(color, "", multiply, "A")
    MAT.connect_material_expressions(strength, "", multiply, "B")
    MAT.connect_material_property(multiply, "", ue.MaterialProperty.MP_EMISSIVE_COLOR)
    MAT.recompile_material(asset)
    LIB.save_loaded_asset(asset)
    return asset


def earth_material():
    path = ROOT + "/Materials/MI_GR_Earth"
    if LIB.does_asset_exist(path):
        return LIB.load_asset(path)
    asset = TOOLS.create_asset("MI_GR_Earth", ROOT + "/Materials", ue.MaterialInstanceConstant, ue.MaterialInstanceConstantFactoryNew())
    MAT.set_material_instance_parent(asset, load(ROOT + "/Materials/M_GR_Surface"))
    MAT.set_material_instance_vector_parameter_value(asset, "BaseColor", ue.LinearColor(0.075, 0.042, 0.022, 1.0))
    MAT.set_material_instance_scalar_parameter_value(asset, "Metallic", 0.0)
    MAT.set_material_instance_scalar_parameter_value(asset, "Roughness", 0.94)
    MAT.update_material_instance(asset)
    LIB.save_loaded_asset(asset)
    return asset


def terrain_pass(earth):
    for i in range(10):
        x = i * 5000
        primitive("TerrainBase_%02d" % i, (x, 0, -78), (50, 70, 0.9), earth)
    for i in range(14):
        side = -1 if i % 2 == 0 else 1
        x = 1500 + i * 3400
        y = side * (5200 + (i % 3) * 1200)
        primitive("Hill_%02d" % i, (x, y, -260), (22 + i % 4 * 6, 13 + i % 3 * 4, 6 + i % 5), earth, "Sphere", rotation=(0, i * 17, 0))


def road_segment(index, x, road, concrete):
    primitive("Highway_%02d" % index, (x, 0, -18), (50, 8, 0.35), road)
    for side in (-1, 1):
        primitive("Shoulder_%02d_%s" % (index, "L" if side < 0 else "R"), (x, side * 980, -25), (50, 11.5, 0.25), concrete)
        primitive("Guardrail_%02d_%s" % (index, "L" if side < 0 else "R"), (x, side * 760, 45), (50, 0.08, 0.8), material("Aluminum"))


def utility_pole(index, x, side, steel, copper):
    y = side * 1550
    primitive("Pole_%02d" % index, (x, y, 510), (0.22, 0.22, 10.5), steel, "Cylinder")
    primitive("Crossarm_%02d" % index, (x, y, 930), (0.20, 3.2, 0.16), steel)
    for offset in (-220, 0, 220):
        primitive("Insulator_%02d_%d" % (index, offset), (x, y + offset, 990), (0.10, 0.10, 0.45), copper, "Cylinder")


def relay_house(x, y, steel, concrete, cyan):
    primitive("Relay_Floor", (x, y, 12), (9, 7, 0.25), concrete)
    primitive("Relay_Back", (x + 430, y, 250), (0.25, 7, 5), steel)
    primitive("Relay_Left", (x, y - 340, 250), (9, 0.25, 5), steel)
    primitive("Relay_Right", (x, y + 340, 250), (9, 0.25, 5), steel)
    primitive("Relay_Roof", (x, y, 505), (9, 7, 0.18), steel)
    for i in range(4):
        primitive("Relay_Cabinet_%02d" % i, (x + 260, y - 240 + i * 160, 130), (1.0, 0.65, 2.6), steel)
        primitive("Relay_LED_%02d" % i, (x + 155, y - 240 + i * 160, 245), (0.06, 0.12, 0.12), cyan, "Sphere")


def build():
    if LEVEL.is_in_play_in_editor():
        raise RuntimeError("Stop Play In Editor before building")
    for required in (SOURCE_MAP, "/Game/ThirdPerson/Blueprints/BP_ThirdPersonGameMode", "/Game/Input/IMC_Default"):
        load(required)
    if not LIB.does_asset_exist(GAME_MAP):
        if not LIB.duplicate_asset(SOURCE_MAP, GAME_MAP):
            raise RuntimeError("Could not duplicate the validated asset lab map")
        LIB.save_asset(GAME_MAP, only_if_is_dirty=False)
        ue.log("GRIDRUNNER_GHOST_SIGNAL_BOOTSTRAP_COMPLETE; run build once more to decorate")
        ue.SystemLibrary.quit_editor()
        return
    existing = {a.get_actor_label() for a in ACTORS.get_all_level_actors()}
    if "Mission_Start" in existing and "TerrainBase_00" in existing:
        ue.log("GRIDRUNNER_GHOST_SIGNAL_ALREADY_COMPLETE")
        ue.SystemLibrary.quit_editor()
        return
    if "Mission_Start" in existing:
        terrain_pass(earth_material())
        if not LEVEL.save_current_level():
            raise RuntimeError("Could not save terrain upgrade")
        LIB.save_directory(ROOT, only_if_is_dirty=True, recursive=True)
        data = json.loads((VALIDATION / "gameplay.json").read_text(encoding="utf-8"))
        data["actor_count"] = len(ACTORS.get_all_level_actors())
        data["terrain_tiles"] = 10
        data["hill_silhouettes"] = 14
        (VALIDATION / "gameplay.json").write_text(json.dumps(data, indent=2), encoding="utf-8")
        ue.log("GRIDRUNNER_GHOST_SIGNAL_TERRAIN_UPGRADE_COMPLETE")
        ue.SystemLibrary.quit_editor()
        return

    road = material("Rubber")
    concrete = material("Concrete")
    steel = material("PaintedSteel")
    copper = material("Copper")
    aluminum = material("Aluminum")
    arc = electric_material()
    terrain_pass(earth_material())
    for i in range(10):
        road_segment(i, i * 5000, road, concrete)
    for i in range(16):
        utility_pole(i, i * 3000, 1 if i % 2 == 0 else -1, steel, copper)

    relay_house(15500, -1600, steel, concrete, arc)
    for i in range(7):
        primitive("Yard_Fence_%02d" % i, (13000 + i * 900, 1450, 150), (8, 0.07, 3), aluminum)
    for i in range(6):
        angle = i * math.tau / 6
        primitive("Debris_%02d" % i, (26000 + math.cos(angle) * 900, math.sin(angle) * 600, 35), (1.6, 0.7, 0.5), steel, rotation=(0, i * 31, i * 4))

    for i, x in enumerate((5200, 11800, 19500, 28500, 39200)):
        primitive("Route_Beacon_%02d" % i, (x, -520, 65), (0.18, 0.18, 1.3), arc, "Cylinder")
        light = spawn(ue.PointLight, "Route_Light_%02d" % i, (x, -520, 170), folder="GRIDRUNNER_GhostSignal/Wayfinding")
        light.light_component.set_mobility(ue.ComponentMobility.MOVABLE)
        light.light_component.set_intensity(4200.0)
        light.light_component.set_attenuation_radius(650.0)
        light.light_component.set_light_color(ue.LinearColor(0.02, 0.55, 1.0, 1.0))

    text_marker("Mission_Start", "GHOST SIGNAL // TRACE THE RELAY", (1800, -720, 210), (0, 90, 0), 72)
    text_marker("Objective_01", "01  RESTORE RELAY", (14200, -720, 170), (0, 90, 0))
    text_marker("Objective_02", "02  RETRIEVE POWER CELL", (24500, -720, 170), (0, 90, 0))
    text_marker("Objective_03", "03  DEPLOY SCOUT", (35000, -720, 170), (0, 90, 0))
    text_marker("Signal_Source", "UNKNOWN CARRIER // 13.8 kV CORRIDOR", (45500, -720, 210), (0, 90, 0), 66, (1.0, 0.35, 0.08, 1.0))

    starts = [a for a in ACTORS.get_all_level_actors() if isinstance(a, ue.PlayerStart)]
    player_start = starts[0] if starts else spawn(ue.PlayerStart, "GhostSignal_PlayerStart", (0, -350, 180))
    player_start.set_actor_label("GhostSignal_PlayerStart")
    player_start.set_actor_location(ue.Vector(400, -350, 180), False, False)
    player_start.set_actor_rotation(ue.Rotator(pitch=0, yaw=0, roll=0), False)
    player_start.set_folder_path("GRIDRUNNER_GhostSignal/Gameplay")

    sun = next((a for a in ACTORS.get_all_level_actors() if a.get_actor_label() == "Lab_Sun"), None)
    if sun:
        sun.set_actor_rotation(ue.Rotator(pitch=-12, yaw=-35, roll=0), False)
        sun.light_component.set_intensity(2.8)
    fog = next((a for a in ACTORS.get_all_level_actors() if a.get_actor_label() == "Lab_Fog"), None)
    if fog:
        fog.get_component_by_class(ue.ExponentialHeightFogComponent).set_editor_property("fog_density", 0.012)

    camera = spawn(ue.CineCameraActor, "Camera_GhostSignal_Wide", (-1700, -3400, 1700), (-13, 24, 0), "GRIDRUNNER_GhostSignal/Cameras")
    camera.set_actor_rotation(ue.MathLibrary.find_look_at_rotation(camera.get_actor_location(), ue.Vector(15500, 0, 50)), False)
    camera.get_cine_camera_component().set_editor_property("current_focal_length", 28.0)

    if not LEVEL.save_current_level():
        raise RuntimeError("Could not save the playable Ghost Signal map")
    LIB.save_directory(ROOT, only_if_is_dirty=True, recursive=True)
    labels = [a.get_actor_label() for a in ACTORS.get_all_level_actors()]
    report = {
        "engine": ue.SystemLibrary.get_engine_version(),
        "map": GAME_MAP,
        "game_mode": "/Game/ThirdPerson/Blueprints/BP_ThirdPersonGameMode",
        "actor_count": len(labels),
        "highway_segments": sum(name.startswith("Highway_") for name in labels),
        "utility_poles": sum(name.startswith("Pole_") for name in labels),
        "route_beacons": sum(name.startswith("Route_Beacon_") for name in labels),
        "terrain_tiles": sum(name.startswith("TerrainBase_") for name in labels),
        "hill_silhouettes": sum(name.startswith("Hill_") for name in labels),
        "objectives": ["restore relay", "retrieve power cell", "deploy SCOUT", "trace ghost signal"],
        "input": ["keyboard/mouse", "Xbox-compatible gamepad", "touch"],
        "asset_lab_preserved": True,
    }
    VALIDATION.mkdir(exist_ok=True)
    (VALIDATION / "gameplay.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
    ue.log("GRIDRUNNER_GHOST_SIGNAL_BUILD_COMPLETE " + json.dumps(report))


if __name__ == "__main__":
    build()
