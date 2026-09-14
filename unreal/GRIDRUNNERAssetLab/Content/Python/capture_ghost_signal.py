"""Capture a real UE editor render of the saved playable prototype."""
import json
import time
from pathlib import Path
import unreal as ue

PROJECT = Path(ue.Paths.project_dir()).resolve()
VALIDATION = PROJECT.parent / "validation"
SHOT = VALIDATION / "ghost_signal_overview.png"
MAP = "/Game/GRIDRUNNER/Maps/L_GhostSignal_Prototype"
LEVEL = ue.get_editor_subsystem(ue.LevelEditorSubsystem)
ACTORS = ue.get_editor_subsystem(ue.EditorActorSubsystem)
if not LEVEL.load_level(MAP):
    raise RuntimeError("Could not reopen Ghost Signal map")
camera = next(a for a in ACTORS.get_all_level_actors() if a.get_actor_label() == "Camera_GhostSignal_Wide")
LEVEL.pilot_level_actor(camera)
LEVEL.editor_set_game_view(True)
state = {"phase": "warm", "deadline": time.monotonic() + 20}


def tick(delta):
    now = time.monotonic()
    if state["phase"] == "warm" and now >= state["deadline"]:
        if SHOT.exists():
            SHOT.unlink()
        ue.AutomationLibrary.finish_loading_before_screenshot()
        state["task"] = ue.AutomationLibrary.take_high_res_screenshot(1280, 720, str(SHOT), camera=camera, delay=2.0)
        state.update(phase="wait", deadline=now + 120)
    elif state["phase"] == "wait" and SHOT.exists() and SHOT.stat().st_size > 1000:
        (VALIDATION / "gameplay_capture.json").write_text(json.dumps({"engine": ue.SystemLibrary.get_engine_version(), "map": MAP, "screenshot": SHOT.name, "resolution": [1280, 720]}, indent=2), encoding="utf-8")
        ue.log("GRIDRUNNER_GHOST_SIGNAL_CAPTURE_OK " + str(SHOT))
        ue.unregister_slate_post_tick_callback(handle)
        ue.SystemLibrary.quit_editor()
    elif state["phase"] == "wait" and now > state["deadline"]:
        ue.log_error("GRIDRUNNER_GHOST_SIGNAL_CAPTURE_TIMEOUT")
        ue.unregister_slate_post_tick_callback(handle)
        ue.SystemLibrary.quit_editor()


handle = ue.register_slate_post_tick_callback(tick)
