"""Inventory Unreal source collections and build a non-destructive Windows hub.

Run with Unreal's bundled Python; does not require the unreal module. Source
projects are read only. Refreshes only files generated inside --hub-root.
"""
import argparse
import datetime as dt
import html
import json
import os
from pathlib import Path
import shutil
import sys

RULES = [
    ("Factory Environment", "Environment", "Industrial buildings and interiors", "A", None, "SM_AssemblyLine"),
    ("Warehouse", "Environment", "Workshop shelving and storage", "A", "Scene_Warehouse", None),
    ("Unfinished Building", "Environment", "Broken concrete and construction ruins", "A", "Scene_UnfinishedBuilding", None),
    ("Freeway Props", "Environment", "Highway barriers, signs and utility clutter", "A", "Deko_MatrixDemo", None),
    ("Motorcycle", "Vehicles", "Evaluate rig, dimensions and controls for electric enduro", "A", "Bike", None),
    ("Motorcycle Interaction Animations", "Characters", "Evaluate mount, dismount and riding clips", "A", "MotoInteractionAnims", None),
    ("Walk Cycle Animations", "Characters", "Evaluate on-foot locomotion clips", "B", "Walk_cycle_AnimsSet", None),
    ("MetaHumans", "Characters", "Character reference; profile before use on this GPU", "B", "MetaHumans", None),
    ("Free Sounds Pack", "Audio", "Audition interaction and environment sounds", "B", "Free_Sounds_Pack", None),
    ("Sparks and Embers", "Effects", "Electrical sparks, embers and Niagara evaluation", "A", "Sparks_Embers", None),
]
SKIP = {"content", "plugins", "saved", "intermediate", "binaries", "deriveddatacache", ".git", ".vs"}
UTC = dt.timezone.utc
LAUNCH_ENV = ('@echo off\nsetlocal DisableDelayedExpansion\n'
              'if not exist "%~dp0RuntimeTemp" mkdir "%~dp0RuntimeTemp"\n'
              'set "TEMP=%~dp0RuntimeTemp"\nset "TMP=%~dp0RuntimeTemp"\n'
              'set "UE-LocalDataCachePath=%~dp0DerivedDataCache"\n'
              'set "UE-ZenDataPath=%~dp0DerivedDataCache\\Zen"\nstart "" ')


def timestamp(seconds):
    return dt.datetime.fromtimestamp(seconds, UTC).isoformat(timespec="seconds") if seconds else None


def discover(root):
    if not root.is_dir():
        raise FileNotFoundError(f"Source root unavailable: {root}")
    for base, dirs, files in os.walk(root, followlinks=False):
        dirs[:] = sorted(d for d in dirs if d.lower() not in SKIP and not (Path(base) / d).is_symlink())
        for name in sorted(files):
            if name.lower().endswith(".uproject"):
                yield Path(base) / name


def inventory(project):
    errors, roots, stems = [], {}, set()
    try:
        descriptor = json.loads(project.read_text(encoding="utf-8-sig"))
    except (OSError, ValueError) as exc:
        descriptor = {}
        errors.append(str(exc))
    content = project.parent / "Content"
    def walk_error(exc):
        errors.append(str(exc))
    for base, dirs, files in os.walk(content, followlinks=False, onerror=walk_error):
        dirs[:] = [d for d in dirs if not (Path(base) / d).is_symlink()]
        for name in files:
            path = Path(base) / name
            if path.is_symlink():
                continue
            relative = path.relative_to(content)
            key = relative.parts[0] if len(relative.parts) > 1 else "(Content root)"
            item = roots.setdefault(key, {"files": 0, "bytes": 0, "packages": 0, "zero_byte_packages": 0, "newest": 0})
            try:
                info = path.stat()
            except OSError as exc:
                errors.append(str(exc))
                continue
            is_package = path.suffix.lower() in {".uasset", ".umap"}
            item["files"] += 1
            item["bytes"] += info.st_size
            item["packages"] += int(is_package)
            item["zero_byte_packages"] += int(is_package and info.st_size == 0)
            item["newest"] = max(item["newest"], info.st_mtime)
            if is_package:
                stems.add(path.stem)
    packs = []
    for name, category, purpose, priority, folder, prefix in RULES:
        if (folder and folder in roots) or (prefix and any(s.startswith(prefix) for s in stems)):
            packs.append(dict(name=name, category=category, purpose=purpose, priority=priority))
    # Unknown folders remain visible rather than being assigned a guessed pack.
    latest = max((r["newest"] for r in roots.values()), default=0)
    return dict(project=str(project), engine=descriptor.get("EngineAssociation", "unspecified"),
                packs=packs, content_roots=roots, files=sum(r["files"] for r in roots.values()),
                packages=sum(r["packages"] for r in roots.values()), bytes=sum(r["bytes"] for r in roots.values()),
                zero_byte_packages=sum(r["zero_byte_packages"] for r in roots.values()),
                latest_content_write=timestamp(latest), errors=errors,
                review_state="Inspection needed" if errors else "Files present; editor validation pending")


def atomic_write(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(path.name + ".tmp")
    temporary.write_text(value, encoding="utf-8")
    temporary.replace(path)


def create_once(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    try:
        with path.open("x", encoding="utf-8") as handle:
            handle.write(value)
    except FileExistsError:
        pass


def batch_arg(value):
    value = str(value)
    if any(c in value for c in '\r\n"'):
        raise ValueError("Unsafe Windows command argument")
    return '"' + value.replace("%", "%%") + '"'


def changes_since(previous, projects):
    old = {p["project"]: p for p in previous.get("projects", [])}
    changes = []
    for project in projects:
        before = old.pop(project["project"], None)
        if before is None:
            changes.append(dict(project=project["project"], change="New source project"))
        elif any(before.get(k) != project.get(k) for k in ("files", "bytes", "latest_content_write", "packs", "content_roots", "errors")):
            changes.append(dict(project=project["project"], change="Content changed; rescan completed"))
    changes.extend(dict(project=p, change="Source project no longer found") for p in old)
    return changes


def build_hub(args, projects):
    hub = args.hub_root
    hub.mkdir(parents=True, exist_ok=True)
    lock = hub / "refresh.lock"
    try:
        handle = lock.open("x")
    except FileExistsError:
        raise RuntimeError(f"Another refresh may be active: {lock}")
    try:
        handle.write(str(os.getpid()))
        handle.close()
        catalog_path = hub / "Catalog.json"
        previous = json.loads(catalog_path.read_text(encoding="utf-8")) if catalog_path.exists() else {}
        free = {str(root.anchor): shutil.disk_usage(root).free for root in (args.source_root, hub)}
        data = dict(schema_version=1, scanned_at=timestamp(dt.datetime.now(UTC).timestamp()),
                    source_root=str(args.source_root), game_project=str(args.game_project),
                    source_policy="Read only; no projects or packages moved or renamed", free_bytes=free,
                    projects=projects, changes=changes_since(previous, projects))
        if previous:
            atomic_write(hub / "Catalog.previous.json", json.dumps(previous, indent=2))
        inbox = hub / "Projects" / "GR_AssetInbox"
        inbox_project = inbox / "GR_AssetInbox.uproject"
        create_once(inbox_project, json.dumps(dict(FileVersion=3, EngineAssociation="5.8", Category="Asset Library",
                    Description="GRIDRUNNER staging project for new Fab Add to Project downloads."), indent=2))
        (inbox / "Content").mkdir(exist_ok=True)
        create_once(inbox / "Config" / "DefaultGame.ini", "[/Script/EngineSettings.GeneralProjectSettings]\nProjectName=GRIDRUNNER Asset Inbox\n")
        for name in ("Downloads", "SourceProjects", "Shortcuts"):
            (hub / name).mkdir(exist_ok=True)
        browse = '@echo off\nsetlocal DisableDelayedExpansion\nstart "" explorer.exe '
        atomic_write(hub / "Browse-Downloaded-Projects.cmd", browse + batch_arg(args.source_root) + "\n")
        atomic_write(hub / "Open-Catalog.cmd", '@echo off\nstart "" "%~dp0Catalog.html"\n')
        atomic_write(hub / "Open-GRIDRUNNER.cmd", LAUNCH_ENV +
                     batch_arg(args.editor) + ' ' + batch_arg(args.game_project) + '\n')
        atomic_write(hub / "Open-Asset-Inbox.cmd", LAUNCH_ENV +
                     batch_arg(args.editor) + ' ' + batch_arg(inbox_project) + '\n')
        review = hub / "Projects" / "GR_AssetReview" / "GR_AssetReview.uproject"
        if review.is_file():
            atomic_write(hub / "Open-Asset-Review.cmd", LAUNCH_ENV +
                         batch_arg(args.editor) + ' ' + batch_arg(review) + '\n')
        guide = Path(__file__).resolve().parents[1] / "ASSET-LIBRARY.md"
        if guide.is_file():
            atomic_write(hub / "README.md", guide.read_text(encoding="utf-8"))
        for relative in ("ASSET-STATUS.md", "validation/asset_library_audit.json", "validation/asset_library_rigs.json"):
            source = Path(__file__).resolve().parents[1] / relative
            if source.is_file():
                atomic_write(hub / relative, source.read_text(encoding="utf-8"))
        atomic_write(hub / "Refresh-Catalog.cmd", '@echo off\nsetlocal DisableDelayedExpansion\n' + batch_arg(sys.executable) +
                     ' ' + batch_arg(Path(__file__).resolve()) + ' --source-root ' + batch_arg(args.source_root) +
                     ' --hub-root ' + batch_arg(hub) + ' --game-project ' + batch_arg(args.game_project) +
                     ' --editor ' + batch_arg(args.editor) + ' --refresh\npause\n')
        cards = []
        for index, project in enumerate(projects, 1):
            label = " + ".join(p["name"] for p in project["packs"]) or "Unclassified or template content"
            slug = "".join(c if c.isalnum() or c in " -+" else "-" for c in label)[:105].strip()
            shortcut = hub / "Shortcuts" / f"{index:02d} Browse {slug}.cmd"
            atomic_write(shortcut, browse + '/select,' + batch_arg(project["project"]) + '\n')
            roots = ", ".join(sorted(project["content_roots"]))
            packs = "".join('<li><b>' + html.escape(p["name"]) + '</b> — ' + html.escape(p["purpose"]) + '</li>' for p in project["packs"])
            cards.append('<article><h2>' + html.escape(label) + '</h2><p>' +
                         html.escape(str(Path(project["project"]).parent)) + '</p><p>UE ' + html.escape(project["engine"]) +
                         f' · {project["packages"]:,} packages · {project["bytes"] / 2**30:.2f} GiB</p><ul>' + packs +
                         '</ul><p class="muted">Content folders: ' + html.escape(roots) + '</p><p>' +
                         html.escape(project["review_state"]) + '</p></article>')
        page = '''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>GRIDRUNNER Asset Library</title><style>body{background:#10191c;color:#e5ecea;font:16px/1.5 system-ui;margin:3rem auto;max-width:1100px;padding:0 24px}h1{color:#85eacb}article{background:#1a282d;padding:24px;margin:18px 0;border-radius:10px}h2{margin-top:0}p{overflow-wrap:anywhere}.muted{color:#9eafb3}input{padding:14px;width:90%;background:#25373c;color:white;border:1px solid #668;border-radius:6px}aside{border-left:3px solid #85eacb;padding-left:18px}</style>
<h1>GRIDRUNNER / Asset Library</h1><aside><p>Open the game with <b>Open-GRIDRUNNER.cmd</b>. Use <b>Open-Asset-Inbox.cmd</b> for new Fab additions on D:.</p>
<p>Existing source projects retain their original folders and engine versions. Use the named Browse shortcuts to locate them. Inspection in a newer engine should use a copy.</p>
<p>Files present does not confirm a finished download or successful Unreal import. Refresh-Catalog.cmd updates this inventory.</p></aside>
<input aria-label="Filter assets" placeholder="Filter by pack, purpose or folder" oninput="for(const a of document.querySelectorAll('article'))a.hidden=!a.textContent.toLowerCase().includes(this.value.toLowerCase())">
'''
        page += '<p class="muted">Scanned ' + data["scanned_at"] + '</p>' + ''.join(cards) + '</html>'
        atomic_write(hub / "Catalog.html", page)
        atomic_write(catalog_path, json.dumps(data, indent=2))
        print(json.dumps(dict(hub=str(hub), projects=len(projects), changes=data["changes"], free_bytes=free), indent=2))
    finally:
        handle.close()
        lock.unlink()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source-root", type=Path, default=Path(r"C:\Users\ty\Documents\Unreal Projects"))
    parser.add_argument("--hub-root", type=Path, default=Path(r"D:\UNREAL-GRIDRUNNER-ASSETS"))
    parser.add_argument("--game-project", type=Path, default=Path(r"D:\GRIDRUNNER-Unreal\unreal\GRIDRUNNERAssetLab\GRIDRUNNERAssetLab.uproject"))
    parser.add_argument("--editor", type=Path, default=Path(r"C:\Program Files\Epic Games\UE_5.8\Engine\Binaries\Win64\UnrealEditor.exe"))
    parser.add_argument("--refresh", action="store_true", help="Create or update the generated hub; source projects stay read only")
    args = parser.parse_args()
    roots = [args.source_root]
    roots.extend(p for p in (args.hub_root / "Projects", args.hub_root / "SourceProjects") if p.is_dir())
    paths = sorted({p.resolve() for root in roots for p in discover(root)})
    projects = [inventory(project) for project in paths]
    if args.refresh:
        if not args.game_project.is_file() or not args.editor.is_file():
            parser.error("Game project or editor unavailable; hub was not changed")
        build_hub(args, projects)
    else:
        print(json.dumps(projects, indent=2))


if __name__ == "__main__":
    main()
