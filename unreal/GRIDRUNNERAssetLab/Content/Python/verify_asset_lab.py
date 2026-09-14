import json
from pathlib import Path
import unreal as ue
root = Path(ue.Paths.project_dir()).resolve().parent / 'validation'
level = ue.get_editor_subsystem(ue.LevelEditorSubsystem)
assert level.load_level('/Game/GRIDRUNNER/Maps/L_AssetLab_Showcase')
actors = ue.get_editor_subsystem(ue.EditorActorSubsystem).get_all_level_actors()
groups = {n: [a for a in actors if str(a.get_folder_path()).endswith('/Imports/' + n)] for n in ['SCOUT','Transformer','Workbench','Crate']}
assert {n: len(a) for n,a in groups.items()} == {'SCOUT':24,'Transformer':3,'Workbench':3,'Crate':3}
assembly = []
for actor in groups['SCOUT']:
    parent = actor.get_attach_parent_actor()
    for component in actor.get_components_by_class(ue.StaticMeshComponent):
        slots = [component.get_material(i) for i in range(component.get_num_materials())]
        assert slots and all(m and m.get_path_name().startswith('/Game/GRIDRUNNER/Materials/SCOUT/MI_') for m in slots)
        assembly.append({'actor':actor.get_actor_label(),'parent':parent.get_actor_label() if parent else None,'slots':[m.get_name() for m in slots],'scale':str(actor.get_actor_scale3d())})
textures = []
for path in ue.EditorAssetLibrary.list_assets('/Game/GRIDRUNNER/Textures/SCOUT'):
    obj = ue.EditorAssetLibrary.load_asset(path)
    if not isinstance(obj, ue.Texture2D): continue
    name = obj.get_name(); srgb = obj.get_editor_property('srgb')
    assert srgb == name.endswith('_albedo'), name
    if name.endswith('_normal'):
        assert obj.get_editor_property('compression_settings') == ue.TextureCompressionSettings.TC_NORMALMAP and obj.get_editor_property('flip_green_channel'), name
    textures.append({'name':name,'srgb':srgb,'compression':str(obj.get_editor_property('compression_settings')),'flip_green':obj.get_editor_property('flip_green_channel')})
report = {'map_reopened':True,'scout_meshes':len(assembly),'assembly':assembly,'textures':textures,'render_settings':{k:ue.SystemLibrary.get_console_variable_int_value(k) for k in ['r.DynamicGlobalIlluminationMethod','r.ReflectionMethod','r.Shadow.Virtual.Enable']}}
(root/'reopen.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
ue.log('GRIDRUNNER_REOPEN_VERIFIED '+str(len(assembly))+' SCOUT mesh components; '+str(len(textures))+' PBR textures')
