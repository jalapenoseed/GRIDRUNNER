"""Reopen the saved lab and capture actual editor renders across four material states.

Launch with -ExecCmds="py <this-file>" so the editor continues ticking for capture.
"""
import json
import time
from pathlib import Path
import unreal as ue
import lab_presets

PROJECT = Path(ue.Paths.project_dir()).resolve()
RECORDS = PROJECT.parent / 'validation'
INFO = json.loads((RECORDS / 'imports.json').read_text(encoding='utf-8'))
LEVEL = ue.get_editor_subsystem(ue.LevelEditorSubsystem)
ACTORS = ue.get_editor_subsystem(ue.EditorActorSubsystem)
LIB = ue.EditorAssetLibrary
MAT = ue.MaterialEditingLibrary
if not LEVEL.load_level(INFO['map']):
    raise RuntimeError('Cannot reopen the saved showcase')
actors = ACTORS.get_all_level_actors()
groups = {name: [a for a in actors if str(a.get_folder_path()).endswith('/Imports/' + name)] for name in ['SCOUT', 'Transformer', 'Workbench', 'Crate']}
if any(not group for group in groups.values()):
    raise RuntimeError('An imported asset is missing after reopening')
camera = next(a for a in actors if a.get_actor_label() == 'Camera_Hero')
dims = INFO['imports'][0]['dimensions_cm']
target = ue.Vector(0, 0, 112 + dims[2] / 2)
distance = max(dims[:2]) * 1.5
location = target + ue.Vector(-distance, -distance * 0.8, distance * 0.65)
camera.set_actor_location(location, False, False)
camera.set_actor_rotation(ue.MathLibrary.find_look_at_rotation(location, target), False)
cine = camera.get_cine_camera_component()
cine.set_editor_property('current_focal_length', 40.0)
focus = cine.get_editor_property('focus_settings')
focus.set_editor_property('focus_method', ue.CameraFocusMethod.DISABLE)
cine.set_editor_property('focus_settings', focus)
wide = next(a for a in actors if a.get_actor_label() == 'Camera_Wide')
wide.set_actor_rotation(ue.MathLibrary.find_look_at_rotation(wide.get_actor_location(), ue.Vector(0, 300, 130)), False)
wide_cine = wide.get_cine_camera_component()
wide_cine.set_editor_property('current_focal_length', 24.0)
wide_focus = wide_cine.get_editor_property('focus_settings')
wide_focus.set_editor_property('focus_method', ue.CameraFocusMethod.DISABLE)
wide_cine.set_editor_property('focus_settings', wide_focus)
LEVEL.pilot_level_actor(camera)
LEVEL.editor_set_game_view(True)
instances = []
for path in LIB.list_assets('/Game/GRIDRUNNER/Materials', recursive=True, include_folder=False):
    obj = LIB.load_asset(path)
    if isinstance(obj, ue.MaterialInstanceConstant):
        instances.append(obj)
SHOTS = RECORDS / 'screenshots_final'
SHOTS.mkdir(exist_ok=True)
CASES = [('day_dry', 'day', 0.0), ('day_wet', 'day', 1.0), ('night_dry', 'night', 0.0), ('night_wet', 'night', 1.0)]
state = {'index': 0, 'phase': 'warm', 'deadline': time.monotonic() + 20, 'written': []}


def apply_case(index):
    name, lighting, wetness = CASES[index]
    lab_presets.apply(lighting)
    for instance in instances:
        MAT.set_material_instance_scalar_parameter_value(instance, 'Wetness', wetness)
        MAT.update_material_instance(instance)
    ue.log('GRIDRUNNER_CAPTURE_STATE ' + name)


def tick(delta):
    if state['phase'] == 'busy':
        return
    try:
        now = time.monotonic()
        index = state['index']
        if state['phase'] == 'warm' and now >= state['deadline']:
            state['phase'] = 'busy'
            file = SHOTS / (CASES[index][0] + '.png')
            if file.exists():
                raise RuntimeError('Capture already exists; preserve it and choose a new output folder')
            ue.AutomationLibrary.finish_loading_before_screenshot()
            shot_camera = next(a for a in actors if a.get_actor_label() == 'Camera_Wide') if CASES[index][0] == 'overview_day' else camera
            state['task'] = ue.AutomationLibrary.take_high_res_screenshot(1280, 720, str(file), camera=shot_camera, delay=2.0)
            state.update(phase='wait', deadline=time.monotonic() + 120, file=file)
        elif state['phase'] == 'wait':
            if state['file'].exists() and state['file'].stat().st_size > 1000:
                state['phase'] = 'busy'
                state['written'].append(state['file'].name)
                ue.log('GRIDRUNNER_CAPTURED ' + str(state['file']))
                state['index'] += 1
                if state['index'] == len(CASES):
                    apply_case(0)
                    LIB.save_directory('/Game/GRIDRUNNER', only_if_is_dirty=True, recursive=True)
                    LEVEL.save_current_level()
                    report = {'engine': ue.SystemLibrary.get_engine_version(), 'map_reopened': INFO['map'], 'group_actor_counts': {name: len(group) for name, group in groups.items()}, 'screenshots': state['written'], 'resolution': [1280, 720], 'wetness_scope': 'SCOUT materials and test surfaces'}
                    (RECORDS / 'captures.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
                    ue.unregister_slate_post_tick_callback(handle)
                    ue.log('GRIDRUNNER_CAPTURE_COMPLETE')
                    ue.SystemLibrary.quit_editor()
                else:
                    apply_case(state['index'])
                    state.update(phase='warm', deadline=now + 15)
            elif now > state['deadline']:
                raise RuntimeError('Screenshot timed out: ' + str(state['file']))
    except Exception as error:
        ue.log_error('GRIDRUNNER_CAPTURE_FAILED ' + repr(error))
        ue.unregister_slate_post_tick_callback(handle)
        ue.SystemLibrary.quit_editor()


CASES.append(('overview_day', 'day', 0.0))
apply_case(0)
handle = ue.register_slate_post_tick_callback(tick)
