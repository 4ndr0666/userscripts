#!/usr/bin/env python3
"""Verify a 4ndr0neering .skill ZIP or extracted directory against its manifest.

A manifest provides integrity evidence, not a trusted publisher signature. Pin
SHA-256 of the whole archive through an independent channel for authenticity.
"""
from __future__ import annotations
import argparse, hashlib, json, stat, sys, zipfile
from pathlib import Path, PurePosixPath

MANIFEST='MANIFEST-SHA256.json'
def sha(data:bytes)->str:return hashlib.sha256(data).hexdigest()
def safe_name(s:str)->bool:
    p=PurePosixPath(s)
    return bool(s) and not s.startswith('/') and '\\' not in s and '..' not in p.parts and p.as_posix()==s

def verify_zip(path:Path)->dict:
    with zipfile.ZipFile(path) as z:
        infos=z.infolist();names=[x.filename for x in infos]
        if len(names)!=len(set(names)):raise ValueError('duplicate archive members')
        if not all(safe_name(n) for n in names):raise ValueError('unsafe archive member path')
        if MANIFEST not in names:raise ValueError('missing SHA-256 manifest')
        for info in infos:
            mode=(info.external_attr>>16)&0o170000
            if mode==stat.S_IFLNK:raise ValueError('symlinks not permitted in skill package')
        manifest=json.loads(z.read(MANIFEST))
        expected=manifest.get('files')
        if manifest.get('format')!='4ndr0neering-skill-manifest-v1' or not isinstance(expected,dict):raise ValueError('invalid manifest format')
        if set(names)!=set(expected)|{MANIFEST}:raise ValueError('unexpected or missing archive entries')
        for n,d in expected.items():
            if not safe_name(n) or not isinstance(d,dict):raise ValueError('invalid manifest entry')
            payload=z.read(n)
            if sha(payload)!=d.get('sha256') or len(payload)!=d.get('size'):raise ValueError('integrity failure: '+n)
        return {'status':'VERIFIED','files':len(expected),'archive_sha256':sha(path.read_bytes())}

def verify_dir(path:Path)->dict:
    manifest=json.loads((path/MANIFEST).read_text());expected=manifest['files']
    found={str(p.relative_to(path)) for p in path.rglob('*') if p.is_file()}
    if found!=set(expected)|{MANIFEST}:raise ValueError('unexpected or missing files')
    for n,d in expected.items():
        p=path/n
        if not safe_name(n) or not p.resolve().is_relative_to(path.resolve()) or not p.is_file() or p.is_symlink():raise ValueError('unsafe file: '+n)
        data=p.read_bytes()
        if sha(data)!=d['sha256'] or len(data)!=d['size']:raise ValueError('integrity failure: '+n)
    return {'status':'VERIFIED','files':len(expected)}

def main()->int:
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('path')
    args=p.parse_args();path=Path(args.path)
    try:
        result=verify_dir(path) if path.is_dir() else verify_zip(path)
        print(json.dumps(result,sort_keys=True));return 0
    except (OSError,ValueError,KeyError,zipfile.BadZipFile,json.JSONDecodeError) as exc:
        print('FAILED: '+str(exc),file=sys.stderr);return 1
if __name__=='__main__':sys.exit(main())
