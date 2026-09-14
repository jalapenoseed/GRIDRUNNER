"""Integrate the selected native assets into a separately saved playable map.

Run in a freshly launched UE editor after compiling GRIDRUNNERGame and migrating
the selected assets. This script explicitly opens its source and destination;
the currently active map is never treated as either. Source assets and approved
assemblies are read-only. A successful run saves, reopens and verifies the map.
"""
import gc
import hashlib
import json
import traceback
from datetime import datetime, timezone
from pathlib import Path

import unreal as ue


VERSION = 2
ROOT = "/Game/GRIDRUNNER"
SOURCE_MAP = ROOT + "/Maps/L_GhostSignal_Prototype"
GAME_MAP = ROOT + "/Maps/L_GhostSignal_FieldSlice"
OWN_TAG = "GR_FieldIntegration"
VENDOR_TAG = "GR_FieldProp"
DRONE_TAG = "GR_DroneSource"
FOLDER = "GRIDRUNNER_FieldSlice"
GAME_MODE = "/Script/GRIDRUNNERGame.GRGameMode"
RELAY_CLASS = "/Script/GRIDRUNNERGame.GRRelay"
BIKE_CLASS = "/Script/GRIDRUNNERGame.GRBikePawn"
MESH_ROOT = "/Game/Deko_MatrixDemo/Freeway/Meshes/"
MESHES = {
    "barrier": MESH_ROOT + "SM_FWYBarrier_Traffic_A01_N1",
    "barrel": MESH_ROOT + "SM_FWYBarrier_Barrel_A01_N1",
    "tire": MESH_ROOT + "SM_FWYTrash_TireDestroyed_A01_N1",
    "warning": MESH_ROOT + "SM_FWYSignWarn_Slippery_A01_N1",
    "bag": MESH_ROOT + "SM_FWYTrash_Bag_A01_N1",
    "container": MESH_ROOT + "SM_FWYTrash_Container_A01_N1",
    "sandbags": MESH_ROOT + "SM_Sandbags_A01_N1",
}
# Native C++ soft loads are not necessarily present in a map's package graph.
RUNTIME_ASSETS = [
    "/Game/ThirdPerson/Blueprints/BP_ThirdPersonCharacter",
    "/Game/Input/IMC_Default",
    "/Game/Bike/BikeBP/BikeBP",
    "/Game/MotoInteractionAnims/Animations/Mounted/Idle/AS_Idle_Riding",
    "/Game/MotoInteractionAnims/Demo/Characters/Mannequins/Meshes/SKM_Manny_Simple",
    "/Game/Free_Sounds_Pack/cue/Ambient_Wind_Loop_1_Cue",
    "/Game/Free_Sounds_Pack/cue/Ambient_Birds_Loop_04_Cue",
    "/Game/Free_Sounds_Pack/cue/Ambient_Rain_Moderate_Loop_1_Cue",
    "/Game/Sparks_Embers/Niagara/NS_Sparks01",
    "/Game/Sparks_Embers/Niagara/NS_Sparks08",
]
RELAYS = [
    (0, (1200.0, -1000.0, 80.0), "Field service disconnect"),
    (1, (15500.0, -1600.0, 80.0), "Corridor relay station"),
    (2, (45500.0, -500.0, 80.0), "Ghost signal receiver"),
]
# Distances are centimetres. Main travelled road stays clear to y = +/- 450.
# Shoulder placements are adjusted from actual asset bounds, preserving pivots.
PLACEMENTS = [
    ("barrier", 2800, -550, 0), ("barrel", 3180, -550, 8),
    ("warning", 3900, 610, 180), ("tire", 5200, 1010, 34),
    ("barrier", 13500, -620, 0), ("barrel", 13950, -570, -14),
    ("sandbags", 14100, -1200, 90), ("container", 16400, -2150, 0),
    ("bag", 16800, -1940, 35), ("tire", 17050, -1120, 22),
    ("barrier", 27000, 590, 0), ("barrel", 27400, 560, 25),
    ("tire", 28200, 1100, 65), ("bag", 28330, 1040, -25),
    ("warning", 42900, -570, 0), ("barrier", 43600, 580, 0),
    ("sandbags", 44000, 1250, 0), ("barrel", 44300, 560, -8),
    ("container", 46100, 1840, 90), ("bag", 46500, 1690, 17),
]
GAPS = [("Guardrail_00_L", 1200.0),
        ("Guardrail_03_L", 15500.0),
        ("Guardrail_09_L", 45500.0)]
LIB = ue.EditorAssetLibrary
LEVEL = ue.get_editor_subsystem(ue.LevelEditorSubsystem)
ACTORS = ue.get_editor_subsystem(ue.EditorActorSubsystem)
MESH_EDITOR = ue.get_editor_subsystem(ue.StaticMeshEditorSubsystem)
PROJECT = Path(ue.Paths.project_dir()).resolve()
REPORT = PROJECT.parent / "validation" / "field_integration.json"
RESULT = {"integration_version": VERSION, "map": GAME_MAP,
          "source_map": SOURCE_MAP, "status": "running", "errors": []}


def write_report():
    REPORT.parent.mkdir(parents=True, exist_ok=True)
    RESULT["updated_utc"] = datetime.now(timezone.utc).isoformat()
    temporary = REPORT.with_suffix(".json.tmp")
    temporary.write_text(json.dumps(RESULT, indent=2, sort_keys=True), encoding="utf-8")
    # Windows readers can deny rename while allowing a report refresh.
    REPORT.write_text(temporary.read_text(encoding="utf-8"), encoding="utf-8")


def require(condition, message):
    if not condition:
        raise RuntimeError(message)


def vec(value):
    return [round(float(value.x), 5), round(float(value.y), 5), round(float(value.z), 5)]


def rot(value):
    return [round(float(value.pitch), 5), round(float(value.yaw), 5), round(float(value.roll), 5)]


def object_path(value):
    return value.get_path_name() if value else None


def load(path):
    asset = LIB.load_asset(path)
    require(asset is not None, "Missing or unloadable asset: " + path)
    return asset


def load_class(path):
    cls = ue.load_class(None, path)
    require(cls is not None, "Native class not compiled/loaded: " + path)
    return cls


def open_map(path):
    gc.collect()
    require(LEVEL.load_level(path), "Could not explicitly load map: " + path)
    world = ue.get_editor_subsystem(ue.UnrealEditorSubsystem).get_editor_world()
    require(world.get_path_name().split(".")[0] == path,
            "Active map identity differs from requested map: " + path)


def tags(actor):
    return {str(tag) for tag in actor.get_editor_property("tags")}


def tag(actor, *values):
    actor.set_editor_property("tags", sorted(tags(actor).union(values)))


def named(label):
    found = [a for a in ACTORS.get_all_level_actors() if a.get_actor_label() == label]
    require(len(found) == 1, "Expected exactly one actor labelled " + label)
    return found[0]


def spawn(cls, label, xyz, yaw=0.0, folder="Gameplay"):
    actor = ACTORS.spawn_actor_from_class(cls, ue.Vector(*xyz), ue.Rotator(0, yaw, 0))
    require(actor is not None, "Could not spawn " + label)
    actor.set_actor_label(label)
    actor.set_folder_path(FOLDER + "/" + folder)
    tag(actor, OWN_TAG)
    return actor


def static_component(actor):
    component = actor.get_component_by_class(ue.StaticMeshComponent)
    require(component is not None, "Static mesh component missing: " + actor.get_actor_label())
    return component


def snapshot(actor):
    components = []
    for component in actor.get_components_by_class(ue.StaticMeshComponent):
        mesh = component.get_editor_property("static_mesh")
        if not mesh:
            continue
        components.append({
            "name": component.get_name(), "mesh": mesh.get_path_name(),
            "relative_location": vec(component.get_editor_property("relative_location")),
            "relative_rotation": rot(component.get_editor_property("relative_rotation")),
            "relative_scale": vec(component.get_editor_property("relative_scale3d")),
            "materials": [object_path(component.get_material(i))
                          for i in range(component.get_num_materials())],
        })
    parent = actor.get_attach_parent_actor()
    return {"label": actor.get_actor_label(), "name": actor.get_name(),
            "location": vec(actor.get_actor_location()),
            "rotation": rot(actor.get_actor_rotation()),
            "scale": vec(actor.get_actor_scale3d()),
            "parent": parent.get_actor_label() if parent else None,
            "components": sorted(components, key=lambda item: item["name"])}


def discover_approved():
    groups = {"scout": [], "transformer": [], "workbench": [], "crate": []}
    for actor in ACTORS.get_all_level_actors():
        data = snapshot(actor)
        mesh_paths = " ".join(c["mesh"] for c in data["components"]).lower()
        for category in groups:
            if category in mesh_paths:
                groups[category].append(data)
    require(len(groups["scout"]) == 19,
            "SCOUT asset-path identification is ambiguous: expected 19 actors, found %s"
            % len(groups["scout"]))
    for category, actors in groups.items():
        require(actors, "Could not identify approved " + category + " by native mesh path")
        require(len({item["label"] for item in actors}) == len(actors),
                "Duplicate approved actor labels in " + category)
        groups[category] = sorted(actors, key=lambda item: item["label"])
    return groups


def fingerprints(approved):
    return {key: {"actors": len(items), "sha256": hashlib.sha256(
        json.dumps(items, sort_keys=True).encode("utf-8")).hexdigest()}
        for key, items in approved.items()}


def source_state():
    open_map(SOURCE_MAP)
    return {"approved": discover_approved(),
            "guardrails": {label: snapshot(named(label)) for label, _ in GAPS}}


def set_transform(actor, data):
    actor.set_actor_location(ue.Vector(*data["location"]), False, False)
    actor.set_actor_rotation(ue.Rotator(*data["rotation"]), False)
    actor.set_actor_scale3d(ue.Vector(*data["scale"]))


def ensure_collision(mesh):
    # Read existing native collision; never change the vendor mesh asset.
    simple = MESH_EDITOR.get_simple_collision_count(mesh)
    convex = MESH_EDITOR.get_convex_collision_count(mesh)
    complexity = MESH_EDITOR.get_collision_complexity(mesh)
    require(simple + convex > 0 or complexity == ue.CollisionTraceFlag.CTF_USE_COMPLEX_AS_SIMPLE,
            "Native collision missing on selected asset: " + mesh.get_path_name())
    return {"simple_shapes": simple, "convex_hulls": convex, "complexity": str(complexity)}


def place_props():
    asset_report = {}
    for key, path in MESHES.items():
        mesh = load(path)
        asset_report[key] = {"asset": path, "collision": ensure_collision(mesh)}
    for index, (key, x, y, yaw) in enumerate(PLACEMENTS):
        actor = spawn(ue.StaticMeshActor, "GR_FieldProp_%02d_%s" % (index, key),
                      (x, y, 0), yaw, "Roadside")
        component = static_component(actor)
        component.set_static_mesh(load(MESHES[key]))
        component.set_mobility(ue.ComponentMobility.STATIC)
        component.set_collision_profile_name("BlockAll")
        component.set_collision_enabled(ue.CollisionEnabled.QUERY_AND_PHYSICS)
        actor.set_actor_scale3d(ue.Vector(1, 1, 1))
        origin, extent = actor.get_actor_bounds(False)
        sign = -1 if y < 0 else 1
        center_y = sign * max(abs(origin.y), 450.0 + extent.y)
        # Main shoulders have a top elevation of -12.5 cm; terrain beyond them
        # has a top elevation of -33 cm in the validated prototype.
        ground = -12.5 if abs(center_y) - extent.y <= 1555.0 else -33.0
        actor.set_actor_location(ue.Vector(x, y + center_y - origin.y,
                                          ground - (origin.z - extent.z)), False, False)
        tag(actor, VENDOR_TAG)
    return asset_report


def open_relay_approaches(baseline):
    results = []
    for label, center in GAPS:
        actor = named(label)
        data = baseline["guardrails"][label]
        set_transform(actor, data)
        lo = data["location"][0] - data["scale"][0] * 50.0
        hi = data["location"][0] + data["scale"][0] * 50.0
        intervals = [(lo, center - 350), (center + 350, hi)]
        require(all(b > a for a, b in intervals), "Relay guardrail opening extends beyond source segment")
        original = static_component(actor)
        for index, (start, end) in enumerate(intervals):
            part = actor if index == 0 else spawn(
                ue.StaticMeshActor, "GR_Approach_" + label,
                data["location"], data["rotation"][1], "Approaches")
            if index:
                component = static_component(part)
                component.set_static_mesh(original.get_editor_property("static_mesh"))
                for slot in range(original.get_num_materials()):
                    component.set_material(slot, original.get_material(slot))
                component.set_collision_profile_name("BlockAll")
                component.set_collision_enabled(ue.CollisionEnabled.QUERY_AND_PHYSICS)
            part.set_actor_location(ue.Vector((start + end) * 0.5,
                                             data["location"][1], data["location"][2]), False, False)
            part.set_actor_scale3d(ue.Vector((end - start) / 100.0,
                                           data["scale"][1], data["scale"][2]))
        results.append({"original_actor": label, "start_x": center - 350,
                        "end_x": center + 350, "width_cm": 700})
    return results


def paint_material():
    path = ROOT + "/Materials/M_GR_FieldRoadPaint"
    if LIB.does_asset_exist(path):
        return load(path)
    asset = ue.AssetToolsHelpers.get_asset_tools().create_asset(
        "M_GR_FieldRoadPaint", ROOT + "/Materials", ue.Material, ue.MaterialFactoryNew())
    require(asset is not None, "Road paint material creation failed")
    edit = ue.MaterialEditingLibrary
    color = edit.create_material_expression(asset, ue.MaterialExpressionConstant3Vector, -300, 0)
    color.set_editor_property("constant", ue.LinearColor(0.24, 0.18, 0.055, 1))
    rough = edit.create_material_expression(asset, ue.MaterialExpressionConstant, -300, 150)
    rough.set_editor_property("r", 0.96)
    edit.connect_material_property(color, "", ue.MaterialProperty.MP_BASE_COLOR)
    edit.connect_material_property(rough, "", ue.MaterialProperty.MP_ROUGHNESS)
    edit.recompile_material(asset)
    require(LIB.save_loaded_asset(asset), "Road paint material save failed")
    return asset


def road_markings():
    material = paint_material()
    plane = load("/Engine/BasicShapes/Plane")
    count = 0
    for index, x in enumerate(range(-1700, 46500, 900)):
        # Deliberate worn interruptions keep the markings subdued against blacktop.
        if index % 11 == 7:
            continue
        for part, (offset, length) in enumerate(((0, 205), (220, 52))):
            actor = spawn(ue.StaticMeshActor, "GR_RoadPaint_%02d_%d" % (index, part),
                          (x + offset, 0, 0.1), 0, "RoadMarkings")
            component = static_component(actor)
            component.set_static_mesh(plane)
            component.set_material(0, material)
            component.set_collision_enabled(ue.CollisionEnabled.NO_COLLISION)
            component.set_editor_property("cast_shadow", False)
            actor.set_actor_scale3d(ue.Vector(length / 100.0,
                                            (11.0 + index % 3) / 100.0, 1))
            count += 1
    return count


def wayfinding():
    # Reuse the existing text actors. The runtime HUD handles detailed objectives.
    entries = {
        "Mission_Start": ("GRIDRUNNER\nFIELD SERVICE 01", (1750, -710, 185)),
        "Objective_01": ("RELAY STATION\nSERVICE ACCESS", (14650, -710, 190)),
        "Objective_02": ("UTILITY CORRIDOR\nKEEP ROAD CLEAR", (24500, -710, 185)),
        "Objective_03": ("SCOUT RECON\nSIGNAL AHEAD", (35000, -710, 185)),
        "Signal_Source": ("CARRIER 03\nRECEIVER", (45100, -710, 190)),
    }
    cube = load("/Engine/BasicShapes/Cube")
    steel = load(ROOT + "/Materials/MI_GR_PaintedSteel")
    for label, (text, position) in entries.items():
        actor = named(label)
        component = actor.get_component_by_class(ue.TextRenderComponent)
        require(component is not None, "Wayfinding text component missing: " + label)
        component.set_text(text.replace("\n", "<br>"))
        component.set_editor_property("world_size", 18.0)
        component.set_horizontal_alignment(ue.HorizTextAligment.EHTA_CENTER)
        component.set_vertical_alignment(ue.VerticalTextAligment.EVRTA_TEXT_CENTER)
        component.set_text_render_color(ue.Color(169, 197, 183, 255))
        actor.set_actor_location(ue.Vector(*position), False, False)
        # Text faces oncoming players travelling along +X.
        actor.set_actor_rotation(ue.Rotator(0, 180, 0), False)
        for suffix, location, scale in (
                ("Board", (position[0] + 6, position[1], position[2]), (0.08, 2.6, 0.95)),
                ("Post", (position[0] + 10, position[1], 85), (0.075, 0.075, 1.95))):
            support = spawn(ue.StaticMeshActor, "GR_Sign_" + label + "_" + suffix,
                            location, 0, "Wayfinding")
            mesh = static_component(support)
            mesh.set_static_mesh(cube)
            mesh.set_material(0, steel)
            mesh.set_collision_profile_name("BlockAll")
            mesh.set_collision_enabled(ue.CollisionEnabled.QUERY_AND_PHYSICS)
            support.set_actor_scale3d(ue.Vector(*scale))


def set_native_property(actor, candidates, value):
    errors = []
    for name in candidates:
        try:
            actor.set_editor_property(name, value)
            require(actor.get_editor_property(name) == value,
                    "Reflected property did not retain assigned value")
            return name
        except Exception as exc:
            errors.append(name + ": " + str(exc))
    raise RuntimeError("Could not set native property on " + actor.get_actor_label()
                       + ": " + "; ".join(errors))


def gameplay():
    for index, position, label in RELAYS:
        actor = spawn(load_class(RELAY_CLASS), "GR_Relay_%02d" % index, position)
        set_native_property(actor, ("relay_index", "RelayIndex"), index)
        set_native_property(actor, ("title", "Title"), label)
        # Actor label is independent of the native UI label property.
        tag(actor, "GR_Relay")
    bike = spawn(load_class(BIKE_CLASS), "GR_ElectricEnduro", (2600, -200, 120))
    tag(bike, "GR_Bike")
    world = ue.get_editor_subsystem(ue.UnrealEditorSubsystem).get_editor_world()
    settings = world.get_world_settings()
    settings.set_editor_property("default_game_mode", load_class(GAME_MODE))
    # Read the actual source assembly asset names; tags do not alter its mesh,
    # hierarchy, material slots, pivots, placement or Blender originals.
    count = 0
    for actor in ACTORS.get_all_level_actors():
        if any("scout" in object_path(component.get_editor_property("static_mesh")).lower()
               for component in actor.get_components_by_class(ue.StaticMeshComponent)
               if component.get_editor_property("static_mesh")):
            tag(actor, DRONE_TAG)
            count += 1
    require(count == 19, "Could not tag exactly 19 approved SCOUT mesh actors")


def restore_missing_character_template(package, registry):
    """Restore only missing Epic character-template files, never vendor content."""
    prefix = "/Game/Characters/"
    if not package.startswith(prefix):
        return False
    relative = package[len(prefix):]
    require(relative and all(part not in ("", ".", "..") for part in relative.split("/")),
            "Invalid character template package path: " + package)
    engine_root = Path(ue.Paths.convert_relative_path_to_full(ue.Paths.engine_dir())).resolve().parent
    source_root = engine_root / "Templates/TemplateResources/High/Characters/Content"
    target_root = PROJECT / "Content/Characters"
    source_package = source_root / (relative + ".uasset")
    if not source_package.is_file():
        return False

    manifest = REPORT.parent / "field_template_manifest.json"
    records = []
    if manifest.exists():
        raw = manifest.read_bytes()
        encoding = "utf-16" if raw.startswith((b"\xff\xfe", b"\xfe\xff")) else "utf-8-sig"
        parsed = json.loads(raw.decode(encoding))
        require(isinstance(parsed, list), "Template manifest must remain a JSON array")
        # Windows PowerShell may wrap an appended array as {value: [...],
        # Count: N}. Unwrap that exact container without dropping file records.
        def append_records(value):
            if isinstance(value, list):
                for child in value:
                    append_records(child)
            elif isinstance(value, dict) and "path" in value:
                records.append(value)
            elif (isinstance(value, dict) and isinstance(value.get("value"), list)
                  and set(value).issubset({"value", "Count"})):
                require(value.get("Count", len(value["value"])) == len(value["value"]),
                        "Template manifest array wrapper count is inconsistent")
                append_records(value["value"])
            else:
                raise RuntimeError("Template manifest contains an invalid file record")
        append_records(parsed)
    require(all(isinstance(record, dict) and "path" in record for record in records),
            "Template manifest contains an invalid file record")
    by_path = {record["path"]: record for record in records}
    copied = []
    for suffix in (".uasset", ".uexp", ".ubulk"):
        source = source_root / (relative + suffix)
        target = target_root / (relative + suffix)
        if not source.is_file() or target.exists():
            continue
        data = source.read_bytes()
        digest = hashlib.sha256(data).hexdigest()
        target.parent.mkdir(parents=True, exist_ok=True)
        # Exclusive creation also prevents overwriting a file created between
        # the existence check and this write by a concurrent download/editor.
        with target.open("xb") as output:
            output.write(data)
        require(hashlib.sha256(target.read_bytes()).hexdigest() == digest,
                "Restored Epic template SHA-256 verification failed: " + str(target))
        record = {"path": target.relative_to(PROJECT / "Content").as_posix(),
                  "source_relative": source.relative_to(engine_root).as_posix(),
                  "sha256": digest, "bytes": len(data)}
        existing = by_path.get(record["path"])
        if existing:
            require(existing.get("sha256") == digest,
                    "Restored template differs from recorded source: " + record["path"])
        else:
            records.append(record)
            by_path[record["path"]] = record
        copied.append(record["path"])
    if copied:
        manifest.parent.mkdir(parents=True, exist_ok=True)
        manifest.write_text(json.dumps(records, indent=2), encoding="utf-8")
        restored = RESULT.setdefault("restored_template_packages", [])
        if package not in restored:
            restored.append(package)
        ue.log("GRIDRUNNER_TEMPLATE_RESTORED " + json.dumps(copied))
    # Existing files may simply have been absent from the registry scan. Read
    # them as-is; only newly copied template files are recorded as restorations.
    registry.scan_paths_synchronous(["/Game/Characters"], force_rescan=True)
    return LIB.does_asset_exist(package)


def dependency_check():
    registry = ue.AssetRegistryHelpers.get_asset_registry()
    options = ue.AssetRegistryDependencyOptions(
        include_soft_package_references=True, include_hard_package_references=True,
        include_searchable_names=False, include_soft_management_references=False,
        include_hard_management_references=False)
    pending = [GAME_MAP] + list(MESHES.values()) + RUNTIME_ASSETS
    seen = set()
    missing = []
    while pending:
        package = pending.pop().split(".")[0]
        if package in seen or not package.startswith("/Game/"):
            continue
        seen.add(package)
        if not LIB.does_asset_exist(package):
            if not restore_missing_character_template(package, registry):
                missing.append(package)
                continue
        for dependency in registry.get_dependencies(package, options):
            dependency = str(dependency)
            if dependency.startswith("/Game/") and dependency not in seen:
                pending.append(dependency)
    return {"game_packages_checked": len(seen), "missing_packages": sorted(missing),
            "hard_and_soft_references": True}


def validate(baseline):
    approved = discover_approved()
    require(approved == baseline["approved"],
            "Approved hero meshes/transforms/material slots/assembly differ from source")
    actors = ACTORS.get_all_level_actors()
    scout = [a for a in actors if DRONE_TAG in tags(a)]
    require(len(scout) == 19, "Saved SCOUT source actor tag count is not 19")
    expected_scout = {item["name"] for item in approved["scout"]}
    require({a.get_name() for a in scout} == expected_scout, "SCOUT tag identity mismatch")
    props = [a for a in actors if VENDOR_TAG in tags(a)]
    require(len(props) == len(PLACEMENTS), "Curated native prop actor count mismatch")
    expected_assets = set(MESHES.values())
    actual_assets = set()
    for actor in props:
        require(vec(actor.get_actor_scale3d()) == [1.0, 1.0, 1.0],
                "Vendor mesh scale changed: " + actor.get_actor_label())
        component = static_component(actor)
        mesh = component.get_editor_property("static_mesh")
        actual_assets.add(mesh.get_path_name().split(".")[0])
        require(component.get_collision_enabled() == ue.CollisionEnabled.QUERY_AND_PHYSICS,
                "Vendor actor collision disabled: " + actor.get_actor_label())
        ensure_collision(mesh)
        origin, extent = actor.get_actor_bounds(False)
        require(abs(origin.y) - extent.y >= 449.5,
                "Vendor actor intrudes into clear road band: " + actor.get_actor_label())
        for slot in range(component.get_num_materials()):
            require(component.get_material(slot) is not None,
                    "Missing vendor material slot: " + actor.get_actor_label())
    require(actual_assets == expected_assets, "Selected native asset coverage mismatch")
    relays = [a for a in actors if a.get_class().get_path_name() == RELAY_CLASS]
    require(len(relays) == 3, "Native relay actor count mismatch")
    for index, position, label in RELAYS:
        actor = named("GR_Relay_%02d" % index)
        require(vec(actor.get_actor_location()) == list(position), "Relay location mismatch")
        require(actor.get_editor_property("relay_index") == index, "Relay sequence index mismatch")
        require(actor.get_editor_property("title") == label, "Relay title mismatch")
    bikes = [a for a in actors if a.get_class().get_path_name() == BIKE_CLASS]
    require(len(bikes) == 1 and "GR_Bike" in tags(bikes[0]), "Native bike missing or duplicated")
    world = ue.get_editor_subsystem(ue.UnrealEditorSubsystem).get_editor_world()
    settings = world.get_world_settings()
    require(object_path(settings.get_editor_property("default_game_mode")) == GAME_MODE,
            "Saved map game mode is not GRIDRUNNERGame.GRGameMode")
    for label, center in GAPS:
        left_origin, left_extent = named(label).get_actor_bounds(False)
        right_origin, right_extent = named("GR_Approach_" + label).get_actor_bounds(False)
        require(right_origin.x - right_extent.x - (left_origin.x + left_extent.x) >= 699,
                "Relay approach guardrail gap is obstructed: " + label)
    dependencies = dependency_check()
    RESULT["dependencies"] = dependencies
    require(not dependencies["missing_packages"],
            "Missing native asset dependencies: " + ", ".join(dependencies["missing_packages"]))
    return {"actor_count": len(actors), "native_prop_actors": len(props),
            "native_mesh_assets": len(actual_assets), "native_relays": len(relays),
            "native_bikes": len(bikes), "scout_source_actors": len(scout),
            "game_mode": GAME_MODE, "approved_fingerprints": fingerprints(approved),
            "road_clear_width_cm": 900, "relay_access_gaps": 3,
            "dependencies": dependencies}


def integrate():
    require(not LEVEL.is_in_play_in_editor(), "Stop PIE before running field integration")
    prior = json.loads(REPORT.read_text(encoding="utf-8")) if REPORT.exists() else {}
    for path in (GAME_MODE, RELAY_CLASS, BIKE_CLASS):
        load_class(path)
    require(LIB.does_asset_exist(SOURCE_MAP), "Verified source map is missing")
    for path in list(MESHES.values()) + RUNTIME_ASSETS:
        load(path)
    baseline = source_state()
    RESULT["engine"] = ue.SystemLibrary.get_engine_version()
    RESULT["approved_source"] = fingerprints(baseline["approved"])
    if not LIB.does_asset_exist(GAME_MAP):
        # Do not retain any UObject reference to the duplicated world while loading
        # it. UE's world GC checks can reject a load if a Python wrapper holds it.
        require(bool(LIB.duplicate_asset(SOURCE_MAP, GAME_MAP)), "Source map duplication failed")
        require(LIB.save_asset(GAME_MAP, only_if_is_dirty=False), "Duplicated map save failed")
    open_map(GAME_MAP)
    if prior.get("status") == "complete" and prior.get("integration_version") == VERSION:
        RESULT.update(prior)
        RESULT["verified"] = validate(baseline)
        RESULT["idempotent_recheck"] = True
        write_report()
        ue.log("GRIDRUNNER_FIELD_INTEGRATION_ALREADY_VERIFIED " + json.dumps(RESULT["verified"]))
        return
    # Retry only replaces our tagged additions. Restore our three editable rail
    # segments from source before splitting, making interrupted runs recoverable.
    for actor in ACTORS.get_all_level_actors():
        if OWN_TAG in tags(actor):
            require(ACTORS.destroy_actor(actor), "Could not remove previous integration actor")
    # The loop variable must not keep an actor/world wrapper alive across reload.
    del actor
    RESULT["assets"] = place_props()
    RESULT["approaches"] = open_relay_approaches(baseline)
    RESULT["road_marking_fragments"] = road_markings()
    wayfinding()
    gameplay()
    RESULT["before_save"] = validate(baseline)
    require(LEVEL.save_current_level(), "FieldSlice map save failed")
    # Switch away and back to establish that serialized actors, tags and native
    # properties survive a genuine level reload rather than an in-memory check.
    open_map(SOURCE_MAP)
    require(discover_approved() == baseline["approved"], "Source assembly changed during integration")
    open_map(GAME_MAP)
    RESULT["verified"] = validate(baseline)
    RESULT["saved_and_reopened"] = True
    RESULT["source_map_unchanged"] = True
    RESULT["status"] = "complete"
    write_report()
    ue.log("GRIDRUNNER_FIELD_INTEGRATION_COMPLETE " + json.dumps(RESULT["verified"]))


if __name__ == "__main__":
    try:
        integrate()
    except Exception as exc:
        RESULT["status"] = "failed"
        RESULT["errors"].append(str(exc))
        RESULT["traceback"] = traceback.format_exc()
        write_report()
        ue.log_error("GRIDRUNNER_FIELD_INTEGRATION_FAILED " + RESULT["traceback"])
    finally:
        ue.SystemLibrary.quit_editor()
