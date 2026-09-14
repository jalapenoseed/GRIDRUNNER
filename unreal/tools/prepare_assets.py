"""Stage existing runtime exports without touching canonical assets. Standard Python 3."""
import argparse
import gzip
import hashlib
import json
from pathlib import Path
import struct

SELECTION = (
    "drones/GR_SCOUT_01.glb.gz",
    "kit/GR_PadTransformer_01.glb",
    "kit/GR_Workbench_02.glb",
    "kit/GR_SupplyCrate_02.glb",
)


def validate_glb(data):
    if len(data) < 20:
        raise ValueError("Truncated GLB")
    magic, version, size = struct.unpack_from("<4sII", data)
    if magic != b"glTF" or version != 2 or size != len(data):
        raise ValueError("Invalid GLB 2.0 header or byte count")
    length, kind = struct.unpack_from("<II", data, 12)
    if kind != 0x4E4F534A or length % 4 or 20 + length > size:
        raise ValueError("Invalid GLB JSON chunk")
    document = json.loads(data[20:20 + length])
    if document.get("asset", {}).get("version") != "2.0":
        raise ValueError("Missing glTF 2.0 metadata")
    return document


def stage(repo, destination):
    source = repo / "dist" / "assets"
    selected = [source / item for item in SELECTION]
    textures = sorted((source / "drones" / "textures").glob("*.png"))
    missing = [str(p) for p in selected if not p.is_file()]
    if missing or not textures:
        raise FileNotFoundError("Incomplete checkout: " + ", ".join(missing or ["drone textures"]))
    # Validate the full batch before writing anything; existing different files are protected.
    payloads = []
    for path in selected + textures:
        data = path.read_bytes()
        relative = path.relative_to(source)
        if path.suffix == ".gz":
            data = gzip.decompress(data)
            relative = relative.with_suffix("")
        if relative.suffix == ".glb":
            validate_glb(data)
        target = destination / relative
        if target.exists() and target.read_bytes() != data:
            raise FileExistsError(f"Refusing to replace modified staging asset: {target}")
        payloads.append((path, target, data))
    report = []
    for path, target, data in payloads:
        target.parent.mkdir(parents=True, exist_ok=True)
        if not target.exists():
            target.write_bytes(data)
        report.append({"source": path.relative_to(repo).as_posix(),
                       "staged": target.relative_to(destination).as_posix(),
                       "bytes": len(data), "sha256": hashlib.sha256(data).hexdigest()})
    return report


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo", type=Path, default=Path(__file__).resolve().parents[2])
    parser.add_argument("--destination", type=Path)
    args = parser.parse_args()
    destination = args.destination or args.repo / "unreal" / "ImportStaging"
    print(json.dumps(stage(args.repo.resolve(), destination.resolve()), indent=2))
