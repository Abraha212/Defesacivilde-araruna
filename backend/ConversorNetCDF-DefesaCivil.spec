# -*- mode: python ; coding: utf-8 -*-
from PyInstaller.utils.hooks import collect_submodules
from PyInstaller.utils.hooks import collect_all

datas = []
binaries = []
hiddenimports = ['xarray', 'xarray.backends', 'xarray.backends.netCDF4_', 'xarray.backends.scipy_', 'xarray.backends.h5netcdf_', 'xarray.coding', 'xarray.coding.times', 'xarray.coding.strings', 'xarray.coding.variables', 'xarray.core', 'xarray.core.dataarray', 'xarray.core.dataset', 'netCDF4', 'netCDF4.utils', 'cftime', 'cftime._cftime', 'pandas', 'pandas._libs', 'pandas._libs.tslibs', 'pandas._libs.tslibs.np_datetime', 'pandas._libs.tslibs.nattype', 'pandas._libs.tslibs.timedeltas', 'pandas._libs.tslibs.timestamps', 'pandas._libs.tslibs.offsets', 'pandas._libs.tslibs.parsing', 'pandas._libs.hashtable', 'pandas._libs.index', 'pandas._libs.lib', 'pandas._libs.parsers', 'pandas.io.formats.csvs', 'numpy', 'numpy.core', 'numpy.core._methods', 'numpy.core.multiarray', 'numpy.lib', 'numpy.lib.format', 'numpy.random', 'numpy.random.common', 'numpy.random.bounded_integers', 'numpy.random.entropy', 'openpyxl', 'openpyxl.styles', 'openpyxl.drawing.image', 'PIL', 'PIL.Image', 'h5py', 'h5netcdf', 'scipy', 'scipy.io', 'scipy.io.netcdf', 'certifi', 'charset_normalizer', 'encodings', 'pkg_resources', 'packaging', 'packaging.version', 'packaging.specifiers', 'packaging.requirements']
hiddenimports += collect_submodules('xarray')
hiddenimports += collect_submodules('netCDF4')
hiddenimports += collect_submodules('cftime')
tmp_ret = collect_all('xarray')
datas += tmp_ret[0]; binaries += tmp_ret[1]; hiddenimports += tmp_ret[2]
tmp_ret = collect_all('netCDF4')
datas += tmp_ret[0]; binaries += tmp_ret[1]; hiddenimports += tmp_ret[2]
tmp_ret = collect_all('cftime')
datas += tmp_ret[0]; binaries += tmp_ret[1]; hiddenimports += tmp_ret[2]


import os as _os
_icon = 'icon.ico' if _os.path.exists('icon.ico') else None

a = Analysis(
    ['conversor_desktop.py'],
    pathex=[],
    binaries=binaries,
    datas=datas + ([('icon.ico', '.')] if _icon else []),
    hiddenimports=hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
    optimize=0,
)
pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name='ConversorNetCDF',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon='icon.ico' if _os.path.exists('icon.ico') else None,
)
