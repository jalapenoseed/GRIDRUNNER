import gzip
import importlib.util
import json
from pathlib import Path
import struct
import tempfile
import unittest

SCRIPT = Path(__file__).resolve().parents[1] / "tools" / "prepare_assets.py"
SPEC = importlib.util.spec_from_file_location("prepare_assets", SCRIPT)
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


def minimal_glb():
    document = json.dumps({"asset": {"version": "2.0"}, "scenes": [{}]}).encode()
    document += b" " * (-len(document) % 4)
    return struct.pack("<4sIIII", b"glTF", 2, 20 + len(document), len(document), 0x4E4F534A) + document


class StagingTests(unittest.TestCase):
    def make_repo(self, repo):
        for name in MODULE.SELECTION:
            path = repo / "dist" / "assets" / name
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(gzip.compress(minimal_glb()) if name.endswith(".gz") else minimal_glb())
        texture = repo / "dist/assets/drones/textures/test.png"
        texture.parent.mkdir(parents=True)
        texture.write_bytes(b"texture-copy-fixture")

    def test_valid_glb(self):
        self.assertEqual(MODULE.validate_glb(minimal_glb())["asset"]["version"], "2.0")

    def test_bad_header_and_truncation(self):
        for data in (b"", b"bad" * 12, minimal_glb()[:-1]):
            with self.subTest(data=data), self.assertRaises(ValueError):
                MODULE.validate_glb(data)

    def test_bad_chunk_length(self):
        data = bytearray(minimal_glb())
        struct.pack_into("<I", data, 12, len(data) + 100)
        with self.assertRaises(ValueError):
            MODULE.validate_glb(data)

    def test_stage_is_repeatable_and_preserves_source(self):
        with tempfile.TemporaryDirectory() as tmp:
            repo = Path(tmp)
            self.make_repo(repo)
            before = {str(p): p.read_bytes() for p in (repo / "dist").rglob("*") if p.is_file()}
            first = MODULE.stage(repo, repo / "staging")
            second = MODULE.stage(repo, repo / "staging")
            self.assertEqual(first, second)
            self.assertEqual(len(first), 5)
            self.assertEqual((repo / "staging/drones/GR_SCOUT_01.glb").read_bytes(), minimal_glb())
            self.assertTrue(all(Path(path).read_bytes() == data for path, data in before.items()))

    def test_missing_input_writes_nothing(self):
        with tempfile.TemporaryDirectory() as tmp:
            repo = Path(tmp)
            with self.assertRaises(FileNotFoundError):
                MODULE.stage(repo, repo / "staging")
            self.assertFalse((repo / "staging").exists())

    def test_modified_destination_is_protected(self):
        with tempfile.TemporaryDirectory() as tmp:
            repo = Path(tmp)
            self.make_repo(repo)
            target = repo / "staging/kit/GR_Workbench_02.glb"
            target.parent.mkdir(parents=True)
            target.write_bytes(b"user-changed")
            with self.assertRaises(FileExistsError):
                MODULE.stage(repo, repo / "staging")
            self.assertEqual(target.read_bytes(), b"user-changed")
            self.assertFalse((repo / "staging/drones").exists())


if __name__ == "__main__":
    unittest.main()
