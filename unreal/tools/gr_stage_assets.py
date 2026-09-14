"""Copy selected pack roots to an isolated UE 5.8 evaluation project on D:.

Copies preserve /Game folder paths. This is an inspection snapshot, not proof
of complete dependency migration. Source projects and the game are untouched.
"""
import hashlib
import json
from pathlib import Path
import shutil
import time

SOURCE = Path(r"C:\Users\ty\Documents\Unreal Projects")
HUB = Path(r"D:\UNREAL-GRIDRUNNER-ASSETS")
DEST = HUB / "Projects" / "GR_AssetReview"
PACKS = [
    ("MyProject", "Bike"),
    ("MyProject", "Deko_MatrixDemo"),
    ("MyProject", "Free_Sounds_Pack"),
    ("FactoryEnvironmentCollect", "MotoInteractionAnims"),
    ("MetaHumans", "Sparks_Embers"),
    ("MetaHumans", "My_Manny.uasset"),
    ("MyProject", "__ExternalActors__/Bike/Maps/L_BikeDemoMap/3/4W/00PI6NV76YQJYAF36VCBBC.uasset"),
]


def sha256(path):
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def main():
    if DEST.exists():
        raise RuntimeError(f"Evaluation project already exists; refusing overwrite: {DEST}")
    planned = []
    for project, pack in PACKS:
        root = SOURCE / project / "Content" / pack
        if not root.exists():
            raise FileNotFoundError(root)
        for source in ([root] if root.is_file() else sorted(root.rglob("*"))):
            if source.is_symlink():
                raise RuntimeError(f"Unexpected link: {source}")
            if not source.is_file():
                continue
            stat = source.stat()
            if time.time() - stat.st_mtime < 120:
                raise RuntimeError(f"Recently modified; wait for downloads: {source}")
            if source.suffix in {".uasset", ".umap"} and not stat.st_size:
                raise RuntimeError(f"Empty Unreal package: {source}")
            planned.append((source, Path("Content") / pack / source.relative_to(root), stat))
    total = sum(stat.st_size for _, _, stat in planned)
    if shutil.disk_usage(HUB).free < total + 10 * 1024**3:
        raise RuntimeError("Insufficient destination space")
    temporary = HUB / "Projects" / ("GR_AssetReview.incoming-" + str(time.time_ns()))
    temporary.mkdir(parents=True)
    manifest = []
    for source, relative, before in planned:
        target = temporary / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, target)
        source_hash = sha256(source)
        if source_hash != sha256(target):
            raise RuntimeError(f"Hash mismatch; incomplete copy retained in {temporary}")
        manifest.append(dict(source=str(source), destination=str(relative), bytes=before.st_size, sha256=source_hash))
    for source, _, before in planned:
        after = source.stat()
        if (after.st_size, after.st_mtime_ns) != (before.st_size, before.st_mtime_ns):
            raise RuntimeError(f"Source changed during snapshot: {source}; copy retained in {temporary}")
    descriptor = dict(FileVersion=3, EngineAssociation="5.8", Category="Asset Evaluation",
                      Description="GRIDRUNNER pack evaluation snapshot; originals preserved.",
                      Plugins=[dict(Name="PythonScriptPlugin", Enabled=True), dict(Name="EditorScriptingUtilities", Enabled=True)])
    (temporary / "GR_AssetReview.uproject").write_text(json.dumps(descriptor, indent=2), encoding="utf-8")
    (temporary / "Copy-Manifest.json").write_text(json.dumps(dict(files=manifest, total_bytes=total), indent=2), encoding="utf-8")
    temporary.rename(DEST)
    print(json.dumps(dict(project=str(DEST), files=len(manifest), bytes=total, verified="SHA-256 copy equality", dependency_validation="pending")))


if __name__ == "__main__":
    main()
