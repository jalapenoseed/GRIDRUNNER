"""Run with Tools > Execute Python Script in Unreal Editor, not ordinary Python.

Creates an editor showroom only. Refuses to replace an existing map or discard dirty work.
"""
import unreal

ROOT = "/Game/GRIDRUNNER"
MAP = ROOT + "/Maps/L_AssetLab"
LIB = unreal.EditorAssetLibrary
MAT = unreal.MaterialEditingLibrary


def spawn(cls, label, xyz, rotation=(0, 0, 0)):
    actor = unreal.get_editor_subsystem(unreal.EditorActorSubsystem).spawn_actor_from_class(
        cls, unreal.Vector(*xyz), unreal.Rotator(pitch=rotation[0], yaw=rotation[1], roll=rotation[2]))
    if not actor:
        raise RuntimeError("Could not spawn " + label)
    actor.set_actor_label(label)
    actor.set_folder_path("GRIDRUNNER_AssetLab")
    return actor


def surface_material():
    path = ROOT + "/Materials/M_GR_Surface"
    if LIB.does_asset_exist(path):
        return LIB.load_asset(path)
    material = unreal.AssetToolsHelpers.get_asset_tools().create_asset(
        "M_GR_Surface", ROOT + "/Materials", unreal.Material, unreal.MaterialFactoryNew())
    if not material:
        raise RuntimeError("Could not create surface material")

    def scalar(name, value, y):
        node = MAT.create_material_expression(material, unreal.MaterialExpressionScalarParameter, -600, y)
        node.set_editor_property("parameter_name", name)
        node.set_editor_property("default_value", value)
        return node

    color = MAT.create_material_expression(material, unreal.MaterialExpressionVectorParameter, -600, -200)
    color.set_editor_property("parameter_name", "BaseColor")
    color.set_editor_property("default_value", unreal.LinearColor(0.08, 0.10, 0.12, 1.0))
    metal = scalar("Metallic", 0.0, 0)
    rough = scalar("Roughness", 0.6, 150)
    wet_rough = scalar("WetRoughness", 0.08, 300)
    wet = scalar("Wetness", 0.0, 450)
    blend = MAT.create_material_expression(material, unreal.MaterialExpressionLinearInterpolate, -200, 200)
    connections = [
        MAT.connect_material_expressions(rough, "", blend, "A"),
        MAT.connect_material_expressions(wet_rough, "", blend, "B"),
        MAT.connect_material_expressions(wet, "", blend, "Alpha"),
        MAT.connect_material_property(color, "", unreal.MaterialProperty.MP_BASE_COLOR),
        MAT.connect_material_property(metal, "", unreal.MaterialProperty.MP_METALLIC),
        MAT.connect_material_property(blend, "", unreal.MaterialProperty.MP_ROUGHNESS),
    ]
    if not all(connections):
        raise RuntimeError("Material graph connection failed")
    MAT.recompile_material(material)
    LIB.save_loaded_asset(material)
    return material


def instance(parent, name, color, metal, rough):
    path = ROOT + "/Materials/MI_GR_" + name
    if LIB.does_asset_exist(path):
        return LIB.load_asset(path)
    asset = unreal.AssetToolsHelpers.get_asset_tools().create_asset(
        "MI_GR_" + name, ROOT + "/Materials", unreal.MaterialInstanceConstant,
        unreal.MaterialInstanceConstantFactoryNew())
    if not asset:
        raise RuntimeError("Could not create " + name)
    MAT.set_material_instance_parent(asset, parent)
    MAT.set_material_instance_vector_parameter_value(asset, "BaseColor", unreal.LinearColor(*color, 1.0))
    MAT.set_material_instance_scalar_parameter_value(asset, "Metallic", metal)
    MAT.set_material_instance_scalar_parameter_value(asset, "Roughness", rough)
    MAT.update_material_instance(asset)
    LIB.save_loaded_asset(asset)
    return asset


def mesh(label, xyz, scale, material, shape="Cube"):
    actor = spawn(unreal.StaticMeshActor, label, xyz)
    component = actor.get_component_by_class(unreal.StaticMeshComponent)
    component.set_static_mesh(LIB.load_asset("/Engine/BasicShapes/" + shape))
    component.set_material(0, material)
    actor.set_actor_scale3d(unreal.Vector(*scale))
    return actor


def build():
    level = unreal.get_editor_subsystem(unreal.LevelEditorSubsystem)
    if level.is_in_play_in_editor():
        raise RuntimeError("Stop Play In Editor before building the lab")
    if LIB.does_asset_exist(MAP):
        raise RuntimeError("L_AssetLab already exists; open it. No existing level was changed.")
    if (unreal.EditorLoadingAndSavingUtils.get_dirty_map_packages()
            or unreal.EditorLoadingAndSavingUtils.get_dirty_content_packages()):
        raise RuntimeError("Save your open map and assets first, then rerun this script")
    for folder in ("Maps", "Materials", "Meshes/Drones", "Meshes/Props", "Textures", "Blueprints", "Cinematics"):
        LIB.make_directory(ROOT + "/" + folder)
    if not level.new_level(MAP):
        raise RuntimeError("Could not create Asset Lab map")
    parent = surface_material()
    palette = [
        ("PaintedSteel", (0.035, 0.05, 0.065), 0.0, 0.42),
        ("Aluminum", (0.60, 0.65, 0.70), 1.0, 0.24),
        ("Rubber", (0.015, 0.018, 0.02), 0.0, 0.80),
        ("Concrete", (0.22, 0.24, 0.23), 0.0, 0.82),
        ("Copper", (0.72, 0.34, 0.16), 1.0, 0.32),
    ]
    materials = [instance(parent, *item) for item in palette]
    # 40 x 40 metre starter; engine cube is 100 cm. Expand only after real assets are staged.
    mesh("Ground_40m", (0, 0, -30), (40, 40, 0.6), materials[3])
    mesh("Workshop_Back", (1600, 0, 300), (0.2, 20, 6), materials[0])
    mesh("Workshop_Left", (800, -1000, 300), (16, 0.2, 6), materials[0])
    mesh("Workshop_Roof", (800, 0, 610), (16, 20, 0.2), materials[0])
    for i, material in enumerate(materials):
        y = (i - 2) * 300
        mesh("Material_Plinth_" + palette[i][0], (900, y, 50), (1.6, 1.6, 1), materials[0])
        mesh("Material_Sample_" + palette[i][0], (900, y, 175), (1.3, 1.3, 1.3), material, "Sphere")
    mesh("SCOUT_Import_Plinth", (0, 0, 55), (4, 4, 1.1), materials[0])
    mesh("Props_Import_Pad", (-800, 900, 15), (8, 8, 0.3), materials[3])
    spawn(unreal.PlayerStart, "Lab_Start", (-1300, -600, 220))
    spawn(unreal.SkyAtmosphere, "Lab_Atmosphere", (0, 0, 0))
    sun = spawn(unreal.DirectionalLight, "Lab_Sun", (0, 0, 1200), (-35, -30, 0))
    sun.light_component.set_mobility(unreal.ComponentMobility.MOVABLE)
    sun.light_component.set_editor_property("atmosphere_sun_light", True)
    sun.light_component.set_intensity(6.0)
    sky = spawn(unreal.SkyLight, "Lab_Sky", (0, 0, 1000))
    sky.light_component.set_mobility(unreal.ComponentMobility.MOVABLE)
    sky.light_component.set_intensity(0.7)
    sky.light_component.set_editor_property("real_time_capture", True)
    fog = spawn(unreal.ExponentialHeightFog, "Lab_Fog", (0, 0, 0))
    fog_component = fog.get_component_by_class(unreal.ExponentialHeightFogComponent)
    if hasattr(fog_component, "set_volumetric_fog"):
        fog_component.set_volumetric_fog(True)
    else:
        unreal.log_warning("Volumetric fog setter unavailable; using standard height fog.")
    for label, xyz, color in [
        ("Cyan_Work_Light", (400, -300, 400), (0.15, 0.80, 1.0)),
        ("Amber_Rim_Light", (1200, 700, 400), (1.0, 0.40, 0.12)),
    ]:
        light = spawn(unreal.PointLight, label, xyz)
        light.light_component.set_mobility(unreal.ComponentMobility.MOVABLE)
        light.light_component.set_intensity(35.0)
        light.light_component.set_attenuation_radius(1800.0)
        light.light_component.set_light_color(unreal.LinearColor(*color, 1.0))
    for label, xyz, rotation in [
        ("Camera_Hero", (-650, -650, 300), (-12, 45, 0)),
        ("Camera_Materials", (350, 0, 220), (0, 0, 0)),
        ("Camera_Wide", (-1700, -1500, 750), (-20, 40, 0)),
    ]:
        spawn(unreal.CineCameraActor, label, xyz, rotation)
    if not level.save_current_level():
        raise RuntimeError("Could not save generated map")
    unreal.log("GRIDRUNNER starter created: " + MAP + ". Import your actual meshes next; see unreal/README.md.")


if __name__ == "__main__":
    build()
