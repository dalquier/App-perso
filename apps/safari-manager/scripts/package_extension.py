#!/usr/bin/env python3
"""Validate and reproducibly package Safari Manager's extension directory."""
from __future__ import annotations
import argparse, hashlib, json, os, sys, zipfile
from pathlib import Path, PurePosixPath

ROOT = Path(__file__).resolve().parents[1]
EXTENSION = ROOT / "extension"
DEFAULT_OUTPUT = ROOT / "dist" / "safari-manager-extension.zip"
REFERENCED_KEYS = {"default_popup", "service_worker"}

def manifest_references(value, key=""):
    if isinstance(value, dict):
        for child_key, child in value.items():
            if child_key in REFERENCED_KEYS and isinstance(child, str): yield child
            elif child_key == "icons" and isinstance(child, dict):
                yield from (item for item in child.values() if isinstance(item, str))
            else: yield from manifest_references(child, child_key)
    elif isinstance(value, list):
        for child in value: yield from manifest_references(child, key)

def safe_resource_path(relative):
    path = PurePosixPath(relative)
    if path.is_absolute() or ".." in path.parts: raise ValueError(f"Chemin non sûr dans manifest.json : {relative}")
    return EXTENSION.joinpath(*path.parts)

def load_manifest():
    path = EXTENSION / "manifest.json"
    if not path.is_file(): raise FileNotFoundError(f"Manifest absent : {path}")
    with path.open(encoding="utf-8") as stream: manifest = json.load(stream)
    if manifest.get("manifest_version") != 3: raise ValueError("manifest_version doit valoir 3")
    for reference in manifest_references(manifest):
        if not safe_resource_path(reference).is_file(): raise FileNotFoundError(f"Ressource absente : {reference}")
    return manifest

def extension_files():
    excluded_parts = {"tests", "docs", "__pycache__", ".DS_Store"}
    return sorted((p for p in EXTENSION.rglob("*") if p.is_file() and not excluded_parts.intersection(p.relative_to(EXTENSION).parts) and not p.name.endswith((".pyc", "~"))), key=lambda p: p.relative_to(EXTENSION).as_posix())

def package(output):
    load_manifest(); output.parent.mkdir(parents=True, exist_ok=True)
    timestamp = (1980, 1, 1, 0, 0, 0)
    with zipfile.ZipFile(output, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        for path in extension_files():
            info = zipfile.ZipInfo(path.relative_to(EXTENSION).as_posix(), timestamp)
            info.compress_type = zipfile.ZIP_DEFLATED; info.external_attr = 0o100644 << 16
            archive.writestr(info, path.read_bytes())
    digest = hashlib.sha256(output.read_bytes()).hexdigest()
    checksum = output.with_suffix(output.suffix + ".sha256")
    checksum.write_text(f"{digest}  {output.name}\n", encoding="ascii", newline="\n")
    print(f"ZIP: {output}\nTaille: {output.stat().st_size} octets\nSHA-256: {digest}\nEmpreinte: {checksum}")

if __name__ == "__main__":
    parser=argparse.ArgumentParser(); parser.add_argument("--output",type=Path,default=DEFAULT_OUTPUT); args=parser.parse_args()
    try: package(args.output.resolve())
    except (OSError, ValueError, json.JSONDecodeError) as error: print(f"Erreur de packaging : {error}",file=sys.stderr); sys.exit(1)
