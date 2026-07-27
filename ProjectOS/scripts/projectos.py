#!/usr/bin/env python3
"""ProjectOS local management CLI. Standard-library only."""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import shutil
import subprocess
import sys
import tarfile
from datetime import datetime, timezone
from pathlib import Path

EXCLUDED = {'.git', '.env', 'secrets.json', 'token.json', 'credentials.json', '__pycache__', '.DS_Store', '.projectos'}


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open('rb') as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(chunk)
    return digest.hexdigest()


def doctor() -> int:
    root = repo_root()
    checks = {
        'repo_root_exists': root.exists(),
        'projectos_exists': (root / 'ProjectOS').exists(),
        'git_available': shutil.which('git') is not None,
        'rclone_available': shutil.which('rclone') is not None,
        'python': sys.version.split()[0],
    }
    print(json.dumps(checks, indent=2, ensure_ascii=False))
    return 0 if checks['repo_root_exists'] and checks['projectos_exists'] else 1


def make_backup() -> Path:
    root = repo_root()
    out = root / '.projectos' / 'backups'
    out.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')
    archive = out / f'App-perso_{stamp}.tar.gz'

    def allowed(info: tarfile.TarInfo) -> tarfile.TarInfo | None:
        parts = Path(info.name).parts
        return None if any(part in EXCLUDED for part in parts) else info

    with tarfile.open(archive, 'w:gz') as tar:
        tar.add(root, arcname='App-perso', filter=allowed)
    manifest = {'archive': archive.name, 'created_utc': stamp, 'sha256': sha256(archive), 'size_bytes': archive.stat().st_size}
    archive.with_suffix(archive.suffix + '.json').write_text(json.dumps(manifest, indent=2), encoding='utf-8')
    print(json.dumps(manifest, indent=2))
    return archive


def upload(archive: Path, remote: str, remote_path: str) -> None:
    if not shutil.which('rclone'):
        raise RuntimeError('rclone est absent. Installez-le et configurez le remote Google Drive.')
    target = f'{remote}:{remote_path.rstrip("/")}/'
    subprocess.run(['rclone', 'copy', str(archive), target, '--checksum', '--create-empty-src-dirs'], check=True)
    subprocess.run(['rclone', 'copy', str(archive.with_suffix(archive.suffix + '.json')), target, '--checksum'], check=True)
    subprocess.run(['rclone', 'check', str(archive.parent), target, '--include', archive.name, '--one-way'], check=True)
    print(f'Backup vérifié dans {target}')


def prune(days: int) -> None:
    cutoff = datetime.now(timezone.utc).timestamp() - days * 86400
    folder = repo_root() / '.projectos' / 'backups'
    for path in folder.glob('App-perso_*') if folder.exists() else []:
        if path.stat().st_mtime < cutoff:
            path.unlink()


def main() -> int:
    parser = argparse.ArgumentParser(prog='projectos')
    sub = parser.add_subparsers(dest='command', required=True)
    sub.add_parser('doctor')
    sub.add_parser('backup')
    up = sub.add_parser('backup-drive')
    up.add_argument('--remote', default=os.getenv('PROJECTOS_RCLONE_REMOTE', 'gdrive'))
    up.add_argument('--path', default=os.getenv('PROJECTOS_DRIVE_PATH', 'App-perso/ProjectOS-Backups'))
    clean = sub.add_parser('prune')
    clean.add_argument('--days', type=int, default=30)
    args = parser.parse_args()
    if args.command == 'doctor': return doctor()
    if args.command == 'backup': make_backup(); return 0
    if args.command == 'backup-drive': upload(make_backup(), args.remote, args.path); return 0
    if args.command == 'prune': prune(args.days); return 0
    return 1


if __name__ == '__main__':
    raise SystemExit(main())
