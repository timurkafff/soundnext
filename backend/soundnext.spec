# -*- mode: python ; coding: utf-8 -*-
"""
PyInstaller spec file для SoundNext
Создает .app bundle для macOS с включенными статическими файлами
"""

import os
from pathlib import Path

BASE_DIR = Path(os.getcwd()).parent
BACKEND_DIR = BASE_DIR / 'backend'
STATIC_DIR = BASE_DIR / 'out'

block_cipher = None

datas = []
if STATIC_DIR.exists():
    datas.append((str(STATIC_DIR), 'static'))

a = Analysis(
    ['app_launcher.py'],
    pathex=[str(BACKEND_DIR)],
    binaries=[],
    datas=datas,
    hiddenimports=[
        'uvicorn.logging',
        'uvicorn.loops',
        'uvicorn.loops.auto',
        'uvicorn.protocols',
        'uvicorn.protocols.http',
        'uvicorn.protocols.http.auto',
        'uvicorn.protocols.websockets',
        'uvicorn.protocols.websockets.auto',
        'uvicorn.lifespan',
        'uvicorn.lifespan.on',
        'aiohttp',
        'sclib',
        'sclib.asyncio',
        'webview',
        'main',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='SoundNext',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=False,  # Без консоли для macOS .app
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)

coll = COLLECT(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name='SoundNext',
)

icon_path = BACKEND_DIR / 'icons' / 'mac.icns'
if not icon_path.exists():
    icon_path = None

app = BUNDLE(
    coll,
    name='SoundNext.app',
    icon=str(icon_path) if icon_path else None,
    bundle_identifier='com.soundnext.app',
    info_plist={
        'NSPrincipalClass': 'NSApplication',
        'NSHighResolutionCapable': 'True',
        'CFBundleShortVersionString': '1.0.0',
        'CFBundleVersion': '1.0.0',
        'NSHumanReadableCopyright': 'Copyright © 2025',
    },
)


