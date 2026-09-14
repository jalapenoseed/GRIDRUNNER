"""Editor-only lighting comparisons. Load L_AssetLab and stop PIE before applying."""
import unreal

PRESETS = {
    "day": (6.0, 0.7, -35.0, 0.0),
    "dusk": (0.6, 0.25, -6.0, 0.3),
    "night": (0.0, 0.015, 15.0, 0.8),
}


def apply(name):
    if name not in PRESETS:
        raise ValueError("Choose day, dusk, or night")
    level = unreal.get_editor_subsystem(unreal.LevelEditorSubsystem)
    if level.is_in_play_in_editor():
        raise RuntimeError("Stop PIE first; these are editor presets, not a runtime weather system")
    actors = unreal.get_editor_subsystem(unreal.EditorActorSubsystem).get_all_level_actors()
    selected = {a.get_actor_label(): a for a in actors}
    if "Lab_Sun" not in selected or "Lab_Sky" not in selected:
        raise RuntimeError("Open the generated L_AssetLab map first")
    sun, sky, pitch, wetness = PRESETS[name]
    selected["Lab_Sun"].light_component.set_intensity(sun)
    selected["Lab_Sun"].set_actor_rotation(unreal.Rotator(pitch, -30, 0), False)
    selected["Lab_Sky"].light_component.set_intensity(sky)
    for name in ("PaintedSteel", "Aluminum", "Rubber", "Concrete", "Copper"):
        instance = unreal.EditorAssetLibrary.load_asset("/Game/GRIDRUNNER/Materials/MI_GR_" + name)
        if instance:
            unreal.MaterialEditingLibrary.set_material_instance_scalar_parameter_value(instance, "Wetness", wetness)
            unreal.MaterialEditingLibrary.update_material_instance(instance)
    unreal.log("Preset applied; changes are unsaved until you choose Save All.")
