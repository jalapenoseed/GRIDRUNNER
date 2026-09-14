"""Import existing GLB scenes and bind the separate SCOUT PBR maps in Unreal."""
import json
import struct
from pathlib import Path
import unreal as ue
import build_asset_lab as lab

PROJECT = Path(ue.Paths.project_dir()).resolve()
STAGING = PROJECT.parent / 'ImportStaging'
LIB = ue.EditorAssetLibrary
MAT = ue.MaterialEditingLibrary
ACTORS = ue.get_editor_subsystem(ue.EditorActorSubsystem)
LEVEL = ue.get_editor_subsystem(ue.LevelEditorSubsystem)
ASSETS = ue.AssetToolsHelpers.get_asset_tools()
CONTENT = '/Game/GRIDRUNNER'
TEXTURES = {}


def source_document(path):
    data = path.read_bytes()
    return json.loads(data[20:20 + struct.unpack_from('<I', data, 12)[0]])


def texture(stem, suffix):
    file = STAGING / 'drones/textures' / (stem + '_' + suffix + '.png')
    if not file.exists():
        return None
    if file.stem in TEXTURES:
        return TEXTURES[file.stem]
    path = CONTENT + '/Textures/SCOUT/' + file.stem
    obj = LIB.load_asset(path) if LIB.does_asset_exist(path) else None
    if not obj:
        task = ue.AssetImportTask()
        task.filename = str(file)
        task.destination_path = CONTENT + '/Textures/SCOUT'
        task.automated = True
        task.save = True
        ASSETS.import_asset_tasks([task])
        objects = task.get_objects()
        if not objects:
            raise RuntimeError('Texture import failed: ' + str(file))
        obj = objects[0]
    obj.set_editor_property('srgb', suffix == 'albedo')
    if suffix == 'normal':
        obj.set_editor_property('compression_settings', ue.TextureCompressionSettings.TC_NORMALMAP)
        obj.set_editor_property('flip_green_channel', True)
    LIB.save_loaded_asset(obj)
    TEXTURES[file.stem] = obj
    return obj


def scout_material(source):
    name = source['name'].replace('RUNTIME_', '')
    folder = CONTENT + '/Materials/SCOUT'
    path = folder + '/MI_' + name
    if LIB.does_asset_exist(path):
        return LIB.load_asset(path)
    material = ASSETS.create_asset('M_' + name, folder, ue.Material, ue.MaterialFactoryNew())
    material.set_editor_property('two_sided', source.get('doubleSided', False))
    pbr = source.get('pbrMetallicRoughness', {})
    stem = name
    albedo_stem = stem
    if 'Paint_Reference_OffWhite' in name:
        stem, albedo_stem = 'GR_01_painted_alum', 'GR_paint_offwhite'
    elif 'Paint_Safety_Ochre' in name:
        stem, albedo_stem = 'GR_01_painted_alum', 'GR_paint_ochre'
    elif 'Optic_ClearCoated_Lens' in name:
        stem = albedo_stem = 'GR_09_camera_glass'

    def scalar(parameter, value, y):
        node = MAT.create_material_expression(material, ue.MaterialExpressionScalarParameter, -600, y)
        node.set_editor_property('parameter_name', parameter)
        node.set_editor_property('default_value', float(value))
        return node

    def sampled(map_stem, suffix, y):
        asset = texture(map_stem, suffix)
        if not asset:
            return None
        node = MAT.create_material_expression(material, ue.MaterialExpressionTextureSampleParameter2D, -900, y)
        node.set_editor_property('parameter_name', suffix.title() + 'Map')
        node.set_editor_property('texture', asset)
        sampler = 'SAMPLERTYPE_NORMAL' if suffix == 'normal' else ('SAMPLERTYPE_COLOR' if suffix == 'albedo' else 'SAMPLERTYPE_LINEAR_COLOR')
        node.set_editor_property('sampler_type', getattr(ue.MaterialSamplerType, sampler))
        return node

    color = sampled(albedo_stem, 'albedo', -500)
    if not color:
        color = MAT.create_material_expression(material, ue.MaterialExpressionVectorParameter, -600, -500)
        color.set_editor_property('parameter_name', 'BaseColor')
        color.set_editor_property('default_value', ue.LinearColor(*pbr.get('baseColorFactor', [0.08, 0.08, 0.08, 1])))
    MAT.connect_material_property(color, 'RGB', ue.MaterialProperty.MP_BASE_COLOR)
    metal = sampled(stem, 'metal', -200)
    MAT.connect_material_property(metal or scalar('Metallic', pbr.get('metallicFactor', 0), -200), 'R' if metal else '', ue.MaterialProperty.MP_METALLIC)
    rough = sampled(stem, 'rough', 0)
    wet = scalar('Wetness', 0, 400)
    wet_rough = scalar('WetRoughness', 0.07, 250)
    blend = MAT.create_material_expression(material, ue.MaterialExpressionLinearInterpolate, -200, 100)
    MAT.connect_material_expressions(rough or scalar('Roughness', pbr.get('roughnessFactor', 0.5), 0), 'R' if rough else '', blend, 'A')
    MAT.connect_material_expressions(wet_rough, '', blend, 'B')
    MAT.connect_material_expressions(wet, '', blend, 'Alpha')
    MAT.connect_material_property(blend, '', ue.MaterialProperty.MP_ROUGHNESS)
    for suffix, prop in [('normal', ue.MaterialProperty.MP_NORMAL), ('ao', ue.MaterialProperty.MP_AMBIENT_OCCLUSION)]:
        node = sampled(stem, suffix, 650 if suffix == 'normal' else 900)
        if node:
            MAT.connect_material_property(node, 'RGB' if suffix == 'normal' else 'R', prop)
    if 'LED' in name:
        emission = MAT.create_material_expression(material, ue.MaterialExpressionMultiply, -200, -350)
        MAT.connect_material_expressions(color, 'RGB', emission, 'A')
        MAT.connect_material_expressions(scalar('EmissionStrength', 3, -350), '', emission, 'B')
        MAT.connect_material_property(emission, '', ue.MaterialProperty.MP_EMISSIVE_COLOR)
    MAT.recompile_material(material)
    LIB.save_loaded_asset(material)
    instance = ASSETS.create_asset('MI_' + name, folder, ue.MaterialInstanceConstant, ue.MaterialInstanceConstantFactoryNew())
    MAT.set_material_instance_parent(instance, material)
    MAT.update_material_instance(instance)
    LIB.save_loaded_asset(instance)
    return instance


def run():
    if LEVEL.is_in_play_in_editor():
        raise RuntimeError('Stop PIE first')
    # Keep the incomplete starter map intact; build the finished scene separately.
    lab.MAP = CONTENT + '/Maps/L_AssetLab_Showcase'
    if LIB.does_asset_exist(lab.MAP):
        LEVEL.load_level(lab.MAP)
        if not any(a.get_actor_label() == 'Camera_Hero' for a in ACTORS.get_all_level_actors()):
            raise RuntimeError('Partial showcase map exists; inspect before rebuilding')
    else:
        LEVEL.load_level('/Engine/Maps/Entry')
        lab.build()
    manager = ue.InterchangeManager.get_interchange_manager_scripted()
    report = []
    selection = [('SCOUT', 'drones/GR_SCOUT_01.glb', (0, 0, 112)), ('Transformer', 'kit/GR_PadTransformer_01.glb', (-800, 1000, 31)), ('Workbench', 'kit/GR_Workbench_02.glb', (450, 600, 1)), ('Crate', 'kit/GR_SupplyCrate_02.glb', (-600, 400, 1))]
    for label, relative, position in selection:
        folder = 'GRIDRUNNER_AssetLab/Imports/' + label
        if any(str(a.get_folder_path()) == folder for a in ACTORS.get_all_level_actors()):
            raise RuntimeError(label + ' already placed; refusing duplicate import')
        before = {a.get_path_name() for a in ACTORS.get_all_level_actors()}
        source = manager.create_source_data(str(STAGING / relative))
        params = ue.ImportAssetParameters()
        params.is_automated = True
        if not manager.import_scene(CONTENT + '/Imports/' + label, source, params):
            raise RuntimeError('Scene import failed: ' + relative)
        actors = [a for a in ACTORS.get_all_level_actors() if a.get_path_name() not in before]
        mesh_actors = [a for a in actors if any(c.static_mesh for c in a.get_components_by_class(ue.StaticMeshComponent))]
        if not mesh_actors:
            raise RuntimeError('No mesh actors imported for ' + label)
        bounds = [a.get_actor_bounds(False) for a in mesh_actors]
        low = [min(getattr(o, axis) - getattr(e, axis) for o, e in bounds) for axis in ('x', 'y', 'z')]
        high = [max(getattr(o, axis) + getattr(e, axis) for o, e in bounds) for axis in ('x', 'y', 'z')]
        delta = ue.Vector(position[0] - (low[0] + high[0]) / 2, position[1] - (low[1] + high[1]) / 2, position[2] - low[2])
        for actor in actors:
            actor.set_folder_path(folder)
            if actor.get_attach_parent_actor() not in actors:
                actor.set_actor_location(actor.get_actor_location() + delta, False, False)
        if label == 'SCOUT':
            materials = {m['name']: scout_material(m) for m in source_document(STAGING / relative)['materials']}
            for actor in mesh_actors:
                for component in actor.get_components_by_class(ue.StaticMeshComponent):
                    for index in range(component.get_num_materials()):
                        current = component.get_material(index)
                        if current:
                            matches = [m for name, m in materials.items() if name in current.get_name()]
                            if len(matches) != 1:
                                raise RuntimeError('Unmapped SCOUT slot: ' + current.get_name())
                            component.set_material(index, matches[0])
        report.append({'source': relative, 'actors': len(actors), 'mesh_actors': len(mesh_actors), 'dimensions_cm': [high[i] - low[i] for i in range(3)], 'translation_cm': [delta.x, delta.y, delta.z]})
        LIB.save_directory(CONTENT, only_if_is_dirty=True, recursive=True)
        if not LEVEL.save_current_level():
            raise RuntimeError('Level save failed')
    records = PROJECT.parent / 'validation'
    records.mkdir(exist_ok=True)
    (records / 'imports.json').write_text(json.dumps({'map': lab.MAP, 'imports': report}, indent=2), encoding='utf-8')
    ue.log('GRIDRUNNER_IMPORT_COMPLETE ' + json.dumps(report))


if __name__ == '__main__':
    run()
